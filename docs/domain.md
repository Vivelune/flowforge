# Domain Model

## Glossary

- **Workflow**: A reusable definition of steps.
- **Step**: One unit inside a workflow.
- **Run**: One execution of a workflow.
- **StepRun**: One execution of one step within a run.

## Step Types (Phase 1)

- `HTTP_REQUEST`: Call a URL.
- `TRANSFORM`: Reshape data using a JSON template.
- `CONDITION`: Compare two values; stop the run early if false.
- `DELAY`: Wait N seconds (capped).

_(LLM_PROMPT arrives in Phase 4 via migration.)_

## Data Flow

Every step has a unique `key`. Run context shape:

```json
{
  "trigger": "<run input>",
  "steps": { "<key>": "<output>" }
}
```
