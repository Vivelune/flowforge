# Local Infrastructure

This directory contains the Docker Compose configuration for FlowForge's local development infrastructure.

It provides the infrastructure dependencies required for local development and experimentation, including a Kafka-compatible event broker, a web-based monitoring interface, and Redis.

The stack is intentionally lightweight and will expand as FlowForge progresses through its development phases.

## 1. Infrastructure Overview

The local development stack consists of three services:

| Service    | Docker Image                    | Purpose                                                            | Host Port |
| ---------- | ------------------------------- | ------------------------------------------------------------------ | --------- |
| `redpanda` | `redpandadata/redpanda:v24.2.1` | Kafka-compatible event broker                                      | `19092`   |
| `console`  | `redpandadata/console:v2.7.2`   | Web interface for inspecting topics, consumer groups, and messages | `8080`    |
| `redis`    | `redis:7-alpine`                | Caching and coordination (Phase 3+)                                | `6379`    |

### Redpanda

Redpanda provides the event streaming infrastructure used by FlowForge.

It exposes the following endpoints:

| Listener                |    Port | Purpose                                                   |
| ----------------------- | ------: | --------------------------------------------------------- |
| External Kafka listener | `19092` | Connections from applications running on the host machine |
| Internal Kafka listener |  `9092` | Connections from containers inside the Docker network     |
| Schema Registry         | `18081` | Schema management and compatibility                       |
| HTTP Proxy              | `18082` | HTTP-based access to Kafka-compatible operations          |

### Redpanda Console

Redpanda Console provides a browser-based interface for inspecting and managing the local broker.

It can be used to:

- Browse topics and partitions.
- Inspect messages and their keys.
- View consumer groups.
- Inspect partition assignments.
- Monitor consumer offsets and lag.
- Troubleshoot message consumption.

Access the Console at:

http://localhost:8080

### Redis

Redis provides an in-memory data store for caching and coordination.

It is included in the infrastructure stack ahead of its planned integration in Phase 3 and later development.

---

## 2. Prerequisites

Before starting the infrastructure, make sure the following tools are installed:

- Docker Desktop or Docker Engine.
- Docker Compose.
- Node.js and pnpm.
- Access to the FlowForge repository.

Verify Docker:

```bash
docker --version
docker compose version
```

Verify pnpm:

```bash
pnpm --version
```

---

## 3. Quick Start

All infrastructure commands should be executed from the FlowForge repository root.

### Start the infrastructure

```bash
pnpm dev:infra
```

This starts all services in the background.

The command is an alias for:

```bash
pnpm infra:up
```

### Verify service status

```bash
pnpm infra:ps
```

All services should eventually report a healthy or running state, depending on their configured healthchecks.

### Open Redpanda Console

Once the broker is healthy, open:

http://localhost:8080

You can now inspect the local Redpanda environment.

---

## 4. Available Commands

The following pnpm scripts manage the local infrastructure.

| Command            | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `pnpm dev:infra`   | Start all local infrastructure services                        |
| `pnpm infra:up`    | Start services in the background                               |
| `pnpm infra:down`  | Stop and remove containers while preserving named volumes      |
| `pnpm infra:reset` | Stop services and delete volumes, performing a full data reset |
| `pnpm infra:ps`    | Display container status                                       |
| `pnpm infra:logs`  | Follow logs from all infrastructure services                   |

### Starting services

```bash
pnpm infra:up
```

### Stopping services

```bash
pnpm infra:down
```

Stopping the infrastructure does not delete persistent data stored in named volumes.

### Resetting the infrastructure

```bash
pnpm infra:reset
```

**Warning:** This removes persistent volumes and permanently deletes the locally stored infrastructure data.

Use this when you intentionally want a clean environment.

### Inspecting logs

```bash
pnpm infra:logs
```

### Checking container status

```bash
pnpm infra:ps
```

---

## 5. Connecting to Kafka

Redpanda exposes two Kafka listeners because applications can connect from different network environments.

Choosing the correct listener is essential.

