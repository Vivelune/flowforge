# Kafka Lab Notes

## 1. Overview

These notes document my hands-on experiments with Kafka concepts using **Redpanda** as the local Kafka-compatible broker.

The goal is to understand how Kafka works internally through practical experiments before implementing the concepts in FlowForge.

The experiments cover:

- Topics and partitions
- Message keys and partition assignment
- Ordering guarantees
- Consumer groups and load balancing
- Consumer rebalancing
- Offsets and message replay
- Retention and log compaction
- Consumer lag and monitoring
- Consumer scaling
- At-least-once delivery and redelivery

### Environment

All experiments were performed using Redpanda v24.2.1 running in Docker.

| Component           | Configuration                    |
| ------------------- | -------------------------------- |
| Broker              | Redpanda v24.2.1                 |
| Docker container    | `flowforge-redpanda`             |
| Broker count        | 1                                |
| Topic               | `playground`                     |
| Partitions          | 3                                |
| Replication factor  | 1                                |
| Console             | `http://localhost:8080`          |
| Client library      | `@flowforge/kafka`               |
| Native Kafka client | `@confluentinc/kafka-javascript` |

**Important:** This is a single-broker development environment. Production deployments would normally use multiple brokers and a higher replication factor.

---

# Part I: Core Kafka Experiments

## Experiment 1: Topics and Partitions

### Objective

Understand how Kafka topics are created and how partitions organize messages.

### Commands

Create a topic named `playground` with three partitions:

```bash
docker exec -it flowforge-redpanda rpk topic create playground -p 3
```

Inspect the topic:

```bash
docker exec -it flowforge-redpanda rpk topic describe playground
```

### Observations

- Successfully created the `playground` topic.
- The topic contained three partitions.
- Replication factor was 1.
- `cleanup.policy` was set to `delete`.
- Default `retention.ms` was `604800000` (7 days).

### Explanation

A topic is a logical container for messages.

Partitions divide a topic into smaller, independently ordered logs. This allows Kafka to distribute data and processing across multiple consumers and brokers.

Each partition maintains its own sequence of messages and offsets.

### Key Takeaways

- A topic can contain multiple partitions.
- Each partition is an independent ordered log.
- Replication provides fault tolerance.
- In a single-broker development environment, replication factor 1 is appropriate.
- In production, replication factor 3 is a common configuration when three brokers are available.

**Why this matters for FlowForge:**

Partitions determine how much parallel processing Kafka can support. They will directly influence how FlowForge workers consume and process events.

---

## Experiment 2: Message Keys and Partition Assignment

### Objective

Understand how message keys determine partition assignment and why keys matter for message ordering.

### Commands

Produce a message using the key `user-1`:

```bash
docker exec -it flowforge-redpanda rpk topic produce playground -k user-1
```

Enter:

```text
hello
```

Produce another message using the key `user-2`:

```bash
docker exec -it flowforge-redpanda rpk topic produce playground -k user-2
```

Enter:

```text
world
```

Consume messages and display their partition, offset, key, and value:

```bash
docker exec -it flowforge-redpanda rpk topic consume playground --offset start -f '%p %o %k %v\n'
```

### Observations

Output:

```text
2 0 user-1 hello
2 1 user-2 world
```

Both messages landed on partition 2.

### Explanation

Kafka uses the message key to determine which partition receives a message.

Messages with the same key are normally assigned to the same partition when using the standard keyed partitioning strategy.

Different keys can still land on the same partition because of hash collisions.

In this experiment, both `user-1` and `user-2` were assigned to partition 2.

With three partitions, two independently distributed keys have approximately a 33% probability of landing on the same partition.

This does not mean that every set of keys will distribute evenly.

### Key Takeaways

- Message keys influence partition assignment.
- The same key normally maps to the same partition.
- Different keys can map to the same partition.
- Kafka guarantees ordering within a partition, not across the entire topic.

**Crucial rule:**

Ordering is guaranteed only within a partition.

Because `user-1` and `user-2` landed on partition 2, their relative order is preserved.

If they had landed on different partitions, Kafka would not guarantee which message would be consumed first across those partitions.

**Why this matters for FlowForge:**

