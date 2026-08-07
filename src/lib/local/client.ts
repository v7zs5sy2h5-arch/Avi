// Fake Supabase client for LOCAL_MODE: same shape as the real
// `@supabase/supabase-js` client for the subset this app uses
// (`.from(table)...` and `.auth.getUser/signInWithPassword/signOut`),
// backed by the in-memory store instead of a real Postgres/Auth backend.

import { cookies } from "next/headers";
import { LOCAL_USER_ID } from "./store";
import { LocalQueryBuilder } from "./queryBuilder";

const SESSION_COOKIE = "ka_local_session";

interface LocalUser {
  id: string;
  email: string;
}

function encodeSession(email: string) {
  return Buffer.from(JSON.stringify({ email })).toString("base64");
}

function decodeSession(raw: string): LocalUser | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    if (!parsed?.email) return null;
    return { id: LOCAL_USER_ID, email: parsed.email };
  } catch {
    return null;
  }
}

function buildAuth() {
  return {
    async getUser() {
      const store = await cookies();
      const raw = store.get(SESSION_COOKIE)?.value;
      const user = raw ? decodeSession(raw) : null;
      return { data: { user }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      if (!email || !password) {
        return {
          data: { user: null, session: null },
          error: { message: "Missing credentials" },
        };
      }
      const store = await cookies();
      store.set(SESSION_COOKIE, encodeSession(email), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return { data: { user: { id: LOCAL_USER_ID, email }, session: {} }, error: null };
    },
    async signOut() {
      const store = await cookies();
      store.delete(SESSION_COOKIE);
      return { error: null };
    },
  };
}

export function createLocalClient() {
  return {
    from<T = Record<string, unknown>>(table: string) {
      return new LocalQueryBuilder<T>(table);
    },
    auth: buildAuth(),
  };
}
