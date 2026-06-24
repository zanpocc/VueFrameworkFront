/**
 * Vue Flow 画布数据模型。
 *
 * - {@link CanvasNodeData} 描述 Vue Flow 节点 `data` 字段，承载 DefinitionNode 关键属性。
 * - {@link CanvasEdgeData} 描述 Vue Flow 边 `data` 字段，承载 DefinitionTransition 关键属性。
 *
 * 这里只放与画布渲染、调度相关的轻量数据；持久化模型完整字段以 `@/api/workflow` 为准。
 */

export interface CanvasNodeData {
  /** 节点显示名（一般等于 nodeName）。 */
  label: string;
  /** 业务节点编码。 */
  nodeKey: string;
  /** START / APPROVAL / END。 */
  nodeType: string;
  /** USER / ROLE / DEPT / POST。 */
  assigneeType?: string | null;
  /** 审批人值（用户名 / 角色编码 / 部门ID / 岗位编码）。 */
  assigneeValue?: string | null;
  /** 排序，与 DefinitionNode.sortOrder 一致。 */
  sortOrder?: number;
  /** 原始 DB id（新增节点暂时为 null）。 */
  rawId?: number | null;
}

export interface CanvasEdgeData {
  /** 数据库主键（新增边为 null）。 */
  rawId?: number | null;
  /** APPROVE / REJECT / SUBMIT 等动作字面量。 */
  action: string;
  /** 条件表达式（NONE 模式为 null）。 */
  conditionExpression?: string | null;
  /** 排序。 */
  sortOrder?: number;
}

export type CanvasNodeType = 'start' | 'approval' | 'end';

export function toCanvasNodeType(nodeType: string): CanvasNodeType {
  switch (nodeType) {
    case 'START':
      return 'start';
    case 'END':
      return 'end';
    default:
      return 'approval';
  }
}

export function fromCanvasNodeType(canvasType: CanvasNodeType): string {
  switch (canvasType) {
    case 'start':
      return 'START';
    case 'end':
      return 'END';
    default:
      return 'APPROVAL';
  }
}
