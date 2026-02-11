#!/usr/bin/env python3
"""
Script to:
1. Query MongoDB to find athlete_ids with alerts and insights
2. Make requests to mcp_service endpoints to get alerts and insights
"""
import sys
import os
import json
import requests
from pathlib import Path
from typing import List, Dict, Any

# Add paths for imports
sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentNew" / "videoAgent"))
sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentBaseline" / "agentic_mcp"))

from dotenv import load_dotenv
load_dotenv()

from mongodb_service import MongoDBService

# MCP Service endpoint
MCP_SERVICE_URL = "http://localhost:8004"

def find_athlete_ids_with_data():
    """Query MongoDB to find athlete_ids that have alerts and/or insights."""
    print("=" * 70)
    print("🔍 Querying MongoDB for athlete_ids with alerts and insights...")
    print("=" * 70)
    
    mongodb = MongoDBService()
    if not mongodb.connect():
        print("❌ Failed to connect to MongoDB")
        return [], []
    
    athlete_ids_with_alerts = []
    athlete_ids_with_insights = []
    
    try:
        # Get collections
        alerts_collection = mongodb.database.get_collection("alerts")
        insights_collection = mongodb.get_insights_collection()
        
        # Find distinct athlete_ids from alerts collection
        print("\n📊 Checking alerts collection...")
        alerts_athlete_ids = alerts_collection.distinct("athlete_id")
        alerts_athlete_ids = [aid for aid in alerts_athlete_ids if aid]  # Filter None values
        athlete_ids_with_alerts = list(set(alerts_athlete_ids))
        print(f"   ✅ Found {len(athlete_ids_with_alerts)} unique athlete_ids with alerts")
        if athlete_ids_with_alerts:
            print(f"   Sample athlete_ids: {athlete_ids_with_alerts[:5]}")
        
        # Count alerts per athlete
        for athlete_id in athlete_ids_with_alerts[:5]:  # Show first 5
            count = alerts_collection.count_documents({"athlete_id": athlete_id})
            print(f"      - {athlete_id}: {count} alerts")
        
        # Find distinct athlete_ids from insights collection
        print("\n📊 Checking insights collection...")
        insights_athlete_ids = insights_collection.distinct("athlete_id")
        insights_athlete_ids = [aid for aid in insights_athlete_ids if aid]  # Filter None values
        athlete_ids_with_insights = list(set(insights_athlete_ids))
        print(f"   ✅ Found {len(athlete_ids_with_insights)} unique athlete_ids with insights")
        if athlete_ids_with_insights:
            print(f"   Sample athlete_ids: {athlete_ids_with_insights[:5]}")
        
        # Count insights per athlete
        for athlete_id in athlete_ids_with_insights[:5]:  # Show first 5
            count = insights_collection.count_documents({"athlete_id": athlete_id})
            print(f"      - {athlete_id}: {count} insights")
        
        # Find athletes with both
        athletes_with_both = set(athlete_ids_with_alerts) & set(athlete_ids_with_insights)
        print(f"\n📊 Athletes with both alerts AND insights: {len(athletes_with_both)}")
        if athletes_with_both:
            print(f"   {list(athletes_with_both)[:5]}")
        
    except Exception as e:
        print(f"❌ Error querying MongoDB: {e}")
        import traceback
        traceback.print_exc()
    finally:
        mongodb.close()
    
    return athlete_ids_with_alerts, athlete_ids_with_insights

def get_athlete_alerts_from_mcp(athlete_id: str, include_stream_urls: bool = True, 
                                include_insights: bool = True, include_metrics: bool = True, 
                                limit: int = 50) -> Dict[str, Any]:
    """Make request to mcp_service to get athlete alerts."""
    url = f"{MCP_SERVICE_URL}/api/get-alerts"
    
    payload = {
        "athlete_id": athlete_id,
        "include_stream_urls": include_stream_urls,
        "include_insights": include_insights,
        "include_metrics": include_metrics,
        "limit": limit
    }
    
    try:
        print(f"\n📡 Requesting alerts for athlete_id: {athlete_id}")
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
        return {"success": False, "error": str(e)}

def get_athlete_insights_from_mcp(athlete_id: str, limit: int = 50, 
                                  activity: str = None, technique: str = None) -> Dict[str, Any]:
    """Make request to mcp_service to get athlete insights."""
    url = f"{MCP_SERVICE_URL}/api/get-insights"
    
    payload = {
        "athlete_id": athlete_id,
        "limit": limit
    }
    
    if activity:
        payload["activity"] = activity
    if technique:
        payload["technique"] = technique
    
    try:
        print(f"\n📡 Requesting insights for athlete_id: {athlete_id}")
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
        return {"success": False, "error": str(e)}

