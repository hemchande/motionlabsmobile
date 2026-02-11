#!/usr/bin/env python3
"""
Focused Test: listen_to_retrieval_queue

Tests the listen_to_retrieval_queue functionality:
1. Verifies Redis connection
2. Sends a test message to retrievalQueue
3. Calls listen_to_retrieval_queue via MCP service
4. Verifies alerts are sent to drift_alerts_queue
"""

import asyncio
import json
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional
import httpx
import redis

# Colors for output
GREEN = '\033[32m'
RED = '\033[31m'
YELLOW = '\033[33m'
BLUE = '\033[34m'
CYAN = '\033[36m'
RESET = '\033[0m'

# MCP Service URL
MCP_SERVICE_URL = "http://localhost:8004"

# Redis connection
REDIS_HOST = "localhost"
REDIS_PORT = 6379


def get_redis_client():
    """Get Redis client connection"""
    try:
        return redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=0,
            decode_responses=True
        )
    except Exception as e:
        print(f"{RED}❌ Failed to connect to Redis: {e}{RESET}")
        return None


def check_redis():
    """Check Redis connection and queue status"""
    print(f"\n{BLUE}=== Checking Redis ==={RESET}")
    redis_client = get_redis_client()
    if not redis_client:
        return None
    
    try:
        redis_client.ping()
        print(f"{GREEN}✅ Redis connection successful{RESET}")
        
        # Check queue lengths
        retrieval_queue_len = redis_client.llen("retrievalQueue")
        alerts_queue_len = redis_client.llen("drift_alerts_queue")
        
        print(f"   retrievalQueue length: {retrieval_queue_len}")
        print(f"   drift_alerts_queue length: {alerts_queue_len}")
        
        return redis_client
    except Exception as e:
        print(f"{RED}❌ Redis check failed: {e}{RESET}")
        return None


def send_test_message_to_queue(redis_client, session_id: str, athlete_id: str = "test_athlete_123"):
    """Send a test message to retrievalQueue"""
    print(f"\n{BLUE}=== Sending Test Message to retrievalQueue ==={RESET}")
    
    if not redis_client:
        print(f"{RED}❌ Redis client not available{RESET}")
        return False
    
    message = {
        "event_type": "video_call_ended",
        "session_id": session_id,
        "athlete_id": athlete_id,
        "activity": "gymnastics",
        "athlete_name": "Test Athlete",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "status": "completed"
    }
    
    try:
        message_json = json.dumps(message)
        redis_client.rpush("retrievalQueue", message_json)
        
        queue_length = redis_client.llen("retrievalQueue")
        print(f"{GREEN}✅ Test message sent to retrievalQueue{RESET}")
        print(f"   Session ID: {session_id}")
        print(f"   Athlete ID: {athlete_id}")
        print(f"   Queue length: {queue_length}")
        print(f"   Message: {json.dumps(message, indent=2)}")
        return True
    except Exception as e:
        print(f"{RED}❌ Failed to send message: {e}{RESET}")
        return False


