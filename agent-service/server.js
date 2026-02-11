import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, unlink } from 'fs/promises';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import crypto from 'crypto';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// Try current directory first, then parent directory
dotenv.config();
const parentEnvPath = join(__dirname, '..', '.env');
const parentEnvResult = dotenv.config({ path: parentEnvPath });
if (!parentEnvResult.error) {
  console.log('✅ Loaded environment variables from parent .env');
} else {
  console.log('ℹ️  Parent .env not found or error loading:', parentEnvResult.error?.message || 'unknown');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store running processes
const runningProcesses = new Map();

// Stream.io configuration
// Try multiple environment variable names to support different setups
const STREAM_API_KEY = process.env.STREAM_API_KEY || process.env.VITE_STREAM_API_KEY || 'htspepyqm3aw';
const STREAM_SECRET = process.env.STREAM_SECRET 
  || process.env.VITE_STREAM_API_SECRET 
  || process.env.STREAM_API_SECRET
  || process.env.VITE_STREAM_SECRET;

// Log configuration status
if (STREAM_SECRET) {
  console.log('✅ Stream.io secret configured');
} else {
  console.warn('⚠️  STREAM_SECRET not found in environment variables');
  console.warn('   Please set one of: STREAM_SECRET, VITE_STREAM_API_SECRET, STREAM_API_SECRET');
  console.warn('   You can create agent-service/.env or set it in the parent .env file');
}

/**
 * Generate Stream.io JWT token for server-side API calls
 * Uses Stream.io's JWT format: header.payload.signature
 */
function generateStreamToken(userId = 'cv_ml_agent') {
  if (!STREAM_SECRET) {
    console.warn('⚠️ STREAM_SECRET not set, cannot generate token');
    return null;
  }

  // Stream.io JWT token format
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user_id: userId,
    exp: now + 3600, // 1 hour expiration
    iat: now
  };

  // Base64 encode header and payload
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', STREAM_SECRET)
    .update(signatureInput)
    .digest('base64url');

  const token = `${signatureInput}.${signature}`;
  return token;
}

/**
 * Generate Stream.io demo join URL (same format as Python agent)
 * Format: https://getstream.io/video/demos/join/{call_id}?api_key=...&token=...&skip_lobby=true&...
 */
function generateDemoJoinUrl(callId, userId = 'user-demo-agent') {
  const token = generateStreamToken(userId);
  
  if (!token) {
    return null;
  }

  // Same parameters as Python agent uses
  const params = new URLSearchParams({
    api_key: STREAM_API_KEY,
    token: token,
    skip_lobby: 'true',
    user_name: 'Human User',
    video_encoder: 'h264',
    bitrate: '12000000',
    w: '1920',
    h: '1080',
    channel_type: 'messaging'
  });

  return `https://getstream.io/video/demos/join/${callId}?${params.toString()}`;
}

/**
 * Get Stream.io call metadata and extract WHIP URL using REST API
 * This fetches the call that was created by the Python agent after it starts
 */
