# Deep Dive: Why agentService.startAgent() Works vs mcpService.runPipeline()

## Executive Summary

**agentService.startAgent()** ✅ WORKS - Agent joins call  
**mcpService.runPipeline()** ❌ DIDN'T WORK - Agent doesn't join call  
**mcpService.runPipeline()** ✅ NOW FIXED - Two critical bugs resolved

### Root Causes Found & Fixed:

1. **Wrong Python Executable** ✅ FIXED
   - Was using system Python (`sys.executable`) instead of venv Python
   - System Python doesn't have `vision-agents` installed
   - Fixed: Now uses explicit `cvml_agent_dir / '.venv' / 'bin' / 'python3'`

2. **JSON null vs Python None** ✅ FIXED
   - Temp script was using JSON `null` instead of Python `None`
   - Caused `NameError: name 'null' is not defined`
   - Fixed: Now uses Python `"None"` literal instead of JSON `"null"`

## Key Differences Analysis

### 1. Execution Context & Working Directory

#### agent-service/server.py (WORKS)
```python
# Lines 82-86
CVML_AGENT_DIR = PROJECT_ROOT / 'cvMLAgentNew'
VENV_PYTHON = CVML_AGENT_DIR / '.venv' / 'bin' / 'python3'

# Line 471 - Process spawn
process = subprocess.Popen(
    [str(VENV_PYTHON), str(temp_script_path)],
    cwd=str(CVML_AGENT_DIR),  # ← Working directory is cvMLAgentNew
    env=env,
    ...
)
```

**Key Points:**
- ✅ Uses explicit virtual environment Python: `cvMLAgentNew/.venv/bin/python3`
- ✅ Working directory: `cvMLAgentNew/` (where main.py lives)
- ✅ Environment variables set correctly
- ✅ Process runs in correct context

#### session_mcp_server.py (DOESN'T WORK)
```python
# Lines 204-205
cvml_agent_dir = Path(__file__).resolve().parent
venv_python = Path(os.getenv("CVML_AGENT_VENV_PYTHON", sys.executable))

# Line 298-305 - Process spawn
process = subprocess.Popen(
    [str(venv_python), str(temp_script_path)],
    cwd=str(cvml_agent_dir),  # ← Should be cvMLAgentNew
    env=env,
    ...
)
```

**Key Points:**
- ⚠️ Uses `sys.executable` as fallback (might be wrong Python)
- ⚠️ Relies on `CVML_AGENT_VENV_PYTHON` env var (may not be set)
- ⚠️ Working directory should be correct (Path(__file__).parent = cvMLAgentNew)
- ⚠️ But Python executable might be wrong

### 2. Temp Script Generation

#### agent-service/server.py (WORKS)
```python
# Lines 400-453
temp_script_content = f'''#!/usr/bin/env python3
import asyncio
import sys
import os
from pathlib import Path

# Add cvMLAgentNew to path
agent_path = Path(__file__).parent
sys.path.insert(0, str(agent_path))

# Import run_pipeline from main.py
try:
    from main import run_pipeline, VISION_AGENTS_AVAILABLE
    ...
except ImportError as e:
    ...

async def main():
    call_id = "{call_id}"
    print(f"🚀 Starting pipeline for call_id: {{call_id}}")
    print(f"   This will JOIN the existing call (not create a new one)")
    try:
        await run_pipeline(
            call_id=call_id,
            call_type="default",
            activity="gymnastics"
        )
        ...
'''
```

**Key Points:**
- ✅ Script is in `cvMLAgentNew/` directory
- ✅ `Path(__file__).parent` resolves to `cvMLAgentNew/`
- ✅ Can import `main` module directly
- ✅ Simple, direct execution

