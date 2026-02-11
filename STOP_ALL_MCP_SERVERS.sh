#!/bin/bash
# Stop all MCP servers

echo "🛑 Stopping All MCP Servers"
echo "============================"
echo ""

pkill -f "session_mcp_server.py" && echo "✅ Stopped Session Manager" || echo "⚠️  Session Manager not running"
pkill -f "pipeline_mcp_server.py" && echo "✅ Stopped Pipeline Processor" || echo "⚠️  Pipeline Processor not running"
pkill -f "athlete_coach_mcp_server.py" && echo "✅ Stopped Athlete/Coach API" || echo "⚠️  Athlete/Coach API not running"
pkill -f "mcp_service.py" && echo "✅ Stopped MCP Service" || echo "⚠️  MCP Service not running"

sleep 2

echo ""
echo "Verifying servers are stopped..."
curl -s http://localhost:8000/mcp > /dev/null 2>&1 && echo "⚠️  Session Manager still responding" || echo "✅ Session Manager stopped"
curl -s http://localhost:8001/mcp > /dev/null 2>&1 && echo "⚠️  Pipeline Processor still responding" || echo "✅ Pipeline Processor stopped"
curl -s http://localhost:8003/mcp > /dev/null 2>&1 && echo "⚠️  Athlete/Coach API still responding" || echo "✅ Athlete/Coach API stopped"
curl -s http://localhost:8004/api/health > /dev/null 2>&1 && echo "⚠️  MCP Service still responding" || echo "✅ MCP Service stopped"

echo ""
echo "✅ All servers stopped!"




