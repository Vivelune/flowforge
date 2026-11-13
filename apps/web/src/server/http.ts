import { NextResponse } from 'next/server';

export function ok<T>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}
