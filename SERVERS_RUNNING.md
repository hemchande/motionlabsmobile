# Servers Running Status

## ✅ Both Servers Are Running!

### 1. MCP Server (Athlete/Coach API)
- **Status**: ✅ Running
- **Port**: 8003
- **URL**: http://localhost:8003/mcp
- **Process**: `athlete_coach_mcp_server.py`
- **Location**: `cvMLAgentBaseline/agentic_mcp/`

### 2. MCP Service (REST API on 8004)
- **Port**: 8004
- **URL**: http://localhost:8004
- **Process**: `mcp_service.py`
- **Location**: `cvMLAgentBaseline/agentic_mcp/`
- **User endpoints**: `POST /api/create-user`, `POST /api/athlete/add-photo`

### 3. Frontend (Vite Dev Server)
- **Status**: ✅ Running
- **Port**: 3000
- **URL**: http://localhost:3000
- **Process**: `vite`
- **Location**: Project root

---

## 🚀 Access Your Application

### Frontend
Open your browser and navigate to:
```
http://localhost:3000
```

### MCP Server Test
To test the MCP server integration, add `?mcp=true` to the URL:
```
http://localhost:3000/?mcp=true
```

---

## 📋 Available Endpoints

### MCP Server Tools (via http://localhost:8003/mcp)

1. **create_user** - Create a new user with athlete_id
2. **login** - Authenticate user
3. **get_session** - Get session details
4. **get_athlete_sessions** - Get all sessions for an athlete
5. **get_athlete_details** - Get athlete summary
6. **get_athlete_alerts** - Get alerts with insights and URLs
7. **get_athlete_trends** - Get trends for an athlete
8. **get_athlete_insights** - Get insights for an athlete
9. **get_all_sessions** - Get all sessions
10. **get_all_athletes** - Get all athletes
11. **add_user_photo** - Add/update profile photo for an athlete

### REST API (via http://localhost:8004)
- `POST /api/create-user` - Create user (generates athlete_id)
- `POST /api/athlete/add-photo` - Add athlete profile photo

---

## 🔧 Managing Servers

### Stop Servers
```bash
# Stop MCP server
pkill -f athlete_coach_mcp_server

# Stop Frontend
pkill -f vite
```

### Restart Servers

**MCP Server:**
```bash
cd cvMLAgentBaseline/agentic_mcp
python3 athlete_coach_mcp_server.py
```

**Frontend:**
```bash
npm run dev
```

---

## ✅ Verification

Both servers should be accessible:
- ✅ Frontend: http://localhost:3000
- ✅ MCP Server: http://localhost:8003/mcp

---

**Status**: Both servers are running! 🎉




