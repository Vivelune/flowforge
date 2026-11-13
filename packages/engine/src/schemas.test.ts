import { describe, it, expect } from 'vitest';
import { httpConfigSchema, conditionConfigSchema, delayConfigSchema } from './schemas.js';

describe('httpConfigSchema', () => {
  it('accepts a minimal valid config and applies defaults', () => {
    const parsed = httpConfigSchema.parse({ url: 'https://example.com' });
    expect(parsed.method).toBe('GET');
    expect(parsed.timeoutMs).toBe(10_000);
  });

  it('rejects a non-URL string', () => {
    expect(() => httpConfigSchema.parse({ url: 'not-a-url' })).toThrow();
  });

  it('rejects timeout above the cap', () => {
    expect(() =>
      httpConfigSchema.parse({ url: 'https://example.com', timeoutMs: 60_000 }),
    ).toThrow();
  });
});

describe('conditionConfigSchema', () => {
  it('accepts each operator', () => {
    for (const op of ['eq', 'neq', 'gt', 'lt', 'contains', 'exists'] as const) {
      expect(() => conditionConfigSchema.parse({ left: 1, operator: op })).not.toThrow();
    }
  });

  it('rejects an unknown operator', () => {
    expect(() => conditionConfigSchema.parse({ left: 1, operator: 'bogus' })).toThrow();
  });
});

describe('delayConfigSchema', () => {
  it('rejects zero', () => {
    expect(() => delayConfigSchema.parse({ seconds: 0 })).toThrow();
  });

  it('rejects above 30 seconds', () => {
    expect(() => delayConfigSchema.parse({ seconds: 31 })).toThrow();
  });

  it('accepts 1 second', () => {
    expect(delayConfigSchema.parse({ seconds: 1 }).seconds).toBe(1);
  });
});
