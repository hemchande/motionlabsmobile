# TaskGroup Error Explanation

## What the Error Means

The error `unhandled errors in a TaskGroup (1 sub-exception)` occurs when:

1. **Async Context Issue**: The MCP client's async session manager creates a TaskGroup to manage multiple concurrent operations
2. **Session Cleanup**: When the async context exits, if there are unhandled exceptions in background tasks, the TaskGroup raises this error
3. **Connection Management**: This typically happens when HTTP connections aren't properly closed or when there are network issues

## Why It Happens

The issue occurs because:
- A new `MultiServerMCPClient` is created for each request
- The client manages HTTP connections to multiple MCP servers
- When the async context exits, background tasks may still be running
- If those tasks have errors, the TaskGroup catches them and raises this exception

## The Fix

I've made two key changes:

### 1. Singleton Client Pattern
Instead of creating a new client for each request, we now use a single shared client instance:

```python
# Global MCP client instance (reused across requests)
_mcp_client = None

def get_mcp_client():
    """Get or create MCP client (singleton pattern)."""
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MultiServerMCPClient({...})
    return _mcp_client
```

### 2. Better Error Handling
Added proper exception handling to catch and log the actual errors:

```python
try:
    async with client.session("athlete_coach_api") as session:
        # ... tool calls ...
except asyncio.CancelledError:
    raise
except Exception as session_error:
    # Log the actual error for debugging
    import traceback
    print(f"❌ Error in get_alerts session: {session_error}")
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"Session error: {str(session_error)}")
```

## Testing

After the fix, test again:

```bash
# Test get-alerts
curl -X POST http://localhost:8004/api/get-alerts \
  -H "Content-Type: application/json" \
  -d '{"athlete_id":"athlete_001","include_stream_urls":true,"include_insights":true,"include_metrics":true,"limit":1}'

# Test get-insights
curl -X POST http://localhost:8004/api/get-insights \
  -H "Content-Type: application/json" \
  -d '{"athlete_id":"athlete_001","limit":1}'
```

## Expected Result

After the fix:
- ✅ No more TaskGroup errors
- ✅ Proper error messages if something fails
- ✅ Better connection reuse (single client instance)
- ✅ Tools work correctly

## If It Still Fails

If you still see errors, check:
1. Are all MCP servers running? (`./start_all_mcp_servers.sh`)
2. Check logs: `tail -f /tmp/mcp_service.log`
3. Check server logs: `tail -f /tmp/athlete_coach_mcp_server.log`
4. Verify network connectivity to MCP servers




