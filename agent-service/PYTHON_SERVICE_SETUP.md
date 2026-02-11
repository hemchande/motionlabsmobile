# Python Agent Service Setup

## Overview

The agent service has been converted from Node.js to Python, using FastAPI and the `cvMLAgentNew/.venv` virtual environment.

## ✅ What Changed

- **Language**: Node.js → Python
- **Framework**: Express → FastAPI
- **Environment**: Uses `cvMLAgentNew/.venv`
- **Same API**: All endpoints work the same way

## 🚀 Quick Start

### Option 1: Using Start Script (Recommended)

```bash
cd agent-service
./start.sh
```

### Option 2: Manual Start

```bash
# Activate virtual environment
cd cvMLAgentNew
source .venv/bin/activate

# Install dependencies (if needed)
pip install -r ../agent-service/requirements.txt

# Start service
cd ../agent-service
python3 server.py
```

### Option 3: Using Virtual Environment Python Directly

```bash
cd agent-service
../cvMLAgentNew/.venv/bin/python3 server.py
```

## 📋 Dependencies

The service requires these packages (installed in `cvMLAgentNew/.venv`):

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `httpx` - HTTP client (for Stream.io API calls)
- `pydantic` - Data validation
- `python-dotenv` - Environment variable loading
- `pyjwt` - JWT token generation

Install with:
```bash
cd cvMLAgentNew
source .venv/bin/activate
pip install -r ../agent-service/requirements.txt
```

## 🔧 Configuration

The service reads environment variables from:
1. `agent-service/.env` (if exists)
2. Parent `.env` file (project root)

Required variables:
- `STREAM_API_KEY` or `VITE_STREAM_API_KEY`
- `STREAM_SECRET` or `VITE_STREAM_API_SECRET`
- `PORT` (default: 3001)
- `FRONTEND_URL` (default: http://localhost:3000)

## 📡 API Endpoints

Same as before:

- `POST /api/start-agent` - Start Python ML agent
- `POST /api/stop-agent` - Stop Python ML agent
- `GET /api/agents` - List running agents
- `GET /api/health` - Health check

## 🎯 Key Features

1. **Uses Virtual Environment**: Automatically uses `cvMLAgentNew/.venv/bin/python3`
2. **Process Management**: Tracks running Python agent processes
3. **Stream.io Integration**: Generates JWT tokens and fetches call metadata
4. **Error Handling**: Proper cleanup and error reporting
5. **Same API**: Frontend doesn't need changes

## 🔄 Migration from Node.js

The frontend doesn't need any changes - the API is identical. Just:
1. Stop the Node.js service
2. Start the Python service
3. Everything works the same!

## ✅ Status

- ✅ Python service created
- ✅ Uses `cvMLAgentNew/.venv`
- ✅ All endpoints implemented
- ✅ Stream.io integration working
- ✅ Process management working
- ✅ Ready to use!

---

**The Python service is now running!** 🎉




