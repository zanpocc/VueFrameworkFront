import { describe, expect, it } from 'vitest';
import {
  operatorsFor,
  serializeVisual,
  parseVisual,
  detectMode,
} from '../conditionSerializer';

describe('conditionSerializer', () => {
  describe('operatorsFor', () => {
    it('returns ordering operators for number fields', () => {
      expect(operatorsFor('number')).toEqual(['==', '!=', '>', '<', '>=', '<=']);
    });

    it('returns ordering operators for date fields', () => {
      expect(operatorsFor('date')).toEqual(['==', '!=', '>', '<', '>=', '<=']);
    });

    it('returns only equality operators for text/enum fields', () => {
      expect(operatorsFor('select')).toEqual(['==', '!=']);
      expect(operatorsFor('input')).toEqual(['==', '!=']);
    });
  });

  describe('serializeVisual', () => {
    it('emits a numeric literal for number fields', () => {
      expect(serializeVisual('amount', '>', '10000', 'number')).toBe('amount > 10000');
    });

    it('quotes string values for enum/text fields', () => {
      expect(serializeVisual('type', '==', 'URGENT', 'select')).toBe("type == 'URGENT'");
    });

    it('escapes single quotes in string values', () => {
      expect(serializeVisual('name', '==', "o'clock", 'input')).toBe("name == 'o\\'clock'");
    });

    it('treats empty numeric value as 0', () => {
      expect(serializeVisual('amount', '==', '', 'number')).toBe('amount == 0');
    });
  });

  describe('parseVisual', () => {
    it('parses a numeric comparison back to a predicate', () => {
      expect(parseVisual('amount > 10000')).toEqual({
        field: 'amount',
        op: '>',
        value: '10000',
      });
    });

    it('parses a quoted string comparison', () => {
      expect(parseVisual("type == 'URGENT'")).toEqual({
        field: 'type',
        op: '==',
        value: 'URGENT',
      });
    });

    it('returns null for multi-clause expressions', () => {
      expect(parseVisual("amount > 10000 && type == 'URGENT'")).toBeNull();
    });

    it('returns null for non-predicate text', () => {
      expect(parseVisual('just some text')).toBeNull();
    });
  });

  describe('detectMode', () => {
    it('detects NONE for empty/null', () => {
      expect(detectMode('')).toBe('NONE');
      expect(detectMode(null)).toBe('NONE');
      expect(detectMode(undefined)).toBe('NONE');
    });

    it('detects VISUAL for a single predicate', () => {
      expect(detectMode('amount > 10000')).toBe('VISUAL');
    });

    it('detects EXPRESSION for a multi-clause body', () => {
      expect(detectMode("amount > 10000 && type == 'URGENT'")).toBe('EXPRESSION');
    });
  });

  describe('round-trip', () => {
    it('visual serialize then parse recovers the predicate', () => {
      const body = serializeVisual('amount', '>=', '5000', 'number');
      expect(parseVisual(body)).toEqual({ field: 'amount', op: '>=', value: '5000' });
    });
  });
});
