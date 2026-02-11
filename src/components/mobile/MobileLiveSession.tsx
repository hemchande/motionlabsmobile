import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Camera, Video, VideoOff, Mic, MicOff, X, Settings, Loader2 } from "lucide-react";
import {
  SpeakerLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { startAgent } from '../../services/athleteCoachService';
import { StreamAgent } from '../../services/streamAgent';

// Stream.io configuration
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || 'htspepyqm3aw';

// Generate a unique user ID for this session
const getUserId = (): string => {
  const stored = sessionStorage.getItem('stream_user_id');
  if (stored) return stored;
  const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('stream_user_id', newId);
  return newId;
};

// Generate Stream.io JWT token (for development only - in production, generate server-side)
const getToken = async (userId: string): Promise<string> => {
  const apiSecret = import.meta.env.VITE_STREAM_API_SECRET;
  
  if (!apiSecret) {
    throw new Error(
      "VITE_STREAM_API_SECRET is not set. Please add it to your .env file.\n" +
      "NOTE: This is for development only. In production, tokens should be generated server-side."
    );
  }

  // Generate JWT token for Stream.io
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiration

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    user_id: userId,
    sub: `user/${userId}`,
    api_key: STREAM_API_KEY,
    iat: now,
    exp: exp
  };

  // Base64 URL encode
  const base64UrlEncode = (obj: any): string => {
    const json = JSON.stringify(obj);
    const base64 = btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);

  // Create signature using Web Crypto API
  const message = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureArrayBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(message)
  );

  // Convert ArrayBuffer to base64url
  const signatureBytes = new Uint8Array(signatureArrayBuffer);
  const signatureBase64 = btoa(String.fromCharCode(...signatureBytes));
  const encodedSignature = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const token = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  return token;
};

interface MobileLiveSessionProps {
  callId?: string | null;
  athleteId?: string | null;
  onClose: () => void;
}

