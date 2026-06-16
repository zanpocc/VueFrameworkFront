import { describe, expect, it, vi } from 'vitest';
import { workflowApi } from '@/api/workflow';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  unwrap: vi.fn((response: { data: unknown }) => response.data),
}));

vi.mock('@/api/http', () => ({
  http: {
    post: mocks.post,
  },
  unwrap: mocks.unwrap,
}));

describe('workflowApi', () => {
  it('imports definition model through the model import endpoint', async () => {
    const payload = {
      nodes: [
        { nodeKey: 'start', nodeName: '开始', nodeType: 'START', sortOrder: 0 },
        {
          nodeKey: 'review',
          nodeName: '审批',
          nodeType: 'APPROVAL',
          assigneeType: 'USER',
          assigneeValue: 'admin',
          sortOrder: 1,
        },
      ],
      transitions: [{ fromNodeKey: 'start', toNodeKey: 'review', action: 'SUBMIT', sortOrder: 0 }],
    };
    mocks.post.mockResolvedValueOnce({ data: { data: { nodes: [], transitions: [] } } });

    await workflowApi.importDefinitionModel(7, payload);

    expect(mocks.post).toHaveBeenCalledWith('/workflow/definitions/7/model/import', payload);
  });
});