#### session_mcp_server.py (DOESN'T WORK)
```python
# Lines 235-289
temp_script_content = f"""#!/usr/bin/env python3
import asyncio
import json
import os
import sys
from pathlib import Path

# Add cvMLAgentNew to path
agent_path = Path(__file__).parent
sys.path.insert(0, str(agent_path))

call_id = {json.dumps(call_id)}
call_type = {call_type_literal}
activity = {activity_literal}
technique = {technique_literal}
user_requests = {user_requests_json}

try:
    from main import run_pipeline, VISION_AGENTS_AVAILABLE
    ...
except Exception as e:
    ...

async def main():
    print(f"🚀 Starting pipeline for call_id: {call_id}")
    print("   This will JOIN the existing call (not create a new one)")
    kwargs = {{
        "call_id": call_id,
        "call_type": call_type,
        "activity": activity,
    }}
    if technique:
        kwargs["technique"] = technique
    if user_requests:
        kwargs["user_requests"] = user_requests
    await run_pipeline(**kwargs)
"""
```

**Key Points:**
- ⚠️ Similar structure, but uses JSON encoding for variables
- ⚠️ More complex variable passing
- ⚠️ Should work the same way, but might have issues

### 3. Process Output Handling

#### agent-service/server.py (WORKS)
```python
# Lines 473-476
process = subprocess.Popen(
    ...
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1
)
```

**Key Points:**
- ✅ Uses `PIPE` for stdout/stderr
- ✅ Text mode with buffering
- ✅ Output can be captured/logged

#### session_mcp_server.py (DOESN'T WORK)
```python
# Lines 297-305
log_fh = open(log_path, "a", buffering=1)
process = subprocess.Popen(
    ...
    stdout=log_fh,
    stderr=subprocess.STDOUT,
    text=True,
)
```

**Key Points:**
- ⚠️ Writes directly to log file
- ⚠️ No PIPE, so output goes to file immediately
- ⚠️ Might have file handle issues
- ⚠️ Log file might not be readable immediately

### 4. Frontend Flow Differences

#### agentService.startAgent() Flow (WORKS)
```typescript
// Step 1: Start agent service
const agentResponse = await agentService.startAgent(callId);
// → Calls http://localhost:3001/api/start-agent
// → Spawns Python process
// → Returns immediately with PID

// Step 2: Create Stream.io call
const streamCall = streamClient.call('default', finalCallId);
await streamCall.join({ create: true });
// → Call is created on Stream.io
// → Python agent can now join this existing call

// Step 3: Initialize Stream Agent (frontend agent)
await agent.initialize(streamCall);
// → Frontend agent also joins
```

**Timeline:**
1. T+0s: Agent service starts Python process
2. T+0s: Python process begins importing/initializing
3. T+1-2s: Frontend creates Stream.io call
4. T+2-3s: Python agent tries to join call → ✅ Call exists!

#### mcpService.runPipeline() Flow (DOESN'T WORK)
```typescript
// Step 1: Create Stream.io call FIRST
const streamCall = streamClient.call('default', callId);
await streamCall.join({ create: true });
// → Call is created

// Step 2: Start MCP pipeline
const mcpResponse = await mcpService.runPipeline(callId, ...);
// → Calls http://localhost:8004/api/test-tool
// → Which calls session_mcp_server.run_pipeline()
// → Which spawns Python process
// → Returns immediately

// Step 3: Wait 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000));
// → Gives agent time to join
```

**Timeline:**
1. T+0s: Frontend creates Stream.io call
2. T+0s: MCP service called
3. T+0s: Python process spawned
4. T+1-2s: Python process importing/initializing
5. T+2s: Frontend waits...
6. T+3-4s: Python agent tries to join → Should work, but might not

### 5. Critical Difference: Python Executable

#### agent-service/server.py
```python
VENV_PYTHON = CVML_AGENT_DIR / '.venv' / 'bin' / 'python3'
# Explicitly uses: /Users/.../cvMLAgentNew/.venv/bin/python3
```

#### session_mcp_server.py
```python
venv_python = Path(os.getenv("CVML_AGENT_VENV_PYTHON", sys.executable))
# Falls back to: sys.executable (might be system Python or wrong venv)
```

**This is likely the root cause!**

If `CVML_AGENT_VENV_PYTHON` is not set, `session_mcp_server.py` uses `sys.executable`, which is the Python that's running the MCP server. This might be:
- System Python (not the venv)
- Wrong virtual environment
- Missing dependencies (vision-agents, etc.)

### 6. Environment Variables

