/**
 * MCP Service Client
 * Calls the session_mcp_server run_pipeline tool directly via MCP
 */

const MCP_SERVICE_URL = import.meta.env.VITE_MCP_SERVICE_URL || 'http://localhost:8004';
const SESSION_MANAGER_URL = import.meta.env.VITE_SESSION_MANAGER_URL || 'http://localhost:8000/mcp';

export interface RunPipelineResponse {
  status: string;
  message: string;
  call_id: string;
  callId?: string;
  pid?: number;
  log_path?: string;
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
  warning?: string;
  error?: string;
}

type AgentQueryResponse = {
  success?: boolean;
  error?: string;
  output?: any;
  messages?: any[];
};

class MCPService {
  private extractFirstJsonObject(text: string): any | null {
    const start = text.indexOf("{");
    if (start < 0) return null;

    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;

      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
  /**
   * Call run_pipeline tool via MCP service test-tool endpoint
   */

  async runPipelineWithQuery(
    callId: string,
    callType: string = "default",
    activity: string = "gymnastics",
    technique?: string,
    userRequests?: string[],
    waitForCompletion: boolean = false
  ): Promise<RunPipelineResponse> {
    try {
      console.log(`📞 Calling agent service: ${MCP_SERVICE_URL}/api/agent-query`);
      console.log(`   Call ID: ${callId}`);

      const query = [
        `Start a video call pipeline and fully orchestrate the workflow.`,
        `call_id: ${callId}`,
        `call_type: ${callType}`,
        `activity: ${activity}`,
        technique ? `technique: ${technique}` : null,
        userRequests?.length ? `user_requests: ${userRequests.join(" | ")}` : null,
        `wait_for_completion: ${waitForCompletion}`,
        ``,
        `Return ONLY a single JSON object with the final pipeline start/summary fields (no extra text).`,
      ]
        .filter((x): x is string => Boolean(x))
        .join("\n");

      const response = await fetch(`${MCP_SERVICE_URL}/api/agent-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const data = (await response.json()) as AgentQueryResponse;

      if (!data?.success) {
        throw new Error(data?.error || "Agent query failed");
      }

      let result: any = data.output;

      // Agent typically returns final message as a string. Parse it.
      if (typeof result === "string") {
        try {
          result = JSON.parse(result);
        } catch {
          const extracted = this.extractFirstJsonObject(result);
          if (extracted) {
            result = extracted;
          } else {
            return {
              status: "error",
              message:
                "Agent did not return JSON output. Check SYSTEM_PROMPT or agent formatting.",
              call_id: callId,
              callId,
              error: String(data.output),
            };
          }
        }
      }

      return {
        status: result.status || "success",
        message: result.message || "Pipeline started",
        call_id: result.call_id || result.callId || callId,
        callId: result.callId || result.call_id || callId,
        pid: result.pid,
        log_path: result.log_path,
        redirectUrl: result.redirectUrl,
        frontendUrl: result.frontendUrl,
        streamUrl: result.streamUrl,
        rtmpUrl: result.rtmpUrl,
        srtUrl: result.srtUrl,
        demoJoinUrl: result.demoJoinUrl,
        streamApiKey: result.streamApiKey,
        streamSessionId: result.streamSessionId,
        cid: result.cid,
        callData: result.callData,
        warning: result.warning,
        error: result.error,
      };
    } catch (error: any) {
      console.error("❌ Error calling /api/agent-query:", error);

      let errorMessage = "Failed to start pipeline via agent-query";
      if (error?.message) errorMessage = error.message;
      else if (typeof error === "string") errorMessage = error;

      if (
        error instanceof TypeError &&
        String(error.message || "").includes("fetch")
      ) {
        errorMessage = `Cannot connect to MCP service at ${MCP_SERVICE_URL}. Make sure it is running (port 8004).`;
      }

      return {
        status: "error",
        message: errorMessage,
        call_id: callId,
        callId,
        error: errorMessage,
      };
    }
  }

  // async runPipelineWithQuery(
  //   callId: string,
  //   callType: string = "default",
  //   activity: string = "gymnastics",
  //   technique?: string,
  //   userRequests?: string[],
  //   waitForCompletion: boolean = false
  // ): Promise<RunPipelineResponse> {
  //   try {
  //     console.log(`📞 Calling MCP service: ${MCP_SERVICE_URL}/api/agent-query`);
  //     console.log(`   Tool: run_pipeline`);
  //     console.log(`   Call ID: ${callId}`);

  //     const response = await fetch(`${MCP_SERVICE_URL}/api/agent-query`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         tool_name: 'run_pipeline',
  //         server_name: 'session_manager',
  //         args: {
  //           call_id: callId,
  //           call_type: callType,
  //           activity: activity,
  //           technique: technique,
  //           user_requests: userRequests,
  //           wait_for_completion: waitForCompletion,
  //         },
  //       }),
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  //     }

  //     const data = await response.json();

  //     if (!data.success) {
  //       throw new Error(data.error || 'MCP tool call failed');
  //     }

  //     // Parse the result (it might be a JSON string)
  //     let result = data.result;
  //     if (typeof result === 'string') {
  //       try {
  //         result = JSON.parse(result);
  //       } catch (e) {
  //         // If parsing fails, return the string as message
  //         return {
  //           status: 'error',
  //           message: result,
  //           call_id: callId,
  //           error: 'Failed to parse MCP tool response',
  //         };
  //       }
  //     } else if (Array.isArray(result) && result.length > 0) {
  //       // Handle array response (sometimes MCP returns array with text field)
  //       const firstItem = result[0];
  //       if (firstItem && typeof firstItem === 'object' && 'text' in firstItem) {
  //         try {
  //           result = JSON.parse(firstItem.text);
  //         } catch (e) {
  //           return {
  //             status: 'error',
  //             message: firstItem.text || 'Unknown error',
  //             call_id: callId,
  //             error: 'Failed to parse MCP tool response',
  //           };
  //         }
  //       }
  //     }

  //     console.log('✅ MCP run_pipeline response:', result);

  //     // Map to StartAgentResponse-like structure
  //     return {
  //       status: result.status || 'success',
  //       message: result.message || 'Pipeline started',
  //       call_id: result.call_id || result.callId || callId,
  //       callId: result.callId || result.call_id || callId,
  //       pid: result.pid,
  //       log_path: result.log_path,
  //       redirectUrl: result.redirectUrl,
  //       frontendUrl: result.frontendUrl,
  //       streamUrl: result.streamUrl,
  //       rtmpUrl: result.rtmpUrl,
  //       srtUrl: result.srtUrl,
  //       demoJoinUrl: result.demoJoinUrl,
  //       streamApiKey: result.streamApiKey,
  //       streamSessionId: result.streamSessionId,
  //       cid: result.cid,
  //       callData: result.callData,
  //       warning: result.warning,
  //       error: result.error,
  //     };
  //   } catch (error: any) {
  //     console.error('❌ Error calling MCP run_pipeline:', error);
      
  //     let errorMessage = 'Failed to start pipeline via MCP';
  //     if (error.message) {
  //       errorMessage = error.message;
  //     } else if (typeof error === 'string') {
  //       errorMessage = error;
  //     }

  //     // Check if it's a network error
  //     if (error instanceof TypeError && error.message.includes('fetch')) {
  //       errorMessage = `Cannot connect to MCP service at ${MCP_SERVICE_URL}. Make sure the MCP service is running on port 8004.`;
  //     }

  //     return {
  //       status: 'error',
  //       message: errorMessage,
  //       call_id: callId,
  //       error: errorMessage,
  //     };
  //   }
  // }
  async runPipeline(
    callId: string,
    callType: string = "default",
    activity: string = "gymnastics",
    technique?: string,
    userRequests?: string[],
    waitForCompletion: boolean = false
  ): Promise<RunPipelineResponse> {
    try {
      console.log(`📞 Calling MCP service: ${MCP_SERVICE_URL}/api/test-tool`);
      console.log(`   Tool: run_pipeline`);
      console.log(`   Call ID: ${callId}`);

      const response = await fetch(`${MCP_SERVICE_URL}/api/test-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool_name: 'run_pipeline',
          server_name: 'session_manager',
          args: {
            call_id: callId,
            call_type: callType,
            activity: activity,
            technique: technique,
            user_requests: userRequests,
            wait_for_completion: waitForCompletion,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'MCP tool call failed');
      }

      // Parse the result (it might be a JSON string)
      let result = data.result;
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch (e) {
          // If parsing fails, return the string as message
          return {
            status: 'error',
            message: result,
            call_id: callId,
            error: 'Failed to parse MCP tool response',
          };
        }
      } else if (Array.isArray(result) && result.length > 0) {
        // Handle array response (sometimes MCP returns array with text field)
        const firstItem = result[0];
        if (firstItem && typeof firstItem === 'object' && 'text' in firstItem) {
          try {
            result = JSON.parse(firstItem.text);
          } catch (e) {
            return {
              status: 'error',
              message: firstItem.text || 'Unknown error',
              call_id: callId,
              error: 'Failed to parse MCP tool response',
            };
          }
        }
      }

      console.log('✅ MCP run_pipeline response:', result);

      // Map to StartAgentResponse-like structure
      return {
        status: result.status || 'success',
        message: result.message || 'Pipeline started',
        call_id: result.call_id || result.callId || callId,
        callId: result.callId || result.call_id || callId,
        pid: result.pid,
        log_path: result.log_path,
        redirectUrl: result.redirectUrl,
        frontendUrl: result.frontendUrl,
        streamUrl: result.streamUrl,
        rtmpUrl: result.rtmpUrl,
        srtUrl: result.srtUrl,
        demoJoinUrl: result.demoJoinUrl,
        streamApiKey: result.streamApiKey,
        streamSessionId: result.streamSessionId,
        cid: result.cid,
        callData: result.callData,
        warning: result.warning,
        error: result.error,
      };
    } catch (error: any) {
      console.error('❌ Error calling MCP run_pipeline:', error);
      
      let errorMessage = 'Failed to start pipeline via MCP';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `Cannot connect to MCP service at ${MCP_SERVICE_URL}. Make sure the MCP service is running on port 8004.`;
      }

      return {
        status: 'error',
        message: errorMessage,
        call_id: callId,
        error: errorMessage,
      };
    }
  }
}

export const mcpService = new MCPService();
