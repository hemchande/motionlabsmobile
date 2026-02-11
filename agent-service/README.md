# Agent Service - Python Implementation

## Overview

Python-based agent service that manages the Python ML agent lifecycle for live video sessions. Uses FastAPI and the `cvMLAgentNew/.venv` virtual environment.

## 🚀 Quick Start

### Start the Service

```bash
cd agent-service
./start.sh
```

Or manually:

```bash
cd agent-service
../cvMLAgentNew/.venv/bin/python3 server.py
```

The service will start on `http://localhost:3001`

## 📋 Requirements

All dependencies are installed in `cvMLAgentNew/.venv`:

- `fastapi` - Web framework
- `uvicorn` - ASGI server  
- `httpx` - HTTP client
- `pydantic` - Data validation
- `python-dotenv` - Environment variables
- `pyjwt` - JWT tokens (not needed - using built-in hmac)

## 🔧 Configuration

Environment variables (loaded from `.env` files):

- `STREAM_API_KEY` or `VITE_STREAM_API_KEY` - Stream.io API key
- `STREAM_SECRET` or `VITE_STREAM_API_SECRET` - Stream.io secret
- `PORT` - Service port (default: 3001)
- `FRONTEND_URL` - Frontend URL (default: http://localhost:3000)

## 📡 API Endpoints

### Start Agent
```bash
POST /api/start-agent
Content-Type: application/json

{
  "callId": "demo-call-xGvo-o50"
}
```

### Stop Agent
```bash
POST /api/stop-agent
Content-Type: application/json

{
  "callId": "demo-call-xGvo-o50"
}
```

### List Agents
```bash
GET /api/agents
```

### Health Check
```bash
GET /api/health
```

## 🎯 Features

- ✅ Uses `cvMLAgentNew/.venv` virtual environment
- ✅ Calls `run_pipeline()` to join existing calls
- ✅ Process management and cleanup
- ✅ Stream.io JWT token generation
- ✅ Call metadata extraction
- ✅ Same API as Node.js version (no frontend changes needed)

## 🔄 Migration from Node.js

The frontend doesn't need any changes - the API is identical!

1. Stop Node.js service: `pkill -f "node.*server.js"`
2. Start Python service: `./start.sh`
3. Done! ✅

## 📁 Files

- `server.py` - Main FastAPI server
- `requirements.txt` - Python dependencies
- `start.sh` - Start script
- `PYTHON_SERVICE_SETUP.md` - Detailed setup guide

---

**Service is running on http://localhost:3001** 🎉
