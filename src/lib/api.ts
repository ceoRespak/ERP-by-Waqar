import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden — you don't have permission for this action") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function handleError(e: unknown) {
  const message = e instanceof Error ? e.message : "Something went wrong";
  return NextResponse.json({ error: message }, { status: 400 });
}
