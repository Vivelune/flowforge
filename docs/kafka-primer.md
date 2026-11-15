# Kafka Primer

A short, opinionated summary of the Kafka concepts Flowforge will rely on. See [kafka-lab-notes.md](./kafka-lab-notes.md) for the hands-on evidence behind each claim.

## What Kafka is for

Kafka (and Redpanda, its API-compatible sibling) is a **durable, append-only log** that multiple processes can read independently. It is not a queue: messages are not deleted on read. Consumers advance a **bookmark** (offset) through the log, and the broker retains messages until a retention policy expires them.

This makes Kafka a good fit for Flowforge because:

- Workflow runs need to be durably recorded before execution starts (survives API crashes).
- Multiple workers can process the same run stream independently (e.g., executor and auditor).
- Replaying historical events is free (just reset the offset).

## Topics and partitions

A **topic** is a named log, split into **partitions**. Each partition is an independent ordered log on disk. A topic with 3 partitions has 3 separate logs.

- Partition count is the **maximum parallelism** for a consumer group. More consumers than partitions → idle consumers (verified in Experiment B).
- Partition count is set at topic creation and should be chosen for the expected future parallelism, not just today's load.

## Keys and ordering

Producers can attach a **key** to each message. Kafka hashes the key to choose a partition:

partition = hash(key) % num_partitions

Consequences:

- Same key → same partition → **strict ordering** for that key.
- Different keys → possibly different partitions → **no ordering** between them.
- No key → round-robin (or sticky) across partitions → no ordering at all.

For Flowforge, this means a workflow run should be keyed by `runId` so all events for a run land on the same partition and are processed in order.

## Consumer groups and parallelism

A **consumer group** is a set of consumers that share a subscription. The broker assigns each partition to exactly one consumer in the group.

- Within a group, each partition is processed by exactly one consumer at a time.
- Across groups, every group gets every message independently.
- Parallelism is capped by partition count.

## Offsets and commits

Each consumer tracks its position per partition as an **offset**. When the consumer commits an offset, it tells the broker "I have processed everything up to here."

Two commit strategies:

- **Auto-commit** (default in many clients): the client commits periodically, _before_ the handler finishes. Fast, but can lose work on crash (message marked processed but handler never ran).
- **Manual commit**: the client commits _after_ the handler succeeds. Slower, but safe. Flowforge uses manual commit.

## Rebalancing

When a consumer joins or leaves, the broker reassigns partitions across the group. This is called a **rebalance**.

- During a rebalance, all consumers in the group briefly stop processing.
- Rebalances are triggered by membership changes, session timeouts, or partition count changes.
- `@confluentinc/kafka-javascript` has a cooperative-sticky balancer that minimizes partition movement.

Verified in Experiment B: killing one consumer caused its partitions to reassign; starting a fourth consumer left one idle because there were only 3 partitions.

## Delivery guarantees

Kafka supports three delivery semantics:

- **At-most-once**: commit before processing. Messages may be lost on crash.
- **At-least-once**: commit after processing. Messages may be redelivered on crash. **This is what Flowforge uses.**
- **Exactly-once**: requires transactions between producer and consumer. Complex, and not necessary for Phase 1–3.

At-least-once means: **handlers must be idempotent.** A crash after processing but before committing will cause the message to be redelivered, and the handler will run again. Verified in Experiment C: message 3 was processed, the process died before commit, and message 3 was redelivered on the next consumer start.

## Retention vs compaction

Two cleanup policies for topics:

- **`cleanup.policy=delete`** (default): delete old segments after `retention.ms` or `retention.bytes`. Use for event logs.
- **`cleanup.policy=compact`**: keep only the latest message per key, delete older ones. Use for state topics (e.g., "current workflow definition").

Flowforge's run-event topics will use `delete` (keep the full history for replay). Future topics for workflow state snapshots may use `compact`.

## The two-listener concept

In Docker, Redpanda exposes Kafka on two addresses:

- **`redpanda:9092`** — internal, only reachable from inside the Docker network.
- **`localhost:19092`** — external, reachable from your host machine.

Your app connects to the bootstrap address you configured in `KAFKA_BROKERS`, and then the broker tells the client which advertised address to use. If you're running the app in Docker, the app must use the internal address; if on the host, the external address. This is the cause of 90% of "my app connects but hangs" issues.

## Further reading

- Lab experiments: [kafka-lab-notes.md](./kafka-lab-notes.md)
- ADR on client choice: [ADR-003](./adr/0003-kafka-client-library.md)
