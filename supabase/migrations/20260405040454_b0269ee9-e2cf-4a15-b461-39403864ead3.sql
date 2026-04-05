DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.weekly_tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.weekly_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.weekly_tasks;

CREATE POLICY "Admins can insert tasks"
  ON public.weekly_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tasks"
  ON public.weekly_tasks
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tasks"
  ON public.weekly_tasks
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can insert school activities" ON public.school_activities;
DROP POLICY IF EXISTS "Authenticated users can update school activities" ON public.school_activities;
DROP POLICY IF EXISTS "Authenticated users can delete school activities" ON public.school_activities;

CREATE POLICY "Admins can insert school activities"
  ON public.school_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update school activities"
  ON public.school_activities
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete school activities"
  ON public.school_activities
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can insert activity files" ON public.activity_files;
DROP POLICY IF EXISTS "Authenticated users can update activity files" ON public.activity_files;
DROP POLICY IF EXISTS "Authenticated users can delete activity files" ON public.activity_files;

CREATE POLICY "Admins can insert activity files"
  ON public.activity_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1
      FROM public.school_activities sa
      WHERE sa.id = activity_id
    )
  );

CREATE POLICY "Admins can update activity files"
  ON public.activity_files
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete activity files"
  ON public.activity_files
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can upload activity files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update activity files in storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete activity files from storage" ON storage.objects;

CREATE POLICY "Admins can upload activity files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'activity-files'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update activity files in storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'activity-files'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'activity-files'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete activity files from storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'activity-files'
    AND public.has_role(auth.uid(), 'admin')
  );