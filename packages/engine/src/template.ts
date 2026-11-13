import type { RunContext } from './types';

const TEMPLATE_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

function getPath(source: unknown, path: string): unknown {
  const parts = path.split('.');
  let cursor: unknown = source;

  for (const part of parts) {
    if (cursor === null || cursor === undefined) {
      throw new Error(`Unresolved template path: ${path} (stopped at "${part}")`);
    }
    if (Array.isArray(cursor)) {
      const idx = Number(part);
      if (!Number.isInteger(idx) || idx < 0 || idx >= cursor.length) {
        throw new Error(`Unresolved template path: ${path} (bad array index "${part}")`);
      }
      cursor = cursor[idx];
      continue;
    }
    if (typeof cursor !== 'object') {
      throw new Error(
        `Unresolved template path: ${path} (cannot read "${part}" off ${typeof cursor})`,
      );
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }

  return cursor;
}

/**
 * Resolve {{path}} placeholders inside any JSON value.
 * - If a string is exactly one template, return the raw value (not a string).
 * - Otherwise replace each placeholder inline and return a string.
 */
export function resolveTemplate(value: unknown, context: RunContext): unknown {
  if (typeof value === 'string') {
    const single = value.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (single) {
      return getPath(context, single[1]!.trim());
    }
    return value.replace(TEMPLATE_RE, (_, path: string) => {
      const resolved = getPath(context, path.trim());
      if (resolved === null || resolved === undefined) return '';
      return typeof resolved === 'string' ? resolved : JSON.stringify(resolved);
    });
  }

  if (Array.isArray(value)) {
    return value.map((v) => resolveTemplate(v, context));
  }

  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveTemplate(v, context);
    }
    return out;
  }

  return value;
}