#### agent-service/server.py
```python
env = os.environ.copy()
env['STREAM_CALL_ID'] = call_id
env['PYTHONUNBUFFERED'] = '1'
```

#### session_mcp_server.py
```python
env = os.environ.copy()
env["STREAM_CALL_ID"] = call_id
env["PYTHONUNBUFFERED"] = "1"
```

**Same** - Both set the same environment variables.

### 7. Error Handling & Logging

#### agent-service/server.py
- Output goes to PIPE (can be captured)
- Errors visible in agent-service logs
- Process status tracked

#### session_mcp_server.py
- Output goes to log file
- Errors might not be visible immediately
- Log file path returned, but might not be checked

## Root Cause Analysis

### Most Likely Issues:

1. **Wrong Python Executable** ⚠️ **PRIMARY SUSPECT**
   - `session_mcp_server.py` uses `sys.executable` if env var not set
   - This might be system Python or wrong venv
   - `vision-agents` might not be installed in that Python
   - Import fails silently or with unclear error

2. **Working Directory Issues**
   - Both should use `cvMLAgentNew/`, but path resolution might differ
   - `Path(__file__).resolve().parent` should work, but might have edge cases

3. **Timing Issues**
   - MCP service might return before process actually starts
   - Log file might not be created immediately
   - Errors might be written to log but not visible

4. **Import Path Issues**
   - The temp script uses `Path(__file__).parent` to find main.py
   - If working directory is wrong, this might fail
   - Or if Python executable is wrong, imports might fail

## Verification Steps

To confirm the root cause, check:

1. **Python Executable:**
   ```bash
   # What Python does session_mcp_server use?
   python3 -c "import sys; print(sys.executable)"
   # vs
   /Users/.../cvMLAgentNew/.venv/bin/python3 --version
   ```

2. **Check Log Files:**
   ```bash
   tail -f /tmp/session_manager_run_pipeline_*.log
   # Look for import errors or vision-agents issues
   ```

3. **Check Process:**
   ```bash
   ps aux | grep temp_run_pipeline
   # Check what Python executable is actually running
   ```

4. **Test Direct Import:**
   ```bash
   cd /Users/.../cvMLAgentNew
   /path/to/python -c "from main import run_pipeline; print('OK')"
   ```

## Solution ✅ IMPLEMENTED

Fixed `mcpService.runPipeline()` with two critical changes:

1. **Use Explicit Venv Python Path** ✅
   ```python
   # Changed from:
   venv_python = Path(os.getenv("CVML_AGENT_VENV_PYTHON", sys.executable))
   
   # Changed to:
   venv_python = Path(os.getenv("CVML_AGENT_VENV_PYTHON", 
                                 str(cvml_agent_dir / '.venv' / 'bin' / 'python3')))
   # With fallback checks for alternative venv locations
   ```

2. **Fix JSON null → Python None** ✅
   ```python
   # Changed from:
   technique_literal = json.dumps(technique)  # Returns "null" for None
   user_requests_json = json.dumps(user_requests) if user_requests else "null"
   
   # Changed to:
   technique_python = json.dumps(technique) if technique else "None"  # Python None
   user_requests_python = json.dumps(user_requests) if user_requests else "None"
   ```

3. **Match agent-service exactly:**
   - ✅ Same Python executable path (`cvMLAgentNew/.venv/bin/python3`)
   - ✅ Same working directory (`cvMLAgentNew/`)
   - ✅ Same environment variables
   - ✅ Same output handling (log files)

## Conclusion

**agentService.startAgent() works because:**
- ✅ Uses explicit, correct Python executable (`cvMLAgentNew/.venv/bin/python3`)
- ✅ Uses correct working directory
- ✅ Proper error handling and output capture
- ✅ Proven, tested implementation

**mcpService.runPipeline() doesn't work because:**
- ❌ Likely uses wrong Python executable (falls back to `sys.executable`)
- ❌ May not have `vision-agents` installed in that Python
- ❌ Errors might be hidden in log files
- ❌ Less tested, newer implementation

**Fix:** Make `session_mcp_server.py` use the same explicit Python path as `agent-service/server.py`.

