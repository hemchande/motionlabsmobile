# MCP Query Builder Usage Guide

## Overview

The `mcpQueryBuilder.ts` file provides typed functions to call all MCP tools through natural language queries. The agent automatically selects and executes the appropriate tools.

## Import

```typescript
import mcpQueryService from './services/mcpQueryBuilder';
// Or import specific query builders
import { sessionManagerQueries, pipelineProcessorQueries, athleteCoachQueries } from './services/mcpQueryBuilder';
```

## Usage Examples

### Session Manager Tools

#### Run Pipeline
```typescript
// Start video processing pipeline
const result = await mcpQueryService.runPipeline({
  call_id: 'demo-call-123',
  activity: 'gymnastics',
  technique: 'back_handspring',
  user_requests: ['knee_valgus', 'landing_form']
});
```

#### Upsert Session
```typescript
// Create or update a session
const result = await mcpQueryService.upsertSession({
  session_id: 'session-123',
  activity: 'gymnastics',
  technique: 'back_handspring',
  athlete_id: 'athlete_001',
  athlete_name: 'Sarah Johnson'
});
```

#### Get Session
```typescript
// Get a session by ID
const result = await mcpQueryService.getSession({
  session_id: 'session-123'
});
```

### Pipeline Processor Tools

#### Listen to Retrieval Queue
```typescript
// Process all messages in queue
const result = await mcpQueryService.listenToRetrievalQueue();

// Process specific number of messages
const result = await mcpQueryService.listenToRetrievalQueue({
  max_messages: 10
});
```

#### Process Video Pipeline
```typescript
// Process pipeline for existing session
const result = await mcpQueryService.processVideoPipeline({
  athlete_id: 'athlete_001',
  session_id: 'session-123',
  activity: 'gymnastics',
  athlete_name: 'Sarah Johnson'
});
```

### Athlete/Coach API Tools

#### Create User
```typescript
// Create a new athlete
const result = await mcpQueryService.createUser({
  email: 'sarah@example.com',
  password: 'password123',
  full_name: 'Sarah Johnson',
  role: 'athlete'
});

// Create a coach
const result = await mcpQueryService.createUser({
  email: 'coach@example.com',
  password: 'password123',
  full_name: 'Coach Smith',
  role: 'coach',
  institution: 'State University'
});
```

#### Login
```typescript
// Login as athlete
const result = await mcpQueryService.login({
  email: 'sarah@example.com',
  password: 'password123',
  role: 'athlete'
});
```

#### Get Athlete Sessions
```typescript
// Get all sessions for an athlete
const result = await mcpQueryService.getAthleteSessions({
  athlete_id: 'athlete_001',
  limit: 50
});

// Filter by activity
const result = await mcpQueryService.getAthleteSessions({
  athlete_id: 'athlete_001',
  activity: 'gymnastics',
  limit: 20
});
```

#### Get Athlete Details
```typescript
// Get athlete summary and statistics
const result = await mcpQueryService.getAthleteDetails({
  athlete_id: 'athlete_001'
});
```

#### Get Athlete Alerts
```typescript
// Get alerts with all data
const result = await mcpQueryService.getAthleteAlerts({
  athlete_id: 'athlete_001',
  include_stream_urls: true,
  include_insights: true,
  include_metrics: true,
  limit: 50
});
```

#### Get Athlete Insights
```typescript
// Get insights for an athlete
const result = await mcpQueryService.getAthleteInsights({
  athlete_id: 'athlete_001',
  limit: 50,
  activity: 'gymnastics'
});
```

#### Get Athlete Trends
```typescript
// Get trends for an athlete
const result = await mcpQueryService.getAthleteTrends({
  athlete_id: 'athlete_001',
  activity: 'gymnastics',
  limit: 20
});
```

#### Get All Sessions
```typescript
// Get all sessions
const result = await mcpQueryService.getAllSessions({
  limit: 50
});

// Filter by activity
const result = await mcpQueryService.getAllSessions({
  activity: 'gymnastics',
  limit: 100
});
```

#### Get All Athletes
```typescript
// Get all athletes with statistics
const result = await mcpQueryService.getAllAthletes({
  limit: 100,
  include_stats: true
});
```

#### Get Alert Queue Messages
```typescript
// Get queue messages
const result = await mcpQueryService.getAlertQueueMessages({
  max_messages: 10,
  queue_name: 'drift_alerts_queue'
});
```

## Query Builders (Direct Access)

You can also build queries directly without calling the service:

```typescript
import { sessionManagerQueries, athleteCoachQueries } from './services/mcpQueryBuilder';

// Build a query
const query = sessionManagerQueries.runPipeline({
  call_id: 'demo-call-123',
  activity: 'gymnastics'
});

// Then call the agent manually
const result = await callAgent(query);
```

## Response Format

All functions return:
```typescript
{
  success: boolean;
  output?: string;      // Agent's response/output
  messages?: string[];  // All messages from agent execution
  error?: string;       // Error message if failed
}
```

For `getAthleteAlerts` and `getAthleteInsights`, the response is parsed and returns:
```typescript
{
  success: boolean;
  alerts: Alert[];     // or insights: Insight[]
  count: number;
  error?: string;
}
```

## Error Handling

All functions handle errors gracefully and return error information:

```typescript
const result = await mcpQueryService.getAthleteInsights({
  athlete_id: 'athlete_001'
});

if (!result.success) {
  console.error('Error:', result.error);
  // Handle error
} else {
  // Use result.insights
  console.log(`Found ${result.count} insights`);
}
```

## Complete Workflow Example

```typescript
// 1. Start pipeline
await mcpQueryService.runPipeline({
  call_id: 'demo-call-123',
  activity: 'gymnastics',
  technique: 'back_handspring'
});

// 2. Process queue messages
await mcpQueryService.listenToRetrievalQueue();

// 3. Get insights
const insights = await mcpQueryService.getAthleteInsights({
  athlete_id: 'athlete_001',
  limit: 50
});

// 4. Get alerts
const alerts = await mcpQueryService.getAthleteAlerts({
  athlete_id: 'athlete_001',
  include_stream_urls: true,
  include_insights: true
});
```

## TypeScript Types

All parameters are fully typed. Use your IDE's autocomplete to see available options:

```typescript
// TypeScript will show you all available parameters
mcpQueryService.runPipeline({
  // IDE will suggest: call_id, call_type, activity, technique, user_requests
});
```