async function getStreamWHIPUrl(callId, maxRetries = 5, retryDelay = 2000) {
  try {
    // Generate JWT token for API authentication
    const token = generateStreamToken('cv_ml_agent');
    
    if (!token) {
      throw new Error('Cannot generate Stream.io token - STREAM_SECRET not set');
    }

    // Stream.io API endpoint for getting call details
    // API key must be included in the URL as a query parameter
    const apiUrl = `https://video.stream-io-api.com/api/v2/video/call/default/${callId}?api_key=${STREAM_API_KEY}`;
    
    // Retry logic: agent might take a moment to create the call
    let callData = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📞 Fetching call metadata (attempt ${attempt}/${maxRetries})...`);
        
        // Make REST API call to get call details
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Stream-Auth-Type': 'jwt'
          }
        });

        if (response.status === 404) {
          console.log(`⏳ Call not found yet (attempt ${attempt}/${maxRetries}), waiting...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          } else {
            throw new Error('Call not found after multiple attempts');
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        callData = result.call || result;
        
        // Check if call exists and has ingress data
        if (callData && (callData.ingress || callData.id)) {
          console.log('✅ Call found, extracting metadata...');
          break;
        } else {
          console.log(`⏳ Call metadata incomplete (attempt ${attempt}/${maxRetries}), waiting...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      } catch (fetchError) {
        console.log(`⚠️  Attempt ${attempt} failed: ${fetchError.message}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          throw fetchError;
        }
      }
    }
    
    if (!callData) {
      throw new Error('Call not found after multiple attempts. Agent may not have created the call yet.');
    }
    
    // Extract WHIP URL from call metadata (from ingress.whip.address)
    let whipUrl = null;
    let rtmpUrl = null;
    let srtUrl = null;
    let sessionId = null;
    
    if (callData?.ingress?.whip?.address) {
      whipUrl = callData.ingress.whip.address;
      // Extract session ID from WHIP URL (it's in the path: .../whip/{sessionId}?...)
      const match = whipUrl.match(/whip\/([^?]+)/);
      if (match) {
        sessionId = match[1];
      }
    }
    
    if (callData?.ingress?.rtmp?.address) {
      rtmpUrl = callData.ingress.rtmp.address;
    }
    
    if (callData?.ingress?.srt?.address) {
      srtUrl = callData.ingress.srt.address;
    }
    
    // Log call attributes for debugging
    console.log('📞 Call metadata extracted:', {
      type: callData?.type,
      id: callData?.id,
      cid: callData?.cid,
      current_session_id: callData?.current_session_id,
      created_by: callData?.created_by?.id || callData?.created_by?.name,
      ingress_enabled: !!callData?.ingress,
      whip_available: !!whipUrl,
      rtmp_available: !!rtmpUrl,
      srt_available: !!srtUrl,
      whip_url: whipUrl ? whipUrl.substring(0, 80) + '...' : null
    });
    
    const finalCallId = callData?.id || callId;
    const demoJoinUrl = generateDemoJoinUrl(finalCallId);
    
    return {
      whipUrl,
      rtmpUrl,
      srtUrl,
      callId: finalCallId,
      cid: callData?.cid,
      sessionId,
      apiKey: STREAM_API_KEY,
      demoJoinUrl: demoJoinUrl, // Same format as Python agent generates
      callData: {
        type: callData?.type,
        id: callData?.id,
        cid: callData?.cid,
        created_by: callData?.created_by,
        current_session_id: callData?.current_session_id,
        created_at: callData?.created_at,
        updated_at: callData?.updated_at,
        settings: callData?.settings ? {
          ingress: callData.settings.ingress ? {
            enabled: callData.settings.ingress.enabled
          } : null
        } : null
      }
    };
  } catch (error) {
    console.error('❌ Error fetching call metadata:', error);
    
    // Fallback: construct URL with generated session ID (won't work without proper call)
    const sessionId = crypto.randomUUID();
    const whipUrl = `https://video.stream-io-api.com/api/v2/video/call/default/${callId}/whip/${sessionId}?api_key=${STREAM_API_KEY}&stream-auth-type=jwt`;
    
    return {
      whipUrl,
      callId,
      sessionId,
      apiKey: STREAM_API_KEY,
      error: error.message,
      fallback: true,
      warning: 'Using fallback URL - call metadata not available. Agent may still be starting.'
    };
  }
}

