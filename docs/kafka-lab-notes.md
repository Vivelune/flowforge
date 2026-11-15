# Kafka Lab Notes

All experiments were run against Redpanda v24.2.1 in Docker (`flowforge-redpanda`) with a single broker.

## Environment

- **Topic:** `playground`
- **Partitions:** 3
- **Replication Factor:** 1 (single development broker)

---

## Experiment 1: Topics and Partitions

### Commands

```bash
docker exec -it flowforge-redpanda rpk topic create playground -p 3

docker exec -it flowforge-redpanda rpk topic describe playground
```

### Observations

- Created `playground` with 3 partitions.
- The describe output showed `PARTITIONS 3` and `REPLICAS 1`.
- `cleanup.policy` is `delete`.
- `retention.ms` defaults to `604800000` (7 days).

### Lesson

In a single-broker development environment, replication is 1. In production, you would use replication factor 3 to ensure high availability across three brokers.

---

## Experiment 2: Keys Decide Partitions

### Commands

```bash
# Produced with key "user-1"
docker exec -it flowforge-redpanda rpk topic produce playground -k user-1
# Typed: "hello"

# Produced with key "user-2"
docker exec -it flowforge-redpanda rpk topic produce playground -k user-2
# Typed: "world"

# Consumed to check partitions
docker exec -it flowforge-redpanda rpk topic consume playground --offset start -f '%p %o %k %v\n'
```

### Observations

**Output:**

```text
2 0 user-1 hello
2 1 user-2 world
```

Both keys landed on partition 2.

### Lesson

Kafka hashes the key to determine the partition. Because we only had 2 keys and 3 partitions, a collision is mathematically possible (roughly a 33% chance for two independently distributed keys to land on the same partition).

If we had used 10 different keys, they would likely have spread across partitions 0, 1, and 2, although this is not guaranteed.

**Crucial rule:** Ordering is guaranteed only within a partition.

Because `user-1` and `user-2` both went to partition 2, they are strictly ordered relative to each other. If they had gone to different partitions, there would be no guaranteed order between them.

---

## Experiment 3: Consumer Groups

### Commands

```bash
# Terminal A
docker exec -it flowforge-redpanda rpk topic consume playground -g groupA

# Terminal B (run simultaneously)
docker exec -it flowforge-redpanda rpk topic consume playground -g groupA

# Produced keyed messages: key-a, key-b, key-c
```

### Observations

- The messages were distributed between Terminal A and Terminal B.
- When we ran `rpk group describe groupA`, we saw `MEMBERS 2` and the partitions split between them.

### Lesson

Within a single consumer group, each partition is assigned to exactly one consumer.

This is how Kafka achieves load balancing.

If you start a second group (`groupB`), it gets its own independent assignments and receives every message.

---

## Experiment 4: Rebalancing

### Commands

1. Killed one consumer in `groupA` using `Ctrl+C`.
2. Started a 3rd and 4th consumer in new terminals.
3. Ran:

```bash
docker exec -it flowforge-redpanda rpk group describe groupA
```

### Observations

- Killing a consumer triggered a rebalance.
- The remaining consumer picked up the freed partitions.
- Running 4 consumers on a 3-partition topic resulted in `MEMBERS 4` in the describe output, but one member was left with zero assigned partitions.

### Lesson

Parallelism is capped by the partition count.

If you have 3 partitions, the maximum number of active consumers doing work in a group is 3.

The 4th consumer will sit idle.

This is a critical foreshadowing for Phase 6 (KEDA autoscaling): you can't scale beyond the number of partitions.

---

## Experiment 5: Offsets and Replay

### Commands

**Attempt 1: Seek while consumers are running**

```bash
docker exec -it flowforge-redpanda rpk group seek groupA --to start
```

### Observations

Attempt 1 failed with:

```text
INVALID_OPERATION: seeking a non-empty group is not allowed.
```

Attempted to delete the group:

```bash
docker exec -it flowforge-redpanda rpk group delete groupA
```

This failed with:

```text
NON_EMPTY_GROUP: The group is not empty.
```

Further investigation:

- `rpk group describe groupA` showed `STATE Stable`, `MEMBERS 3`.
- The `rpk topic consume` processes were still alive inside the container even though the terminal windows were closed.
- The Redpanda image has no `ps` or `pkill`, so they could not be killed directly.

### Solution

Ran:

```bash
docker restart flowforge-redpanda
```

After the container returned healthy, ran:

```bash
docker exec -it flowforge-redpanda rpk group describe groupA
```

The output showed:

```text
STATE Empty
MEMBERS 0
```

Then ran the seek command successfully:

```bash
docker exec -it flowforge-redpanda rpk group seek groupA --to start
```

**Output:**

```text
TOPIC       PARTITION  PRIOR-OFFSET  CURRENT-OFFSET
playground  0          -1            0
playground  1          -1            0
playground  2          3             0
```

Starting a new consumer replayed all messages from offset 0.

### Lesson

- Kafka refuses to reset offsets on a non-empty group to prevent duplicate reads. The broker enforces this for safety.
- Closing a terminal does not kill the process inside a Docker container.
- Restarting the container is the practical way to clear orphaned clients in a minimal image.

---

## Experiment 6: Retention and Compaction

### Commands

**Check the current retention and cleanup configuration:**

```bash
docker exec -it flowforge-redpanda rpk topic describe -c playground | grep -E "retention|cleanup"
```

**Output showed:**

```text
retention.ms 604800000
cleanup.policy delete
```

**Change retention to 1 minute:**

```bash
docker exec -it flowforge-redpanda rpk topic alter-config playground --set retention.ms=60000
```

**Output:**

```text
TOPIC playground STATUS OK
```

**Verify the new retention configuration:**

```bash
docker exec -it flowforge-redpanda rpk topic describe -c playground | grep retention.ms
```

**Output:**

```text
retention.ms 60000 DYNAMIC_TOPIC_CONFIG
```

### Observations

The `retention.ms` was successfully overridden from the default (7 days) to 1 minute (60,000 ms).

The source changed to `DYNAMIC_TOPIC_CONFIG`.

### Lesson

Retention (`cleanup.policy=delete`) deletes old segments based on time or size.

Compaction (`cleanup.policy=compact`) is different — it keeps only the latest message for each key.

- **Retention** is for event logs (e.g., every page view).
- **Compaction** is for state tables (e.g., current user profile).

---

## Experiment 7: Lag in Console

### Commands

**Produced a large batch of messages:**

```bash
docker exec -it flowforge-redpanda rpk topic produce playground -k perf
```

### Observations

Opened:

```text
http://localhost:8080
```

Navigated to:

```text
Topics → playground → Consumer Groups → groupA
```

The Console showed:

- The group state as `Empty`.
- A total lag of 4 on partition 2.

This was because the group offset was reset to 0, but the log-end-offset had grown to 4.

### Lesson

Consumer lag is calculated as:

```text
Lag = Log-End-Offset - Group-Offset
```

In other words, lag represents the number of messages that a consumer group has not yet processed or committed.

A high consumer lag indicates that consumers are falling behind the rate at which messages are being produced.

An `Empty` consumer group can still have lag because its previously committed offsets are retained even when no consumers are currently connected.
