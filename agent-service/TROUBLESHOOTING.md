# Troubleshooting "Failed to fetch" Error

## Issue

When clicking "Start Live Session", you get:
```
Failed to start session: Failed to fetch
```

## Common Causes

### 1. Agent Service Not Running

**Check:**
```bash
curl http://localhost:3001/api/health
```

**Fix:**
```bash
cd agent-service
../cvMLAgentNew/.venv/bin/python3 server.py
```

### 2. CORS Issue

The service should allow all origins. Check the CORS configuration in `server.py`.

### 3. Network/Port Issue

**Check if service is accessible:**
```bash
curl -X POST http://localhost:3001/api/start-agent \
  -H "Content-Type: application/json" \
  -d '{"callId":"test"}'
```

### 4. Frontend URL Mismatch

Make sure `VITE_AGENT_SERVICE_URL` in `.env` matches the service URL:
```env
VITE_AGENT_SERVICE_URL=http://localhost:3001
```

### 5. Timeout

The service now returns immediately (doesn't wait for agent to fully start). If you still get timeouts, check:
- Is the Python agent process starting?
- Are there errors in the agent service logs?

## Quick Fixes

1. **Restart the service:**
   ```bash
   pkill -f "python.*server.py"
   cd agent-service
   ../cvMLAgentNew/.venv/bin/python3 server.py
   ```

2. **Check browser console** for detailed error messages

3. **Verify service is running:**
   ```bash
   curl http://localhost:3001/api/health
   ```

4. **Check frontend environment:**
   - Make sure `.env` has `VITE_AGENT_SERVICE_URL=http://localhost:3001`
   - Restart frontend after changing `.env`

## Debug Steps

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Start Live Session"
4. Look for the request to `/api/start-agent`
5. Check the error details

Common issues:
- **CORS error**: Service not allowing origin
- **Connection refused**: Service not running
- **Timeout**: Service taking too long (now fixed - returns immediately)




