/**
 * Agent Service API
 * Handles communication with the agent service for starting/stopping Python ML agent
 */

const AGENT_SERVICE_URL = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:3001';

export interface StartAgentResponse {
  success: boolean;
  message?: string;
  callId: string;
  pid?: number;
  redirectUrl?: string;
  frontendUrl?: string;
  streamUrl?: string;
  rtmpUrl?: string;
  srtUrl?: string;
  demoJoinUrl?: string;
  streamApiKey?: string;
  streamSessionId?: string;
  cid?: string;
  callData?: any;
  error?: string;
  warning?: string;
}

export interface StopAgentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AgentStatus {
  callId: string;
  pid: number;
  killed: boolean;
  redirectUrl: string;
}

export const agentService = {
  /**
   * Start the Python ML agent for a live session
   */
  async startAgent(callId?: string): Promise<StartAgentResponse> {
    try {
      console.log(`📞 Calling agent service: ${AGENT_SERVICE_URL}/api/start-agent`);
      console.log(`   Call ID: ${callId || 'not provided'}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${AGENT_SERVICE_URL}/api/start-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: callId || undefined
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Agent service response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error starting agent:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. The agent service may be taking too long to respond.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = `Cannot connect to agent service at ${AGENT_SERVICE_URL}. Make sure the service is running on port 3001.`;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        callId: callId || 'unknown'
      };
    }
  },

  /**
   * Stop the Python ML agent
   */
  async stopAgent(callId?: string): Promise<StopAgentResponse> {
    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/api/stop-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: callId || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error stopping agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get list of running agents
   */
  async getAgents(): Promise<{ agents: AgentStatus[] }> {
    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/api/agents`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting agents:', error);
      return { agents: [] };
    }
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/api/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking health:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
};

