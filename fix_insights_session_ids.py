#!/usr/bin/env python3
"""
Fix insights to be tagged with existing session_ids for testing.
This ensures get_athlete_alerts can properly link insights to sessions.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from bson import ObjectId

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
sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentNew"))
sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentBaseline" / "agentic_mcp"))

try:
    from videoAgent.mongodb_service import MongoDBService
except ImportError:
    # Try alternative path
    sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentNew" / "videoAgent"))
    from mongodb_service import MongoDBService

def fix_insights_session_ids():
    """Tag insights with existing session_ids from sessions collection."""
    print("=" * 80)
    print("🔧 FIXING INSIGHTS SESSION_IDS")
    print("=" * 80)
    
    mongodb = MongoDBService()
    if not mongodb.connect():
        print("❌ Failed to connect to MongoDB")
        return 1
    
    try:
        sessions_collection = mongodb.get_sessions_collection()
        insights_collection = mongodb.get_insights_collection()
        alerts_collection = mongodb.database.get_collection("alerts")
        
        # Step 1: Get all sessions with their IDs
        print("\n📋 Step 1: Getting all sessions...")
        all_sessions = list(sessions_collection.find({}).limit(100))
        print(f"   Found {len(all_sessions)} sessions")
        
        if not all_sessions:
            print("   ⚠️  No sessions found. Cannot fix insights.")
            return 1
        
        # Create mapping: athlete_id -> list of session_ids
        athlete_sessions = {}
        for session in all_sessions:
            athlete_id = session.get("athlete_id")
            if athlete_id:
                if athlete_id not in athlete_sessions:
                    athlete_sessions[athlete_id] = []
                athlete_sessions[athlete_id].append({
                    "_id": str(session.get("_id")),
                    "session_id": session.get("session_id"),
                    "athlete_name": session.get("athlete_name")
                })
        
        print(f"   Found sessions for {len(athlete_sessions)} athletes")
        
        # Step 2: Get all insights
        print("\n📋 Step 2: Getting all insights...")
        all_insights = list(insights_collection.find({}))
        print(f"   Found {len(all_insights)} insights")
        
        if not all_insights:
            print("   ⚠️  No insights found.")
            return 0
        
        # Step 3: Fix insights to use existing session_ids
        print("\n📋 Step 3: Fixing insights session_ids...")
        updated_count = 0
        skipped_count = 0
        no_athlete_count = 0
        
        # Create a map of all session_ids (both _id and session_id) for quick lookup
        all_session_ids = set()
        session_id_map = {}  # Maps any session identifier to the session
        for session in all_sessions:
            session_obj_id = str(session.get("_id"))
            session_id_str = session.get("session_id")
            all_session_ids.add(session_obj_id)
            if session_id_str:
                all_session_ids.add(session_id_str)
            session_id_map[session_obj_id] = session
            if session_id_str:
                session_id_map[session_id_str] = session
        
        for insight in all_insights:
            athlete_id = insight.get("athlete_id")
            current_session_id = insight.get("session_id")
            insight_id = str(insight.get("_id"))
            
            # Check if current session_id exists in any session
            session_exists = False
            if current_session_id:
                session_exists = str(current_session_id) in all_session_ids
            
            # If no athlete_id, try to infer from session
            if not athlete_id and current_session_id:
                matching_session = session_id_map.get(str(current_session_id))
                if matching_session:
                    athlete_id = matching_session.get("athlete_id")
            
            # If still no athlete_id, skip
            if not athlete_id:
                no_athlete_count += 1
                continue
            
            # Check if athlete has sessions
            if athlete_id in athlete_sessions:
                sessions_for_athlete = athlete_sessions[athlete_id]
                
                # If session doesn't exist or doesn't match, update it
                if not session_exists or not any(
                    str(sess["_id"]) == str(current_session_id) or sess.get("session_id") == current_session_id
                    for sess in sessions_for_athlete
                ):
                    # Use first available session for this athlete
                    target_session = sessions_for_athlete[0]
                    new_session_id = target_session.get("session_id") or target_session.get("_id")
                    
                    # Also ensure athlete_id is set
                    update_data = {
                        "session_id": new_session_id,
                        "athlete_id": athlete_id
                    }
                    
                    # Update insight
                    result = insights_collection.update_one(
                        {"_id": insight.get("_id")},
                        {"$set": update_data}
                    )
                    
                    if result.modified_count > 0:
                        updated_count += 1
                        print(f"   ✅ Updated insight {insight_id[:8]}... for athlete {athlete_id}")
                        print(f"      Old session_id: {current_session_id}")
                        print(f"      New session_id: {new_session_id}")
                else:
                    # Ensure athlete_id is set even if session_id is correct
                    if not insight.get("athlete_id"):
                        insights_collection.update_one(
                            {"_id": insight.get("_id")},
                            {"$set": {"athlete_id": athlete_id}}
                        )
                    skipped_count += 1
            else:
                skipped_count += 1
        
        print(f"\n   ℹ️  Insights without athlete_id: {no_athlete_count}")
        
        print(f"\n✅ Updated {updated_count} insights")
        print(f"   Skipped {skipped_count} insights (already correct or no matching athlete)")
        
        # Step 4: Also fix alerts to point to existing sessions
        print("\n📋 Step 4: Fixing alerts session_ids...")
        all_alerts = list(alerts_collection.find({}).limit(100))
        alert_updated_count = 0
        
        for alert in all_alerts:
            athlete_id = alert.get("athlete_id")
            current_session_id = alert.get("session_id")
            
            if athlete_id and athlete_id in athlete_sessions:
                sessions_for_athlete = athlete_sessions[athlete_id]
                
                # Check if current session_id exists
                session_exists = False
                for sess in sessions_for_athlete:
                    if str(sess["_id"]) == str(current_session_id) or sess["session_id"] == current_session_id:
                        session_exists = True
                        break
                
                if not session_exists and sessions_for_athlete:
                    # Use first available session
                    target_session = sessions_for_athlete[0]
                    new_session_id = target_session.get("session_id") or target_session.get("_id")
                    
                    # Update alert
                    result = alerts_collection.update_one(
                        {"_id": alert.get("_id")},
                        {
                            "$set": {
                                "session_id": new_session_id,
                                "sessions_affected": [new_session_id],
                                "updated_at": mongodb.database.client.server_info()["localTime"]
                            }
                        }
                    )
                    
                    if result.modified_count > 0:
                        alert_updated_count += 1
                        print(f"   ✅ Updated alert {alert.get('alert_id')} for athlete {athlete_id}")
        
        print(f"\n✅ Updated {alert_updated_count} alerts")
        
        # Step 5: Verify the fixes
        print("\n📋 Step 5: Verifying fixes...")
        verification_passed = 0
        verification_failed = 0
        
        for insight in insights_collection.find({}):
            athlete_id = insight.get("athlete_id")
            session_id = insight.get("session_id")
            
            if athlete_id and athlete_id in athlete_sessions:
                # Check if session_id exists in sessions
                session_found = False
                for sess in athlete_sessions[athlete_id]:
                    if str(sess["_id"]) == str(session_id) or sess["session_id"] == session_id:
                        session_found = True
                        break
                
                if session_found:
                    verification_passed += 1
                else:
                    verification_failed += 1
        
        print(f"   ✅ Verified: {verification_passed} insights have valid session_ids")
        if verification_failed > 0:
            print(f"   ⚠️  Failed: {verification_failed} insights still have invalid session_ids")
        
        print("\n" + "=" * 80)
        print("✅ FIXING COMPLETE!")
        print("=" * 80)
        print(f"\n📊 Summary:")
        print(f"   - Insights updated: {updated_count}")
        print(f"   - Alerts updated: {alert_updated_count}")
        print(f"   - Insights verified: {verification_passed}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        mongodb.close()

if __name__ == "__main__":
    sys.exit(fix_insights_session_ids())

