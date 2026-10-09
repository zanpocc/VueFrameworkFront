import { http, unwrap, type ApiResult } from './http';
import type { Citation, PlatformId } from './rag';

export interface AgentToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AgentToolCall {
  name: string;
  status: string;
  summary?: string;
}

export interface AgentChatResponse {
  runId: string;
  status: 'SUCCEEDED' | 'FAILED' | string;
  phase: string;
  orchestrator: string;
  model: string;
  intent: string;
  answer: string;
  citations: Citation[];
  evidenceIndexes: number[];
  grounded: boolean;
  retrievalCount: number;
  toolCalls: AgentToolCall[];
}

export interface AgentRunView extends AgentChatResponse {
  knowledgeBaseId: PlatformId;
  question: string;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
}

export const agentApi = {
  tools() {
    return http.get<ApiResult<AgentToolDefinition[]>>('/agent/tools').then(unwrap);
  },
  chat(payload: { knowledgeBaseId: PlatformId; question: string; topK?: number }) {
    return http
      .post<ApiResult<AgentChatResponse>>('/agent/chat', payload, { timeout: 180000 })
      .then(unwrap);
  },
  run(runId: string) {
    return http.get<ApiResult<AgentRunView>>(`/agent/runs/${runId}`).then(unwrap);
  },
};
