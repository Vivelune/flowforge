import { describe, it, expect } from 'vitest';
import { resolveTemplate } from './template';
import type { RunContext } from './types';

const ctx: RunContext = {
  trigger: { userId: 'u1', count: 3 },
  steps: {
    fetch: { title: 'hello', tags: ['a', 'b'] },
    shape: { nested: { deep: 42 } },
  },
};

describe('resolveTemplate', () => {
  it('resolves a whole-value template to a raw value', () => {
    expect(resolveTemplate('{{trigger.userId}}', ctx)).toBe('u1');
    expect(resolveTemplate('{{steps.fetch.tags}}', ctx)).toEqual(['a', 'b']);
  });

  it('resolves embedded templates inside a string', () => {
    expect(resolveTemplate('user={{trigger.userId}}', ctx)).toBe('user=u1');
  });

  it('resolves dotted paths into nested objects', () => {
    expect(resolveTemplate('{{steps.shape.nested.deep}}', ctx)).toBe(42);
  });

  it('resolves array indexes', () => {
    expect(resolveTemplate('{{steps.fetch.tags.1}}', ctx)).toBe('b');
  });

  it('resolves recursively through objects and arrays', () => {
    const out = resolveTemplate(
      { a: '{{trigger.userId}}', list: ['{{steps.fetch.title}}', 'static'] },
      ctx,
    );
    expect(out).toEqual({ a: 'u1', list: ['hello', 'static'] });
  });

  it('throws on a missing path', () => {
    expect(() => resolveTemplate('{{steps.nope.value}}', ctx)).toThrow(/Unresolved template path/);
  });

  it('returns non-string primitives untouched', () => {
    expect(resolveTemplate(42, ctx)).toBe(42);
    expect(resolveTemplate(true, ctx)).toBe(true);
    expect(resolveTemplate(null, ctx)).toBe(null);
  });
});
