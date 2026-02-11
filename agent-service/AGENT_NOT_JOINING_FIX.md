# Fix: Agent Not Joining Call

## Issue

The Python agent process exits immediately (code: 0) instead of joining the Stream.io call and staying alive.

**Error in logs:**
```
vision-agents not available - running in standalone mode
❌ Python agent process exited (code: 0, signal: null)
```

## Root Cause

The `main.py` script requires `vision-agents` to be installed. The `run_pipeline()` function checks for `vision-agents` and raises an error if it's not available:

```python
if not VISION_AGENTS_AVAILABLE:
    raise RuntimeError("vision-agents not available. Install with: pip install vision-agents[getstream,openai,ultralytics,gemini]")
```

## Solution

### Quick Fix: Install vision-agents

Run the installation script:

```bash
cd agent-service
./install-vision-agents.sh
```

Or manually:

```bash
cd cvMLAgentNew
source .venv/bin/activate  # or your virtual environment
pip install vision-agents[getstream,openai,ultralytics,gemini]
```

### Alternative: Use MCP Server

The agent service now tries to use the MCP server first (which may have vision-agents installed):

1. Start the MCP server: `cd cvMLAgentNew && python3 session_mcp_server.py`
2. The agent service will automatically use it if available
3. Set `MCP_SERVER_URL` in agent-service/.env if using a different port

## Verification

After installing vision-agents, restart the agent service and try again. You should see:

```
✅ Imported run_pipeline from main.py
🚀 Starting pipeline for call_id: demo-call-xGvo-o50
🚀 Starting pipeline for call_id=demo-call-xGvo-o50
🤖 Initializing CV ML Agent...
✅ Agent joined call
```

Instead of:
```
Running in standalone mode - use workflow directly
❌ Python agent process exited (code: 0, signal: null)
```

## Alternative: Use MCP Server

If you can't install vision-agents, you can use the MCP server approach instead:

1. Start the MCP server: `cd cvMLAgentNew && python3 session_mcp_server.py`
2. Update the agent service to call the MCP server's `run_pipeline` tool instead of running main.py directly

But the recommended approach is to install vision-agents in the cvMLAgentNew environment.

