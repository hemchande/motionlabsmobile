#!/usr/bin/env python3
"""
Agent Service - Python Implementation
Manages Python ML agent lifecycle for live video sessions.

Uses the cvMLAgentNew/.venv virtual environment.
"""

import os
import sys
import json
import asyncio
import subprocess
import signal
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import httpx
    import base64
    import hashlib
    import hmac
    FASTAPI_AVAILABLE = True
except ImportError:
    print("❌ Required packages not installed. Installing...")
    print("   Run: pip install fastapi uvicorn httpx pydantic pyjwt")
    FASTAPI_AVAILABLE = False
    sys.exit(1)

# Load environment variables
from dotenv import load_dotenv

# Load from current directory and parent directory
load_dotenv()
parent_env_path = Path(__file__).parent.parent / '.env'
if parent_env_path.exists():
    load_dotenv(parent_env_path)
    print('✅ Loaded environment variables from parent .env')
else:
    print('ℹ️  Parent .env not found')

# Initialize FastAPI app
app = FastAPI(title="Agent Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store running processes: {call_id: subprocess.Process}
running_processes: Dict[str, subprocess.Popen] = {}

# Stream.io configuration
STREAM_API_KEY = os.getenv('STREAM_API_KEY') or os.getenv('VITE_STREAM_API_KEY') or 'htspepyqm3aw'
STREAM_SECRET = (
    os.getenv('STREAM_SECRET') 
    or os.getenv('VITE_STREAM_API_SECRET') 
    or os.getenv('STREAM_API_SECRET')
    or os.getenv('VITE_STREAM_SECRET')
)

if STREAM_SECRET:
    print('✅ Stream.io secret configured')
else:
    print('⚠️  STREAM_SECRET not found in environment variables')
    print('   Please set one of: STREAM_SECRET, VITE_STREAM_API_SECRET, STREAM_API_SECRET')

# Paths
AGENT_SERVICE_DIR = Path(__file__).parent
PROJECT_ROOT = AGENT_SERVICE_DIR.parent
CVML_AGENT_DIR = PROJECT_ROOT / 'cvMLAgentNew'
VENV_PYTHON = CVML_AGENT_DIR / '.venv' / 'bin' / 'python3'
MAIN_SCRIPT = CVML_AGENT_DIR / 'main.py'

# Check if virtual environment exists
if not VENV_PYTHON.exists():
    # Try alternative locations
    if (CVML_AGENT_DIR / 'venv' / 'bin' / 'python3').exists():
        VENV_PYTHON = CVML_AGENT_DIR / 'venv' / 'bin' / 'python3'
    else:
        print(f'⚠️  Virtual environment not found at {VENV_PYTHON}')
        print('   Will use system python3')
        VENV_PYTHON = 'python3'

print(f'✅ Using Python: {VENV_PYTHON}')
print(f'✅ Agent directory: {CVML_AGENT_DIR}')


def generate_stream_token(user_id: str = 'cv_ml_agent') -> Optional[str]:
    """Generate Stream.io JWT token for server-side API calls."""
    if not STREAM_SECRET:
        print('⚠️ STREAM_SECRET not set, cannot generate token')
        return None

    # Stream.io JWT token format
    header = {
        'alg': 'HS256',
        'typ': 'JWT'
    }

    now = int(time.time())
    payload = {
        'user_id': user_id,
        'exp': now + 3600,  # 1 hour expiration
        'iat': now
    }

    # Base64 URL encode header and payload
    def base64url_encode(data: dict) -> str:
        json_str = json.dumps(data, separators=(',', ':'))
        base64_str = base64.b64encode(json_str.encode()).decode()
        return base64_str.replace('+', '-').replace('/', '_').replace('=', '')

    encoded_header = base64url_encode(header)
    encoded_payload = base64url_encode(payload)
    signature_input = f'{encoded_header}.{encoded_payload}'

    # Create HMAC signature
    signature = hmac.new(
        STREAM_SECRET.encode(),
        signature_input.encode(),
        hashlib.sha256
    ).digest()
    
    signature_b64 = base64.b64encode(signature).decode()
    encoded_signature = signature_b64.replace('+', '-').replace('/', '_').replace('=', '')

    token = f'{signature_input}.{encoded_signature}'
    return token


def generate_demo_join_url(call_id: str, user_id: str = 'user-demo-agent') -> Optional[str]:
    """Generate Stream.io demo join URL (same format as Python agent)."""
    token = generate_stream_token(user_id)
    if not token:
        return None

    params = {
        'api_key': STREAM_API_KEY,
        'token': token,
        'skip_lobby': 'true',
        'user_name': 'Human User',
        'video_encoder': 'h264',
        'bitrate': '12000000',
        'w': '1920',
        'h': '1080',
        'channel_type': 'messaging'
    }

    param_str = '&'.join(f'{k}={v}' for k, v in params.items())
    return f'https://getstream.io/video/demos/join/{call_id}?{param_str}'


async def get_stream_whip_url(call_id: str, max_retries: int = 5, retry_delay: float = 2.0) -> Dict[str, Any]:
    """Get Stream.io call metadata and extract WHIP URL using REST API."""
    try:
        token = generate_stream_token('cv_ml_agent')
        if not token:
            raise ValueError('Cannot generate Stream.io token - STREAM_SECRET not set')

        api_url = f'https://video.stream-io-api.com/api/v2/video/call/default/{call_id}?api_key={STREAM_API_KEY}'

        call_data = None
        for attempt in range(1, max_retries + 1):
            try:
                print(f'📞 Fetching call metadata (attempt {attempt}/{max_retries})...')
                
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        api_url,
                        headers={
                            'Authorization': f'Bearer {token}',
                            'Content-Type': 'application/json',
                            'Stream-Auth-Type': 'jwt'
                        },
                        timeout=10.0
                    )

                if response.status_code == 404:
                    print(f'⏳ Call not found yet (attempt {attempt}/{max_retries}), waiting...')
                    if attempt < max_retries:
                        await asyncio.sleep(retry_delay)
                        continue
                    else:
                        raise ValueError('Call not found after multiple attempts')
                elif not response.is_success:
                    error_text = response.text
                    raise ValueError(f'API error: {response.status_code} - {error_text}')

                result = response.json()
                call_data = result.get('call') or result

                if call_data and (call_data.get('ingress') or call_data.get('id')):
                    print('✅ Call found, extracting metadata...')
                    break
                else:
                    print(f'⏳ Call metadata incomplete (attempt {attempt}/{max_retries}), waiting...')
                    if attempt < max_retries:
                        await asyncio.sleep(retry_delay)

            except httpx.RequestError as fetch_error:
                print(f'⚠️  Attempt {attempt} failed: {fetch_error}')
                if attempt < max_retries:
                    await asyncio.sleep(retry_delay)
                else:
                    raise

        if not call_data:
            raise ValueError('Call not found after multiple attempts. Agent may not have created the call yet.')

        # Extract WHIP URL from call metadata
        whip_url = None
        rtmp_url = None
        srt_url = None
        session_id = None

        ingress = call_data.get('ingress', {})
        if ingress.get('whip', {}).get('address'):
            whip_url = ingress['whip']['address']
            # Extract session ID from WHIP URL
            import re
            match = re.search(r'whip/([^?]+)', whip_url)
            if match:
                session_id = match.group(1)

        if ingress.get('rtmp', {}).get('address'):
            rtmp_url = ingress['rtmp']['address']

        if ingress.get('srt', {}).get('address'):
            srt_url = ingress['srt']['address']

        # Log call attributes for debugging
        print('📞 Call metadata extracted:', {
            'type': call_data.get('type'),
            'id': call_data.get('id'),
            'cid': call_data.get('cid'),
            'current_session_id': call_data.get('current_session_id'),
            'created_by': call_data.get('created_by', {}).get('id') or call_data.get('created_by', {}).get('name'),
            'ingress_enabled': bool(call_data.get('ingress')),
            'whip_available': bool(whip_url),
            'rtmp_available': bool(rtmp_url),
            'srt_available': bool(srt_url),
        })

        final_call_id = call_data.get('id') or call_id
        demo_join_url = generate_demo_join_url(final_call_id)

        return {
            'whipUrl': whip_url,
            'rtmpUrl': rtmp_url,
            'srtUrl': srt_url,
            'callId': final_call_id,
            'cid': call_data.get('cid'),
            'sessionId': session_id,
            'apiKey': STREAM_API_KEY,
            'demoJoinUrl': demo_join_url,
            'callData': {
                'type': call_data.get('type'),
                'id': call_data.get('id'),
                'cid': call_data.get('cid'),
                'created_by': call_data.get('created_by'),
                'current_session_id': call_data.get('current_session_id'),
                'created_at': call_data.get('created_at'),
                'updated_at': call_data.get('updated_at'),
            }
        }

    except Exception as error:
        print(f'❌ Error fetching call metadata: {error}')

        # Fallback: construct URL with generated session ID
        session_id = str(uuid.uuid4())
        whip_url = f'https://video.stream-io-api.com/api/v2/video/call/default/{call_id}/whip/{session_id}?api_key={STREAM_API_KEY}&stream-auth-type=jwt'

        return {
            'whipUrl': whip_url,
            'callId': call_id,
            'sessionId': session_id,
            'apiKey': STREAM_API_KEY,
            'error': str(error),
            'fallback': True,
            'warning': 'Using fallback URL - call metadata not available. Agent may still be starting.'
        }


