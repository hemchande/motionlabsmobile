# Enhanced `get_athlete_alerts` Endpoint

## ✅ Status: Working

The `get_athlete_alerts` endpoint has been enhanced to include:
- **Insights mapped to Cloudflare URLs** (array)
- **Session metrics** from associated sessions
- **Chat messages** (insights array) from sessions
- **Multiple Cloudflare URLs** from different sources

---

## 📋 New Features

### 1. **Cloudflare URLs Array** 🎥
- Maps insights to Cloudflare stream URLs
- Collects URLs from multiple sources:
  - Session directly (`cloudflare_stream_url`)
  - Insights collection (`cloudflare_stream_url`, `stream_url`, `preview_url`)
  - Clips array in session (`cloudflare_stream_url`, `preview_url`, `stream_url`)
- Returns array with source and type information

### 2. **Session Metrics** 📈
- Includes all metrics from the associated session
- Only included if `include_metrics=True` (default: True)

### 3. **Session Insights/Chat Messages** 💡
- Retrieves insights from `insights` collection for the session
- Includes the `insights` array (chat messages)
- Maps each insight to its Cloudflare URL if available
- Also checks session directly for insights

### 4. **Session Metadata** 📋
- Enhanced metadata including:
  - `session_id`
  - `activity`
  - `technique`
  - `timestamp`
  - `athlete_name`
  - `athlete_id`

---

## 🔧 API Parameters

```python
async def get_athlete_alerts(
    athlete_id: str,
    include_stream_urls: bool = True,    # Include Cloudflare URLs
    include_insights: bool = True,         # Include insights/chat messages
    include_metrics: bool = True,         # Include session metrics
    limit: int = 50                       # Max alerts to return
) -> str
```

---

## 📊 Response Structure

```json
{
  "status": "success",
  "athlete_id": "athlete_001",
  "count": 5,
  "alerts": [
    {
      "_id": "...",
      "alert_id": "...",
      "alert_type": "technical_drift",
      "status": "new",
      "session_id": "...",
      
      // Session metadata
      "session_metadata": {
        "session_id": "...",
        "activity": "gymnastics",
        "technique": "vault",
        "timestamp": "...",
        "athlete_name": "Athlete One",
        "athlete_id": "athlete_001"
      },
      
      // Session metrics (if include_metrics=True)
      "session_metrics": {
        "height_off_floor_meters": 0.25,
        "landing_knee_bend_min": 160.0,
        // ... more metrics
      },
      
      // Cloudflare URLs array (if include_stream_urls=True)
      "cloudflare_stream_urls": [
        {
          "url": "https://...",
          "source": "session",
          "type": "session_video"
        },
        {
          "url": "https://...",
          "source": "insight",
          "insight_id": "...",
          "type": "insight_video"
        },
        {
          "url": "https://...",
          "source": "clip",
          "clip_id": "...",
          "type": "clip_video"
        }
      ],
      "cloudflare_stream_url": "https://...",  // Backward compatibility (first URL)
      
      // Session insights (if include_insights=True)
      "session_insights": [
        {
          "insight_id": "...",
          "session_id": "...",
          "insight_count": 4,
          "form_issue_count": 4,
          "form_issue_types": ["landing_knee_bend", "insufficient_height"],
          "insights": [  // Chat messages array
            "Knee bend is below baseline",
            "Height decreased significantly",
            // ... more insights
          ],
          "cloudflare_stream_url": "https://...",
          "created_at": "..."
        }
      ],
      
      // Insights mapped to URLs
      "insights_with_urls": [
        {
          "insight_id": "...",
          "insights": ["message1", "message2"],
          "form_issues": ["issue1", "issue2"],
          "cloudflare_url": "https://..."
        }
      ]
    }
  ]
}
```

---

## 🎯 Usage Examples

### Get alerts with all enhancements:
```python
result = await get_athlete_alerts(
    athlete_id="athlete_001",
    include_stream_urls=True,
    include_insights=True,
    include_metrics=True,
    limit=10
)
```

### Get alerts with minimal data:
```python
result = await get_athlete_alerts(
    athlete_id="athlete_001",
    include_stream_urls=False,
    include_insights=False,
    include_metrics=False,
    limit=10
)
```

### Get alerts with only insights:
```python
result = await get_athlete_alerts(
    athlete_id="athlete_001",
    include_stream_urls=False,
    include_insights=True,
    include_metrics=False,
    limit=10
)
```

---

## 🔍 How It Works

1. **Finds alerts** for the athlete (by `athlete_id` or via sessions)
2. **For each alert**:
   - Gets the `session_id` from the alert
   - Looks up the session in `sessions` collection
   - If session found:
     - Adds session metadata
     - Adds session metrics (if enabled)
     - Collects Cloudflare URLs from:
       - Session directly
       - Insights collection for that session
       - Clips array in session
     - Retrieves insights from `insights` collection
     - Maps insights to their Cloudflare URLs
     - Creates `insights_with_urls` mapping

---

## ✅ Testing

Run the test script:
```bash
python3 test_enhanced_alerts.py
```

**Test Results:**
- ✅ Syntax: OK
- ✅ MongoDB connection: Working
- ✅ Endpoint execution: Working
- ✅ All parameters: Functional

---

## 📝 Notes

- **Backward compatibility**: Still includes `cloudflare_stream_url` (first URL) for compatibility
- **Multiple sources**: Checks session, insights collection, and clips for URLs
- **Insights mapping**: Each insight can have its own Cloudflare URL
- **Chat messages**: The `insights` array contains the actual chat messages/insights
- **Performance**: Uses efficient MongoDB queries with proper indexing

---

## 🚀 Next Steps

1. ✅ Endpoint enhanced and tested
2. ✅ All features working
3. ✅ Ready for integration with frontend
4. ✅ Can be used in Next.js API routes if needed

---

**Status**: ✅ **Production Ready!**





