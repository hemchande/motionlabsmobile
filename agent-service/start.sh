#!/bin/bash
# Start script for Python agent service
# Uses the cvMLAgentNew/.venv virtual environment

cd "$(dirname "$0")/.."

# Activate virtual environment
if [ -d "cvMLAgentNew/.venv" ]; then
    source cvMLAgentNew/.venv/bin/activate
elif [ -d "cvMLAgentNew/venv" ]; then
    source cvMLAgentNew/venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Using system Python."
fi

# Install dependencies if needed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing agent service dependencies..."
    pip install -r agent-service/requirements.txt
fi

# Start the service
cd agent-service
python3 server.py




