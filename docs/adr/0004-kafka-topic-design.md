# ADR-004: Kafka Topic Design

- **Status:** Accepted
- **Date:** 2026-11-17
- **Decision Makers:** Flowforge maintainers

## Context

Phase 3 moves workflow execution out of the web process and onto Kafka. The broker becomes the coordination layer between the API, relay, orchestrator, and workers. The topic topology determines:

- Per-run ordering guarantees
- Maximum worker parallelism
- Retention and replay behavior
- Failure isolation (poison messages must not block live traffic)

## Decision

| Topic                | Partitions | Replication                           | Retention | Events                           |
| -------------------- | ---------- | ------------------------------------- | --------- | -------------------------------- |
| `workflow.runs`      | 6          | `KAFKA_REPLICATION` (1 local, 3 prod) | 7 days    | `run.requested`, `run.completed` |
| `workflow.steps`     | 6          | same                                  | 7 days    | `step.execute`                   |
| `workflow.results`   | 6          | same                                  | 7 days    | `step.completed`, `step.failed`  |
| `workflow.steps.dlq` | 3          | same                                  | 30 days   | Poison and exhausted messages    |

**Key:** always `runId`. Every event for a run lands on the same partition, guaranteeing per-run ordering.

**Partitions:** 6 for live topics, because:

- It allows scaling workers to 6 in Phase 6 (KEDA) without a topology change.
- Partition count cannot be reduced, and increasing it later remaps keys to partitions, breaking per-run ordering across the change. 6 is a safe ceiling for the expected demo load.
- DLQ has 3 partitions because poison traffic is sparse.

**Replication:** driven by env `KAFKA_REPLICATION` so the same `ensureTopics()` works locally (1, single broker) and in Phase 5/10 (3, multi-broker).

**Retention:** 7 days on live topics is longer than any practical replay window. DLQ is 30 days because delayed debugging of poison messages is common.

## Consequences

**Positive:**

- Per-run ordering is guaranteed by the key.
- Worker scaling up to 6 requires no coordination.
- DLQ isolation means a single poison message can't block live traffic.

**Negative:**

- Partition count is a permanent decision per topic. This is the main cost.
- DLQ with 3 partitions has limited replay parallelism, but that matches its low traffic.

## Alternatives Considered

- **1 partition per topic:** Simple, but limits worker parallelism to 1. Rejected because Phase 6 explicitly requires horizontal scaling.
- **12 partitions:** More headroom, but each partition adds broker memory, file handles, and consumer coordination overhead. 6 is enough for the target load and matches the expected KEDA max.
- **Single topic for all events:** Simpler topology, but prevents independent scaling of orchestrator and workers. Rejected.

## Notes

`ensureTopics()` is idempotent: it lists existing topics and only creates the missing ones. It is safe to call on every `infra:up`.
