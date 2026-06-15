
-- Enum for level
DO $$ BEGIN
  CREATE TYPE public.education_level AS ENUM ('inicial','primaria_1','primaria_2','bachillerato');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TEACHERS
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  photo_url text,
  level public.education_level NOT NULL,
  grades text[] NOT NULL DEFAULT '{}',
  subjects text[] NOT NULL DEFAULT '{}',
  years text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers public read" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "teachers admin insert" ON public.teachers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "teachers admin update" ON public.teachers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "teachers admin delete" ON public.teachers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COORDINATORS
CREATE TABLE public.coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  level public.education_level NOT NULL,
  section text NOT NULL, -- e.g. 'inicial','primera_etapa','segunda_etapa','1','2','3','4','5'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(level, section)
);
GRANT SELECT ON public.coordinators TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordinators TO authenticated;
GRANT ALL ON public.coordinators TO service_role;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coord public read" ON public.coordinators FOR SELECT USING (true);
CREATE POLICY "coord admin insert" ON public.coordinators FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "coord admin update" ON public.coordinators FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "coord admin delete" ON public.coordinators FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_coord_updated BEFORE UPDATE ON public.coordinators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROMO LOGOS
CREATE TABLE public.promo_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_year integer NOT NULL,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_logos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_logos TO authenticated;
GRANT ALL ON public.promo_logos TO service_role;
ALTER TABLE public.promo_logos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promos public read" ON public.promo_logos FOR SELECT USING (true);
CREATE POLICY "promos admin insert" ON public.promo_logos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "promos admin update" ON public.promo_logos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "promos admin delete" ON public.promo_logos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_promos_updated BEFORE UPDATE ON public.promo_logos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
