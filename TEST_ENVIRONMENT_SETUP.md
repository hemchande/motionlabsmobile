# Test Environment Setup

## Virtual Environment for Tests

### Recommended: `cvMLAgentNew/.venv`

This is the main virtual environment used by the MCP servers and has all required dependencies.

## Running the E2E Test

```bash
# Activate the virtual environment
source cvMLAgentNew/.venv/bin/activate

# Run the test
python3 test_mcp_orchestration_e2e.py
```

## Required Packages

The test requires:
- `httpx` - For HTTP requests to MCP service
- `redis` - For Redis queue connection

Both are already installed in `cvMLAgentNew/.venv` ✅

## Alternative: Using Full Path

If you don't want to activate the venv:

```bash
/Users/eishahemchand/MotionLabsAI/cvMLAgentNew/.venv/bin/python3 test_mcp_orchestration_e2e.py
```

## Other Virtual Environments

- `cvMLAgentBaseline/mcpEnv` - Used for baseline agent (may not have httpx/redis)
- `videoAgent/.venv` - Used for video agent (may not have httpx/redis)

**Recommendation**: Use `cvMLAgentNew/.venv` for all MCP-related tests.

## Verifying Setup

```bash
# Check if packages are available
source cvMLAgentNew/.venv/bin/activate
python3 -c "import httpx; import redis; print('✅ All packages available')"
```

## Installing Missing Packages (if needed)

```bash
source cvMLAgentNew/.venv/bin/activate
pip install httpx redis
```




