#!/usr/bin/env python3
"""
Extract and display tool calls from agent-query response
"""
import sys
import json
import re

if len(sys.argv) > 1:
    with open(sys.argv[1], 'r') as f:
        data = json.load(f)
else:
    data = json.load(sys.stdin)

print("=" * 70)
print("AGENT QUERY RESPONSE - TOOL CALL TRACKING")
print("=" * 70)
print(f"Success: {data.get('success')}")
print()

# Check for tool_calls in response
if 'tool_calls' in data and isinstance(data['tool_calls'], dict):
    print("📊 TOOL CALLS FROM RESPONSE:")
    print("-" * 70)
    tool_calls = data['tool_calls']
    
    if 'run_pipeline' in tool_calls:
        rp = tool_calls['run_pipeline']
        status = "✅ YES" if rp.get('called') else "❌ NO"
        print(f"run_pipeline called: {status}")
        if rp.get('called'):
            print(f"  Timestamp: {rp.get('timestamp')}")
            print(f"  Args: {rp.get('args')}")
    else:
        print("❌ run_pipeline: NOT TRACKED")
    
    if 'listen_to_retrieval_queue' in tool_calls:
        lrq = tool_calls['listen_to_retrieval_queue']
        status = "✅ YES" if lrq.get('called') else "❌ NO"
        print(f"listen_to_retrieval_queue called: {status}")
        if lrq.get('called'):
            print(f"  Timestamp: {lrq.get('timestamp')}")
            print(f"  Args: {lrq.get('args')}")
    else:
        print("❌ listen_to_retrieval_queue: NOT TRACKED")
    
    if 'all_tools' in tool_calls:
        print(f"\nTotal tools called: {len(tool_calls['all_tools'])}")
        for tool in tool_calls['all_tools']:
            print(f"  - {tool.get('name')} at {tool.get('timestamp')}")
else:
    print("⚠️  tool_calls field not found in response or not a dict")
    if 'tool_calls' in data:
        print(f"   tool_calls type: {type(data['tool_calls'])}")
        print(f"   tool_calls value: {data['tool_calls']}")

print()
print("=" * 70)
print("TOOL CALLS EXTRACTED FROM MESSAGES:")
print("=" * 70)

# Extract tool calls from messages
tools_found = []
for i, msg_str in enumerate(data.get('messages', [])):
    if 'tool_calls=[' in str(msg_str):
        # Extract tool name and args using regex
        matches = re.findall(r"'name': '([^']+)'", str(msg_str))
        for match in matches:
            tools_found.append({'name': match})
        
        # Try to extract args too
        args_matches = re.findall(r"'args': ({[^}]+})", str(msg_str))
        if args_matches:
            for idx, args_match in enumerate(args_matches):
                if idx < len(tools_found):
                    tools_found[idx]['args'] = args_match

if tools_found:
    for i, tool in enumerate(tools_found, 1):
        print(f"✅ Tool {i}: {tool.get('name')}")
        if 'args' in tool:
            args_display = tool['args'][:100] + "..." if len(tool['args']) > 100 else tool['args']
            print(f"   Args: {args_display}")
else:
    print("❌ No tool calls found in messages")

print("=" * 70)
print("SUMMARY:")
print("=" * 70)
print(f"Total tools detected: {len(tools_found)}")
print(f"run_pipeline called: {'✅ YES' if any(t.get('name') == 'run_pipeline' for t in tools_found) else '❌ NO'}")
print(f"listen_to_retrieval_queue called: {'✅ YES' if any(t.get('name') == 'listen_to_retrieval_queue' for t in tools_found) else '❌ NO'}")
print("=" * 70)

# Show output preview
output = data.get('output', '')
if output:
    print("\n📝 OUTPUT PREVIEW:")
    print("-" * 70)
    print(output[:300] + "..." if len(output) > 300 else output)
    print("=" * 70)


