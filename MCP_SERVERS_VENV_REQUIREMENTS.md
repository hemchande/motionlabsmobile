# MCP Servers Virtual Environment Requirements

## Summary

All MCP servers should use **`cvMLAgentNew/.venv`** for consistency, but some have fallback options.

## Server Virtual Environment Requirements

### 1. Session Manager (session_mcp_server.py) - Port 8000
**Location**: `cvMLAgentNew/session_mcp_server.py`

**Virtual Environment**: `cvMLAgentNew/.venv`

**Required Packages**:
- `fastmcp` - MCP server framework
- `vision-agents[getstream,openai,ultralytics,gemini]` - For video processing
- `httpx`, `jwt` - For Stream.io integration
- `python-dotenv` - Environment variables

**Key Dependencies**:
- Needs `vision-agents` to run `main.run_pipeline()`
- Uses `cvMLAgentNew/.venv/bin/python3` explicitly

---

### 2. Pipeline Processor (pipeline_mcp_server.py) - Port 8001
**Location**: `cvMLAgentBaseline/agentic_mcp/pipeline_mcp_server.py`

**Virtual Environment**: 
- **Preferred**: `cvMLAgentBaseline/mcpEnv` (if exists)
- **Fallback**: `cvMLAgentNew/.venv`

**Required Packages**:
- `fastmcp` - MCP server framework
- `langchain` - For agent tools
- `langchain-openai` - For OpenAI integration
- `testMCP` module (local) - Contains pipeline tools
- `python-dotenv` - Environment variables

**Key Dependencies**:
- Needs `testMCP` module which requires `langchain`
- `testMCP` must be importable from `cvMLAgentBaseline/agentic_mcp/`

---

### 3. Athlete/Coach API (athlete_coach_mcp_server.py) - Port 8003
**Location**: `cvMLAgentBaseline/agentic_mcp/athlete_coach_mcp_server.py`

**Virtual Environment**:
- **Preferred**: `cvMLAgentBaseline/mcpEnv` (if exists)
- **Fallback**: System Python (not recommended)

**Required Packages**:
- `fastmcp` - MCP server framework
- `pymongo` or MongoDB service - For database access
- `redis` - For queue access
- `python-dotenv` - Environment variables

**Key Dependencies**:
- Needs MongoDB connection (from `videoAgent.mongodb_service`)
- Needs Redis for queue operations

---

### 4. MCP Service (mcp_service.py) - Port 8004
**Location**: `cvMLAgentBaseline/agentic_mcp/mcp_service.py`

**Virtual Environment**: `cvMLAgentNew/.venv`

**Required Packages**:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `langchain` - **REQUIRED** for `/api/agent-query` endpoint
- `langchain-openai` - **REQUIRED** for agent initialization
- `langchain-mcp-adapters` - For MCP client integration
- `python-dotenv` - Environment variables
- `httpx` - For HTTP requests (if needed)

**Key Dependencies**:
- **CRITICAL**: Must have `langchain` and `langchain-openai` for agent queries
- Without LangChain, `/api/agent-query` will fail
- Uses `cvMLAgentNew/.venv/bin/python3` (from start script)

---

## Current Setup (from start_all_mcp_servers.sh)

All servers are started using: **`cvMLAgentNew/.venv/bin/python3`**

This means:
- ✅ Session Manager: Uses `cvMLAgentNew/.venv` ✓
- ⚠️ Pipeline Processor: Uses `cvMLAgentNew/.venv` (but needs `testMCP` with langchain)
- ⚠️ Athlete/Coach API: Uses `cvMLAgentNew/.venv` (should work)
- ⚠️ MCP Service: Uses `cvMLAgentNew/.venv` (but needs langchain installed)

---

## Recommended Setup

### Option 1: Use cvMLAgentNew/.venv for ALL servers (Current)

**Install all dependencies in `cvMLAgentNew/.venv`:**

```bash
source cvMLAgentNew/.venv/bin/activate

# Core MCP dependencies
pip install fastmcp python-dotenv

# For Session Manager
pip install vision-agents[getstream,openai,ultralytics,gemini]

# For Pipeline Processor (needs langchain for testMCP)
pip install langchain langchain-openai

# For MCP Service (needs langchain for agent queries)
pip install fastapi uvicorn langchain langchain-openai langchain-mcp-adapters

# For Athlete/Coach API
pip install pymongo redis
```

**Pros**: Single venv, easier to manage  
**Cons**: All dependencies in one place

---

### Option 2: Use Separate venvs (Original Design)

- **Session Manager**: `cvMLAgentNew/.venv` (has vision-agents)
- **Pipeline Processor**: `cvMLAgentBaseline/mcpEnv` (has langchain, testMCP)
- **Athlete/Coach API**: `cvMLAgentBaseline/mcpEnv` (has MongoDB, Redis)
- **MCP Service**: `cvMLAgentNew/.venv` (needs langchain added)

**Pros**: Isolated dependencies  
**Cons**: More complex, need to manage multiple venvs

---

## Current Issue

The MCP Service is running but **LangChain is not installed** in `cvMLAgentNew/.venv`.

**Solution**: Install LangChain in `cvMLAgentNew/.venv`:

```bash
cvMLAgentNew/.venv/bin/pip install langchain langchain-openai
```

Then restart the MCP service.

---

## For Testing

**Test script** (`test_mcp_orchestration_e2e.py`) should use:
- **Virtual Environment**: `cvMLAgentNew/.venv`
- **Required Packages**: `httpx`, `redis` (already installed)

---

## Quick Reference

| Server | Port | Venv | Critical Dependencies |
|--------|------|------|----------------------|
| Session Manager | 8000 | `cvMLAgentNew/.venv` | vision-agents |
| Pipeline Processor | 8001 | `cvMLAgentNew/.venv` | langchain, testMCP |
| Athlete/Coach API | 8003 | `cvMLAgentNew/.venv` | pymongo, redis |
| MCP Service | 8004 | `cvMLAgentNew/.venv` | **langchain, langchain-openai** |

**All servers currently use `cvMLAgentNew/.venv` via `start_all_mcp_servers.sh`**




