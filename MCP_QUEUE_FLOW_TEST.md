# MCP Service Queue Flow Test

## Overview

This test verifies the complete queue message flow through the MCP service:
1. **upsert_session** → sends message to `retrievalQueue`
2. **listen_to_retrieval_queue** → processes messages from `retrievalQueue` → sends alerts to `drift_alerts_queue`
3. **get_athlete_alerts** → retrieves alerts from database

## Test Coverage

### Direct MCP Server Calls
- ✅ `upsert_session` (session_mcp_server) - sends to retrievalQueue
- ✅ `listen_to_retrieval_queue` (pipeline_mcp_server) - processes queue, sends to drift_alerts_queue
- ✅ `get_athlete_alerts` (athlete_coach_mcp_server) - retrieves alerts

### MCP Service Calls
- ✅ `run_pipeline` via MCP service
- ✅ `listen_to_retrieval_queue` via MCP service
- ✅ `get_athlete_alerts` via MCP service

### Queue Verification
- ✅ Verifies messages sent to `retrievalQueue` after `upsert_session`
- ✅ Verifies alerts sent to `drift_alerts_queue` after `listen_to_retrieval_queue`

## Prerequisites

1. **Redis must be running:**
   ```bash
   redis-cli ping  # Should return PONG
   ```

2. **All MCP servers must be running:**
   - Session Manager (port 8000)
   - Pipeline Processor (port 8001)
   - Athlete/Coach API (port 8003)
   - MCP Service (port 8004)

   Start all servers:
   ```bash
   ./start_all_mcp_servers.sh
   ```

## Running the Test

```bash
python3 test_mcp_queue_flow.py
```

## Expected Flow

### Step 1: Send Message to retrievalQueue
- Calls `upsert_session` with test session data
- Session is saved to MongoDB
- Message is sent to `retrievalQueue` with:
  ```json
  {
    "session_id": "test_session_...",
    "athlete_id": "test_athlete_123",
    "activity": "gymnastics",
    "athlete_name": "Test Athlete"
  }
  ```

### Step 2: Process retrievalQueue
- Calls `listen_to_retrieval_queue` (max_messages=1)
- Pipeline processor picks up message from `retrievalQueue`
- Processes message through pipeline:
  - Extract insights
  - Track trends
  - Check baseline eligibility
  - Detect drift and create alerts
- Alerts are sent to `drift_alerts_queue`

### Step 3: Retrieve Alerts
- Calls `get_athlete_alerts` to retrieve alerts from database
- Returns alerts with Cloudflare URLs, metrics, and insights

## Queue Message Flow

```
upsert_session
    ↓
MongoDB (session saved)
    ↓
retrievalQueue (message sent)
    ↓
listen_to_retrieval_queue
    ↓
Pipeline Processing (insights, trends, drift detection)
    ↓
drift_alerts_queue (alerts sent)
    ↓
MongoDB (alerts saved)
    ↓
get_athlete_alerts (retrieves alerts)
```

## Test Results

The test will show:
- ✅/❌ for each test case
- Queue lengths before and after
- Message verification status
- Final summary of all tests

## Troubleshooting

### Redis Not Running
```bash
# Start Redis
redis-server
# or
brew services start redis
```

### MCP Servers Not Running
```bash
# Check status
curl http://localhost:8000/mcp
curl http://localhost:8001/mcp
curl http://localhost:8003/mcp
curl http://localhost:8004/api/health

# Start all servers
./start_all_mcp_servers.sh
```

### No Messages in Queue
- Check Redis connection: `redis-cli ping`
- Check queue manually: `redis-cli LRANGE retrievalQueue 0 -1`
- Check logs: `tail -f /tmp/*_mcp*.log`

### testMCP Not Available
- The `listen_to_retrieval_queue` requires `testMCP` module
- Ensure `cvMLAgentBaseline/agentic_mcp/testMCP.py` is available
- Check that pipeline_mcp_server can import testMCP

## Notes

- `run_pipeline` only sends to `retrievalQueue` when a Stream.io call actually ends
- For testing, we use `upsert_session` to manually send test messages
- The test uses `max_messages=1` to process only one message at a time
- Queue verification waits up to 10 seconds for messages to appear




