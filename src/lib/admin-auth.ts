import { supabase } from "@/integrations/supabase/client";

export const isAdminUser = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  return !error && Boolean(data);
};
