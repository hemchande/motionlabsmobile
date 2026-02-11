#!/bin/bash
# Script to install vision-agents in cvMLAgentNew environment

echo "🔧 Installing vision-agents for Python ML Agent..."
echo ""

cd "$(dirname "$0")/../cvMLAgentNew"

# Check if virtual environment exists
if [ -d ".venv" ]; then
    echo "✅ Found virtual environment: .venv"
    source .venv/bin/activate
elif [ -d "venv" ]; then
    echo "✅ Found virtual environment: venv"
    source venv/bin/activate
else
    echo "⚠️  No virtual environment found. Installing globally..."
fi

echo "📦 Installing vision-agents with all dependencies..."
pip install vision-agents[getstream,openai,ultralytics,gemini]

echo ""
echo "✅ Installation complete!"
echo ""
echo "To verify, run:"
echo "  python3 -c \"from vision_agents.core import Agent; print('✅ vision-agents installed')\""
echo ""