### 5.1 Applications Running on the Host Machine

If an application runs directly on your computer, use:

```env
KAFKA_BROKERS=localhost:19092
```

Examples include:

- Local Next.js applications.
- Node.js playground scripts.
- Locally running FlowForge services.
- Kafka consumers and producers executed outside Docker.

Do not use `redpanda:9092` from your host machine.

The hostname `redpanda` is only resolvable inside the Docker network.

### 5.2 Applications Running Inside Docker

If an application runs inside another Docker container connected to the same Compose network, use:

```env
KAFKA_BROKERS=redpanda:9092
```

This applies to future containerized FlowForge components, including:

- Workflow workers.
- Event relays.
- Other Kafka producers and consumers.

### 5.3 Understanding the Two-Listener Concept

| Application location | Kafka broker address |
| -------------------- | -------------------- |
| Host machine         | `localhost:19092`    |
| Docker container     | `redpanda:9092`      |

The two addresses connect to the same Redpanda broker but are intended for different network environments.

**Important:** A Kafka client initially connects to its configured bootstrap broker and then receives broker metadata containing advertised listener addresses.

Therefore, the listener configuration must be correct not only for the initial connection but also for subsequent broker communication.

A mismatch can cause clients to hang, fail to connect, or encounter connection errors.

For a deeper explanation, see:

`docs/kafka-primer.md` — The two-listener concept.

---

## 6. Persistent Data

The Docker Compose stack uses named volumes to preserve infrastructure data between container restarts.

This means:

- Stopping services does not automatically delete broker data.
- Recreating containers preserves data when the named volumes are retained.
- Restarting Redpanda does not intentionally reset the topic data.
- Running `pnpm infra:reset` removes the associated volumes.

This is important when working with Kafka because topics, messages, and consumer group state can persist across development sessions.

### When to use each command

| Situation                     | Command            |
| ----------------------------- | ------------------ |
| Start development environment | `pnpm infra:up`    |
| Temporarily stop services     | `pnpm infra:down`  |
| Restart after stopping        | `pnpm infra:up`    |
| Completely reset local data   | `pnpm infra:reset` |

Avoid resetting the infrastructure unless you intentionally want to discard existing local data.

---

## 7. Troubleshooting

### 7.1 Broker Is Healthy but My Kafka Client Hangs

This is commonly caused by using the wrong Kafka listener.

Check the environment variable:

For applications running on your computer:

```env
KAFKA_BROKERS=localhost:19092
```

For applications running inside Docker:

```env
KAFKA_BROKERS=redpanda:9092
```

Also verify that the application can reach the advertised broker address.

See `docs/kafka-primer.md` for the two-listener explanation.

### 7.2 Port Already in Use

If Docker cannot start a service because a port is occupied, another process may already be using one of these ports:

|    Port | Service                          |
| ------: | -------------------------------- |
|  `8080` | Redpanda Console                 |
|  `6379` | Redis                            |
| `19092` | Redpanda external Kafka listener |

You can either stop the conflicting process or change the host-side port mapping in `docker-compose.yml`.

For example:

```yaml
ports:
  - '19093:19092'
```

This maps host port `19093` to container port `19092`.

If you change the host port, update the host application's broker configuration accordingly:

```env
KAFKA_BROKERS=localhost:19093
```

**Important:** Do not change the container-side port unless you also update the corresponding internal listener and application configuration.

### 7.3 Stale Consumer Group State

Sometimes a consumer group remains active even after its terminal window has been closed.

Inspect the group:

```bash
docker exec -it flowforge-redpanda rpk group describe <group>
```

Delete the group:

```bash
docker exec -it flowforge-redpanda rpk group delete <group>
```

If deletion fails because the group still has active members, investigate whether consumer processes are still running.

In the minimal Redpanda container used for these experiments, process-management utilities such as `ps` and `pkill` may not be available.

For the local development environment, restarting the broker can clear orphaned client connections:

```bash
docker restart flowforge-redpanda
```

Verify the group afterward:

