
CREATE POLICY "News media public read" ON storage.objects FOR SELECT USING (bucket_id = 'news-media');
CREATE POLICY "Admins upload news media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'news-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update news media files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'news-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete news media files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'news-media' AND public.has_role(auth.uid(), 'admin'));
