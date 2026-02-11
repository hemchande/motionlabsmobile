# Verify All MCP Tools Are Running

## Summary

All MCP tools are accessible and working:

### Session Manager (port 8000)
- ✅ `upsert_session` - Create/update sessions
- ✅ `run_pipeline` - Run video processing pipeline
- ✅ `get_session` - Get session by ID

**Total: 3 tools**

### Pipeline Processor (port 8001)
- ✅ `process_video_pipeline` - Process complete video pipeline
- ✅ `listen_to_retrieval_queue` - Listen to Redis queue

**Total: 2 tools**

### Athlete/Coach API (port 8003)
- ✅ `create_user` - Create new user
- ✅ `login` - Authenticate user
- ✅ `get_session` - Get session by ID
- ✅ `get_athlete_sessions` - Get all sessions for athlete
- ✅ `get_athlete_details` - Get athlete details
- ✅ `get_athlete_alerts` - Get alerts with Cloudflare URLs
- ✅ `get_athlete_trends` - Get trends
- ✅ `get_athlete_insights` - Get insights
- ✅ `get_alert_queue_messages` - Get alert queue messages
- ✅ `get_all_sessions` - Get all sessions
- ✅ `get_all_athletes` - Get all athletes

**Total: 11 tools**

## Grand Total: 16 Tools

## Test Commands

### List All Tools
```bash
curl http://localhost:8004/api/tools | python3 -m json.tool
```

### Test a Specific Tool
```bash
curl -X POST http://localhost:8004/api/test-tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "get_athlete_alerts",
    "server_name": "athlete_coach_api",
    "args": {
      "athlete_id": "athlete_001",
      "include_stream_urls": true,
      "include_insights": true,
      "include_metrics": true,
      "limit": 5
    }
  }' | python3 -m json.tool
```

### Run Python Test
```bash
python3 test_all_mcp_tools.py
```

## MCP Service Endpoints

1. **GET /api/tools** - List all available tools
2. **POST /api/test-tool** - Test a specific tool
3. **POST /api/get-alerts** - Get alerts (uses get_athlete_alerts tool)
4. **POST /api/get-insights** - Get insights (uses get_athlete_insights tool)
5. **POST /api/start-pipeline** - Start pipeline (uses run_pipeline tool)
6. **POST /api/agent-query** - Natural language query (uses all tools via agent)

## Verification

All tools are:
- ✅ Accessible via MCP protocol
- ✅ Loaded by MCP service
- ✅ Available to agent (if langchain installed)
- ✅ Can be called directly via `/api/test-tool`




