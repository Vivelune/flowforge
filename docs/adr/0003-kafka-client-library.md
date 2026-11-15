# ADR-003: Kafka Client Library

- **Status:** Accepted
- **Date:** 2026-11-15
- **Decision Makers:** Flowforge maintainers

## Context

We need a Node.js client to produce and consume messages from Redpanda (Kafka). The client must support TypeScript, manual offset commits, and graceful shutdown. We evaluated three main options: `kafkajs`, `@confluentinc/kafka-javascript`, and `node-rdkafka`.

## Decision

We will use **`@confluentinc/kafka-javascript`**.

## Alternatives Considered

### Option 1: `kafkajs`

- **Pros:** Excellent pure-JS developer experience, huge community adoption, very clean API.
- **Cons:** The original project has been effectively unmaintained since early 2023. It lacks recent security updates and does not have native performance optimizations.

### Option 2: `node-rdkafka`

- **Pros:** Wraps `librdkafka` (the gold standard C library for Kafka). Extremely high performance.
- **Cons:** The API is callback-heavy and feels dated in a modern TypeScript/async-await codebase. Building the native C++ bindings is notoriously fragile across different operating systems and Docker base images (e.g., Alpine Linux).

### Option 3: `@confluentinc/kafka-javascript`

- **Pros:**
  - Maintained by Confluent (the creators of Kafka).
  - Wraps `librdkafka` for high performance and reliability.
  - Provides a KafkaJS-compatible API, making it familiar and easy to use.
  - Fully typed in TypeScript.
- **Cons:** Requires native binaries. In Docker, we must use a Debian-based Node image (e.g., `node:22-bookworm-slim`) rather than Alpine to ensure the pre-built binaries work.

## Consequences

- **Positive:** We get a maintained, highly performant client with a modern API. It supports the advanced features (like idempotent producers and manual commits) that Phase 3 requires.
- **Negative:** Developers on Windows may need to ensure build tools are installed if pre-built binaries fail. Docker images must not use Alpine.
