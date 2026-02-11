/**
 * MCP Query Builder
 * Builds natural language queries for all MCP tools and calls the MCP service
 */

import { mcpService } from './mcpService';

const MCP_SERVICE_URL = import.meta.env.VITE_MCP_SERVICE_URL || 'http://localhost:8004';

// ============================================================================
// SESSION MANAGER TOOLS
// ============================================================================

export interface RunPipelineParams {
  call_id: string;
  call_type?: string;
  activity?: string;
  technique?: string;
  user_requests?: string[];
}

export interface UpsertSessionParams {
  session_id: string;
  activity?: string;
  technique?: string;
  athlete_id?: string;
  athlete_name?: string;
  session_data?: Record<string, any>;
}

export interface GetSessionParams {
  session_id: string;
}

// ============================================================================
// PIPELINE PROCESSOR TOOLS
// ============================================================================

export interface ListenToRetrievalQueueParams {
  max_messages?: number | null;
}

export interface ProcessVideoPipelineParams {
  athlete_id: string;
  session_id: string;
  activity?: string;
  athlete_name?: string;
}

// ============================================================================
// ATHLETE/COACH API TOOLS
// ============================================================================

export interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  role?: 'athlete' | 'coach';
  institution?: string;
  firebase_uid?: string;
}

export interface LoginParams {
  email: string;
  password: string;
  role?: 'athlete' | 'coach';
}

export interface GetAthleteSessionsParams {
  athlete_id: string;
  limit?: number;
  activity?: string;
  technique?: string;
}

export interface GetAthleteDetailsParams {
  athlete_id: string;
}

export interface GetAthleteAlertsParams {
  athlete_id: string;
  include_stream_urls?: boolean;
  include_insights?: boolean;
  include_metrics?: boolean;
  limit?: number;
}

export interface GetAthleteInsightsParams {
  athlete_id: string;
  limit?: number;
  activity?: string;
  technique?: string;
}

export interface GetAthleteTrendsParams {
  athlete_id: string;
  activity?: string;
  technique?: string;
  limit?: number;
}

export interface GetAllSessionsParams {
  limit?: number;
  activity?: string;
  athlete_id?: string;
}

export interface GetAllAthletesParams {
  limit?: number;
  include_stats?: boolean;
}

export interface GetAlertQueueMessagesParams {
  max_messages?: number;
  queue_name?: string;
}

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Session Manager Query Builders
 */
export const sessionManagerQueries = {
  /**
   * Build query to run the video processing pipeline
   */
  runPipeline(params: RunPipelineParams): string {
    const parts = [
      `Process video with call_id ${params.call_id}`,
      `Start by running the full pipeline with call_id ${params.call_id}`,
    ];

    if (params.activity) {
      parts.push(`activity ${params.activity}`);
    } else {
      parts.push(`activity gymnastics`);
    }

    if (params.technique) {
      parts.push(`technique ${params.technique}`);
    }

    if (params.user_requests && params.user_requests.length > 0) {
      parts.push(`user_requests ${params.user_requests.join(', ')}`);
    }

    parts.push('Then listen to the retrieval queue to process any messages.');

    return parts.join(', ') + '.';
  },

  /**
   * Build query to upsert a session
   */
  upsertSession(params: UpsertSessionParams): string {
    const parts = [
      `Create or update session ${params.session_id}`,
      `activity ${params.activity || 'gymnastics'}`,
      `technique ${params.technique || 'back_handspring'}`,
    ];

    if (params.athlete_id) {
      parts.push(`athlete_id ${params.athlete_id}`);
    }

    if (params.athlete_name) {
      parts.push(`athlete_name ${params.athlete_name}`);
    }

    return parts.join(', ') + '.';
  },

  /**
   * Build query to get a session
   */
  getSession(params: GetSessionParams): string {
    return `Get session ${params.session_id} from MongoDB.`;
  },
};

/**
 * Pipeline Processor Query Builders
 */
export const pipelineProcessorQueries = {
  /**
   * Build query to listen to retrieval queue
   */
  listenToRetrievalQueue(params: ListenToRetrievalQueueParams = {}): string {
    if (params.max_messages !== null && params.max_messages !== undefined) {
      return `Listen to retrieval queue and process ${params.max_messages} messages.`;
    }
    return 'Listen to retrieval queue and process all messages.';
  },

  /**
   * Build query to process video pipeline
   */
  processVideoPipeline(params: ProcessVideoPipelineParams): string {
    const parts = [
      `Process video pipeline for athlete ${params.athlete_id}`,
      `session ${params.session_id}`,
      `activity ${params.activity || 'gymnastics'}`,
    ];

    if (params.athlete_name) {
      parts.push(`athlete_name ${params.athlete_name}`);
    }

    return parts.join(', ') + '.';
  },
};

