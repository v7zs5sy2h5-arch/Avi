// Session check for LOCAL_MODE used from proxy.ts (NextRequest/NextResponse
// cookie jar, not next/headers), mirroring lib/local/client.ts's cookie.

import type { NextRequest } from "next/server";

const SESSION_COOKIE = "ka_local_session";

export function hasLocalSession(request: NextRequest): boolean {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return false;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return Boolean(parsed?.email);
  } catch {
    return false;
  }
}