# Pydantic models for request/response
class StartAgentRequest(BaseModel):
    callId: Optional[str] = None


class StartAgentResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    callId: str
    pid: Optional[int] = None
    redirectUrl: Optional[str] = None
    frontendUrl: Optional[str] = None
    streamUrl: Optional[str] = None
    rtmpUrl: Optional[str] = None
    srtUrl: Optional[str] = None
    demoJoinUrl: Optional[str] = None
    streamApiKey: Optional[str] = None
    streamSessionId: Optional[str] = None
    cid: Optional[str] = None
    callData: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    warning: Optional[str] = None


class StopAgentRequest(BaseModel):
    callId: Optional[str] = None


class StopAgentResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


@app.get('/api/health')
async def health_check():
    """Health check endpoint."""
    return {
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat()
    }


@app.get('/api/agents')
async def get_agents():
    """Get list of running agents."""
    agents = []
    for call_id, process in running_processes.items():
        agents.append({
            'callId': call_id,
            'pid': process.pid,
            'killed': process.poll() is not None,
            'redirectUrl': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/?callId={call_id}"
        })
    return {'agents': agents}


@app.post('/api/start-agent', response_model=StartAgentResponse)
async def start_agent(request: StartAgentRequest):
    """Start the Python ML agent for a live session."""
    call_id = request.callId or os.getenv('STREAM_CALL_ID') or 'demo-call-xGvo-o50'

    # Check if agent is already running
    if call_id in running_processes:
        process = running_processes[call_id]
        if process.poll() is None:  # Process still running
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            redirect_url = f'{frontend_url}/?callId={call_id}'

            try:
                whip_info = await get_stream_whip_url(call_id)
                return StartAgentResponse(
                    success=True,
                    message='Agent is already running for this call',
                    callId=whip_info.get('callId') or call_id,
                    pid=process.pid,
                    redirectUrl=redirect_url,
                    frontendUrl=frontend_url,
                    streamUrl=whip_info.get('whipUrl'),
                    rtmpUrl=whip_info.get('rtmpUrl'),
                    srtUrl=whip_info.get('srtUrl'),
                    demoJoinUrl=whip_info.get('demoJoinUrl'),
                    streamApiKey=whip_info.get('apiKey'),
                    streamSessionId=whip_info.get('sessionId'),
                    cid=whip_info.get('cid'),
                    callData=whip_info.get('callData')
                )
            except Exception as error:
                return StartAgentResponse(
                    success=True,
                    message='Agent is already running for this call',
                    callId=call_id,
                    pid=process.pid,
                    redirectUrl=redirect_url,
                    frontendUrl=frontend_url,
                    error=str(error),
                    warning='Failed to get Stream.io WHIP URL'
                )

    try:
        # Create temporary script that calls run_pipeline()
        temp_script_content = f'''#!/usr/bin/env python3
import asyncio
import sys
import os
from pathlib import Path

# Add cvMLAgentNew to path
agent_path = Path(__file__).parent
sys.path.insert(0, str(agent_path))

# Import run_pipeline from main.py
try:
    from main import run_pipeline, VISION_AGENTS_AVAILABLE
    if not VISION_AGENTS_AVAILABLE:
        print("❌ vision-agents not available. Cannot run pipeline.", file=sys.stderr)
        print("   Install with: pip install vision-agents[getstream,openai,ultralytics,gemini]", file=sys.stderr)
        sys.exit(1)
    print(f"✅ Imported run_pipeline from main.py")
except ImportError as e:
    print(f"❌ Failed to import run_pipeline: {{e}}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)

async def main():
    call_id = "{call_id}"
    print(f"🚀 Starting pipeline for call_id: {{call_id}}")
    print(f"   This will JOIN the existing call (not create a new one)")
    try:
        # This will join the EXISTING call that the frontend created
        await run_pipeline(
            call_id=call_id,
            call_type="default",
            activity="gymnastics"
        )
        print(f"✅ Pipeline completed for call_id: {{call_id}}")
    except Exception as e:
        print(f"❌ Pipeline error: {{e}}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    try:
        # Run the pipeline - this will keep running until the call ends
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\n⚠️  Pipeline interrupted by user")
    except Exception as e:
        print(f"❌ Fatal error: {{e}}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
'''

        temp_script_path = CVML_AGENT_DIR / f'temp_run_pipeline_{call_id.replace("-", "_").replace(".", "_")}.py'
        temp_script_path.write_text(temp_script_content)
        temp_script_path.chmod(0o755)

        print(f'🚀 Starting Python agent for call ID: {call_id}')
        print(f'   Using run_pipeline() to join existing call')
        print(f'   Script: {temp_script_path}')

        # Set environment variables
        env = os.environ.copy()
        env['STREAM_CALL_ID'] = call_id
        env['PYTHONUNBUFFERED'] = '1'

        # Spawn Python process using virtual environment
        process = subprocess.Popen(
            [str(VENV_PYTHON), str(temp_script_path)],
            cwd=str(CVML_AGENT_DIR),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        # Store process
        running_processes[call_id] = process

        # Handle process exit in background
        def cleanup_on_exit():
            process.wait()
            if process.returncode == 0:
                print(f'✅ Python agent process completed (code: {process.returncode})')
            else:
                print(f'❌ Python agent process exited (code: {process.returncode})')
            running_processes.pop(call_id, None)
            # Clean up temporary script
            try:
                temp_script_path.unlink()
            except Exception:
                pass

        # Start cleanup task
        asyncio.create_task(asyncio.to_thread(cleanup_on_exit))

        # Return response immediately - don't wait for agent to fully start
        # The agent will start in the background
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        redirect_url = f'{frontend_url}/?callId={call_id}'

        # Return immediately with process info
        # Metadata extraction can happen asynchronously
        response_data = StartAgentResponse(
            success=True,
            message='Agent started successfully',
            callId=call_id,
            pid=process.pid,
            redirectUrl=redirect_url,
            frontendUrl=frontend_url,
            streamUrl=None,  # Will be available after agent joins
            rtmpUrl=None,
            srtUrl=None,
            demoJoinUrl=None,
            streamApiKey=STREAM_API_KEY,
            streamSessionId=None,
            warning='Agent is starting. Call metadata will be available once agent joins.'
        )

        # Start metadata extraction in background (non-blocking)
        async def extract_metadata_background():
            try:
                await asyncio.sleep(3)  # Give agent time to start
                
                # Check if process is still running
                if process.poll() is not None:
                    print(f'⚠️  Agent process exited with code {process.returncode}')
                    return
                
                print(f'⏳ Extracting call metadata for callId: {call_id}')
                whip_info = await get_stream_whip_url(call_id, max_retries=3, retry_delay=2.0)
                print(f'✅ Metadata extraction complete. WHIP URL available: {bool(whip_info.get("whipUrl"))}')
            except Exception as error:
                print(f'⚠️  Background metadata extraction failed: {error}')

        # Don't await - let it run in background
        asyncio.create_task(extract_metadata_background())

        return response_data

    except Exception as error:
        print(f'Error starting agent: {error}')
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))


@app.post('/api/stop-agent', response_model=StopAgentResponse)
async def stop_agent(request: StopAgentRequest):
    """Stop the Python ML agent."""
    call_id = request.callId or os.getenv('STREAM_CALL_ID') or 'demo-call-xGvo-o50'

    process = running_processes.get(call_id)
    if not process:
        return StopAgentResponse(
            success=False,
            message='No agent process found for this call'
        )

    try:
        # Terminate the process
        process.terminate()
        
        # Wait a bit for graceful shutdown
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            # Force kill if it doesn't terminate
            process.kill()
            process.wait()

        running_processes.pop(call_id, None)
        return StopAgentResponse(
            success=True,
            message='Agent stopped successfully'
        )
    except Exception as error:
        print(f'Error stopping agent: {error}')
        return StopAgentResponse(
            success=False,
            error=str(error)
        )


if __name__ == '__main__':
    import uvicorn
    
    port = int(os.getenv('PORT', 3001))
    print(f'🚀 Agent service starting on http://localhost:{port}')
    print(f'   Using virtual environment: {VENV_PYTHON}')
    print(f'   Agent directory: {CVML_AGENT_DIR}')
    
    uvicorn.run(app, host='0.0.0.0', port=port)

