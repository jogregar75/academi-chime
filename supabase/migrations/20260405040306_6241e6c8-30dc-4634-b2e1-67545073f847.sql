CREATE TABLE public.school_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_school_activities_level_date
  ON public.school_activities (level, activity_date DESC, created_at DESC);

ALTER TABLE public.school_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view school activities"
  ON public.school_activities
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert school activities"
  ON public.school_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update school activities"
  ON public.school_activities
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete school activities"
  ON public.school_activities
  FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER update_school_activities_updated_at
  BEFORE UPDATE ON public.school_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.activity_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.school_activities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_files_activity_id
  ON public.activity_files (activity_id);

ALTER TABLE public.activity_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity files"
  ON public.activity_files
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert activity files"
  ON public.activity_files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update activity files"
  ON public.activity_files
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete activity files"
  ON public.activity_files
  FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-files', 'activity-files', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Activity files are publicly readable'
  ) THEN
    CREATE POLICY "Activity files are publicly readable"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'activity-files');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload activity files'
  ) THEN
    CREATE POLICY "Authenticated users can upload activity files"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'activity-files');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update activity files in storage'
  ) THEN
    CREATE POLICY "Authenticated users can update activity files in storage"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'activity-files');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete activity files from storage'
  ) THEN
    CREATE POLICY "Authenticated users can delete activity files from storage"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'activity-files');
  END IF;
END $$;