# Alerts, Insights, and Session Clips — Client Display Spec

This document describes how **alerts** (drift alerts per insight) should be shown in the frontend, including how to display **insight metadata** and **session clips** with their video URLs. Use this when integrating with the Athlete Coach MCP API or the `athleteCoachMcpClient.js` client.

---

## 1. Conceptual model

### 1.1 Alert ↔ Insight relationship

- **One alert** is created per **(athlete_id, insight_id)** when **technical drift** is detected.
- Drift is detected only **after a baseline exists** for that insight (baseline is established after 8 sessions).
- An alert is created when **3 or more** post-baseline sessions show **moderate or high** risk for that insight.
- Each alert is tied to a **single insight type** (`insight_id`) and contains a **list of session IDs** (`session_ids` / `sessions_affected`) that contributed to the drift.

So:

- **Alert** = “This athlete has drifted on this specific form issue (insight).”
- **Insight** = The form issue type (e.g. knee valgus, landing knee bend).
- **Sessions** = The training sessions where the issue was observed at moderate/high severity; these are the sessions whose clips you should show.

### 1.2 What the client should show

For each **alert** the client should display:

1. **Insight label** — Human-readable name for the form issue (`insight_id`).
2. **Alert metadata** — Severity, created/updated time, status.
3. **Contributing sessions** — Count and list of sessions that triggered the alert.
4. **Session clips / stream URLs** — For each of those sessions (and any insight-specific clips), show video with session metadata (date, technique, etc.).

---

## 2. Insight IDs and display labels

Alerts use **standardized insight IDs**. Map them to user-facing labels as follows:

| `insight_id` (API)           | Suggested display label              |
|----------------------------|--------------------------------------|
| `insufficient_height`      | Insufficient height                  |
| `landing_knee_bend`        | Landing knee bend                    |
| `knee_valgus_collapse`     | Knee valgus collapse                 |
| `insufficient_hip_flexion` | Insufficient hip flexion             |
| `bent_knees_in_flight`     | Bent knees in flight                 |
| `poor_alignment`           | Poor alignment                       |
| `insufficient_split_angle` | Insufficient split angle             |
| `poor_landing_quality`     | Poor landing quality                 |

The client can maintain this mapping (e.g. in a constant or i18n file) and use it whenever displaying `alert.insight_id`.

---

## 3. Alert payload (from API)

When you call **get_athlete_alerts** or **get_alert**, each alert object can look like this (fields may vary by backend version):

### 3.1 Core alert fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | MongoDB document ID (use as `alert_id` if needed). |
| `alert_id` | string | Optional; some backends set this; otherwise use `_id`. |
| `athlete_id` | string | Athlete this alert belongs to. |
| `insight_id` | string | **Form issue type** — use for label and grouping. |
| `alert_type` | string | e.g. `"technical_drift"`. |
| `severity` | string | e.g. `"moderate"`, `"severe"`, `"minor"`. |
| `status` | string | e.g. `"new"`, `"open"`, `"resolved"`. |
| `session_ids` | string[] | **All sessions that contributed to this alert.** |
| `sessions_affected` | string[] | Same as `session_ids` (backward compatibility). |
| `session_id` | string | Optional; single “primary” session (legacy). |
| `post_baseline_session_count` | number | Number of post-baseline sessions with moderate/high risk. |
| `created_at` | string (ISO) | When the alert was created. |
| `updated_at` | string (ISO) | Last update. |

### 3.2 Enriched fields (e.g. from get_athlete_alerts)

When using **get_athlete_alerts** with `include_stream_urls: true` and `include_insights: true`:

| Field | Type | Description |
|-------|------|-------------|
| `cloudflare_stream_url` | string | Single “primary” stream URL (first available). |
| `cloudflare_stream_urls` | array | **List of stream URLs** with source and type. |
| `session_metadata` | object | For the primary session: activity, technique, timestamp, athlete_name, etc. |
| `session_metrics` | object | Metrics for the primary session (if requested). |
| `session_insights` | array | Insight/chat entries for the primary session. |
| `insights_with_urls` | array | Insights with optional `cloudflare_url` per insight. |

Each entry in **cloudflare_stream_urls** can look like:

```json
{
  "url": "https://customer-xxx.cloudflarestream.com/.../manifest/video.m3u8",
  "source": "session",
  "type": "session_video"
}
```

or:

```json
{
  "url": "https://...",
  "source": "insight",
  "insight_id": "...",
  "type": "insight_video"
}
```

or:

```json
{
  "url": "https://...",
  "source": "clip",
  "clip_id": "...",
  "type": "clip_video"
}
```

- **session_video** — Full session stream.
- **insight_video** — Clip/URL tied to a specific insight.
- **clip_video** — Clip from session’s `clips` array.

For **per-insight alerts**, the backend may only enrich the **first** session (`session_id`). To show **all** sessions that contributed, the client should use **get_sessions_for_alert** and **get_clips_for_alert** (see below).

---

## 4. How to show alerts with session clips — step by step

### 4.1 List alerts for an athlete

