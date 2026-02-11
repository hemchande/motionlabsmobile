# MCP Query Builder

Complete TypeScript service for calling all MCP tools via natural language queries.

## Quick Start

```typescript
import mcpQueryService from './services/mcpQueryBuilder';

// Run pipeline
await mcpQueryService.runPipeline({
  call_id: 'demo-call-123',
  activity: 'gymnastics'
});

// Get insights
const insights = await mcpQueryService.getAthleteInsights({
  athlete_id: 'athlete_001'
});

// Get alerts
const alerts = await mcpQueryService.getAthleteAlerts({
  athlete_id: 'athlete_001',
  include_stream_urls: true
});
```

## All Available Functions

### Session Manager (3 functions)
- `runPipeline()` - Start video processing
- `upsertSession()` - Create/update session
- `getSession()` - Get session by ID

### Pipeline Processor (2 functions)
- `listenToRetrievalQueue()` - Process queue messages
- `processVideoPipeline()` - Process existing session

### Athlete/Coach API (10 functions)
- `createUser()` - Create user
- `login()` - Authenticate user
- `getAthleteSessions()` - Get athlete sessions
- `getAthleteDetails()` - Get athlete summary
- `getAthleteAlerts()` - Get alerts with URLs/insights
- `getAthleteInsights()` - Get insights
- `getAthleteTrends()` - Get trends
- `getAllSessions()` - Get all sessions
- `getAllAthletes()` - Get all athletes
- `getAlertQueueMessages()` - Get queue messages

## Features

✅ **Fully Typed** - All parameters are TypeScript typed  
✅ **Auto Query Building** - Natural language queries built automatically  
✅ **Agent Selection** - Agent automatically selects the right tools  
✅ **Error Handling** - Comprehensive error handling  
✅ **Type Safety** - Full TypeScript support with autocomplete  

## Files

- `mcpQueryBuilder.ts` - Main query builder service
- `mcpService.ts` - Low-level MCP service client
- `MCP_QUERY_BUILDER_USAGE.md` - Detailed usage guide

---

**15 tools available through typed functions!** 🎉




