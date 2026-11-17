# HTTP API

Base URL (dev): `http://localhost:3000`

All errors use the shape:

```json
{ "error": { "code": "VALIDATION", "message": "...", "details": { ... } } }

> **Note (Phase 3):** The endpoint still returns `202 Accepted` with `{ "runId": "..." }`, but the run now stays in `PENDING` until the relay and orchestrator pick it up. Execution is no longer performed inside the web process. Expected latency from trigger to `RUNNING` is 1–3 seconds (one relay poll interval plus one orchestrator round-trip).
```
