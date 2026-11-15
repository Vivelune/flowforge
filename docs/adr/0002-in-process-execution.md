# ADR-002: In-Process Execution as a Baseline

## Status

Accepted (Phase 1)

## Context

We need a working workflow engine to validate the domain model, UI, and step executors quickly. Introducing message brokers (Kafka) and separate worker processes at this stage would introduce too much infrastructure overhead and slow down initial iteration.

## Decision

We will execute workflows directly inside the Next.js API route (`POST /api/workflows/:id/runs`) using a fire-and-forget promise (`void executeRun(...)`).

## Consequences

- **Pros:** Extremely fast to build, easy to debug, zero additional infrastructure.
- **Cons:**
  - **No resilience:** A crash loses in-flight work.
  - **No scaling:** CPU/network-bound executions block the web server.
  - **No retries:** A failed step fails the run immediately.
- **Evidence:** See `docs/baseline.md` for the crash test and throughput measurements.

## Next Steps

In Phase 3, we will replace this with an event-driven architecture. The API will publish a `RunRequested` event to Kafka, and a separate worker pool will consume it and execute the workflow, providing resilience and horizontal scaling.