const MobileLiveSessionContent = ({ callId }: { callId: string }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { camera, isMute: isVideoMuted } = useCameraState();
  const { microphone, isMute: isAudioMuted } = useMicrophoneState();

  const toggleVideo = useCallback(async () => {
    try {
      if (isVideoMuted) {
        await camera.enable();
      } else {
        await camera.disable();
      }
    } catch (err) {
      console.error("Error toggling video:", err);
      setError("Failed to toggle video");
    }
  }, [camera, isVideoMuted]);

  const toggleAudio = useCallback(async () => {
    try {
      if (isAudioMuted) {
        await microphone.enable();
      } else {
        await microphone.disable();
      }
    } catch (err) {
      console.error("Error toggling audio:", err);
      setError("Failed to toggle audio");
    }
  }, [microphone, isAudioMuted]);

  useEffect(() => {
    setIsConnected(true);
  }, []);

  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isVideoMuted ? 'bg-gray-600' : 'bg-white/20'
            }`}
          >
            {isVideoMuted ? (
              <VideoOff className="w-6 h-6 text-white" />
            ) : (
              <Video className="w-6 h-6 text-white" />
            )}
          </button>
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isAudioMuted ? 'bg-gray-600' : 'bg-white/20'
            }`}
          >
            {isAudioMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export function MobileLiveSession({ callId: propCallId, athleteId: propAthleteId, onClose }: MobileLiveSessionProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callId, setCallId] = useState<string>("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [streamAgent, setStreamAgent] = useState<StreamAgent | null>(null);

  useEffect(() => {
    const fixedCallId = propCallId ?? import.meta.env.VITE_STREAM_CALL_ID ?? 'demo-call-xGvo-o50';
    setCallId(fixedCallId);
  }, [propCallId]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (call && call.state?.joined) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [call]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartSession = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera access is not supported in this browser.");
        setIsInitializing(false);
        return;
      }

      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setError("Camera access requires HTTPS or localhost.");
        setIsInitializing(false);
        return;
      }

      // Step 1: Connect to Stream.io FIRST (create the call)
      // This ensures the call exists before the agent tries to join
      console.log("📞 Step 1: Creating Stream.io call...");
      const userId = getUserId();
      const user: User = { id: userId };

      // Get token first
      const token = await getToken(userId);

      // Create Stream client
      const streamClient = new StreamVideoClient({ 
        apiKey: STREAM_API_KEY,
        tokenProvider: async () => {
          // Return a fresh token when needed
          return await getToken(userId);
        }
      });

      // Connect the user to the client (this is required!)
      await streamClient.connectUser(user, token);

      // Create and join the call FIRST (this creates the call)
      // The Python agent will join this existing call
      const streamCall = streamClient.call('default', callId);
      await streamCall.join({ create: true });
      
      console.log("✅ Call created and joined:", callId);
      
      // Enable camera and microphone
      await streamCall.camera.enable();
      await streamCall.microphone.enable();

      setClient(streamClient);
      setCall(streamCall);

      // Step 2: Start the ML agent via Athlete Coach API (POST /api/agent/start)
      const athleteId = propAthleteId ?? 'athlete_001';
      console.log("🚀 Step 2: Starting agent via /api/agent/start...");
      console.log("   call_id:", callId, "athlete_id:", athleteId);
      
      const startResult = await startAgent({
        call_id: callId,
        athlete_id: athleteId,
        activity: 'gymnastics',
        user_requests: ['record live session'],
      });
      
      const startSuccess = (startResult?.success as boolean) ?? (startResult?.status as string) === 'success';
      if (!startSuccess) {
        const msg = (startResult as { message?: string })?.message ?? (startResult as { error?: string })?.error ?? 'Failed to start agent';
        throw new Error(msg);
      }

      console.log("✅ Agent start requested:", startResult);
      const finalCallId = callId;
      
      // Give the agent a moment to join the call
      console.log("⏳ Waiting for agent to join call...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

      // Step 3: Initialize Stream Agent (joins as agent participant)
      try {
        console.log("🤖 Initializing Stream Agent...");
        const agentToken = await getToken('cv_ml_agent');
        const agent = new StreamAgent({
          apiKey: STREAM_API_KEY,
          userId: 'cv_ml_agent',
          token: agentToken,
          callType: 'default',
          callId: finalCallId,
        });
        
        // Set up transcript callbacks
        agent.setTranscriptCallbacks({
          onUserTranscript: (text) => {
            console.log('📝 User transcript:', text);
          },
          onAgentTranscript: (text) => {
            console.log('📝 Agent transcript:', text);
          },
        });
        
        // Initialize agent with call instance
        await agent.initialize(streamCall);
        setStreamAgent(agent);
        
        // Log agent info
        const agentInfo = agent.getAgentInfo();
        console.log(`✅ Agent initialized: ${agentInfo.name} (${agentInfo.id})`);
      } catch (agentError: any) {
        console.warn('⚠️ Failed to initialize Stream Agent:', agentError.message);
        console.warn('   Video call will still work, but agent features may not be available');
        // Don't fail the entire session if agent initialization fails
      }

      setIsInitializing(false);

      console.log("✅ Connected to Stream call:", finalCallId);
      console.log("✅ Agent start requested; agent will join the call");
    } catch (err: any) {
      console.error("Error starting session:", err);
      setIsInitializing(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permission denied. Please allow camera and microphone access.");
      } else {
        setError(`Failed to start session: ${err.message || "Unknown error"}`);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      // Disconnect Stream Agent
      if (streamAgent) {
        console.log("🛑 Disconnecting Stream Agent...");
        await streamAgent.disconnect();
        setStreamAgent(null);
      }

      // Note: MCP pipeline runs until call ends, no need to stop manually
      // The process will clean up automatically when the call ends
      if (callId) {
        console.log("🛑 Leaving call - pipeline will stop automatically");
      }

      if (call) {
        await call.leave();
      }
      if (client) {
        await client.disconnectUser();
      }
      setClient(null);
      setCall(null);
      setError(null);
      setRecordingTime(0);
      onClose();
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  };

  // If client and call are ready, render Stream.io components
  if (client && call) {
    return (
      <div className="h-full flex flex-col bg-black relative">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent px-4 pt-3 pb-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleDisconnect}
              className="w-9 h-9 flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
            <button className="w-9 h-9 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Stream.io Video Container */}
        <div className="flex-1 relative">
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <div className="w-full h-full">
                <SpeakerLayout />
              </div>
              <MobileLiveSessionContent callId={callId} />
            </StreamCall>
          </StreamVideo>
        </div>
      </div>
    );
  }

  // Initial state - show start button
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg text-gray-900 flex-1">Live Recording Session</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-blue-600 rounded-3xl mb-6 flex items-center justify-center shadow-lg">
          <Camera className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-2xl text-gray-900 mb-2 text-center font-semibold">Start Live Session</h2>
        <p className="text-gray-600 text-sm mb-8 text-center">
          Real-time AI analysis powered by Stream.io
        </p>

        {/* Error Message */}
        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
            {error.includes("Permission denied") && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-700 mb-2"><strong>Quick Fix:</strong></p>
                <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                  <li>Allow camera and microphone access</li>
                  <li>Refresh and try again</li>
                  <li>Make sure no other apps are using your camera</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Start Button */}
        <button 
          onClick={handleStartSession} 
          disabled={isInitializing}
          className="w-full h-14 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700"
        >
          <Camera className="w-5 h-5" />
          {isInitializing ? "Starting Session..." : "Start Live Session"}
        </button>

        {/* Info */}
        <div className="mt-8 w-full bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-900 text-xs mb-2"><strong>How it works:</strong></p>
          <ul className="text-blue-800 text-xs space-y-1 list-disc list-inside">
            <li>Your camera stream is sent to the AI agent via Stream.io</li>
            <li>Real-time analysis of technique and form</li>
            <li>Get instant feedback during practice</li>
          </ul>
          {callId && (
            <p className="text-blue-700 text-xs mt-3">
              <strong>Call ID:</strong> <code className="px-1.5 py-0.5 bg-white rounded text-xs">{callId}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

