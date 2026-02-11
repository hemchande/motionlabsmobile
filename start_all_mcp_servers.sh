#!/bin/bash
# Start all MCP servers required for the MCP service

echo "🚀 Starting All MCP Servers"
echo "============================"
echo ""

# Colors
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'
RESET='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check if servers are already running
check_server() {
    local port=$1
    local name=$2
    if curl -s "http://localhost:${port}" > /dev/null 2>&1 || curl -s "http://localhost:${port}/mcp" > /dev/null 2>&1 || curl -s "http://localhost:${port}/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${name} is already running on port ${port}${RESET}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ${name} is not running on port ${port}${RESET}"
        return 1
    fi
}

# Kill existing processes
echo "Cleaning up existing processes..."
pkill -f "session_mcp_server.py" 2>/dev/null
pkill -f "pipeline_mcp_server.py" 2>/dev/null
pkill -f "athlete_coach_mcp_server.py" 2>/dev/null
pkill -f "mcp_service.py" 2>/dev/null
sleep 2

# Check Python virtual environment
VENV_PYTHON="${SCRIPT_DIR}/cvMLAgentNew/.venv/bin/python3"
if [ ! -f "$VENV_PYTHON" ]; then
    echo -e "${RED}❌ Virtual environment not found at ${VENV_PYTHON}${RESET}"
    echo "   Please create the virtual environment first"
    exit 1
fi

echo ""
echo "Starting servers..."
echo ""

# 1. Session Manager (port 8000)
echo -e "${BLUE}1. Starting Session Manager (port 8000)...${RESET}"
if check_server 8000 "Session Manager"; then
    echo "   Already running"
else
    cd "${SCRIPT_DIR}/cvMLAgentNew"
    if [ -f "session_mcp_server.py" ]; then
        # Use cvMLAgentNew's venv
        if [ -f ".venv/bin/python3" ]; then
            .venv/bin/python3 session_mcp_server.py > /tmp/session_mcp_server.log 2>&1 &
        else
            $VENV_PYTHON session_mcp_server.py > /tmp/session_mcp_server.log 2>&1 &
        fi
        SESSION_PID=$!
        echo "   Started with PID: $SESSION_PID"
        sleep 3
        if check_server 8000 "Session Manager"; then
            echo -e "   ${GREEN}✅ Session Manager started successfully${RESET}"
        else
            echo -e "   ${RED}❌ Failed to start Session Manager${RESET}"
            echo "   Check logs: tail -f /tmp/session_mcp_server.log"
        fi
    else
        echo -e "   ${YELLOW}⚠️  session_mcp_server.py not found${RESET}"
    fi
fi

# 2. Pipeline Processor (port 8001)
echo ""
echo -e "${BLUE}2. Starting Pipeline Processor (port 8001)...${RESET}"
if check_server 8001 "Pipeline Processor"; then
    echo "   Already running"
else
    cd "${SCRIPT_DIR}/cvMLAgentBaseline/agentic_mcp"
    if [ -f "pipeline_mcp_server.py" ]; then
        $VENV_PYTHON pipeline_mcp_server.py 8001 > /tmp/pipeline_mcp_server.log 2>&1 &
        PIPELINE_PID=$!
        echo "   Started with PID: $PIPELINE_PID"
        sleep 3
        if check_server 8001 "Pipeline Processor"; then
            echo -e "   ${GREEN}✅ Pipeline Processor started successfully${RESET}"
        else
            echo -e "   ${RED}❌ Failed to start Pipeline Processor${RESET}"
            echo "   Check logs: tail -f /tmp/pipeline_mcp_server.log"
        fi
    else
        echo -e "   ${YELLOW}⚠️  pipeline_mcp_server.py not found${RESET}"
    fi
fi

# 3. Athlete/Coach API (port 8003)
echo ""
echo -e "${BLUE}3. Starting Athlete/Coach API (port 8003)...${RESET}"
if check_server 8003 "Athlete/Coach API"; then
    echo "   Already running"
else
    cd "${SCRIPT_DIR}/cvMLAgentBaseline/agentic_mcp"
    if [ -f "athlete_coach_mcp_server.py" ]; then
        $VENV_PYTHON athlete_coach_mcp_server.py 8003 > /tmp/athlete_coach_mcp_server.log 2>&1 &
        ATHLETE_PID=$!
        echo "   Started with PID: $ATHLETE_PID"
        sleep 3
        if check_server 8003 "Athlete/Coach API"; then
            echo -e "   ${GREEN}✅ Athlete/Coach API started successfully${RESET}"
        else
            echo -e "   ${RED}❌ Failed to start Athlete/Coach API${RESET}"
            echo "   Check logs: tail -f /tmp/athlete_coach_mcp_server.log"
        fi
    else
        echo -e "   ${YELLOW}⚠️  athlete_coach_mcp_server.py not found${RESET}"
    fi
fi

# 4. MCP Service (port 8004)
echo ""
echo -e "${BLUE}4. Starting MCP Service (port 8004)...${RESET}"
if check_server 8004 "MCP Service"; then
    echo "   Already running"
else
    cd "${SCRIPT_DIR}/cvMLAgentBaseline/agentic_mcp"
    if [ -f "mcp_service.py" ]; then
        # Load environment variables from .env file if it exists
        if [ -f "${SCRIPT_DIR}/.env" ]; then
            export $(grep -v '^#' "${SCRIPT_DIR}/.env" | xargs)
        fi
        $VENV_PYTHON mcp_service.py > /tmp/mcp_service.log 2>&1 &
        MCP_SERVICE_PID=$!
        echo "   Started with PID: $MCP_SERVICE_PID"
        sleep 5
        if check_server 8004 "MCP Service"; then
            echo -e "   ${GREEN}✅ MCP Service started successfully${RESET}"
        else
            echo -e "   ${RED}❌ Failed to start MCP Service${RESET}"
            echo "   Check logs: tail -f /tmp/mcp_service.log"
        fi
    else
        echo -e "   ${YELLOW}⚠️  mcp_service.py not found${RESET}"
    fi
fi

# Summary
echo ""
echo "============================"
echo -e "${CYAN}Server Status Summary${RESET}"
echo "============================"
echo ""

check_server 8000 "Session Manager" || echo -e "${RED}❌ Session Manager (8000)${RESET}"
check_server 8001 "Pipeline Processor" || echo -e "${RED}❌ Pipeline Processor (8001)${RESET}"
check_server 8003 "Athlete/Coach API" || echo -e "${RED}❌ Athlete/Coach API (8003)${RESET}"
check_server 8004 "MCP Service" || echo -e "${RED}❌ MCP Service (8004)${RESET}"

echo ""
echo "Log files:"
echo "  - Session Manager: /tmp/session_mcp_server.log"
echo "  - Pipeline Processor: /tmp/pipeline_mcp_server.log"
echo "  - Athlete/Coach API: /tmp/athlete_coach_mcp_server.log"
echo "  - MCP Service: /tmp/mcp_service.log"
echo ""
echo "To view logs: tail -f /tmp/*_mcp*.log"
echo ""
echo "To stop all servers: pkill -f '_mcp_server.py|mcp_service.py'"

