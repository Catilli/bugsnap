import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth guard is handled client-side by dashboard/layout.tsx (reads JWT from
// localStorage via Zustand). Middleware cannot access localStorage, so auth
// checks here were always no-ops that caused a redirect loop after login.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
