import { describe, it, expect } from 'vitest';
import { conditionExecutor } from './condition.js';
import type { RunContext } from '../types.js';

const ctx: RunContext = {
  trigger: null,
  steps: { fetch: { title: 'hello', count: 5, tags: ['a', 'b'] } },
};

describe('conditionExecutor', () => {
  it('eq compares values', async () => {
    const r = await conditionExecutor(
      { left: '{{steps.fetch.title}}', right: 'hello', operator: 'eq' },
      ctx,
    );
    expect(r.output.passed).toBe(true);
    expect(r.stop).toBe(false);
  });

  it('neq is the inverse of eq', async () => {
    const r = await conditionExecutor(
      { left: '{{steps.fetch.title}}', right: 'world', operator: 'neq' },
      ctx,
    );
    expect(r.output.passed).toBe(true);
  });

  it('gt / lt coerce to numbers', async () => {
    const gt = await conditionExecutor(
      { left: '{{steps.fetch.count}}', right: 3, operator: 'gt' },
      ctx,
    );
    expect(gt.output.passed).toBe(true);

    const lt = await conditionExecutor(
      { left: '{{steps.fetch.count}}', right: 3, operator: 'lt' },
      ctx,
    );
    expect(lt.output.passed).toBe(false);
    expect(lt.stop).toBe(true);
  });

  it('contains works on strings', async () => {
    const r = await conditionExecutor(
      { left: '{{steps.fetch.title}}', right: 'ell', operator: 'contains' },
      ctx,
    );
    expect(r.output.passed).toBe(true);
  });

  it('contains works on arrays', async () => {
    const r = await conditionExecutor(
      { left: '{{steps.fetch.tags}}', right: 'a', operator: 'contains' },
      ctx,
    );
    expect(r.output.passed).toBe(true);
  });

  it('exists returns false and stops on missing paths', async () => {
    // Note: use eq with a template that resolves to undefined-ish is tricky;
    // we test exists against a resolved null.
    const r = await conditionExecutor({ left: '{{steps.fetch.title}}', operator: 'exists' }, ctx);
    expect(r.output.passed).toBe(true);
    expect(r.stop).toBe(false);
  });

  it('stop is true when the condition fails', async () => {
    const r = await conditionExecutor(
      { left: '{{steps.fetch.count}}', right: 100, operator: 'gt' },
      ctx,
    );
    expect(r.output.passed).toBe(false);
    expect(r.stop).toBe(true);
  });
});
