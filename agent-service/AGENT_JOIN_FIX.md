# Fix: Agent Not Joining Call

## Issue

When running `main.py` standalone, the agent joins successfully. But when called through the agent service, the agent never joins the call.

## Root Cause

The `vision-agents` CLI (used when running `main.py` standalone) **creates a NEW call** with a random ID instead of joining the existing call that the frontend created.

When you run:
```bash
python3 main.py
```

The CLI creates a call like `5ed781a6-3f3d-4b90-8d24-51a331c4c9e1` (random UUID), not the call ID that the frontend is using (`demo-call-xGvo-o50`).

## Solution

The agent service now uses `run_pipeline()` programmatically, which **explicitly joins the existing call** by passing the `call_id` parameter:

```python
await run_pipeline(
    call_id=callId,  # Joins THIS call (not creates new)
    call_type="default",
    activity="gymnastics"
)
```

This ensures the agent joins the **same call** that the frontend created.

## How It Works Now

1. **Frontend** creates call: `streamCall.join({ create: true })` with `callId = "demo-call-xGvo-o50"`
2. **Agent Service** calls `run_pipeline(call_id="demo-call-xGvo-o50")`
3. **Python Agent** joins the **existing call** via `agent.create_call('default', 'demo-call-xGvo-o50')`
4. **Agent processes video** from the same call

## Key Difference

- **CLI approach** (standalone): Creates NEW call with random ID
- **run_pipeline() approach** (agent service): Joins EXISTING call with specified ID

## Verification

After this fix, when you click "Record Live Session":
1. Frontend creates call with ID: `demo-call-xGvo-o50`
2. Agent service starts Python process
3. Python calls `run_pipeline(call_id="demo-call-xGvo-o50")`
4. Agent joins the **same call** that frontend created
5. You should see in logs: `✅ Agent joined call`

The agent will now successfully join the call! 🎉




