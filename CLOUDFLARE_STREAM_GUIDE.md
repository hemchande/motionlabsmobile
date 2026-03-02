# Cloudflare Stream Integration Guide

## How Videos Are Stored and Retrieved

### 1. Video URLs in Database

Each session in MongoDB has a `cloudflare_stream_url` field:

```json
{
  "session_id": "athlete_002_session_66",
  "athlete_id": "athlete_002",
  "athlete_name": "John Doe",
  "cloudflare_stream_url": "https://customer-xxx.cloudflarestream.com/VIDEO_ID/manifest/video.m3u8",
  "timestamp": "2026-02-12T10:00:00",
  "activity": "gymnastics",
  "technique": "vault"
}
```

### 2. API Endpoints to Fetch Videos

#### Get Single Session (with video URL)
```http
GET /api/session/{session_id}
```

**Response:**
```json
{
  "status": "success",
  "session": {
    "session_id": "athlete_002_session_66",
    "cloudflare_stream_url": "https://customer-xxx.cloudflarestream.com/VIDEO_ID/manifest/video.m3u8",
    ...
  }
}
```

#### Get All Sessions (with video URLs)
```http
GET /api/sessions?limit=50
```

**Response:**
```json
{
  "status": "success",
  "count": 10,
  "sessions": [
    {
      "session_id": "session_1",
      "cloudflare_stream_url": "https://...",
      ...
    },
    ...
  ]
}
```

#### Get Sessions for an Alert (multiple videos)
```http
GET /api/alert/{alert_id}/sessions
```

**Response:**
```json
{
  "status": "success",
  "alert_id": "alert_123",
  "count": 5,
  "sessions": [
    {
      "session_id": "session_1",
      "cloudflare_stream_url": "https://...",
      ...
    },
    ...
  ]
}
```

### 3. URL Format Conversion

Cloudflare Stream provides two URL formats:

**HLS Manifest URL (from API):**
```
https://customer-xxx.cloudflarestream.com/VIDEO_ID/manifest/video.m3u8
```

**Iframe Embed URL (for display):**
```
https://customer-xxx.cloudflarestream.com/VIDEO_ID/iframe
```

**Conversion Code:**
```javascript
function toCloudflareIframeUrl(m3u8Url) {
  const match = m3u8Url.match(/https:\/\/customer-([^.]+)\.cloudflarestream\.com\/([^/]+)\//);
  if (match) {
    return `https://customer-${match[1]}.cloudflarestream.com/${match[2]}/iframe`;
  }
  return null;
}
```

### 4. Display Video in React

**Component: `StreamVideoPlayer.tsx`**

```tsx
import { StreamVideoPlayer } from './components/StreamVideoPlayer';

// Fetch session
const session = await getSession('athlete_002_session_66');

// Display video
<StreamVideoPlayer 
  url={session.cloudflare_stream_url} 
  title="Session Video"
/>
```

**How it works:**
1. Component receives Cloudflare Stream URL
2. Converts m3u8 URL to iframe URL
3. Renders iframe with video player
4. Handles fallback to HLS.js for non-iframe streams

### 5. Complete Flow Example

```typescript
// 1. Fetch session from API
const session = await fetch(
  'https://athlete-coach-fastapi-630016859450.europe-west1.run.app/api/session/athlete_002_session_66'
).then(r => r.json());

// 2. Extract video URL
const videoUrl = session.session.cloudflare_stream_url;
// "https://customer-xxx.cloudflarestream.com/VIDEO_ID/manifest/video.m3u8"

// 3. Convert to iframe URL
const iframeUrl = toCloudflareIframeUrl(videoUrl);
// "https://customer-xxx.cloudflarestream.com/VIDEO_ID/iframe"

// 4. Display in iframe
<iframe 
  src={iframeUrl} 
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" 
  allowFullScreen
/>
```

## Testing

### HTML Test File

Open `test_cloudflare_stream.html` in your browser to test:

```bash
open test_cloudflare_stream.html
```

**Tests included:**
1. ✅ Fetch all sessions and find ones with videos
2. ✅ Get specific session by ID and play video
3. ✅ Get sessions for an alert (multiple videos)
4. ✅ Display video directly from URL

### cURL Test

```bash
# Get a session
curl https://athlete-coach-fastapi-630016859450.europe-west1.run.app/api/session/athlete_002_session_66

# Get all sessions
curl "https://athlete-coach-fastapi-630016859450.europe-west1.run.app/api/sessions?limit=10"

# Get alert sessions
curl https://athlete-coach-fastapi-630016859450.europe-west1.run.app/api/alert/alert_123/sessions
```

## Implementation in Your App

**File:** `src/services/athleteCoachService.ts`

```typescript
// Get session with video
export async function getSession(sessionId: string): Promise<Record<string, unknown>> {
  const client = getClient();
  const res = await client.getSession(sessionId);
  const session = res.session ?? res;
  return session;
}

// Get sessions for alert (multiple videos)
export async function getSessionsForAlert(alertId: string): Promise<SessionsForAlertResponse> {
  const client = getClient();
  return await client.getSessionsForAlert(alertId);
}
```

**Usage:**
```tsx
// Fetch and display session video
const session = await getSession('athlete_002_session_66');

<StreamVideoPlayer 
  url={session.cloudflare_stream_url} 
  title={`Session ${session.session_id}`}
/>
```

## Summary

**How it works:**
1. 📹 Videos uploaded to Cloudflare Stream
2. 💾 URLs stored in MongoDB sessions collection
3. 🔌 API returns session data with `cloudflare_stream_url`
4. 🎬 Frontend converts m3u8 → iframe URL
5. 📺 Display in `<iframe>` or HLS video player

**Key Files:**
- `src/components/StreamVideoPlayer.tsx` - Video player component
- `src/services/athleteCoachService.ts` - API calls to fetch sessions
- `test_cloudflare_stream.html` - Interactive test page
