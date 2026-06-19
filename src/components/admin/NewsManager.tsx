import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, Trash2, Upload, Star, StarOff, Image as ImageIcon, Film } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/image-compress";

const BUCKET = "news-media";

type NewsMedia = {
  id: string;
  storage_path: string;
  media_type: "image" | "video";
  position: number;
};

type NewsItem = {
  id: string;
  title: string;
  content: string;
  published_at: string;
  featured: boolean;
  news_media: NewsMedia[];
};

const sanitize = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);

const NewsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0);
  const [form, setForm] = useState({
    title: "",
    content: "",
    published_at: format(new Date(), "yyyy-MM-dd"),
    featured: false,
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("news")
      .select("id, title, content, published_at, featured, news_media (id, storage_path, media_type, position)")
      .order("published_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las noticias.", variant: "destructive" });
      setItems([]);
    } else {
      setItems((data ?? []) as NewsItem[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setForm({ title: "", content: "", published_at: format(new Date(), "yyyy-MM-dd"), featured: false });
    setFiles([]);
    setFileKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Campos requeridos", description: "Título y contenido son obligatorios.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const { data: created, error: insertError } = await (supabase as any)
      .from("news")
      .insert({
        title: form.title.trim(),
        content: form.content.trim(),
        published_at: new Date(`${form.published_at}T12:00:00`).toISOString(),
        featured: form.featured,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      setSaving(false);
      toast({ title: "Error", description: "No se pudo crear la noticia.", variant: "destructive" });
      return;
    }

    const uploadedPaths: string[] = [];
    try {
      const rows = [];
      let idx = 0;
      for (const raw of files) {
        const isImage = raw.type.startsWith("image/");
        const isVideo = raw.type.startsWith("video/");
        if (!isImage && !isVideo) continue;

        const toUpload = isImage
          ? await compressImage(raw, { maxSize: 1600, quality: 0.85 }).catch(() => raw)
          : raw;

        const path = `${created.id}/${Date.now()}-${crypto.randomUUID()}-${sanitize(toUpload.name)}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, toUpload, { upsert: false, contentType: toUpload.type });
        if (upErr) throw upErr;

        uploadedPaths.push(path);
        rows.push({
          news_id: created.id,
          storage_path: path,
          media_type: isImage ? "image" : "video",
          position: idx++,
        });
      }

      if (rows.length > 0) {
        const { error: mErr } = await (supabase as any).from("news_media").insert(rows);
        if (mErr) throw mErr;
      }

      toast({ title: "Noticia publicada" });
      resetForm();
      await fetchItems();
    } catch {
      if (uploadedPaths.length > 0) await supabase.storage.from(BUCKET).remove(uploadedPaths);
      await (supabase as any).from("news").delete().eq("id", created.id);
      toast({ title: "Error", description: "No se pudo publicar la noticia.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: NewsItem) => {
    if (!confirm("¿Eliminar esta noticia y sus archivos?")) return;
    setDeletingId(item.id);
    try {
      const paths = item.news_media.map((m) => m.storage_path);
      if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
      const { error } = await (supabase as any).from("news").delete().eq("id", item.id);
      if (error) throw error;
      toast({ title: "Noticia eliminada" });
      await fetchItems();
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleFeatured = async (item: NewsItem) => {
    await (supabase as any).from("news").update({ featured: !item.featured }).eq("id", item.id);
    await fetchItems();
  };

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-accent font-semibold uppercase tracking-wider">Noticias</p>
        <h2 className="font-display text-2xl font-bold text-foreground mt-2">Publicar noticia o actividad</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Suba noticias, actividades o actos del colegio con fotos o videos. Las imágenes se comprimen automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="news-date">Fecha de publicación</Label>
          <Input id="news-date" type="date" value={form.published_at}
            onChange={(e) => setForm({ ...form, published_at: e.target.value })} required />
        </div>
        <div className="space-y-2 flex flex-col justify-end">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Marcar como destacada
          </label>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="news-title">Título</Label>
          <Input id="news-title" value={form.title} maxLength={150}
            onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="news-content">Contenido</Label>
          <Textarea id="news-content" rows={5} value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="news-files">Fotos y videos (opcional)</Label>
          <Input key={fileKey} id="news-files" type="file" multiple
            accept="image/*,video/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          {files.length > 0 && (
            <p className="text-xs text-muted-foreground">{files.length} archivo(s) seleccionado(s)</p>
          )}
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Publicar noticia
          </Button>
        </div>
      </form>

      <div className="mt-10 pt-8 border-t border-border">
        <h3 className="font-display text-xl font-bold text-foreground mb-4">Noticias publicadas</h3>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-accent" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Todavía no hay noticias.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-xl border border-border bg-background p-5">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <CalendarDays className="w-3 h-3" />
                      {format(new Date(item.published_at), "d MMM yyyy", { locale: es })}
                      {item.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent px-2 py-0.5 font-semibold">
                          <Star className="w-3 h-3" /> Destacada
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-foreground text-lg">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3 max-w-3xl">{item.content}</p>
                    <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {item.news_media.filter((m) => m.media_type === "image").length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Film className="w-3 h-3" />
                        {item.news_media.filter((m) => m.media_type === "video").length}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button type="button" variant="ghost" size="icon" onClick={() => void toggleFeatured(item)} title="Destacar">
                      {item.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive"
                      onClick={() => void handleDelete(item)} disabled={deletingId === item.id}>
                      {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsManager;
