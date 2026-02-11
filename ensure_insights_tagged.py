#!/usr/bin/env python3
"""
Ensure all insights are tagged with existing session_ids for testing.
More aggressive approach - assigns insights to sessions even if they don't match.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from bson import ObjectId
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
sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentNew"))
sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentBaseline" / "agentic_mcp"))

try:
    from videoAgent.mongodb_service import MongoDBService
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent / "cvMLAgentNew" / "videoAgent"))
    from mongodb_service import MongoDBService

def ensure_insights_tagged():
    """Ensure all insights are tagged with existing session_ids."""
    print("=" * 80)
    print("🔧 ENSURING INSIGHTS ARE TAGGED WITH EXISTING SESSION_IDS")
    print("=" * 80)
    
    mongodb = MongoDBService()
    if not mongodb.connect():
        print("❌ Failed to connect to MongoDB")
        return 1
    
    try:
        sessions_collection = mongodb.get_sessions_collection()
        insights_collection = mongodb.get_insights_collection()
        
        # Step 1: Get all sessions grouped by athlete_id
        print("\n📋 Step 1: Getting all sessions...")
        all_sessions = list(sessions_collection.find({}))
        print(f"   Found {len(all_sessions)} sessions")
        
        # Group sessions by athlete_id
        athlete_sessions_map = {}
        for session in all_sessions:
            athlete_id = session.get("athlete_id")
            if athlete_id:
                if athlete_id not in athlete_sessions_map:
                    athlete_sessions_map[athlete_id] = []
                athlete_sessions_map[athlete_id].append({
                    "_id": str(session.get("_id")),
                    "session_id": session.get("session_id"),
                    "athlete_name": session.get("athlete_name")
                })
        
        print(f"   Found sessions for {len(athlete_sessions_map)} athletes")
        for athlete_id, sessions in list(athlete_sessions_map.items())[:3]:
            print(f"      - {athlete_id}: {len(sessions)} sessions")
        
        # Step 2: Get all insights
        print("\n📋 Step 2: Getting all insights...")
        all_insights = list(insights_collection.find({}))
        print(f"   Found {len(all_insights)} insights")
        
        # Step 3: Tag insights with session_ids
        print("\n📋 Step 3: Tagging insights with existing session_ids...")
        updated_count = 0
        athlete_id_added_count = 0
        session_id_updated_count = 0
        
        # Process all insights - be aggressive about tagging
        for insight in all_insights:
            insight_id = insight.get("_id")
            athlete_id = insight.get("athlete_id")
            current_session_id = insight.get("session_id")
            
            update_data = {}
            needs_update = False
            original_athlete_id = athlete_id
            
            # If no athlete_id, try to infer from insight data
            if not athlete_id:
                # Try to find athlete_id from athlete_name in insight
                athlete_name = insight.get("athlete_name")
                if athlete_name:
                    # Try to find matching athlete_id from sessions
                    for aid, sessions in athlete_sessions_map.items():
                        if any(s.get("athlete_name") == athlete_name for s in sessions):
                            athlete_id = aid
                            break
                
                # If still no athlete_id, try to match by session_id
                if not athlete_id and current_session_id:
                    for aid, sessions in athlete_sessions_map.items():
                        for sess in sessions:
                            if (str(sess["_id"]) == str(current_session_id) or 
                                sess.get("session_id") == current_session_id):
                                athlete_id = aid
                                break
                        if athlete_id:
                            break
                
                # If still no athlete_id, distribute insights across athletes
                if not athlete_id and athlete_sessions_map:
                    # Use a simple hash of insight_id to distribute evenly
                    insight_idx = hash(str(insight_id)) % len(athlete_sessions_map)
                    athlete_id = list(athlete_sessions_map.keys())[insight_idx]
                
                if athlete_id:
                    update_data["athlete_id"] = athlete_id
                    needs_update = True
                    athlete_id_added_count += 1
            
            # If athlete_id exists, ensure session_id is valid
            if athlete_id and athlete_id in athlete_sessions_map:
                sessions_for_athlete = athlete_sessions_map[athlete_id]
                
                # Check if current session_id is valid
                session_valid = False
                if current_session_id:
                    for sess in sessions_for_athlete:
                        if (str(sess["_id"]) == str(current_session_id) or 
                            sess.get("session_id") == current_session_id):
                            session_valid = True
                            break
                
                # If session_id is invalid or missing, assign a valid one
                if not session_valid and sessions_for_athlete:
                    # Use the most recent session (first in list, or could sort by timestamp)
                    target_session = sessions_for_athlete[0]
                    new_session_id = target_session.get("session_id") or target_session.get("_id")
                    update_data["session_id"] = new_session_id
                    needs_update = True
                    session_id_updated_count += 1
                    print(f"   ✅ Tagging insight {str(insight_id)[:8]}...")
                    print(f"      Athlete: {athlete_id}")
                    print(f"      Session: {new_session_id}")
            
            # Also check if insight needs athlete_id or session_id even if they exist
            # (they might exist but be invalid)
            if athlete_id and athlete_id not in athlete_sessions_map:
                # athlete_id exists but doesn't match any sessions - reassign
                if athlete_sessions_map:
                    new_athlete_id = list(athlete_sessions_map.keys())[0]
                    update_data["athlete_id"] = new_athlete_id
                    athlete_id = new_athlete_id
                    needs_update = True
                    athlete_id_added_count += 1
            
            # If we have athlete_id now, ensure session_id is set
            if athlete_id and athlete_id in athlete_sessions_map:
                sessions_for_athlete = athlete_sessions_map[athlete_id]
                
                # Check if current session_id is valid
                session_valid = False
                if current_session_id:
                    for sess in sessions_for_athlete:
                        if (str(sess["_id"]) == str(current_session_id) or 
                            sess.get("session_id") == current_session_id):
                            session_valid = True
                            break
                
                # If session_id is invalid or missing, assign a valid one
                if not session_valid and sessions_for_athlete:
                    target_session = sessions_for_athlete[0]
                    new_session_id = target_session.get("session_id") or target_session.get("_id")
                    update_data["session_id"] = new_session_id
                    needs_update = True
                    if current_session_id:
                        session_id_updated_count += 1
                    else:
                        athlete_id_added_count += 1  # Count as adding both
            
            # Update if needed
            if needs_update:
                result = insights_collection.update_one(
                    {"_id": insight_id},
                    {"$set": update_data}
                )
                if result.modified_count > 0:
                    updated_count += 1
                    if original_athlete_id != athlete_id:
                        print(f"   ✅ Tagged insight {str(insight_id)[:8]}...")
                        print(f"      Athlete: {athlete_id} (was: {original_athlete_id or 'none'})")
                        print(f"      Session: {update_data.get('session_id', current_session_id)}")
        
        print(f"\n✅ Updated {updated_count} insights")
        print(f"   - Added athlete_id to {athlete_id_added_count} insights")
        print(f"   - Updated session_id for {session_id_updated_count} insights")
        
        # Step 4: Verify all insights are properly tagged
        print("\n📋 Step 4: Verifying all insights are tagged...")
        verified_count = 0
        unverified_count = 0
        
        for insight in insights_collection.find({}):
            athlete_id = insight.get("athlete_id")
            session_id = insight.get("session_id")
            
            if athlete_id and session_id:
                # Check if session exists for this athlete
                if athlete_id in athlete_sessions_map:
                    sessions = athlete_sessions_map[athlete_id]
                    session_found = any(
                        str(s["_id"]) == str(session_id) or s.get("session_id") == session_id
                        for s in sessions
                    )
                    if session_found:
                        verified_count += 1
                    else:
                        unverified_count += 1
                else:
                    unverified_count += 1
            else:
                unverified_count += 1
        
        print(f"   ✅ Verified: {verified_count} insights properly tagged")
        if unverified_count > 0:
            print(f"   ⚠️  Unverified: {unverified_count} insights still need tagging")
        
        # Step 5: Show sample of tagged insights
        print("\n📋 Step 5: Sample of tagged insights...")
        sample_insights = list(insights_collection.find({
            "athlete_id": {"$exists": True, "$ne": None},
            "session_id": {"$exists": True, "$ne": None}
        }).limit(5))
        
        for insight in sample_insights:
            print(f"   ✅ Insight {str(insight.get('_id'))[:8]}...")
            print(f"      Athlete: {insight.get('athlete_id')}")
            print(f"      Session: {insight.get('session_id')}")
            print(f"      Insights count: {insight.get('insight_count', 0)}")
        
        print("\n" + "=" * 80)
        print("✅ TAGGING COMPLETE!")
        print("=" * 80)
        print(f"\n📊 Final Summary:")
        print(f"   - Total insights: {len(all_insights)}")
        print(f"   - Insights updated: {updated_count}")
        print(f"   - Insights verified: {verified_count}")
        print(f"   - Insights unverified: {unverified_count}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        mongodb.close()

if __name__ == "__main__":
    sys.exit(ensure_insights_tagged())

