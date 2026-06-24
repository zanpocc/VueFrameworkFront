/**
 * 流程节点自动布局：按拓扑序生成 Vue Flow 坐标。
 *
 * 算法：
 * 1. 按 transition 的 from→to 计算每个节点的"层级"（最长路径长度），其中 START 为 0。
 * 2. 没有入度的节点（孤儿）默认为第 0 层；不可达节点按 sortOrder 兜底排在末层。
 * 3. 同一层级内按 sortOrder 排序，从上到下垂直堆叠。
 * 4. 横向间距 240、纵向间距 120，节点自身视为 180×80。
 *
 * 这是个纯函数，没副作用，方便测试。
 */
import type { DefinitionNode, DefinitionTransition } from '@/api/workflow';

export interface XY {
  x: number;
  y: number;
}

const COLUMN_STEP = 240;
const ROW_STEP = 120;
const ORIGIN_X = 60;
const ORIGIN_Y = 40;

export function autoLayout(
  nodes: DefinitionNode[],
  transitions: DefinitionTransition[],
): Map<string, XY> {
  const positions = new Map<string, XY>();
  if (nodes.length === 0) return positions;

  // 1. 收集邻接表与入度
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  nodes.forEach((node) => {
    adjacency.set(node.nodeKey, []);
    indegree.set(node.nodeKey, 0);
  });
  transitions.forEach((edge) => {
    if (!adjacency.has(edge.fromNodeKey) || !indegree.has(edge.toNodeKey)) return;
    adjacency.get(edge.fromNodeKey)!.push(edge.toNodeKey);
    indegree.set(edge.toNodeKey, (indegree.get(edge.toNodeKey) ?? 0) + 1);
  });

  // 2. 计算层级（最长路径，BFS 用拓扑队列）
  // 优先种子：START 节点；如果没有 START，回落到所有入度为 0 的节点。
  // 这样写的目的是：APPROVAL 类型的孤儿节点（无入边但也不是流程起点）会留到
  // 最后一层后面，而不是与 START 同列。
  const level = new Map<string, number>();
  const queue: string[] = [];
  const startNodes = nodes.filter((n) => n.nodeType === 'START');
  const seedNodes =
    startNodes.length > 0
      ? startNodes
      : nodes.filter((n) => (indegree.get(n.nodeKey) ?? 0) === 0);
  seedNodes.forEach((node) => {
    level.set(node.nodeKey, 0);
    queue.push(node.nodeKey);
  });

  // 复制入度供 Kahn 算法消费
  const pendingIn = new Map(indegree);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = level.get(current) ?? 0;
    for (const next of adjacency.get(current) ?? []) {
      const proposed = currentLevel + 1;
      const existing = level.get(next);
      if (existing === undefined || proposed > existing) {
        level.set(next, proposed);
      }
      const remaining = (pendingIn.get(next) ?? 1) - 1;
      pendingIn.set(next, remaining);
      if (remaining === 0) {
        queue.push(next);
      }
    }
  }

  // 3. 不可达节点（环 / 孤岛）按 sortOrder 排在最后一层后面
  const maxLevel = Math.max(0, ...level.values());
  nodes.forEach((node) => {
    if (!level.has(node.nodeKey)) {
      level.set(node.nodeKey, maxLevel + 1);
    }
  });

  // 4. 按层分组并排序
  const buckets = new Map<number, DefinitionNode[]>();
  nodes.forEach((node) => {
    const lvl = level.get(node.nodeKey) ?? 0;
    if (!buckets.has(lvl)) buckets.set(lvl, []);
    buckets.get(lvl)!.push(node);
  });

  buckets.forEach((bucket) => {
    bucket.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.nodeKey.localeCompare(b.nodeKey);
    });
  });

  // 5. 输出坐标
  buckets.forEach((bucket, lvl) => {
    const x = ORIGIN_X + lvl * COLUMN_STEP;
    bucket.forEach((node, rowIdx) => {
      positions.set(node.nodeKey, {
        x,
        y: ORIGIN_Y + rowIdx * ROW_STEP,
      });
    });
  });

  return positions;
}
