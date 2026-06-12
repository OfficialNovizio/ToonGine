---
name: pletor-agent
description: >-
  Use this skill whenever the user wants to run, trigger, or interact with a Pletor AI agent via the Pletor Public API. Triggers include: calling a Pletor agent, submitting a job to Pletor, running image/video/ad generation through Pletor, uploading assets to Pletor, checking the status of a Pletor run, downloading Pletor outputs, or listing available Pletor agents. Also trigger when the user says things like "use Pletor to...", "run the Pletor agent", "generate with Pletor", or "send this to Pletor". Always use this skill for any multi-step Pletor workflow — don't try to improvise the API calls from memory.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [coo, operations, workflow, planning, sprint, milestones, process, automation]
---

# Pletor Agent Skill

This skill handles end-to-end interaction with the Pletor Public API:
discovering agents, uploading assets, creating runs, polling for completion,
and downloading outputs.

**Base URL:** `https://api.pletor.ai/api/public/v1`
**Auth header:** `X-Api-Key: <user's API key>`

---

## Step-by-step workflow

### 1. Get the API key

Ask the user for their Pletor API key if it hasn't been provided. Never hardcode or guess it.

```
X-Api-Key: <USER_API_KEY>
```

---

### 2. Discover the agent

If the user hasn't specified an agent ID, list available agents and let them choose:

```bash
curl -s -H "X-Api-Key: $PLETOR_API_KEY" \
  "https://api.pletor.ai/api/public/v1/agents/" | jq .
```

To filter by visibility or tag:
```bash
curl -s -H "X-Api-Key: $PLETOR_API_KEY" \
  "https://api.pletor.ai/api/public/v1/agents/?visibility=PUBLIC&tags=social_media" | jq .
```

To fetch a specific agent's details (inputs/outputs schema):
```bash
curl -s -H "X-Api-Key: $PLETOR_API_KEY" \
  "https://api.pletor.ai/api/public/v1/agents/<agent_id>" | jq .
```

The response includes:
- `id` — the agent UUID needed to create a run
- `inputs[]` — each with `id`, `type` (`text_input` or asset input), and `description`
- `outputs[]` — what the agent produces (e.g. images, video)
- `estimated_cost` — cost in credits

**Always inspect the agent's `inputs` before building the run payload.**

---

### 3. Upload assets (if needed)

If any input has type `asset` (e.g. product photo, logo), upload the file first:

```bash
curl -s -X POST \
  -H "X-Api-Key: $PLETOR_API_KEY" \
  -F "file=@/path/to/local/file.jpg" \
  "https://api.pletor.ai/api/public/v1/assets/upload" | jq .
```

The response returns an `id` (asset UUID). Store it — you'll reference it in the run payload.

---

### 4. Create the run

POST to `/runs/` with the agent ID and all required inputs:

```bash
curl -s -X POST \
  -H "X-Api-Key: $PLETOR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "<agent_id>",
    "inputs": [
      {
        "id": "<input_id_for_text>",
        "value": "Your text prompt here"
      },
      {
        "id": "<input_id_for_asset>",
        "value": {
          "asset_ids": ["<asset_uuid>"]
        }
      }
    ]
  }' \
  "https://api.pletor.ai/api/public/v1/runs/" | jq .
```

**Input format rules:**
- Text inputs: `"value": "<string>"`
- Asset inputs: `"value": { "asset_ids": ["<uuid>", ...] }`
- Use the `id` from the agent's `inputs[]` array — not the agent ID itself

The response returns a `run_id`. Store it for polling.

---

### 5. Poll for completion

Poll until `status` is `"completed"` (or `"failed"`):

```bash
while true; do
  RESULT=$(curl -s -H "X-Api-Key: $PLETOR_API_KEY" \
    "https://api.pletor.ai/api/public/v1/runs/<run_id>")
  STATUS=$(echo $RESULT | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo $RESULT | jq .
    break
  fi
  sleep 5
done
```

Recommended poll interval: 5 seconds. Stop on `completed` or `failed`.

---

### 6. Download outputs

Extract asset IDs from the completed run response, then download each output:

```bash
ASSET_IDS=$(echo $RESULT | jq -r '.outputs[].asset_ids[]')

for ASSET_ID in $ASSET_IDS; do
  curl -s -H "X-Api-Key: $PLETOR_API_KEY" \
    "https://api.pletor.ai/api/public/v1/assets/$ASSET_ID/download" \
    -o "output_$ASSET_ID.jpg"
  echo "Downloaded: output_$ASSET_ID.jpg"
done
```

Alternatively, retrieve metadata first to get the filename:
```bash
curl -s -H "X-Api-Key: $PLETOR_API_KEY" \
  "https://api.pletor.ai/api/public/v1/assets/<asset_id>" | jq .
```

---

## Endpoint quick reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/agents/` | GET | List all agents |
| `/agents/{agent_id}` | GET | Get agent details + input schema |
| `/assets/` | GET | List all assets |
| `/assets/upload` | POST | Upload file (multipart/form-data) |
| `/assets/{asset_id}` | GET | Get asset metadata |
| `/assets/{asset_id}/download` | GET | Download file |
| `/runs/` | POST | Create and start a run |
| `/runs/` | GET | List all runs |
| `/runs/{run_id}` | GET | Get run status and results |
| `/runs/{run_id}` | DELETE | Cancel an ongoing run |

---

## Error handling

- **401**: Invalid or missing API key — double-check `X-Api-Key` header
- **404**: Agent or asset ID not found — verify UUIDs from discovery step
- **422**: Invalid input — re-check the agent's required `inputs` schema
- **run status = "failed"**: Surface the error message from the run response to the user

---

## Example: Full text-to-image run (minimal)

```bash
export PLETOR_API_KEY="your-key-here"
BASE="https://api.pletor.ai/api/public/v1"

AGENT_ID="uuid-of-your-agent"

curl -s -H "X-Api-Key: $PLETOR_API_KEY" "$BASE/agents/$AGENT_ID" | jq '.inputs'

RUN=$(curl -s -X POST \
  -H "X-Api-Key: $PLETOR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_id\": \"$AGENT_ID\", \"inputs\": [{\"id\": \"<input_id>\", \"value\": \"A sunset over Paris\"}]}" \
  "$BASE/runs/")
RUN_ID=$(echo $RUN | jq -r '.id')

while true; do
  STATUS=$(curl -s -H "X-Api-Key: $PLETOR_API_KEY" "$BASE/runs/$RUN_ID" | jq -r '.status')
  [ "$STATUS" = "completed" ] && break
  sleep 5
done

curl -s -H "X-Api-Key: $PLETOR_API_KEY" "$BASE/runs/$RUN_ID" \
  | jq -r '.outputs[].asset_ids[]' \
  | xargs -I{} curl -s -H "X-Api-Key: $PLETOR_API_KEY" \
    "$BASE/assets/{}/download" -o "result_{}.jpg"
```
