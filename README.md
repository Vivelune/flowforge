# Flowforge

**An event-driven AI workflow orchestration platform.**

Flowforge is a distributed workflow orchestration system designed to execute, coordinate, and monitor AI-powered workflows.

The project explores how to build reliable distributed systems using event-driven architecture, asynchronous job processing, and independently deployable services.

> **Project status:** Early development. Core infrastructure and architecture are being established.

## Goals

- Build an event-driven workflow execution engine.
- Support asynchronous and distributed workflow execution.
- Coordinate workers through durable event messaging.
- Provide reliable execution, retries, and failure handling.
- Track workflow state and execution history.
- Expose workflow management through a web dashboard.
- Support observability across distributed services.

## Architecture

Flowforge is organized as a pnpm and Turborepo monorepo.

### Applications

| Application   | Responsibility               |
| ------------- | ---------------------------- |
| `apps/web`    | Web dashboard and API layer  |
| `apps/worker` | Workflow execution workers   |
| `apps/relay`  | Event ingestion and delivery |

### Shared packages

| Package           | Responsibility                                  |
| ----------------- | ----------------------------------------------- |
| `packages/config` | Shared environment validation and configuration |
| `packages/db`     | Database schema and data access                 |
| `packages/events` | Shared event contracts and schemas              |

### Infrastructure

The planned infrastructure includes:

- Kafka / Redpanda for event streaming.
- PostgreSQL for persistent application data.
- Redis for caching and coordination.
- Kubernetes for container orchestration.
- KEDA for event-driven worker autoscaling.
- OpenTelemetry for distributed tracing.
- Prometheus and Grafana for metrics and dashboards.

These components will be introduced incrementally as the system develops.

## Technology Stack

| Area                    | Technology                         |
| ----------------------- | ---------------------------------- |
| Language                | TypeScript                         |
| Runtime                 | Node.js                            |
| Package manager         | pnpm                               |
| Monorepo orchestration  | Turborepo                          |
| Web application         | Next.js                            |
| Validation              | Zod                                |
| Database                | PostgreSQL                         |
| Messaging               | Kafka / Redpanda                   |
| Cache                   | Redis                              |
| Container orchestration | Kubernetes                         |
| Observability           | OpenTelemetry, Prometheus, Grafana |

## Repository Structure

```text
flowforge/
├── apps/
│   ├── web/
│   ├── worker/
│   └── relay/
├── packages/
│   ├── config/
│   ├── db/
│   └── events/
├── infra/
│   ├── docker/
│   ├── k8s/
│   ├── helm/
│   └── terraform/
├── docs/
│   ├── adr/
│   └── architecture/
├── .github/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- pnpm
- Git

### Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd flowforge
```

Install dependencies:

```bash
pnpm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Update `.env` with the connection details and credentials for your local development environment.

Do not commit `.env` or other files containing secrets.

### Development commands

Run the available workspace validation commands from the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Individual workspace commands can also be run with pnpm filters.

For example:

```bash
pnpm --filter @flowforge/config lint
pnpm --filter @flowforge/config typecheck
pnpm --filter @flowforge/config build
```

The full application development workflow will be documented as the web, worker, relay, and infrastructure components become operational.

## Architecture Decisions

Important technical decisions are documented as Architecture Decision Records (ADRs).

| ADR                                                | Decision                          |
| -------------------------------------------------- | --------------------------------- |
| [ADR-0001](docs/adr/0001-monorepo-architecture.md) | Use a pnpm and Turborepo monorepo |

See [docs/adr](docs/adr/) for the complete decision history.

## Development Roadmap

The project is being developed incrementally:

- [x] Monorepo foundation.
- [x] Shared environment configuration package.
- [x] Architecture decision record structure.
- [ ] Workflow domain model.
- [ ] Initial workflow execution engine.
- [ ] Event-driven execution with Kafka / Redpanda.
- [ ] Distributed worker architecture.
- [ ] Workflow monitoring dashboard.
- [ ] Kubernetes deployment and autoscaling.
- [ ] Distributed tracing and metrics.

## Engineering Principles

- Explicit service and package boundaries.
- Event-driven communication where appropriate.
- Idempotent and fault-tolerant execution.
- Observable distributed workflows.
- Independently deployable applications.
- Automated testing and continuous integration.
- Architecture decisions documented and reviewed.

## License

No license has been selected yet.
