
CREATE TABLE public.authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  photo_url text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view authorities" ON public.authorities FOR SELECT USING (true);
CREATE POLICY "Admins can insert authorities" ON public.authorities FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update authorities" ON public.authorities FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete authorities" ON public.authorities FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_authorities_updated_at BEFORE UPDATE ON public.authorities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('authority-photos', 'authority-photos', true);

CREATE POLICY "Authority photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'authority-photos');
CREATE POLICY "Admins upload authority photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'authority-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update authority photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'authority-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete authority photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'authority-photos' AND has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.authorities (name, role, display_order) VALUES
  ('Por definir', 'Gerente General Académico', 10),
  ('Por definir', 'Gerente General Administrativo', 20),
  ('Por definir', 'Director', 30),
  ('Por definir', 'Subdirector', 40),
  ('Por definir', 'Subdirector de Inicial', 50),
  ('Por definir', 'Coordinación Departamento de Evaluación', 60),
  ('Por definir', 'Coordinadora I Etapa', 70),
  ('Por definir', 'Coordinador II Etapa', 80),
  ('Por definir', 'Coordinador 1er Año', 90),
  ('Por definir', 'Coordinador 2do Año', 100),
  ('Por definir', 'Coordinador 3er Año', 110),
  ('Por definir', 'Coordinador 4to Año', 120),
  ('Por definir', 'Coordinador 5to Año', 130),
  ('Por definir', 'Coordinador de Cultura', 140),
  ('Por definir', 'Coordinador de Disciplina y Deporte', 150),
  ('Por definir', 'Coordinadora de Recursos Para el Aprendizaje', 160);