Messages belonging to the same workflow or execution should use an appropriate key if their processing order matters.

---

## Experiment 3: Consumer Groups

### Objective

Understand how consumer groups distribute partitions between consumers and how multiple groups independently consume the same topic.

### Setup

Start two consumers using the same consumer group.

**Terminal A:**

```bash
docker exec -it flowforge-redpanda rpk topic consume playground -g groupA
```

**Terminal B:**

```bash
docker exec -it flowforge-redpanda rpk topic consume playground -g groupA
```

Produce messages using the keys:

```text
key-a
key-b
key-c
```

### Observations

- Messages were distributed between Terminal A and Terminal B.
- Running `rpk group describe groupA` showed two group members.
- The partitions were divided between the two consumers.

### Explanation

A consumer group allows multiple consumers to cooperate in processing messages from a topic.

Within one consumer group:

- Each partition is assigned to one consumer at a time.
- Different consumers can process different partitions in parallel.
- Messages from a particular partition are handled by its assigned consumer.

A second consumer group operates independently.

For example, if `groupB` subscribes to the same topic, it receives its own copy of the topic's message stream rather than sharing the workload with `groupA`.

### Key Takeaways

- Consumers in the same group share partition assignments.
- Different consumer groups independently consume the same topic.
- Consumer groups provide load balancing.
- A partition is assigned to only one consumer within a group at a time.

**Why this matters for FlowForge:**

Different services can independently consume the same events using different consumer groups.

For example, one group could process workflow executions while another group handles analytics or audit logging.

---

## Experiment 4: Consumer Rebalancing

### Objective

Understand how Kafka redistributes partition assignments when consumers join or leave a consumer group.

### Setup

1. Start two consumers in `groupA`.
2. Kill one consumer using `Ctrl+C`.
3. Observe the remaining consumer picking up the freed partitions.
4. Start additional consumers until there are four consumers in the group.
5. Inspect the group:

```bash
docker exec -it flowforge-redpanda rpk group describe groupA
```

### Observations

- Killing a consumer triggered a rebalance.
- The remaining consumer picked up the partitions previously assigned to the terminated consumer.
- Adding more consumers caused another rebalance.
- With four consumers and three partitions, one consumer received zero partitions.

The group description showed:

```text
MEMBERS 4
```

One member remained idle.

### Explanation

A rebalance happens when the membership of a consumer group changes or when partition assignments need to be redistributed.

For example:

- A consumer joins the group.
- A consumer leaves the group.
- A consumer crashes.
- The topic's partition count changes.

Kafka redistributes the available partitions among the active consumers.

### Key Takeaways

Parallelism is limited by the number of partitions.

For a topic with three partitions:

| Consumers | Expected workload distribution |
| --------- | ------------------------------ |
| 1         | 3 partitions                   |
| 2         | 2 + 1                          |
| 3         | 1 + 1 + 1                      |
| 4         | 1 + 1 + 1 + 0                  |

Adding consumers beyond the partition count does not increase the maximum number of consumers actively processing those partitions.

**Why this matters for FlowForge:**

This is an important limitation for Phase 6 (KEDA autoscaling).

If FlowForge has three partitions, scaling the consumer deployment to ten replicas does not give it ten-way parallelism.

The maximum number of consumers actively assigned partitions in this setup is three.

---

## Experiment 5: Offsets and Message Replay

### Objective

Understand consumer offsets and how to reset them to replay previously consumed messages.

### Attempt 1: Seek While Consumers Were Running

Attempted to reset the group offset:

```bash
docker exec -it flowforge-redpanda rpk group seek groupA --to start
```

This failed with:

```text
INVALID_OPERATION: seeking a non-empty group is not allowed.
```

### Attempt 2: Delete the Consumer Group

Attempted:

```bash
docker exec -it flowforge-redpanda rpk group delete groupA
```

This also failed:

```text
NON_EMPTY_GROUP: The group is not empty.
```

### Investigation

Ran:

```bash
docker exec -it flowforge-redpanda rpk group describe groupA
```

Observed:

```text
STATE Stable
MEMBERS 3
```

The problem was that the `rpk topic consume` processes were still alive inside the Docker container.