/**
 * Athlete/Coach API Query Builders
 */
export const athleteCoachQueries = {
  /**
   * Build query to create a user
   */
  createUser(params: CreateUserParams): string {
    const parts = [
      `Create user with email ${params.email}`,
      `full_name ${params.full_name}`,
      `role ${params.role || 'athlete'}`,
    ];

    if (params.institution) {
      parts.push(`institution ${params.institution}`);
    }

    if (params.firebase_uid) {
      parts.push(`firebase_uid ${params.firebase_uid}`);
    }

    return parts.join(', ') + '.';
  },

  /**
   * Build query to login
   */
  login(params: LoginParams): string {
    return `Login with email ${params.email}, role ${params.role || 'athlete'}.`;
  },

  /**
   * Build query to get athlete sessions
   */
  getAthleteSessions(params: GetAthleteSessionsParams): string {
    const parts = [`Get all sessions for athlete_id ${params.athlete_id}`];

    if (params.limit) {
      parts.push(`limit ${params.limit}`);
    }

    if (params.activity) {
      parts.push(`activity ${params.activity}`);
    }

    if (params.technique) {
      parts.push(`technique ${params.technique}`);
    }

    return parts.join(', ') + '.';
  },

  /**
   * Build query to get athlete details
   */
  getAthleteDetails(params: GetAthleteDetailsParams): string {
    return `Get athlete details and summary information for athlete_id ${params.athlete_id}.`;
  },

  /**
   * Build query to get athlete alerts
   */
  getAthleteAlerts(params: GetAthleteAlertsParams): string {
    const parts = [`Get alerts for athlete_id ${params.athlete_id}`];

    if (params.include_stream_urls !== false) {
      parts.push('include Cloudflare stream URLs');
    }

    if (params.include_insights !== false) {
      parts.push('include insights');
    }

    if (params.include_metrics !== false) {
      parts.push('include metrics');
    }

    if (params.limit) {
      parts.push(`limit ${params.limit}`);
    }

    return parts.join(', ') + '.';
  },

  /**
   * Build query to get athlete insights
   */
  getAthleteInsights(params: GetAthleteInsightsParams): string {
    const parts = [`Get insights for athlete_id ${params.athlete_id}`];

    if (params.limit) {
      parts.push(`limit ${params.limit}`);
    }

    if (params.activity) {
      parts.push(`activity ${params.activity}`);
    }

    if (params.technique) {
      parts.push(`technique ${params.technique}`);
    }

    return parts.join(', ') + '.';
  },

  /**
   * Build query to get athlete trends
   */
  getAthleteTrends(params: GetAthleteTrendsParams): string {
    const parts = [`Get trends for athlete_id ${params.athlete_id}`];

    if (params.activity) {
      parts.push(`activity ${params.activity}`);
    }

    if (params.technique) {
      parts.push(`technique ${params.technique}`);
    }

    if (params.limit) {
      parts.push(`limit ${params.limit}`);
    }

    return parts.join(', ') + '.';
  },

  /**
   * Build query to get all sessions
   */
  getAllSessions(params: GetAllSessionsParams = {}): string {
    const parts = ['Get all sessions'];

    if (params.limit) {
      parts.push(`limit ${params.limit}`);
    }

    if (params.activity) {
      parts.push(`activity ${params.activity}`);
    }

    if (params.athlete_id) {
      parts.push(`athlete_id ${params.athlete_id}`);
    }

    return parts.join(', ') + '.';
  },

  /**
   * Build query to get all athletes
   */
  getAllAthletes(params: GetAllAthletesParams = {}): string {
    const parts = ['Get all athletes'];

    if (params.limit) {
      parts.push(`limit ${params.limit}`);
    }

    if (params.include_stats !== false) {
      parts.push('include statistics');
    }

    return parts.join(', ') + '.';
  },

  /**
   * Build query to get alert queue messages
   */
  getAlertQueueMessages(params: GetAlertQueueMessagesParams = {}): string {
    const parts = ['Get alert queue messages'];

    if (params.max_messages) {
      parts.push(`max_messages ${params.max_messages}`);
    }

    if (params.queue_name) {
      parts.push(`queue_name ${params.queue_name}`);
    }

    return parts.join(', ') + '.';
  },
};

// ============================================================================
// SERVICE FUNCTIONS - Call MCP Service with Built Queries
// ============================================================================

/**
 * MCP Query Service
 * Provides typed functions to call all MCP tools via the agent
 */
