# ADR-005: Transactional Outbox

- **Status:** Accepted
- **Date:** 2026-11-18
- **Decision Makers:** Flowforge maintainers

## Context

Phase 3 introduces Kafka between the API and the execution pipeline. When a user triggers a run, the API must do two things atomically:

1. Persist the `Run` row (so the UI can display it immediately).
2. Publish a `run.requested` event (so the pipeline picks it up).

Directly calling `producer.send()` from the API route is unsafe. The two operations (DB commit and Kafka publish) cannot participate in the same transaction. Three failure modes exist:

- **Publish-then-write:** The event is published but the DB write fails. Downstream consumers process a run that does not exist. Data loss in reverse.
- **Write-then-publish:** The DB commit succeeds but the Kafka publish fails. The user sees a PENDING run that never progresses. This is the dual-write problem.
- **Both succeed:** The happy path.

Retries at the API layer do not fix the second failure mode: you can't know whether the publish actually landed (network timeouts are ambiguous), and retrying after a successful commit duplicates the event.

## Decision

Use the **transactional outbox** pattern.

1. The API writes the `Run` row and an `OutboxEvent` row **in the same Postgres transaction**.
2. A separate relay process polls the outbox for unpublished rows and publishes them to Kafka.
3. The relay marks each row published after a successful publish.

The DB commit is the source of truth: if the `Run` exists, the outbox row exists, and the relay will eventually publish it.

## Consequences

**Positive:**

- No lost events. A committed `Run` will always produce a `run.requested` event.
- No phantom events. An outbox row only exists if its corresponding `Run` was committed.
- The relay can retry indefinitely without affecting the API.

**Negative:**

- Delivery becomes **at-least-once**: the relay may publish the same row twice if it crashes after the Kafka ack but before the `publishedAt` update.
- Adds a polling service (the relay) and a small latency (poll interval) between commit and publish.
- Adds one row per event to the DB, which requires cleanup.

The at-least-once consequence is handled by idempotent consumers (Issue #8) and `ProcessedEvent` deduplication.

## Alternatives Considered

- **Publish-then-write:** rejected for the phantom-event failure mode above.
- **Change Data Capture with Debezium:** a connector reads the Postgres WAL and publishes to Kafka automatically. This avoids the relay entirely, but adds a Kafka Connect cluster to operate. It also couples CDC to schema changes (renaming a table breaks the connector). Deferred to Phase 10 if the outbox becomes a bottleneck.
- **Debezium outbox event router:** a Debezium feature that reads a dedicated outbox table. Same deployment cost as CDC above.

## Notes

The relay uses `SELECT ... FOR UPDATE SKIP LOCKED` so multiple relay instances can run concurrently without double-publishing the same row in the normal case. Crashes still produce duplicates, which is why consumers must be idempotent.