// Start agent endpoint
app.post('/api/start-agent', async (req, res) => {
  const callId = req.body.callId || process.env.STREAM_CALL_ID || 'demo-call-xGvo-o50';
  
  // Check if agent is already running
  if (runningProcesses.has(callId)) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/?callId=${callId}`;
    
    // Get Stream.io WHIP URL by creating/getting the call
    getStreamWHIPUrl(callId).then(whipInfo => {
      res.json({
        success: true,
        message: 'Agent is already running for this call',
        callId: whipInfo.callId || callId,
        pid: runningProcesses.get(callId).pid,
        redirectUrl: redirectUrl,
        frontendUrl: frontendUrl,
        streamUrl: whipInfo.whipUrl,
        rtmpUrl: whipInfo.rtmpUrl,
        srtUrl: whipInfo.srtUrl,
        demoJoinUrl: whipInfo.demoJoinUrl,
        streamApiKey: whipInfo.apiKey,
        streamSessionId: whipInfo.sessionId,
        cid: whipInfo.cid,
        callData: whipInfo.callData
      });
    }).catch(error => {
      res.json({
        success: true,
        message: 'Agent is already running for this call',
        callId,
        pid: runningProcesses.get(callId).pid,
        redirectUrl: redirectUrl,
        frontendUrl: frontendUrl,
        streamUrl: null,
        error: error.message,
        warning: 'Failed to get Stream.io WHIP URL'
      });
    });
    return;
  }

  try {
    // Option 1: Try calling MCP server's run_pipeline tool (recommended)
    // This uses the MCP server's Python environment which may have vision-agents
    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8000/mcp';
    
    console.log(`🚀 Starting Python agent for call ID: ${callId}`);
    console.log(`   Attempting to use MCP server at: ${mcpServerUrl}`);
    
    try {
      // Try calling MCP server first
      const mcpResponse = await fetch(`${mcpServerUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'run_pipeline',
            arguments: {
              call_id: callId,
              call_type: 'default',
              activity: 'gymnastics'
            }
          }
        }),
      });

      if (mcpResponse.ok) {
        const mcpData = await mcpResponse.json();
        if (mcpData.result && !mcpData.error) {
          console.log('✅ Using MCP server to run pipeline');
          // MCP server will handle the pipeline asynchronously
          // We'll still return the response with call metadata
        } else if (mcpData.error) {
          console.log(`⚠️  MCP server error: ${mcpData.error.message}`);
          console.log(`   Falling back to direct Python execution...`);
          // Fall through to direct execution
        }
      }
    } catch (mcpError) {
      console.log(`⚠️  MCP server not available: ${mcpError.message}`);
      console.log(`   Falling back to direct Python execution...`);
      // Fall through to direct execution
    }

    // Option 2: Direct Python execution - use run_pipeline() to join existing call
    const agentPath = join(__dirname, '..', 'cvMLAgentNew');
    
    // Create a Python script that calls run_pipeline programmatically
    // This ensures we join the EXISTING call (not create a new one like CLI does)
    const runPipelineScript = `#!/usr/bin/env python3
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
    print(f"❌ Failed to import run_pipeline: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)

async def main():
    call_id = "${callId}"
    print(f"🚀 Starting pipeline for call_id: {call_id}")
    print(f"   This will JOIN the existing call (not create a new one)")
    try:
        # This will join the EXISTING call that the frontend created
        await run_pipeline(
            call_id=call_id,
            call_type="default",
            activity="gymnastics"
        )
        print(f"✅ Pipeline completed for call_id: {call_id}")
    except Exception as e:
        print(f"❌ Pipeline error: {e}", file=sys.stderr)
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
        print(f"❌ Fatal error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
`;
    
    // Write temporary script
    const tempScriptPath = join(agentPath, `temp_run_pipeline_${callId.replace(/[^a-zA-Z0-9]/g, '_')}.py`);
    writeFileSync(tempScriptPath, runPipelineScript);
    
    // Make script executable (Unix/Linux/Mac)
    if (process.platform !== 'win32') {
        try {
            const { chmodSync } = require('fs');
            chmodSync(tempScriptPath, 0o755);
        } catch (err) {
            // Ignore chmod errors
        }
    }
    
    console.log(`   Using run_pipeline() to join existing call`);
    console.log(`   Script: ${tempScriptPath}`);
    console.log(`   Call ID: ${callId} (will JOIN this call, not create new)`);
    
    // Set environment variables for the Python process
    const env = {
      ...process.env,
      STREAM_CALL_ID: callId, // Also set for reference
      PYTHONUNBUFFERED: '1' // Ensure Python output is not buffered
    };

    // Spawn Python process with the temporary script
    // This will call run_pipeline() which explicitly joins the call_id we pass
    const pythonProcess = spawn('python3', [tempScriptPath], {
      cwd: agentPath,
      env: env,
      stdio: 'inherit' // Pass through stdout/stderr to parent process
    });

    // Store process
    runningProcesses.set(callId, pythonProcess);

    // Handle process exit
    pythonProcess.on('exit', (code, signal) => {
      if (code === 0) {
        console.log(`✅ Python agent process completed (code: ${code})`);
      } else {
        console.log(`❌ Python agent process exited (code: ${code}, signal: ${signal})`);
      }
      runningProcesses.delete(callId);
      // Clean up temporary script
      try {
        unlinkSync(tempScriptPath);
      } catch (err) {
        // Ignore cleanup errors
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`❌ Error starting Python agent:`, error);
      runningProcesses.delete(callId);
      res.status(500).json({
        success: false,
        error: error.message
      });
      return;
    });

    // Give agent a moment to start and create/join the call, then extract metadata
    setTimeout(async () => {
      if (pythonProcess.killed) {
        res.status(500).json({
          success: false,
          error: 'Process failed to start'
        });
      } else {
        // Get the frontend URL from environment or default to localhost
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/?callId=${callId}`;
        
        console.log(`⏳ Waiting for agent to create call, then extracting metadata for callId: ${callId}`);
        
        try {
          // Wait for agent to start and create/join the call, then extract call metadata
          // The Python agent will create the call via agent.create_call()
          const whipInfo = await getStreamWHIPUrl(callId, 5, 2000);
          
          console.log(`✅ Metadata extraction complete. WHIP URL available: ${!!whipInfo.whipUrl}`);
          
          res.json({
            success: true,
            message: 'Agent started successfully',
            callId: whipInfo.callId || callId,
            pid: pythonProcess.pid,
            redirectUrl: redirectUrl,
            frontendUrl: frontendUrl,
            streamUrl: whipInfo.whipUrl,
            rtmpUrl: whipInfo.rtmpUrl,
            srtUrl: whipInfo.srtUrl,
            demoJoinUrl: whipInfo.demoJoinUrl, // Same format as Python agent
            streamApiKey: whipInfo.apiKey,
            streamSessionId: whipInfo.sessionId,
            cid: whipInfo.cid,
            callData: whipInfo.callData,
            ...(whipInfo.fallback && { warning: whipInfo.warning || 'Using fallback URL - call metadata may not be available yet' })
          });
        } catch (error) {
          console.error(`❌ Error extracting metadata: ${error.message}`);
          // Return response even if metadata extraction fails
          const fallbackSessionId = crypto.randomUUID();
          const fallbackWhipUrl = `https://video.stream-io-api.com/api/v2/video/call/default/${callId}/whip/${fallbackSessionId}?api_key=${STREAM_API_KEY}&stream-auth-type=jwt`;
          
          const fallbackDemoJoinUrl = generateDemoJoinUrl(callId);
          
          res.json({
            success: true,
            message: 'Agent started successfully',
            callId,
            pid: pythonProcess.pid,
            redirectUrl: redirectUrl,
            frontendUrl: frontendUrl,
            streamUrl: fallbackWhipUrl,
            demoJoinUrl: fallbackDemoJoinUrl,
            streamApiKey: STREAM_API_KEY,
            streamSessionId: fallbackSessionId,
            warning: `Metadata extraction failed: ${error.message}. Using fallback URL.`
          });
        }
      }
    }, 3000); // Increased delay to give agent time to create call

  } catch (error) {
    console.error('Error starting agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop agent endpoint
app.post('/api/stop-agent', (req, res) => {
  const callId = req.body.callId || process.env.STREAM_CALL_ID || 'demo-call-xGvo-o50';
  
  const process = runningProcesses.get(callId);
  if (!process) {
    return res.json({
      success: false,
      message: 'No agent process found for this call'
    });
  }

  try {
    process.kill('SIGTERM');
    runningProcesses.delete(callId);
    res.json({
      success: true,
      message: 'Agent stopped successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get running agents
app.get('/api/agents', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const agents = Array.from(runningProcesses.entries()).map(([callId, process]) => ({
    callId,
    pid: process.pid,
    killed: process.killed,
    redirectUrl: `${frontendUrl}/?callId=${callId}`
  }));
  res.json({ agents });
});

// Test endpoint to get call metadata directly
app.get('/api/test-call-metadata', async (req, res) => {
  const callId = req.query.callId || 'demo-call-xGvo-o50';
  
  try {
    console.log(`🧪 Testing call metadata extraction for: ${callId}`);
    const whipInfo = await getStreamWHIPUrl(callId, 5, 2000);
    
    res.json({
      success: true,
      callId,
      ...whipInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      callId,
      error: error.message,
      stack: error.stack
    });
  }
});

// Get redirect URL for a call ID
app.get('/api/redirect-url', async (req, res) => {
  const callId = req.query.callId || process.env.STREAM_CALL_ID || 'demo-call-xGvo-o50';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}/?callId=${callId}`;
  
  try {
    // Get Stream.io WHIP URL by creating/getting the call
    const whipInfo = await getStreamWHIPUrl(callId);
    
    res.json({
      callId: whipInfo.callId || callId,
      redirectUrl,
      frontendUrl,
      agentRunning: runningProcesses.has(callId),
      streamUrl: whipInfo.whipUrl,
      rtmpUrl: whipInfo.rtmpUrl,
      srtUrl: whipInfo.srtUrl,
      streamApiKey: whipInfo.apiKey,
      streamSessionId: whipInfo.sessionId,
      cid: whipInfo.cid,
      callData: whipInfo.callData
    });
  } catch (error) {
    res.status(500).json({
      callId,
      redirectUrl,
      frontendUrl,
      agentRunning: runningProcesses.has(callId),
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Agent service running on http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST /api/start-agent - Start Python agent (returns redirectUrl and streamUrl)`);
  console.log(`   - POST /api/stop-agent - Stop Python agent`);
  console.log(`   - GET /api/agents - List running agents (includes redirectUrl)`);
  console.log(`   - GET /api/redirect-url?callId=xxx - Get redirect URL for a call ID`);
  console.log(`   - GET /api/test-call-metadata?callId=xxx - Test call metadata extraction`);
  console.log(`   - GET /api/health - Health check`);
});

