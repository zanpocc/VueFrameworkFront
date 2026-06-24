import type { FormField, FormFieldType } from '@/form-engine/types';

/**
 * Condition serialization for workflow transitions.
 *
 * The backend stores the bare expression body in `wf_process_transition.condition_expression`
 * (e.g. `amount > 10000`); `BpmnModelConverter` wraps it in `${...}` when emitting BPMN.
 * So this module deals only with the bare body.
 *
 * Two authoring modes are supported:
 *  - VISUAL: a single `<field> <op> <value>` predicate, friendly for simple branching.
 *  - EXPRESSION: a free-form JUEL body for flexible multi-clause conditions.
 */

export type ConditionOp = '==' | '!=' | '>' | '<' | '>=' | '<=';

export interface VisualCondition {
  field: string;
  op: ConditionOp;
  /** Stored as a string in the UI; serialized with quoting decided by field type. */
  value: string;
}

const OPS: ConditionOp[] = ['==', '!=', '>', '<', '>=', '<='];

const NUMERIC_OR_DATE: FormFieldType[] = ['number', 'date'];

/** Operators applicable to a field type. Numeric/date fields support ordering;
 *  text/enum fields only support equality. */
export function operatorsFor(fieldType: FormFieldType | undefined): ConditionOp[] {
  if (fieldType && NUMERIC_OR_DATE.includes(fieldType)) {
    return ['==', '!=', '>', '<', '>=', '<='];
  }
  return ['==', '!='];
}

function isNumericField(fieldType: FormFieldType | undefined): boolean {
  return !!fieldType && fieldType === 'number';
}

/** Serialize a visual predicate to a bare JUEL expression body. */
export function serializeVisual(
  field: string,
  op: ConditionOp,
  value: string,
  fieldType: FormFieldType | undefined,
): string {
  const trimmed = value.trim();
  if (isNumericField(fieldType)) {
    // number field: emit as a numeric literal (no quotes)
    return `${field} ${op} ${trimmed === '' ? '0' : trimmed}`;
  }
  // string-ish field: wrap value in single quotes
  return `${field} ${op} '${trimmed.replace(/'/g, "\\'")}'`;
}

/**
 * Parse a bare expression body back into a visual predicate.
 * Returns null when the body is not a single `<field> <op> <value>` clause
 * (e.g. multi-clause `a > 1 && b == 2`), in which case the UI falls back to
 * EXPRESSION mode. The value side is constrained to one literal — a quoted
 * string, a boolean, or a number — so composite bodies don't match.
 */
export function parseVisual(expr: string): VisualCondition | null {
  const literal = "'(?:[^'\\\\]|\\\\.)*'|\"(?:[^\"\\\\]|\\\\.)*\"|true|false|-?\\d+(?:\\.\\d+)?";
  const match = expr
    .trim()
    .match(new RegExp(`^([A-Za-z_][\\w.]*)\\s*(==|!=|>=|<=|>|<)\\s*(${literal})\\s*$`));
  if (!match) return null;
  const [, field, op, rawValue] = match;
  if (!OPS.includes(op as ConditionOp)) return null;
  let value = rawValue.trim();
  // strip surrounding single or double quotes
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1).replace(/\\'/g, "'");
  }
  return { field, op: op as ConditionOp, value };
}

/** Detect the most fitting authoring mode for an existing expression body. */
export function detectMode(expr: string | null | undefined): 'NONE' | 'VISUAL' | 'EXPRESSION' {
  if (!expr || expr.trim() === '') return 'NONE';
  return parseVisual(expr) ? 'VISUAL' : 'EXPRESSION';
}

/** Resolve the FormField for a key from a schema's field list. */
export function findField(fields: FormField[], key: string): FormField | undefined {
  return fields.find((f) => f.key === key);
}
