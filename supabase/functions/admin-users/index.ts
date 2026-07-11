// Admin user management edge function.
// Actions: list, create, delete, reset-password.
// Only callable by users with the "admin" role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing bearer token" }, 401);
    }

    // Validate caller
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) return json({ error: roleErr.message }, 500);
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (error) return json({ error: error.message }, 500);

      const ids = data.users.map((u) => u.id);
      const { data: roles } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

      const roleMap = new Map<string, string[]>();
      for (const r of roles ?? []) {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      }

      return json({
        users: data.users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          first_name: (u.user_metadata as any)?.first_name ?? null,
          last_name: (u.user_metadata as any)?.last_name ?? null,
          roles: roleMap.get(u.id) ?? [],
        })),
      });
    }

    if (action === "create") {
      const first_name = String(body.first_name ?? "").trim();
      const last_name = String(body.last_name ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");

      if (!first_name || !last_name) return json({ error: "Nombre y apellido requeridos" }, 400);
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return json({ error: "Correo inválido" }, 400);
      }
      if (password.length < 8) return json({ error: "Contraseña mínima 8 caracteres" }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name },
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "Error al crear usuario" }, 400);

      const { error: roleInsertErr } = await admin
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "admin" });
      if (roleInsertErr) {
        // Rollback the auth user if role assignment fails.
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: roleInsertErr.message }, 500);
      }

      return json({ ok: true, user: { id: created.user.id, email: created.user.email } });
    }

    if (action === "delete") {
      const userId = String(body.user_id ?? "");
      if (!userId) return json({ error: "user_id requerido" }, 400);
      if (userId === userData.user.id) {
        return json({ error: "No puedes eliminar tu propia cuenta" }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "reset-password") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const redirectTo = String(body.redirect_to ?? "");
      if (!email) return json({ error: "email requerido" }, 400);
      const { error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      // Even if user doesn't exist, respond ok to avoid enumeration.
      if (error && !String(error.message).toLowerCase().includes("not found")) {
        return json({ error: error.message }, 500);
      }
      return json({ ok: true });
    }

    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error("admin-users error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
