import { describe, it, expect } from 'vitest';
import { autoLayout } from '../autoLayout';
import type { DefinitionNode, DefinitionTransition } from '@/api/workflow';

function buildNode(
  nodeKey: string,
  nodeType = 'APPROVAL',
  sortOrder = 0,
): DefinitionNode {
  return {
    id: 0,
    definitionId: 1,
    nodeKey,
    nodeName: nodeKey,
    nodeType,
    assigneeType: 'USER',
    assigneeValue: null,
    multiMode: null,
    sortOrder,
    posX: null,
    posY: null,
    createdAt: '2026-06-23T00:00:00Z',
  };
}

function buildEdge(from: string, to: string): DefinitionTransition {
  return {
    id: 0,
    definitionId: 1,
    fromNodeKey: from,
    toNodeKey: to,
    action: 'NEXT',
    conditionExpression: null,
    sortOrder: 0,
    createdAt: '2026-06-23T00:00:00Z',
  };
}

describe('autoLayout', () => {
  it('returns empty map for empty nodes', () => {
    expect(autoLayout([], [])).toEqual(new Map());
  });

  it('places a linear chain into ascending columns', () => {
    const nodes = [
      buildNode('start', 'START'),
      buildNode('a'),
      buildNode('b'),
      buildNode('end', 'END'),
    ];
    const edges = [buildEdge('start', 'a'), buildEdge('a', 'b'), buildEdge('b', 'end')];

    const layout = autoLayout(nodes, edges);

    const startX = layout.get('start')!.x;
    const aX = layout.get('a')!.x;
    const bX = layout.get('b')!.x;
    const endX = layout.get('end')!.x;

    expect(aX).toBeGreaterThan(startX);
    expect(bX).toBeGreaterThan(aX);
    expect(endX).toBeGreaterThan(bX);
  });

  it('stacks siblings of the same level vertically', () => {
    const nodes = [
      buildNode('start', 'START'),
      buildNode('a', 'APPROVAL', 0),
      buildNode('b', 'APPROVAL', 1),
    ];
    const edges = [buildEdge('start', 'a'), buildEdge('start', 'b')];

    const layout = autoLayout(nodes, edges);

    const a = layout.get('a')!;
    const b = layout.get('b')!;

    expect(a.x).toBe(b.x);
    expect(b.y).toBeGreaterThan(a.y);
  });

  it('places unreachable nodes after the deepest level', () => {
    const nodes = [
      buildNode('start', 'START'),
      buildNode('a'),
      buildNode('orphan'),
    ];
    const edges = [buildEdge('start', 'a')];

    const layout = autoLayout(nodes, edges);

    const a = layout.get('a')!;
    const orphan = layout.get('orphan')!;

    expect(orphan.x).toBeGreaterThan(a.x);
  });
});
