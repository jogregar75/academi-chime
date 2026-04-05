
-- Table for weekly tasks organized by week and level
CREATE TABLE public.weekly_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('inicial', 'primaria')),
  subject TEXT NOT NULL,
  task_description TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_tasks ENABLE ROW LEVEL SECURITY;

-- Everyone can read tasks (public school website)
CREATE POLICY "Anyone can view weekly tasks"
  ON public.weekly_tasks FOR SELECT
  USING (true);

-- Only authenticated admins can manage tasks (we'll use roles later, for now authenticated users)
CREATE POLICY "Authenticated users can insert tasks"
  ON public.weekly_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON public.weekly_tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON public.weekly_tasks FOR DELETE
  TO authenticated
  USING (true);

-- Index for faster queries by week and level
CREATE INDEX idx_weekly_tasks_week_level ON public.weekly_tasks (week_start DESC, level);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_weekly_tasks_updated_at
  BEFORE UPDATE ON public.weekly_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
