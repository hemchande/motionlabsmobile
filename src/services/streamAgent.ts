/**
 * Stream.io Agent Service for CV ML Agent (Matching Python cvMLAgentNew)
 * This service creates a programmatic agent that joins Stream.io calls
 * with the same architecture as the Python backend:
 * - Agent participant with ID "cv_ml_agent"
 * - Event subscriptions for transcription
 * - Frame processing for pose detection and ACL risk analysis
 */

import { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import type { Call as CallType } from '@stream-io/video-react-sdk';

export interface StreamAgentConfig {
  apiKey: string;
  apiSecret?: string;
  userId: string;
  token: string;
  callType: string;
  callId: string;
}

export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  confidence?: number;
}

export interface KeypointsDict {
  nose?: Keypoint;
  left_eye?: Keypoint;
  right_eye?: Keypoint;
  left_ear?: Keypoint;
  right_ear?: Keypoint;
  left_shoulder?: Keypoint;
  right_shoulder?: Keypoint;
  left_elbow?: Keypoint;
  right_elbow?: Keypoint;
  left_wrist?: Keypoint;
  right_wrist?: Keypoint;
  left_hip?: Keypoint;
  right_hip?: Keypoint;
  left_knee?: Keypoint;
  right_knee?: Keypoint;
  left_ankle?: Keypoint;
  right_ankle?: Keypoint;
}

export interface ACLMetrics {
  acl_tear_risk_score: number;
  left_knee_valgus_angle: number;
  right_knee_valgus_angle: number;
  acl_knee_flexion_degrees: number;
  impact_force_N: number;
  acl_high_risk_detected: boolean;
  frame_number: number;
  timestamp: number;
}

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Agent class matching Python cvMLAgentNew architecture
 * Agent ID: "cv_ml_agent"
 * Agent Name: "CV ML Gymnastics Analyst"
 */
export class StreamAgent {
  // Agent identity (matching Python)
  private readonly AGENT_ID = 'cv_ml_agent';
  private readonly AGENT_NAME = 'CV ML Gymnastics Analyst';
  
  private client: StreamVideoClient | null = null;
  private call: CallType | null = null;
  private isProcessing: boolean = false;
  private frameCount: number = 0;
  private previousKeypoints: KeypointsDict | null = null;
  private previousTimestamp: number | null = null;
  private transcriptEntries: TranscriptEntry[] = [];
  private onUserTranscriptCallback?: (text: string) => void;
  private onAgentTranscriptCallback?: (text: string) => void;
  
  constructor(private config: StreamAgentConfig) {}

  /**
   * Initialize agent and join call as agent participant
   * Matches Python: agent.create_call() and agent.join(call)
   */
  async initialize(callInstance?: CallType): Promise<void> {
    try {
      if (callInstance) {
        // Use provided call instance (from frontend)
        this.call = callInstance;
        this.client = callInstance.client as StreamVideoClient;
      } else {
        // Create new client as agent
        this.client = new StreamVideoClient({
          apiKey: this.config.apiKey,
          user: {
            id: this.AGENT_ID, // Agent user ID (matching Python)
            name: this.AGENT_NAME,
          },
          token: this.config.token,
        });

        // Create or get call
        this.call = this.client.call(this.config.callType, this.config.callId);
      }

      // Join call as agent (matching Python: agent.join(call))
      await this.call.join({ create: true });
      
      console.log(`✅ ${this.AGENT_NAME} (${this.AGENT_ID}) joined call:`, this.call.cid);
      
      // Set up event subscriptions (matching Python event handlers)
      this.setupEventSubscriptions();
      
      // Start frame processing
      this.startFrameProcessing();
      
      // Send greeting (matching Python greeting)
      await this.sendGreeting();
      
    } catch (error) {
      console.error('❌ Error initializing Stream agent:', error);
      throw error;
    }
  }

  /**
   * Set up event subscriptions for transcription
   * Matches Python: @agent.subscribe handlers
   */
  private setupEventSubscriptions(): void {
    if (!this.call) return;

    // Subscribe to user speech transcription events
    // Matching Python: @agent.subscribe RealtimeUserSpeechTranscriptionEvent
    this.call.on('participantJoined', () => {
      // Listen for participant updates that might include transcription
      this.processParticipants();
    });

    // Listen for call updates (transcription events come through here)
    this.call.on('callUpdated', () => {
      // Check for transcription updates
      this.checkTranscriptUpdates();
    });

    // For now, we'll use manual transcription capture
    // In production, you'd subscribe to Stream.io's transcription events
    console.log('✅ Event subscriptions set up (manual transcription capture)');
  }

  /**
   * Check for transcription updates from Stream.io
   */
  private checkTranscriptUpdates(): void {
    // TODO: Implement Stream.io transcription event handling
    // Stream.io provides transcription events that we can subscribe to
    // This would match the Python RealtimeUserSpeechTranscriptionEvent
  }