async def call_listen_to_retrieval_queue(max_messages: int = 1):
    """Call listen_to_retrieval_queue via MCP service"""
    print(f"\n{BLUE}=== Calling listen_to_retrieval_queue via MCP Service ==={RESET}")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:  # 2 minute timeout for processing
            print(f"   Calling: {MCP_SERVICE_URL}/api/test-tool")
            print(f"   Tool: listen_to_retrieval_queue")
            print(f"   Max messages: {max_messages}")
            
            response = await client.post(
                f"{MCP_SERVICE_URL}/api/test-tool",
                json={
                    "tool_name": "listen_to_retrieval_queue",
                    "server_name": "pipeline_processor",
                    "args": {
                        "max_messages": max_messages
                    }
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print(f"{GREEN}✅ MCP service call successful{RESET}")
                    result = data.get("result", {})
                    
                    # Parse result if it's a string
                    if isinstance(result, str):
                        try:
                            result = json.loads(result)
                        except:
                            pass
                    elif isinstance(result, list) and result:
                        # Handle LangChain streaming response
                        if isinstance(result[0], dict) and "text" in result[0]:
                            try:
                                result = json.loads(result[0]["text"])
                            except:
                                result = result[0].get("text", result)
                    
                    print(f"   Response: {json.dumps(result, indent=2)[:500]}...")
                    return True, result
                else:
                    error = data.get("error", "Unknown error")
                    print(f"{RED}❌ MCP service call failed: {error}{RESET}")
                    return False, None
            else:
                error_text = response.text
                print(f"{RED}❌ HTTP error {response.status_code}: {error_text}{RESET}")
                return False, None
    except Exception as e:
        print(f"{RED}❌ Exception calling MCP service: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return False, None


def check_alerts_queue(redis_client, timeout: int = 30):
    """Check if alerts were sent to drift_alerts_queue"""
    print(f"\n{BLUE}=== Checking drift_alerts_queue for Alerts ==={RESET}")
    
    if not redis_client:
        print(f"{RED}❌ Redis client not available{RESET}")
        return False
    
    initial_len = redis_client.llen("drift_alerts_queue")
    print(f"   Initial queue length: {initial_len}")
    print(f"   Waiting up to {timeout} seconds for alerts...")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        current_len = redis_client.llen("drift_alerts_queue")
        
        if current_len > initial_len:
            # New alerts arrived
            print(f"{GREEN}✅ New alerts found in drift_alerts_queue!{RESET}")
            print(f"   Queue length: {current_len} (was {initial_len})")
            
            # Get all new messages
            for i in range(initial_len, current_len):
                message_json = redis_client.lindex("drift_alerts_queue", i)
                if message_json:
                    try:
                        message = json.loads(message_json)
                        print(f"\n   Alert #{i - initial_len + 1}:")
                        print(f"   {json.dumps(message, indent=2)}")
                    except json.JSONDecodeError as e:
                        print(f"   ⚠️  Failed to parse alert JSON: {e}")
                        print(f"   Raw: {message_json[:200]}...")
            
            return True
        
        time.sleep(1)
    
    print(f"{YELLOW}⚠️  No new alerts found after {timeout} seconds{RESET}")
    print(f"   Final queue length: {redis_client.llen('drift_alerts_queue')}")
    return False


async def main():
    """Run the test"""
    print(f"{CYAN}{'='*70}{RESET}")
    print(f"{CYAN}Test: listen_to_retrieval_queue{RESET}")
    print(f"{CYAN}{'='*70}{RESET}")
    
    # Step 1: Check Redis
    redis_client = check_redis()
    if not redis_client:
        print(f"{RED}❌ Cannot proceed without Redis{RESET}")
        return
    
    # Step 2: Send test message to retrievalQueue
    session_id = f"test_listen_queue_{int(time.time())}"
    if not send_test_message_to_queue(redis_client, session_id):
        print(f"{RED}❌ Failed to send test message{RESET}")
        return
    
    # Wait a moment for message to be in queue
    await asyncio.sleep(1)
    
    # Step 3: Call listen_to_retrieval_queue
    success, result = await call_listen_to_retrieval_queue(max_messages=1)
    
    if not success:
        print(f"\n{RED}❌ listen_to_retrieval_queue failed{RESET}")
        print(f"   Check if testMCP is available in pipeline_mcp_server")
        return
    
    # Step 4: Check for alerts in drift_alerts_queue
    # Wait a bit for processing to complete
    print(f"\n{YELLOW}⏳ Waiting for pipeline processing to complete...{RESET}")
    await asyncio.sleep(5)
    
    alerts_found = check_alerts_queue(redis_client, timeout=30)
    
    # Final summary
    print(f"\n{CYAN}{'='*70}{RESET}")
    print(f"{CYAN}Test Summary{RESET}")
    print(f"{CYAN}{'='*70}{RESET}")
    print(f"  listen_to_retrieval_queue call: {GREEN}✅ PASS{RESET}" if success else f"  listen_to_retrieval_queue call: {RED}❌ FAIL{RESET}")
    print(f"  Alerts in drift_alerts_queue: {GREEN}✅ YES{RESET}" if alerts_found else f"  Alerts in drift_alerts_queue: {YELLOW}⚠️  NO{RESET}")
    
    # Final queue status
    print(f"\n{BLUE}Final Queue Status:{RESET}")
    retrieval_len = redis_client.llen("retrievalQueue")
    alerts_len = redis_client.llen("drift_alerts_queue")
    print(f"   retrievalQueue: {retrieval_len} messages")
    print(f"   drift_alerts_queue: {alerts_len} messages")


if __name__ == "__main__":
    asyncio.run(main())

