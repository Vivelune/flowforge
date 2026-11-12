# ADR-0001: Use a pnpm and Turborepo Monorepo

- **Status:** Accepted
- **Date:** 2026-11-12
- **Decision Makers:** Flowforge maintainers

## Context

Flowforge is an event-driven AI workflow orchestration platform.
It consists of multiple applications and shared packages that must
evolve together.

The planned applications include:

- `apps/web`: Web dashboard and API layer.
- `apps/worker`: Workflow execution workers.
- `apps/relay`: Event ingestion and delivery service.

The planned shared packages include:

- `packages/config`: Shared environment validation and configuration.
- `packages/db`: Database schema and data access.
- `packages/events`: Shared event contracts and schemas.

These applications share domain models, event contracts, configuration,
and development tooling.

We need a repository structure that supports independent application
builds while keeping shared code consistent and easy to maintain.

## Decision

We will use a monorepo managed by pnpm workspaces and Turborepo.

The repository will contain independently buildable applications and
reusable packages.

pnpm will manage dependencies and workspace relationships.

Turborepo will orchestrate tasks such as:

- Build
- Lint
- Typecheck
- Test

Task dependencies and caching will be configured through `turbo.json`.

Each application and package will maintain its own `package.json`
and expose explicit scripts for supported tasks.

Shared code will be implemented in internal workspace packages
rather than duplicated across applications.

Applications will remain independently deployable. The monorepo
does not require all services to be deployed together.

## Alternatives Considered

### Option 1: Multiple repositories

Each application and shared package could live in its own repository.

This provides stronger repository-level isolation, but introduces
additional overhead:

- Cross-repository changes require coordinated pull requests.
- Shared contracts can become versioning and compatibility problems.
- CI configuration and development tooling may be duplicated.
- Local development across multiple repositories becomes harder.

We rejected this option because the applications are closely related
and are expected to evolve together.

### Option 2: Single repository without workspace tooling

We could place all applications and packages in one repository
without pnpm workspaces or a build orchestrator.

This would simplify the initial setup, but dependency management,
task execution, and build caching would become increasingly difficult
as the project grows.

We rejected this option because we want explicit workspace boundaries
and scalable task orchestration from the beginning.

## Consequences

### Positive

- Shared event contracts and domain types have a single source of truth.
- Cross-service changes can be reviewed in one pull request.
- Dependency management is centralized.
- Turborepo can cache build and validation tasks.
- Applications can still be built and deployed independently.
- Local development is easier because the complete system lives together.

### Negative

- Repository tooling is more complex than a single application repository.
- CI pipelines must avoid unnecessary work across unrelated packages.
- Shared package changes can affect multiple applications.
- Repository permissions and ownership boundaries are less isolated.

### Risks

- Poor workspace boundaries could create tightly coupled applications.
- Circular dependencies could make builds difficult to reason about.
- Shared packages could become dumping grounds for unrelated code.

We will mitigate these risks by:

- Keeping package responsibilities narrow.
- Defining explicit package exports.
- Using dependency boundaries between applications and packages.
- Enforcing linting, typechecking, and build validation in CI.
- Keeping applications independently deployable.