1. Call **get_athlete_alerts(athlete_id, { include_stream_urls: true, include_insights: true, limit: 50 })**.
2. For each alert in the response:
   - Map **insight_id** to a display label (Section 2).
   - Show **severity** and **status**.
   - Show **session count**: `alert.session_ids?.length ?? alert.sessions_affected?.length ?? 0`, or use `post_baseline_session_count` if present.
   - Use **cloudflare_stream_urls** (or **cloudflare_stream_url**) to show at least one video; if the backend only attached one session’s URLs, optionally fetch the rest (steps 4.2–4.3).

### 4.2 Get all sessions for an alert

When the user opens a single alert (or you need full session list):

1. Call **get_sessions_for_alert(alert_id)**.
2. Response shape:
   - `status`, `alert_id`, `count`, `sessions` (array of session objects).
3. Each **session** can contain:
   - `_id`, `session_id`, `athlete_id`, `activity`, `technique`, `timestamp`, `cloudflare_stream_url`, `clips` (array), etc.
4. Use this list to:
   - Show “Contributing sessions” with **session metadata** (date, technique).
   - For each session, use **session.cloudflare_stream_url** (or a clip URL from **session.clips**) to show the corresponding **session clip** next to that session’s metadata.

### 4.3 Get all clips for an alert

When you want a flat list of clips (session + insight clips) for the alert:

1. Call **get_clips_for_alert(alert_id)**.
2. Response shape:
   - `status`, `alert_id`, `count`, `clips` (array).
3. Each **clip** can have:
   - `cloudflare_stream_url`, `preview_url`, `stream_url`, `clip_id`, `session_id`, timestamps, labels, etc.
4. Display each clip with whatever metadata the API returns (e.g. session_id, clip_id, timestamp), and optionally group by session if you have session list from 4.2.

### 4.4 Single alert detail (get_alert)

For a single alert screen:

1. Call **get_alert(alert_id)** to get full alert document (including optional enriched **session** if backend attached one).
2. Then:
   - Call **get_sessions_for_alert(alert_id)** for the full list of sessions and their metadata/URLs.
   - Call **get_clips_for_alert(alert_id)** for the full list of clips.
3. UI suggestion:
   - **Header**: Insight label (from `insight_id`), severity, date range or “X sessions”.
   - **Section “Contributing sessions”**: One row/card per session from `get_sessions_for_alert` with session metadata and that session’s stream URL (or first clip URL).
   - **Section “Clips”**: Grid or list of clips from `get_clips_for_alert`, each with thumbnail/player and metadata.

---

## 5. Metadata to show next to each session clip

For each **session** (from get_sessions_for_alert or from alert enrichment), show at least:

| Metadata | Source | Notes |
|----------|--------|--------|
| Session date/time | `session.timestamp` | Format for locale. |
| Technique | `session.technique` | e.g. back_handspring. |
| Activity | `session.activity` | e.g. gymnastics. |
| Session ID | `session.session_id` or `session._id` | For debugging or deep links. |

For each **clip** (from get_clips_for_alert or session.clips), show:

| Metadata | Source | Notes |
|----------|--------|--------|
| Stream / preview URL | `clip.cloudflare_stream_url` or `preview_url` / `stream_url` | For video player. |
| Clip ID | `clip.clip_id` | Optional. |
| Session ID | `clip.session_id` | Link back to session. |
| Label / description | If API provides | Optional. |

---

## 6. Example client flow (pseudo-code)

```text
// 1) List alerts for athlete
alertsResponse = await client.getAthleteAlerts(athleteId, {
  include_stream_urls: true,
  include_insights: true,
  limit: 50
});
alerts = alertsResponse.alerts;

// 2) For each alert, show insight label + session count + primary video
for (alert of alerts) {
  displayLabel = INSIGHT_LABELS[alert.insight_id] || alert.insight_id;
  sessionCount = (alert.session_ids || alert.sessions_affected || []).length;
  primaryUrl = alert.cloudflare_stream_url || alert.cloudflare_stream_urls?.[0]?.url;
  // Render: displayLabel, alert.severity, sessionCount, primaryUrl
}

// 3) When user opens one alert
sessionsResponse = await client.getSessionsForAlert(alertId);
clipsResponse = await client.getClipsForAlert(alertId);
sessions = sessionsResponse.sessions;
clips = clipsResponse.clips;

// 4) Show “Contributing sessions” with metadata + stream URL per session
for (session of sessions) {
  showSessionCard(session.timestamp, session.technique, session.cloudflare_stream_url);
}

// 5) Show all clips (with metadata)
for (clip of clips) {
  showClipPlayer(clip.cloudflare_stream_url || clip.preview_url, clip.session_id, clip.clip_id);
}
```

---

## 7. Summary table for your client agent

| Goal | API method | Key response fields |
|------|------------|----------------------|
| List alerts for athlete | **get_athlete_alerts** | `alerts[]`, each: `insight_id`, `severity`, `session_ids` / `sessions_affected`, `cloudflare_stream_urls` |
| One alert detail | **get_alert** | `alert` (full document) |
| All sessions for one alert | **get_sessions_for_alert** | `sessions[]` (metadata + `cloudflare_stream_url` per session) |
| All clips for one alert | **get_clips_for_alert** | `clips[]` (URLs + metadata) |
| Display label for insight | Client-side map | Map `insight_id` → human-readable label (Section 2) |

Use this spec so that **alerts are shown per insight**, with **session count**, **session list with metadata**, and **session/clip video URLs** displayed consistently for your client agent and frontend.