Closing the terminal windows had not terminated those processes.

The Redpanda image did not contain `ps` or `pkill`, so the orphaned processes could not easily be terminated from inside the container.

### Solution: Restart the Container

Restarted Redpanda:

```bash
docker restart flowforge-redpanda
```

After the container became healthy, inspected the group again:

```bash
docker exec -it flowforge-redpanda rpk group describe groupA
```

Output:

```text
STATE Empty
MEMBERS 0
```

Now the group was empty.

### Attempt 3: Reset the Offset

Successfully executed:

```bash
docker exec -it flowforge-redpanda rpk group seek groupA --to start
```

Output:

```text
TOPIC       PARTITION  PRIOR-OFFSET  CURRENT-OFFSET
playground  0          -1            0
playground  1          -1            0
playground  2          3             0
```

Starting a new consumer replayed the messages from offset 0.

### Explanation

Kafka tracks the progress of a consumer group using offsets.

An offset represents a position in a partition's log.

A consumer group commits offsets to record its progress. When a consumer restarts, it can continue from its previously committed position.

Resetting the offsets allows a consumer group to replay messages.

### Key Takeaways

- Offsets track consumer progress.
- Committed offsets determine where a consumer group resumes.
- Resetting offsets can replay previously consumed messages.
- Redpanda refuses to seek a non-empty group in this experiment.
- Closing a terminal does not necessarily terminate a process running inside Docker.
- Restarting the container cleared the orphaned consumer connections in this development setup.

**Why this matters for FlowForge:**

Offset management is important for recovery, debugging, replaying events, and handling failed workflow executions.

It also helps distinguish between a message being processed and a message being acknowledged through a committed offset.

---

## Experiment 6: Retention and Log Compaction

### Objective

Understand how Kafka manages stored messages and the difference between retention and compaction.

### Step 1: Inspect the Current Configuration

```bash
docker exec -it flowforge-redpanda rpk topic describe -c playground | grep -E "retention|cleanup"
```

Output:

```text
retention.ms 604800000
cleanup.policy delete
```

The default retention period was seven days.

### Step 2: Change Retention to One Minute

```bash
docker exec -it flowforge-redpanda rpk topic alter-config playground --set retention.ms=60000
```

Output:

```text
TOPIC playground STATUS OK
```

### Step 3: Verify the Configuration

```bash
docker exec -it flowforge-redpanda rpk topic describe -c playground | grep retention.ms
```

Output:

```text
retention.ms 60000 DYNAMIC_TOPIC_CONFIG
```

### Observations

The retention configuration was successfully changed from:

```text
604800000 ms = 7 days
```

to:

```text
60000 ms = 1 minute
```

The configuration source changed to `DYNAMIC_TOPIC_CONFIG`.

### Explanation

Kafka supports different cleanup policies.

**1. Delete (Retention)**

With:

```text
cleanup.policy=delete
```

Old log segments are deleted according to retention settings, such as time or size.

This is useful for event streams where historical events only need to remain available for a configured period.

Example:

- Page views
- Application logs
- Temporary events

**2. Compact (Log Compaction)**

With:

```text
cleanup.policy=compact
```

Kafka retains the latest message for each key as compaction runs.

This is useful for maintaining the latest known state associated with a key.

Example:

- Current user profile
- Latest account settings
- Latest configuration for a service

### Key Takeaways

| Feature       | Retention / Delete      | Compaction                    |
| ------------- | ----------------------- | ----------------------------- |
| Purpose       | Remove old log segments | Preserve latest state per key |
| Main use      | Event history           | State storage                 |
| Configuration | `delete`                | `compact`                     |

**Why this matters for FlowForge:**

Retention controls how long workflow events remain available for replay and debugging.

Compaction can be useful for state-oriented topics where the latest value for each key is more important than preserving every historical update.

---

## Experiment 7: Consumer Lag and Redpanda Console

### Objective

Understand consumer lag and how it can be monitored through Redpanda Console.

### Setup

Produced additional messages:

```bash
docker exec -it flowforge-redpanda rpk topic produce playground -k perf
```

Opened Redpanda Console:

```text
http://localhost:8080
```

Navigated to:

```text
Topics → playground → Consumer Groups → groupA
```

### Observations

The Console showed:

- Consumer group state: `Empty`
- Total lag: 4 on partition 2

The group offset had previously been reset to 0, while the log-end offset had increased to 4.

### Explanation

Consumer lag measures how far behind a consumer group is relative to the latest available messages in a partition.

The calculation is:

```text
Lag = Log-End-Offset - Group-Offset
```

For example:

```text
Log-End-Offset = 4
Group-Offset   = 0

Lag = 4 - 0 = 4
```

This indicates that the group has four offsets of lag on that partition.

A consumer group can be in the `Empty` state and still have lag.

This happens because committed offsets can remain stored even when no consumers are currently connected.

### Key Takeaways

- Consumer lag measures the difference between the log-end offset and the group's committed offset.
- High lag indicates that a consumer group is falling behind.
- An empty consumer group can still have lag.
- Monitoring lag helps identify processing bottlenecks.

**Why this matters for FlowForge:**

Consumer lag will be an important monitoring metric when scaling workflow workers.

If messages arrive faster than workers can process them, lag increases.

This can help determine when additional consumers or more processing capacity are needed.

---

# Part II: Code-Based Experiments

These experiments use `@flowforge/kafka` against the local Redpanda broker.

Each experiment resets the topic before running so that message counts and results are deterministic.

## Experiment A: Message Ordering

**File:** `tools/playground/src/ordering.ts`

### Objective

Verify that Kafka preserves message ordering for messages sharing the same key.

### Setup

- Produce 5 runs.
- Each run contains 20 events.
- Every event is keyed by its `runId`.
- Consume the messages.
- Verify that sequence numbers increase for each key.

### Result

```text
Total received: 100
Violations: 0

✅ Ordering preserved per key.
```

### Explanation

Messages with the same key are assigned to the same partition.

Because ordering is guaranteed within a partition, the sequence of events for each key is preserved.

### Gotcha Encountered: Reusing the Topic

The first execution left 100 messages in the topic.

The second execution produced another 100 messages.

As a result, the consumer encountered old messages again, including:

```text
run-1 seq 1
```

This caused two apparent ordering violations.

This was not a Kafka ordering bug.

The experiment was reading messages from the previous execution as well as the current one.

**Fix:** Reset the topic before each experiment to ensure deterministic results.

### Another Gotcha: `fromBeginning: false`

Using:

```typescript
fromBeginning: false;
```

with a consumer group that already had committed offsets caused the consumer to sit idle and eventually time out.

Switching to:

```typescript
fromBeginning: true;
```

fixed the issue for these playground experiments.

### Key Takeaways

- Kafka preserves ordering within a partition.
- Message keys determine partition assignment.
- Reusing a topic can introduce old messages into a new test.
- Consumer group offsets affect where consumption starts.
- Clean test environments are important for deterministic results.

---

## Experiment B: Consumer Group Scaling

**File:** `tools/playground/src/rebalance.ts`

### Objective

Observe how partition assignments change as consumers are added to the same consumer group.

### Setup

Started consumers in this sequence:

```text
1 → 2 → 3 → 4
```

All consumers used the same group:

```text
scaling-group
```

The topic had three partitions.

### Observed Assignments

| Number of consumers | Partition assignments     |
| ------------------- | ------------------------- |
| 1                   | `[0, 1, 2]`               |
| 2                   | `[1]`, `[0, 2]`           |
| 3                   | `[1]`, `[0]`, `[2]`       |
| 4                   | `[2]`, `[1]`, `[]`, `[0]` |

With four consumers, Consumer 3 received:

```text
Local: Assign partitions and 0 partition(s)
```

### Explanation

The consumer group redistributed partitions as new consumers joined.

The assignments demonstrated that Kafka can distribute the workload across consumers, but only up to the number of available partitions.

With three partitions, at most three consumers can actively own partitions at the same time.

### Client Quirk Encountered

The `@confluentinc/kafka-javascript` client does not implement:

```typescript
consumer.events.on('GROUP_JOIN');
```

Attempting to use it throws:

```text
Not implemented
```

