import type { SupabaseClient } from "@supabase/supabase-js";

// Resolves a client from either an existing client_id (selected from the
// autocomplete dropdown) or a free-typed client_name (creates a new client
// row, reusing an existing one with the exact same name if present).
export async function resolveClientId(
  supabase: SupabaseClient,
  userId: string,
  clientId: string | null,
  clientName: string | null,
): Promise<string | null> {
  if (clientId) return clientId;

  const name = clientName?.trim();
  if (!name) return null;

  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("clients")
    .insert({ user_id: userId, name })
    .select("id")
    .single();

  if (error) throw error;
  return created.id as string;
}
