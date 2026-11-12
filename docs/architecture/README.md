# Flowforge Architecture

This directory contains technical documentation describing the architecture,
components, and internal behavior of Flowforge.

## System Overview

Flowforge is an event-driven AI workflow orchestration platform.

The system is designed around independently deployable applications
that communicate through well-defined contracts and asynchronous events.

## Core Applications

| Application   | Responsibility                            |
| ------------- | ----------------------------------------- |
| `apps/web`    | Workflow management API and web dashboard |
| `apps/worker` | Executes workflow jobs                    |
| `apps/relay`  | Handles event ingestion and delivery      |

## Shared Packages

| Package           | Responsibility                                  |
| ----------------- | ----------------------------------------------- |
| `packages/config` | Environment validation and shared configuration |
| `packages/db`     | Database schema and data access                 |
| `packages/events` | Event schemas and shared contracts              |

## Planned System Components

- **Web application:** Workflow creation, management, and monitoring.
- **Event broker:** Durable event communication between services.
- **Workers:** Asynchronous workflow execution.
- **Database:** Persistent workflow definitions and execution state.
- **Redis:** Caching and coordination.
- **Observability:** Metrics, logs, and distributed traces.

## Architecture Documentation

Architecture documents will be added here as the system evolves.

| Document            | Description                                 | Status  |
| ------------------- | ------------------------------------------- | ------- |
| System architecture | High-level component relationships          | Planned |
| Workflow lifecycle  | Workflow execution and state transitions    | Planned |
| Event architecture  | Event contracts and messaging patterns      | Planned |
| Worker architecture | Job execution and concurrency               | Planned |
| Failure handling    | Retries, timeouts, and dead-letter handling | Planned |
| Observability       | Metrics, logs, and distributed tracing      | Planned |

## Architecture Decision Records

Important architectural decisions are maintained separately in [`docs/adr`](../adr/).

See [ADR-0001: Monorepo Architecture](../adr/0001-monorepo-architecture.md).
