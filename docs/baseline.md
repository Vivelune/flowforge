# Phase 1 Baseline Measurements

This document records the behavior and limitations of the monolith architecture (Next.js with in-process execution) before migrating to an event-driven model.

## 1. Throughput & Concurrency

- **Test:** Fired 50 runs simultaneously, each configured with a 3-second `DELAY` step.
- **Result:** All 50 runs completed in approximately **8 seconds**.
- **Observation:** While the runs were executing, the single Node.js thread was heavily congested. The database connection pool and the event loop were shared between serving HTTP requests and executing workflow logic. The dashboard became sluggish and unresponsive while the runs were processing. (See `screenshots/throughput-concurrency.png`).

## 2. Crash Resilience

- **Test:** Triggered a run with a 10-second delay, then killed the Next.js server (`Ctrl+C`) mid-execution.
- **Result:** The run is permanently stuck in the `RUNNING` state in the database.
- **Observation:** Because execution happens in-process, the state was lost when the process died. There is no retry mechanism, no timeout, and no recovery worker. The work is permanently orphaned. (See `screenshots/crash-test.png`).

## 3. Architectural Weaknesses

- **Coupled scaling:** We cannot scale the execution tier independently of the web tier. If someone triggers 10,000 workflows, the API will likely crash.
- **Reliability:** A server restart during execution loses all active runs.
- **No retries:** A temporary network failure on step 1 fails the entire run immediately.
- **No backpressure:** The API accepts runs infinitely fast, but the single process cannot execute them fast enough, leading to memory exhaustion under heavy load.
