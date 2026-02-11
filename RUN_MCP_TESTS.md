# How to Run MCP Service Tests

## Prerequisites

1. **Start Athlete/Coach MCP Server:**
   ```bash
   cd cvMLAgentBaseline/agentic_mcp
   python3 athlete_coach_mcp_server.py
   ```
   Server should start on `http://localhost:8003/mcp`

2. **Optional: Start MCP Service (requires langchain):**
   ```bash
   cd cvMLAgentBaseline/agentic_mcp
   ../cvMLAgentNew/.venv/bin/python3 mcp_service.py
   ```
   Service should start on `http://localhost:8004`

## Test Options

### Option 1: Direct MCP Server Test (Recommended - No langchain needed)
```bash
cd MotionLabsAI
../cvMLAgentNew/.venv/bin/python3 test_mcp_servers_direct.py
```

**Tests:**
- ✅ Get athlete alerts (with Cloudflare URLs, insights, metrics)
- ✅ Get athlete insights
- ✅ Complete workflow

### Option 2: MCP Service Test (Requires langchain)
```bash
# Install langchain first
cd cvMLAgentNew
source .venv/bin/activate
pip install langchain langchain-openai

# Start MCP service (in one terminal)
cd ../cvMLAgentBaseline/agentic_mcp
python3 mcp_service.py

# Run tests (in another terminal)
cd MotionLabsAI
node test_mcp_service_node.js
```

### Option 3: Quick Bash Test
```bash
./test_mcp_quick.sh athlete_001
```

## What Gets Tested

1. **Get Athlete Alerts**
   - Returns alerts with Cloudflare URLs
   - Includes insights/chat messages
   - Includes session metrics
   - Verifies URL format

2. **Get Athlete Insights**
   - Returns insights
   - Links to Cloudflare URLs
   - Includes session context

3. **Complete Workflow**
   - Alerts → URLs → Insights mapping
   - Data structure validation

## Expected Results

If tests pass, you should see:
- ✅ Alerts retrieved with Cloudflare URLs
- ✅ Insights linked to URLs
- ✅ Metrics included
- ✅ Data structure matches frontend expectations

## Troubleshooting

**"Service not responding"**
- Check if MCP server is running: `curl http://localhost:8003/mcp`
- Check if MCP service is running: `curl http://localhost:8004/api/health`

**"No alerts found"**
- Update `athlete_id` in test config to use a real athlete ID
- Check MongoDB has alerts for that athlete

**"No Cloudflare URLs"**
- Verify sessions have `cloudflare_stream_url` field
- Check insights collection has URLs

## Next Steps After Tests Pass

1. Integrate `mcpQueryService` into frontend:
   - Alerts screen → `getAthleteAlerts()`
   - Insights → `getAthleteInsights()`
   - Video player → Use Cloudflare URLs

2. Map data to components:
   - Alerts → Alert cards
   - Cloudflare URLs → Video player
   - Insights → Chat messages/feedback