The alternative was to inspect the assignment using:

```typescript
consumer.assignment();
```

This works once the rebalance has settled.

The logged arrays represent the raw partition assignments returned by the client.

### Key Takeaways

- Adding consumers triggers rebalancing.
- Consumers in the same group share partitions.
- More consumers do not necessarily mean more parallelism.
- Partition count limits consumer parallelism.
- The client-side `consumer.assignment()` method can be used to inspect assignments after rebalancing.

**Connection to Phase 6 (KEDA):**

KEDA autoscaling must account for the number of partitions.

Scaling beyond the partition count will create idle consumer replicas rather than additional partition-level processing capacity.

---

## Experiment C: Message Redelivery and At-Least-Once Delivery

**File:** `tools/playground/src/redelivery.ts`

### Objective

Demonstrate what happens when a consumer processes a message but crashes before committing its offset.

The experiment verifies that Kafka can deliver the same message again after a consumer restarts.

### Setup

1. Produce five messages.
2. Use the keys `msg-1` through `msg-5`.
3. Distribute the messages across three partitions.
4. Start the consumer.
5. Simulate a deterministic crash when processing message 3.
6. Trigger the crash before `commitOffsets` runs.
7. Inspect the consumer group's committed offsets.
8. Start the consumer again and observe redelivery.

### First Consume

Observed output:

```text
Processing message 2...
Processing message 5...
Processing message 1...
Processing message 3...

💥 Simulating crash before commit on message 3!
```

The consumer crashed before committing the offsets.

Notice that the messages did not arrive in numerical key order.

They arrived in this sequence:

```text
2 → 5 → 1 → 3
```

This is expected because messages are distributed across multiple partitions.

Kafka guarantees ordering within a partition, not globally across all partitions.

### Group State After the Crash

Command:

```bash
docker exec -it flowforge-redpanda rpk group describe redelivery-group
```

Observed state:

```text
partition 0: CURRENT-OFFSET 2, LOG-END-OFFSET 2, LAG 0
partition 1: CURRENT-OFFSET 1, LOG-END-OFFSET 3, LAG 2
partition 2: (empty)
```

### Understanding the Output

Message 3 lives on partition 1.

Its partition showed:

```text
CURRENT-OFFSET: 1
LOG-END-OFFSET: 3
LAG: 2
```

This means:

- The consumer group had committed its position at offset 1.
- The partition's log-end offset was 3.
- Two offsets were still pending from the group's perspective.
- Message 3 was among those pending messages.

The important detail is that processing a message does not automatically mean its offset has been committed.

If the consumer crashes before committing, Kafka still considers the message unacknowledged from the consumer group's perspective.

### Second Consume

Restarted the consumer.

Observed output:

```text
Processing message 3...

💥 Simulating crash before commit on message 3!
```

Message 3 was delivered again.

<text style="display:none"> </text>

### Result

**Message 3 was redelivered because its offset had not been committed before the crash.**

This demonstrates **at-least-once delivery**.

The broker can resend a message when the consumer has processed it but has not successfully committed the corresponding offset.

This creates the possibility of duplicate processing.

### Gotcha Encountered: Message Arrival Order

An earlier version of the script used:

```typescript
lastProcessed >= 5;
```

as its exit condition.

This was incorrect.

Messages arrive in partition order, not necessarily in key or numerical order.

For example, message 5 could arrive before message 3.

The script would then exit before message 3 was ever consumed, meaning the crash trigger would never execute.

### Fix: Track All Seen Message IDs

Changed the implementation to track observed message IDs using a `Set`.

Conceptually:

```typescript
const seenIds = new Set<string>();
```

Each processed message adds its ID:

```typescript
seenIds.add(messageId);
```

The script only exits after all five message IDs have been observed.

This ensures that message arrival order does not affect the test's completion condition.

### Key Takeaways

- Kafka commits offsets to track consumer progress.
- Processing a message and committing its offset are separate operations.
- A crash before committing can cause redelivery.
- Messages can be processed more than once.
- Multiple partitions do not provide a global message ordering guarantee.
- Tests should not assume that messages arrive in numerical key order.

### Connection to Phase 3: Database Idempotency