def main():
    """Main function to query MongoDB and test MCP service endpoints."""
    print("=" * 70)
    print("Testing Athlete Alerts and Insights via MCP Service")
    print("=" * 70)
    
    # Step 1: Query MongoDB to find athlete_ids
    athlete_ids_with_alerts, athlete_ids_with_insights = find_athlete_ids_with_data()
    
    if not athlete_ids_with_alerts and not athlete_ids_with_insights:
        print("\n❌ No athlete_ids found with alerts or insights in MongoDB")
        return
    
    # Step 2: Test alerts endpoint with athletes that have alerts
    print("\n" + "=" * 70)
    print("🧪 Testing /api/get-alerts endpoint")
    print("=" * 70)
    
    # Test with first 3 athletes that have alerts
    test_athletes_alerts = athlete_ids_with_alerts[:3]
    
    for athlete_id in test_athletes_alerts:
        result = get_athlete_alerts_from_mcp(athlete_id, limit=10)
        if result.get("success"):
            alerts_count = result.get("count", 0)
            print(f"   ✅ Success: {alerts_count} alerts returned for {athlete_id}")
            if alerts_count > 0:
                # Show first alert summary
                alerts = result.get("alerts", [])
                if alerts:
                    first_alert = alerts[0]
                    alert_type = first_alert.get("alert_type", "unknown")
                    session_id = first_alert.get("session_id", "unknown")
                    print(f"      First alert: type={alert_type}, session_id={session_id}")
        else:
            print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
    
    # Step 3: Test insights endpoint with athletes that have insights
    print("\n" + "=" * 70)
    print("🧪 Testing /api/get-insights endpoint")
    print("=" * 70)
    
    # Test with first 3 athletes that have insights
    test_athletes_insights = athlete_ids_with_insights[:3]
    
    for athlete_id in test_athletes_insights:
        result = get_athlete_insights_from_mcp(athlete_id, limit=10)
        if result.get("success"):
            insights_count = result.get("count", 0)
            print(f"   ✅ Success: {insights_count} insights returned for {athlete_id}")
            if insights_count > 0:
                # Show first insight summary
                insights = result.get("insights", [])
                if insights:
                    first_insight = insights[0]
                    session_id = first_insight.get("session_id", "unknown")
                    activity = first_insight.get("activity", "unknown")
                    print(f"      First insight: session_id={session_id}, activity={activity}")
        else:
            print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
    
    # Step 4: Check if MCP service is running
    print("\n" + "=" * 70)
    print("🔍 Checking MCP Service Health")
    print("=" * 70)
    try:
        health_response = requests.get(f"{MCP_SERVICE_URL}/api/health", timeout=5)
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"✅ MCP Service is running")
            print(f"   Status: {health_data.get('status')}")
            print(f"   Agent status: {health_data.get('agent_status')}")
        else:
            print(f"⚠️  MCP Service returned status {health_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ MCP Service is not responding: {e}")
        print(f"   Make sure the service is running on {MCP_SERVICE_URL}")
    
    # Step 5: Generate curl commands for manual testing
    print("\n" + "=" * 70)
    print("📝 Generated curl commands for manual testing")
    print("=" * 70)
    
    print("\n# ============================================================")
    print("# GET ALERTS - Athletes with alerts:")
    print("# ============================================================")
    
    for athlete_id in athlete_ids_with_alerts[:5]:  # First 5
        print(f"\n# Get alerts for {athlete_id}:")
        print(f"curl -X POST {MCP_SERVICE_URL}/api/get-alerts \\")
        print(f"  -H 'Content-Type: application/json' \\")
        print(f"  -d '{{\"athlete_id\": \"{athlete_id}\", \"limit\": 10, \"include_stream_urls\": true, \"include_insights\": true, \"include_metrics\": true}}' \\")
        print(f"  | python3 -m json.tool")
    
    print("\n# ============================================================")
    print("# GET INSIGHTS - Athletes with insights:")
    print("# ============================================================")
    
    for athlete_id in athlete_ids_with_insights[:5]:  # First 5
        print(f"\n# Get insights for {athlete_id}:")
        print(f"curl -X POST {MCP_SERVICE_URL}/api/get-insights \\")
        print(f"  -H 'Content-Type: application/json' \\")
        print(f"  -d '{{\"athlete_id\": \"{athlete_id}\", \"limit\": 10}}' \\")
        print(f"  | python3 -m json.tool")
    
    print("\n# ============================================================")
    print("# GET INSIGHTS with filters:")
    print("# ============================================================")
    
    if athlete_ids_with_insights:
        athlete_id = athlete_ids_with_insights[0]
        print(f"\n# Get insights for {athlete_id} filtered by activity:")
        print(f"curl -X POST {MCP_SERVICE_URL}/api/get-insights \\")
        print(f"  -H 'Content-Type: application/json' \\")
        print(f"  -d '{{\"athlete_id\": \"{athlete_id}\", \"limit\": 10, \"activity\": \"gymnastics\"}}' \\")
        print(f"  | python3 -m json.tool")
    
    print("\n" + "=" * 70)
    print("✅ Script complete! Use the curl commands above to test manually.")
    print("=" * 70)
    print(f"\nFound {len(athlete_ids_with_alerts)} athletes with alerts")
    print(f"Found {len(athlete_ids_with_insights)} athletes with insights")
    print(f"Found {len(set(athlete_ids_with_alerts) & set(athlete_ids_with_insights))} athletes with both")

if __name__ == "__main__":
    main()