export const mcpQueryService = {
  // ========================================================================
  // SESSION MANAGER
  // ========================================================================

  /**
   * Run the video processing pipeline
   */
  async runPipeline(params: RunPipelineParams) {
    const query = sessionManagerQueries.runPipeline(params);
    return await mcpService.startPipeline({
      call_id: params.call_id,
      call_type: params.call_type || 'default',
      activity: params.activity || 'gymnastics',
      technique: params.technique,
      user_requests: params.user_requests,
    });
  },

  /**
   * Upsert a session
   */
  async upsertSession(params: UpsertSessionParams) {
    const query = sessionManagerQueries.upsertSession(params);
    return await callAgent(query);
  },

  /**
   * Get a session
   */
  async getSession(params: GetSessionParams) {
    const query = sessionManagerQueries.getSession(params);
    return await callAgent(query);
  },

  // ========================================================================
  // PIPELINE PROCESSOR
  // ========================================================================

  /**
   * Listen to retrieval queue
   */
  async listenToRetrievalQueue(params: ListenToRetrievalQueueParams = {}) {
    const query = pipelineProcessorQueries.listenToRetrievalQueue(params);
    return await callAgent(query);
  },

  /**
   * Process video pipeline
   */
  async processVideoPipeline(params: ProcessVideoPipelineParams) {
    const query = pipelineProcessorQueries.processVideoPipeline(params);
    return await callAgent(query);
  },

  // ========================================================================
  // ATHLETE/COACH API
  // ========================================================================

  /**
   * Create a user
   */
  async createUser(params: CreateUserParams) {
    const query = athleteCoachQueries.createUser(params);
    return await callAgent(query);
  },

  /**
   * Login
   */
  async login(params: LoginParams) {
    const query = athleteCoachQueries.login(params);
    return await callAgent(query);
  },

  /**
   * Get athlete sessions
   */
  async getAthleteSessions(params: GetAthleteSessionsParams) {
    const query = athleteCoachQueries.getAthleteSessions(params);
    return await callAgent(query);
  },

  /**
   * Get athlete details
   */
  async getAthleteDetails(params: GetAthleteDetailsParams) {
    const query = athleteCoachQueries.getAthleteDetails(params);
    return await callAgent(query);
  },

  /**
   * Get athlete alerts
   */
  async getAthleteAlerts(params: GetAthleteAlertsParams) {
    const query = athleteCoachQueries.getAthleteAlerts(params);
    // Use the existing getAlerts method which has better response parsing
    return await mcpService.getAlerts({
      athlete_id: params.athlete_id,
      include_stream_urls: params.include_stream_urls !== false,
      include_insights: params.include_insights !== false,
      include_metrics: params.include_metrics !== false,
      limit: params.limit || 50,
    });
  },

  /**
   * Get athlete insights
   */
  async getAthleteInsights(params: GetAthleteInsightsParams) {
    const query = athleteCoachQueries.getAthleteInsights(params);
    // Use the existing getInsights method which has better response parsing
    return await mcpService.getInsights({
      athlete_id: params.athlete_id,
      limit: params.limit || 50,
      activity: params.activity,
      technique: params.technique,
    });
  },

  /**
   * Get athlete trends
   */
  async getAthleteTrends(params: GetAthleteTrendsParams) {
    const query = athleteCoachQueries.getAthleteTrends(params);
    return await callAgent(query);
  },

  /**
   * Get all sessions
   */
  async getAllSessions(params: GetAllSessionsParams = {}) {
    const query = athleteCoachQueries.getAllSessions(params);
    return await callAgent(query);
  },

  /**
   * Get all athletes
   */
  async getAllAthletes(params: GetAllAthletesParams = {}) {
    const query = athleteCoachQueries.getAllAthletes(params);
    return await callAgent(query);
  },

  /**
   * Get alert queue messages
   */
  async getAlertQueueMessages(params: GetAlertQueueMessagesParams = {}) {
    const query = athleteCoachQueries.getAlertQueueMessages(params);
    return await callAgent(query);
  },
};

// ============================================================================
// HELPER FUNCTION - Call Agent with Query
// ============================================================================

/**
 * Call the MCP service agent with a natural language query
 */
async function callAgent(query: string) {
  try {
    console.log(`📞 Calling MCP agent with query: ${query}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(`${MCP_SERVICE_URL}/api/agent-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
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
    console.log('✅ MCP agent response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error calling MCP agent:', error);

    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The MCP service may be taking too long to respond.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot connect to MCP service at ${MCP_SERVICE_URL}. Make sure the service is running on port 8004.`;
      }
    }

    return {
      success: false,
      error: errorMessage,
      output: null,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default mcpQueryService;




