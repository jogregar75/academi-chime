
-- Restrict has_role: only authenticated users need it for RLS evaluation
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Remove broad SELECT policies on public buckets to prevent listing all files.
-- Public bucket files remain accessible via their direct public URLs.
DROP POLICY IF EXISTS "Activity files are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Authority photos public read" ON storage.objects;