```bash
docker exec -it flowforge-redpanda rpk group describe <group>
```

**Note:** Restarting the broker is a troubleshooting workaround, not a general solution for managing production consumer groups.

### 7.4 No Such Container After `infra:down`

If you run:

```bash
pnpm infra:down
```

Docker Compose removes the containers.

Trying to execute a command against a removed container may return:

```text
No such container
```

Start the infrastructure again:

```bash
pnpm infra:up
```

Your persistent data should remain available as long as the named volumes were not removed.

### 7.5 Redpanda Console Shows No Topics

A fresh Redpanda environment does not automatically contain your application topics.

Create a topic manually:

```bash
docker exec -it flowforge-redpanda rpk topic create playground -p 3
```

Alternatively, execute one of the Kafka playground experiments:

```bash
pnpm --filter @flowforge/playground ordering
```

Once messages have been produced, navigate to:

http://localhost:8080

Then open:

`Topics → playground`

### 7.6 Consumer Lag Does Not Decrease

If consumer lag remains high:

1. Inspect the consumer group in Redpanda Console.
2. Check whether consumers are connected.
3. Inspect partition assignments.
4. Verify that consumers are successfully processing messages.
5. Check whether offsets are being committed.
6. Inspect application logs for processing errors.

Remember:

```text
Lag = Log-End-Offset - Group-Offset
```

An empty consumer group can still have lag because committed offsets remain stored even when no consumers are connected.

Refer to `docs/kafka-lab-notes.md` for the consumer lag experiment.

---

## 8. Infrastructure Scope and Development Phases

The local infrastructure is being introduced incrementally as FlowForge progresses through its development phases.

The current stack intentionally focuses on the dependencies needed for Phase 2.

### Included

| Component        | Purpose                                      |
| ---------------- | -------------------------------------------- |
| Redpanda         | Kafka-compatible event streaming             |
| Redpanda Console | Broker inspection and monitoring             |
| Redis            | Future caching and coordination requirements |

### Intentionally Excluded

The following components are not part of the current Phase 2 infrastructure stack.

| Component            | Planned Phase     | Reason                                                    |
| -------------------- | ----------------- | --------------------------------------------------------- |
| PostgreSQL           | Phase 1 uses Neon | Database is hosted in Neon rather than running locally    |
| Kubernetes           | Phase 5           | Introduced when container orchestration becomes necessary |
| Prometheus / Grafana | Phase 7           | Dedicated metrics collection and visualization            |
| FlowForge Worker     | Phase 3           | Workflow execution infrastructure                         |
| FlowForge Relay      | Phase 3           | Event relay infrastructure                                |

These dependencies will be introduced when their corresponding phases require them.

The Compose configuration should remain lightweight to keep the local development loop fast and manageable.

---

## 9. Related Documentation

For additional information about the infrastructure and Kafka implementation, see:

| Document                       | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `docs/domain.md`               | Domain model and glossary                   |
| `docs/api.md`                  | HTTP API reference                          |
| `docs/baseline.md`             | Phase 1 monolith baseline measurements      |
| `docs/kafka-lab-notes.md`      | Kafka hands-on experiments and observations |
| `docs/kafka-primer.md`         | Kafka concepts and architecture primer      |
| `docs/architecture/phase-1.md` | Phase 1 component diagram                   |
| `docs/adr/`                    | Architecture Decision Records               |

---

## 10. Development Principles

A few principles guide the design of this local infrastructure:

1. **Keep the development environment lightweight.** Only introduce dependencies when a development phase requires them.
2. **Preserve data by default.** Stopping services should not unexpectedly destroy local development data.
3. **Make networking explicit.** Host applications and containerized applications must use the correct Kafka listener.
4. **Keep local and production concerns separate.** The local Compose stack is a development environment, not a production deployment configuration.
5. **Introduce infrastructure incrementally.** Each new dependency should have a clear architectural purpose.

The goal is to maintain a predictable, reproducible local environment that supports FlowForge development without introducing unnecessary infrastructure complexity.
