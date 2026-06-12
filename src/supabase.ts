import { createClient } from "@supabase/supabase-js";
import { User } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfiguredValue = (value: string | undefined) =>
  Boolean(value && value.trim() && !value.trim().startsWith("MY_"));

export const isSupabaseConfigured = isConfiguredValue(supabaseUrl) && isConfiguredValue(supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const mapSupabaseUser = (authUser: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): User => {
  const metadata = authUser.user_metadata || {};
  const email = authUser.email?.trim().toLowerCase() || "";
  const metadataName = typeof metadata.full_name === "string" ? metadata.full_name : "";
  const fallbackName = email ? email.split("@")[0].replace(/[._-]+/g, " ") : "CivicSnap User";

  return {
    email,
    name: metadataName || fallbackName,
    ward: typeof metadata.ward === "string" ? metadata.ward : "Ward 13 - Toronto Centre",
    bio: typeof metadata.bio === "string" ? metadata.bio : "",
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
  };
};