This experiment has an important architectural implication for FlowForge.

**Idempotency must be enforced by the database, not by an in-memory `seen IDs` set.**

An in-memory set only exists while the process is running.

If the process crashes and restarts:

- The in-memory set is lost.
- Previously processed messages may be delivered again.
- The application may attempt to execute the same operation twice.

Therefore, the database must enforce uniqueness for operations that should only happen once.

For example, a uniqueness constraint could be:

```sql
UNIQUE (run_id, step_key, attempt)
```

When the same message is processed again, the database constraint prevents a duplicate record from being created.

The second processing attempt can then become a no-op or follow the application's existing idempotency handling.

**The key principle:**

Never rely on an in-memory flag to guarantee that a distributed operation happens only once.

The database must be the source of truth for idempotency.

---

# Part III: Consolidated Lessons

## 1. Kafka Ordering

- Kafka guarantees ordering within a partition.
- Kafka does not guarantee ordering across partitions.
- Message keys determine partition assignment.
- Messages sharing the same key normally land on the same partition.
- Key selection is important when processing order matters.

## 2. Consumer Groups and Scaling

- Consumers in the same group share partition assignments.
- Different consumer groups independently consume the same topic.
- Adding or removing consumers triggers rebalancing.
- Partition count limits consumer parallelism.
- Adding consumers beyond the partition count creates idle consumers.

## 3. Offsets and Recovery

- Offsets track consumer progress.
- Consumer groups commit offsets.
- Resetting offsets allows messages to be replayed.
- A message can be processed without its offset being committed.
- Crashes between processing and committing can cause redelivery.

## 4. Retention and Compaction

- Retention controls how long old log segments remain available.
- Compaction preserves the latest value for each key as compaction runs.
- Retention is useful for historical event streams.
- Compaction is useful for state-oriented data.

## 5. Monitoring

- Consumer lag indicates how far behind a group is.
- Lag is calculated using the difference between the log-end offset and committed group offset.
- An empty group can still have lag.
- Monitoring lag helps identify processing bottlenecks.

## 6. Reliability and Idempotency

- At-least-once delivery can result in duplicate processing.
- Processing and committing offsets are separate operations.
- In-memory deduplication is not sufficient across process restarts.
- Database-level uniqueness constraints provide durable idempotency protection.

---

# Part IV: Connection to FlowForge Development Phases

These experiments provide the foundation for several important FlowForge implementation decisions.

| FlowForge phase | Kafka concept              | Practical implication                              |
| --------------- | -------------------------- | -------------------------------------------------- |
| Phase 3         | Redelivery and idempotency | Enforce duplicate protection at the database level |
| Phase 3         | Offsets                    | Understand processing versus committed progress    |
| Phase 3         | Message ordering           | Use appropriate message keys                       |
| Phase 6         | Consumer scaling           | Partition count limits parallelism                 |
| Phase 6         | Consumer lag               | Monitor backlog and processing capacity            |
| Phase 6         | Rebalancing                | Account for changing worker assignments            |
| Infrastructure  | Retention                  | Configure event-history storage                    |
| Infrastructure  | Compaction                 | Consider state-oriented topics                     |

---

# Final Understanding

The most important concepts I learned from these experiments are:

1. **Partitions provide parallelism, but also define ordering boundaries.**
2. **Message keys are important because they determine where messages are processed.**
3. **Consumer groups distribute work, while separate groups independently receive the same stream.**
4. **Rebalancing allows consumers to join and leave without permanently losing partition assignments.**
5. **Offsets control where consumers resume and make message replay possible.**
6. **Consumer lag helps identify whether processing capacity is keeping up with incoming messages.**
7. **At-least-once delivery means duplicate processing is possible.**
8. **Database-level idempotency is essential because an application can crash after processing a message but before committing its offset.**
9. **Scaling consumers beyond the number of partitions does not increase partition-level parallelism.**

**Overall conclusion:**

Kafka is not simply a message queue. It is a distributed event log with partitioning, ordering guarantees, consumer coordination, offset management, and replay capabilities.

Understanding these mechanisms is essential before building reliable, scalable workflow execution in FlowForge.
