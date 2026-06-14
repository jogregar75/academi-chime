
ALTER TABLE public.authorities
  ADD COLUMN IF NOT EXISTS joined_date date,
  ADD COLUMN IF NOT EXISTS positions text;

CREATE TABLE IF NOT EXISTS public.org_chart_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.org_chart_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_chart_settings TO authenticated;
GRANT ALL ON public.org_chart_settings TO service_role;

ALTER TABLE public.org_chart_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view org chart"
  ON public.org_chart_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert org chart"
  ON public.org_chart_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update org chart"
  ON public.org_chart_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete org chart"
  ON public.org_chart_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_org_chart_settings_updated_at
  BEFORE UPDATE ON public.org_chart_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.org_chart_settings (image_url)
SELECT NULL WHERE NOT EXISTS (SELECT 1 FROM public.org_chart_settings);
