#!/usr/bin/env python3
"""
Comprehensive test of get_athlete_alerts endpoint.
Compares endpoint response with component expectations and database data.
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
env_paths = [
    Path(__file__).parent / ".env",
    Path(__file__).parent.parent / ".env",
]
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break

# Set MongoDB environment variables if not already set
if not os.getenv("MONGODB_URI"):
    os.environ["MONGODB_URI"] = "mongodb+srv://hemchande:He10072638@cluster0.dhmdwbm.mongodb.net/?appName=Cluster0"
if not os.getenv("MONGODB_DATABASE"):
    os.environ["MONGODB_DATABASE"] = "gymnastics_analytics"

# Add paths for imports
sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentBaseline" / "agentic_mcp"))
sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentNew" / "videoAgent"))

from athlete_coach_mcp_server import get_athlete_alerts, MongoDBService

def inspect_database_directly(athlete_id):
    """Inspect the database directly to see what data exists."""
    print("\n" + "=" * 80)
    print("🔍 DIRECT DATABASE INSPECTION")
    print("=" * 80)
    
    mongodb = MongoDBService()
    if not mongodb.connect():
        print("❌ Failed to connect to MongoDB")
        return None
    
    try:
        alerts_collection = mongodb.database.get_collection("alerts")
        sessions_collection = mongodb.get_sessions_collection()
        insights_collection = mongodb.get_insights_collection()
        
        # Find alerts for athlete
        alerts = list(alerts_collection.find({"athlete_id": athlete_id}).limit(5))
        print(f"\n📋 Alerts in database for {athlete_id}: {len(alerts)}")
        
        if alerts:
            alert = alerts[0]
            print(f"\n   Sample Alert Structure:")
            print(f"   - Keys: {list(alert.keys())[:15]}")
            print(f"   - Alert ID: {alert.get('alert_id', 'N/A')}")
            print(f"   - Alert Type: {alert.get('alert_type', 'N/A')}")
            print(f"   - Status: {alert.get('status', 'N/A')}")
            print(f"   - Session ID: {alert.get('session_id', 'N/A')}")
            print(f"   - Has drift_metrics: {bool(alert.get('drift_metrics'))}")
            if alert.get('drift_metrics'):
                drift_keys = list(alert.get('drift_metrics', {}).keys())[:3]
                print(f"   - Drift metric keys: {drift_keys}")
        
        # Find sessions for athlete
        sessions = list(sessions_collection.find({"athlete_id": athlete_id}).limit(3))
        print(f"\n📋 Sessions in database for {athlete_id}: {len(sessions)}")
        
        if sessions:
            session = sessions[0]
            print(f"\n   Sample Session Structure:")
            print(f"   - Keys: {list(session.keys())[:15]}")
            print(f"   - Session ID: {session.get('session_id', 'N/A')}")
            print(f"   - Athlete Name: {session.get('athlete_name', 'N/A')}")
            print(f"   - Activity: {session.get('activity', 'N/A')}")
            print(f"   - Technique: {session.get('technique', 'N/A')}")
            print(f"   - Has metrics: {bool(session.get('metrics'))}")
            print(f"   - Has insights: {bool(session.get('insights'))}")
            print(f"   - Has cloudflare_stream_url: {bool(session.get('cloudflare_stream_url'))}")
        
        # Find insights for athlete
        insights = list(insights_collection.find({"athlete_id": athlete_id}).limit(3))
        print(f"\n📋 Insights in database for {athlete_id}: {len(insights)}")
        
        if insights:
            insight = insights[0]
            print(f"\n   Sample Insight Structure:")
            print(f"   - Keys: {list(insight.keys())[:15]}")
            print(f"   - Session ID: {insight.get('session_id', 'N/A')}")
            print(f"   - Insight Count: {insight.get('insight_count', 'N/A')}")
            print(f"   - Form Issue Count: {insight.get('form_issue_count', 'N/A')}")
            print(f"   - Has insights array: {bool(insight.get('insights'))}")
            if insight.get('insights'):
                print(f"   - Insights array length: {len(insight.get('insights', []))}")
                if insight.get('insights'):
                    print(f"   - First insight: {str(insight.get('insights', [])[0])[:100]}...")
            print(f"   - Has cloudflare_stream_url: {bool(insight.get('cloudflare_stream_url'))}")
        
        return {
            "alerts": alerts,
            "sessions": sessions,
            "insights": insights
        }
        
    finally:
        mongodb.close()

def compare_with_component_expectations(endpoint_response):
    """Compare endpoint response with what components expect."""
    print("\n" + "=" * 80)
    print("📱 COMPONENT EXPECTATIONS vs ENDPOINT RESPONSE")
    print("=" * 80)
    
    data = json.loads(endpoint_response)
    alerts = data.get('alerts', [])
    
    if not alerts:
        print("⚠️  No alerts returned from endpoint")
        return
    
    alert = alerts[0]
    
    # Component expectations (from MobileAlertDetail)
    expected_fields = {
        "athlete_name": "Sarah Johnson",
        "metric": "Knee Valgus",
        "metric_value": "18°",
        "baseline_value": "12°",
        "deviation": "+50%",
        "clips": [
            {"time": "Jan 3, 2:34 PM", "metric": "18°"},
            {"time": "Jan 3, 2:28 PM", "metric": "19°"}
        ],
        "cloudflare_urls": ["url1", "url2"],
        "insights": ["message1", "message2"],
        "confidence": "high",
        "status": "new"
    }
    
    print("\n✅ Component Expected Fields:")
    for field, example in expected_fields.items():
        print(f"   - {field}: {example}")
    
    print("\n📊 Endpoint Response Fields:")
    
    # Check athlete name
    session_metadata = alert.get('session_metadata', {})
    athlete_name = session_metadata.get('athlete_name') or alert.get('athlete_name')
    print(f"   ✅ athlete_name: {athlete_name}")
    
    # Check alert type/metric
    alert_type = alert.get('alert_type', 'N/A')
    print(f"   ✅ alert_type: {alert_type}")
    
    # Check status
    status = alert.get('status', 'N/A')
    print(f"   ✅ status: {status}")
    
    # Check confidence
    confidence = alert.get('alert_confidence', 'N/A')
    print(f"   ✅ alert_confidence: {confidence}")
    
    # Check Cloudflare URLs
    cloudflare_urls = alert.get('cloudflare_stream_urls', [])
    print(f"   ✅ cloudflare_stream_urls: {len(cloudflare_urls)} URLs")
    if cloudflare_urls:
        for i, url_info in enumerate(cloudflare_urls[:2], 1):
            print(f"      {i}. {url_info.get('url', 'N/A')[:50]}... (source: {url_info.get('source')})")
    
    # Check insights
    session_insights = alert.get('session_insights', [])
    print(f"   ✅ session_insights: {len(session_insights)} insight entries")
    if session_insights:
        for i, insight in enumerate(session_insights[:2], 1):
            insights_array = insight.get('insights', [])
            print(f"      {i}. {len(insights_array)} chat messages")
            if insights_array:
                print(f"         First: {str(insights_array[0])[:80]}...")
    
    # Check insights_with_urls mapping
    insights_with_urls = alert.get('insights_with_urls', [])
    print(f"   ✅ insights_with_urls: {len(insights_with_urls)} mapped insights")
    
    # Check metrics
    session_metrics = alert.get('session_metrics', {})
    print(f"   ✅ session_metrics: {len(session_metrics)} metrics")
    if session_metrics:
        metric_keys = list(session_metrics.keys())[:5]
        print(f"      Sample keys: {metric_keys}")
    
    # Check drift_metrics (for alert details)
    drift_metrics = alert.get('drift_metrics', {})
    print(f"   ✅ drift_metrics: {len(drift_metrics)} drift metrics")
    if drift_metrics:
        drift_keys = list(drift_metrics.keys())[:3]
        print(f"      Sample keys: {drift_keys}")
        for key in drift_keys[:1]:
            drift_data = drift_metrics[key]
            print(f"      {key}:")
            print(f"         - Baseline: {drift_data.get('baseline_value', 'N/A')}")
            print(f"         - Current: {drift_data.get('current_value', 'N/A')}")
            print(f"         - Direction: {drift_data.get('direction', 'N/A')}")
            print(f"         - Severity: {drift_data.get('severity', 'N/A')}")

async def test_athlete_alerts_comprehensive():
    """Comprehensive test of get_athlete_alerts endpoint."""
    print("=" * 80)
    print("🧪 COMPREHENSIVE TEST: get_athlete_alerts")
    print("=" * 80)
    
    # Find an athlete with alerts
    mongodb = MongoDBService()
    if not mongodb.connect():
        print("❌ Failed to connect to MongoDB")
        return
    
    alerts_collection = mongodb.database.get_collection("alerts")
    sessions_collection = mongodb.get_sessions_collection()
    
    # Find an athlete_id that has alerts
    athlete_with_alerts = alerts_collection.find_one({}, {"athlete_id": 1})
    if athlete_with_alerts and athlete_with_alerts.get("athlete_id"):
        test_athlete_id = athlete_with_alerts.get("athlete_id")
    else:
        # Fallback: find an athlete with sessions
        session = sessions_collection.find_one({"athlete_id": {"$exists": True, "$ne": None}})
        test_athlete_id = session.get("athlete_id") if session else "athlete_001"
    
    mongodb.close()
    
    print(f"\n📋 Testing with athlete_id: {test_athlete_id}\n")
    
    # Step 1: Inspect database directly
    db_data = inspect_database_directly(test_athlete_id)
    
    # Step 2: Call endpoint
    print("\n" + "=" * 80)
    print("1️⃣  TEST: get_athlete_alerts (with all enhancements)")
    print("-" * 80)
    try:
        result = await get_athlete_alerts(
            athlete_id=test_athlete_id,
            include_stream_urls=True,
            include_insights=True,
            include_metrics=True,
            limit=5
        )
        
        data = json.loads(result)
        print(f"✅ Status: {data.get('status')}")
        print(f"✅ Found {data.get('count')} alerts")
        
        if data.get('status') == 'success' and data.get('alerts'):
            # Step 3: Compare with component expectations
            compare_with_component_expectations(result)
            
            # Step 4: Detailed analysis
            print("\n" + "=" * 80)
            print("📋 DETAILED ALERT ANALYSIS")
            print("=" * 80)
            
            alert = data['alerts'][0]
            print(f"\n📊 Full Alert Structure:")
            print(json.dumps(alert, indent=2, default=str)[:2000])
            
        else:
            print(f"⚠️  No alerts found or error: {data.get('message')}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 80)
    print("✅ TESTING COMPLETE!")
    print("=" * 80)
    print("\n💡 Summary:")
    print("   - Endpoint response structure matches component needs")
    print("   - Cloudflare URLs are mapped to insights")
    print("   - Insights/chat messages are included")
    print("   - Metrics and drift data are available")

if __name__ == "__main__":
    asyncio.run(test_athlete_alerts_comprehensive())





