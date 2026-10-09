import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/http', () => ({
  http: { get: vi.fn(), post: vi.fn() },
  unwrap: (response: {
    data: { success: boolean; code: string; message: string; data: unknown };
  }) => {
    if (!response.data.success) throw new Error(response.data.message || response.data.code);
    return response.data.data;
  },
}));

import { agentApi } from '@/api/agent';
import { http } from '@/api/http';

const get = vi.mocked(http.get);
const post = vi.mocked(http.post);

function ok<T>(data: T) {
  return Promise.resolve({
    data: { success: true, code: 'OK', message: 'success', data, timestamp: '' },
  });
}

beforeEach(() => vi.clearAllMocks());

describe('agentApi', () => {
  it('loads the Java-owned tool catalog', async () => {
    get.mockReturnValue(ok([{ name: 'rag_search', description: 'search', inputSchema: {} }]));

    const result = await agentApi.tools();

    expect(result[0]?.name).toBe('rag_search');
    expect(get).toHaveBeenCalledWith('/agent/tools');
  });

  it('calls the Spring AI Agent through the Java endpoint', async () => {
    post.mockReturnValue(
      ok({
        runId: 'run-1',
        status: 'SUCCEEDED',
        phase: 'COMPLETED',
        orchestrator: 'SPRING_AI',
        model: 'qwen3.5:4b',
        intent: 'definition',
        answer: 'answer',
        citations: [],
        evidenceIndexes: [1],
        grounded: true,
        retrievalCount: 1,
        toolCalls: [{ name: 'rag_search', status: 'SUCCEEDED' }],
      }),
    );

    await agentApi.chat({ knowledgeBaseId: '7', question: 'What is CR3?', topK: 3 });

    expect(post).toHaveBeenCalledWith(
      '/agent/chat',
      { knowledgeBaseId: '7', question: 'What is CR3?', topK: 3 },
      { timeout: 180000 },
    );
  });
});