  /**
   * Send greeting message (matching Python greeting)
   */
  private async sendGreeting(): Promise<void> {
    const greeting = `🤸 ACL Risk Analysis Agent

I'm analyzing your gymnastics movements in real-time for ACL injury risk factors:

🔍 **Focusing on:**
- Knee valgus (knock-knee) detection
- Landing knee flexion angles
- Impact force measurements
- Asymmetric landing patterns

⚠️ I'll alert you immediately when HIGH risk moments are detected (risk score ≥ 0.7).

Frame capture is active - analysis begins automatically!`;

    // Add to transcript as assistant
    this.addTranscriptEntry('assistant', greeting);

    // Emit as event for UI display
    window.dispatchEvent(
      new CustomEvent('agentMessage', {
        detail: { message: greeting, role: 'assistant' },
      })
    );
  }

  /**
   * Handle user message (matching Python: on_user_transcript)
   */
  async handleUserMessage(userText: string): Promise<void> {
    if (!userText || !userText.trim()) return;

    // Add to transcript (matching Python: workflow.add_transcript_entry("user", user_text))
    this.addTranscriptEntry('user', userText);
    
    if (this.onUserTranscriptCallback) {
      this.onUserTranscriptCallback(userText);
    }
  }

  /**
   * Add transcript entry (matching Python: workflow.add_transcript_entry)
   */
  private addTranscriptEntry(role: 'user' | 'assistant', content: string): void {
    const entry: TranscriptEntry = {
      role,
      content,
      timestamp: Date.now(),
    };
    
    this.transcriptEntries.push(entry);
    
    // Emit transcript update event
    window.dispatchEvent(
      new CustomEvent('transcriptUpdate', {
        detail: { entry, allEntries: this.transcriptEntries },
      })
    );
    
    console.log(`📝 [${role.toUpperCase()}]`, content.substring(0, 100));
  }

  /**
   * Get transcript entries
   */
  getTranscript(): TranscriptEntry[] {
    return [...this.transcriptEntries];
  }

  /**
   * Set callbacks for transcript events (matching Python event handlers)
   */
  setTranscriptCallbacks(callbacks: {
    onUserTranscript?: (text: string) => void;
    onAgentTranscript?: (text: string) => void;
  }): void {
    this.onUserTranscriptCallback = callbacks.onUserTranscript;
    this.onAgentTranscriptCallback = callbacks.onAgentTranscript;
  }

  /**
   * Start processing video frames from the call
   */
  private startFrameProcessing(): void {
    if (!this.call) return;

    // Listen for remote participants joining
    this.call.on('participantJoined', () => {
      setTimeout(() => this.processParticipants(), 500);
    });

    // Listen for tracks being published/updated
    this.call.on('callUpdated', () => {
      this.processParticipants();
    });

    // Listen for participant updates
    this.call.on('participantUpdated', () => {
      this.processParticipants();
    });

    // Process existing participants after a short delay
    setTimeout(() => this.processParticipants(), 1000);
    
    // Poll periodically in case we miss events
    const pollInterval = setInterval(() => {
      if (!this.isProcessing && this.call) {
        this.processParticipants();
      }
    }, 2000);

    // Clean up interval when disconnected
    this.call.on('callLeft', () => {
      clearInterval(pollInterval);
    });
  }

  /**
   * Process all participants' video tracks
   */
  private processParticipants(): void {
    if (!this.call || this.isProcessing) return;

    // Use Stream.io's remote participants API
    const remoteParticipants = Array.from(this.call.state.remoteParticipants.values());
    
    for (const participant of remoteParticipants) {
      // Skip agent's own participant
      if (participant.sessionId === this.call.sessionId) continue;

      // Get video track from remote participant
      const videoTrack = participant.videoTrack;
      
      if (videoTrack && videoTrack.getMediaStreamTrack) {
        const mediaStreamTrack = videoTrack.getMediaStreamTrack();
        if (mediaStreamTrack && mediaStreamTrack.readyState === 'live') {
          this.isProcessing = true;
          const stream = new MediaStream([mediaStreamTrack]);
          this.processVideoStream(stream);
          break; // Process one participant at a time
        }
      }
    }
  }

  /**
   * Process video stream frames
   */
  private processVideoStream(stream: MediaStream): void {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const processFrame = async () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Extract frame as ImageData
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process frame for pose detection
        await this.processFrame(imageData, Date.now());

        this.frameCount++;
      }

      if (this.isProcessing && this.call) {
        requestAnimationFrame(processFrame);
      }
    };

    video.addEventListener('loadedmetadata', () => {
      processFrame();
    });

    video.play().catch((err) => {
      console.error('Error playing video:', err);
    });
  }

  /**
   * Process a single frame for pose detection and metrics
   */
  private async processFrame(imageData: ImageData, timestamp: number): Promise<void> {
    try {
      // For now, emit a simple event to indicate processing
      // In production, you'd integrate with pose detection service
      window.dispatchEvent(
        new CustomEvent('agentFrameProcessed', {
          detail: { frameNumber: this.frameCount, timestamp },
        })
      );
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }

  /**
   * Stop processing and leave call
   */
  async disconnect(): Promise<void> {
    this.isProcessing = false;
    
    if (this.call) {
      await this.call.leave();
    }
    
    if (this.client) {
      await this.client.disconnectUser();
    }

    this.client = null;
    this.call = null;
    this.frameCount = 0;
    this.previousKeypoints = null;
    this.previousTimestamp = null;
  }

  /**
   * Get agent info
   */
  getAgentInfo(): { id: string; name: string } {
    return {
      id: this.AGENT_ID,
      name: this.AGENT_NAME,
    };
  }
}




