import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';
import { describe, expect, it } from 'vitest';
import WorkflowDiagram from '../WorkflowDiagram.vue';
import type { DefinitionNode, DefinitionTransition } from '@/api/workflow';

const nodes: DefinitionNode[] = [
  {
    id: 1,
    definitionId: 1,
    nodeKey: 'start',
    nodeName: '开始',
    nodeType: 'START',
    assigneeType: 'USER',
    assigneeValue: null,
    sortOrder: 1,
    posX: null,
    posY: null,
    createdAt: '2026-06-15T00:00:00',
  },
  {
    id: 2,
    definitionId: 1,
    nodeKey: 'review',
    nodeName: '主管审批',
    nodeType: 'APPROVAL',
    assigneeType: 'USER',
    assigneeValue: 'admin',
    sortOrder: 2,
    posX: null,
    posY: null,
    createdAt: '2026-06-15T00:00:00',
  },
  {
    id: 3,
    definitionId: 1,
    nodeKey: 'end',
    nodeName: '结束',
    nodeType: 'END',
    assigneeType: 'USER',
    assigneeValue: null,
    sortOrder: 3,
    posX: null,
    posY: null,
    createdAt: '2026-06-15T00:00:00',
  },
];

const transitions: DefinitionTransition[] = [
  {
    id: 1,
    definitionId: 1,
    fromNodeKey: 'start',
    toNodeKey: 'review',
    action: 'SUBMIT',
    conditionExpression: null,
    sortOrder: 1,
    createdAt: '2026-06-15T00:00:00',
  },
  {
    id: 2,
    definitionId: 1,
    fromNodeKey: 'review',
    toNodeKey: 'end',
    action: 'APPROVE',
    conditionExpression: null,
    sortOrder: 1,
    createdAt: '2026-06-15T00:00:00',
  },
  {
    id: 3,
    definitionId: 1,
    fromNodeKey: 'review',
    toNodeKey: 'start',
    action: 'REJECT',
    conditionExpression: null,
    sortOrder: 2,
    createdAt: '2026-06-15T00:00:00',
  },
];

describe('WorkflowDiagram', () => {
  it('renders nodes, main transitions, branch transitions and active state', () => {
    const wrapper = mount(WorkflowDiagram, {
      props: {
        nodes,
        transitions,
        activeNodeKey: 'review',
        visitedNodeKeys: ['start', 'review'],
      },
      global: { plugins: [ElementPlus] },
    });

    expect(wrapper.text()).toContain('开始');
    expect(wrapper.text()).toContain('主管审批');
    expect(wrapper.text()).toContain('SUBMIT');
    expect(wrapper.text()).toContain('REJECT');
    expect(wrapper.find('.workflow-diagram__node--active').text()).toContain('主管审批');
    expect(wrapper.findAll('.workflow-diagram__node--visited')).toHaveLength(2);
  });

  it('renders empty state when there are no nodes', () => {
    const wrapper = mount(WorkflowDiagram, {
      props: { nodes: [], transitions: [] },
      global: { plugins: [ElementPlus] },
    });

    expect(wrapper.text()).toContain('暂无流程节点');
  });
});
