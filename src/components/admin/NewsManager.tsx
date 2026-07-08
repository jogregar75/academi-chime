import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, Trash2, Upload, Star, StarOff, Image as ImageIcon, Film, Pencil, X, Save } from "lucide-react";
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
  url?: string;
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

const uploadFiles = async (newsId: string, files: File[], startPosition: number) => {
  const uploadedPaths: string[] = [];
  const rows: Array<{ news_id: string; storage_path: string; media_type: string; position: number }> = [];
  let idx = startPosition;
  for (const raw of files) {
    const isImage = raw.type.startsWith("image/");
    const isVideo = raw.type.startsWith("video/");
    if (!isImage && !isVideo) continue;

    const toUpload = isImage
      ? await compressImage(raw, { maxSize: 1600, quality: 0.85 }).catch(() => raw)
      : raw;

    const path = `${newsId}/${Date.now()}-${crypto.randomUUID()}-${sanitize(toUpload.name)}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, toUpload, { upsert: false, contentType: toUpload.type });
    if (upErr) throw upErr;

    uploadedPaths.push(path);
    rows.push({
      news_id: newsId,
      storage_path: path,
      media_type: isImage ? "image" : "video",
      position: idx++,
    });
  }
  return { uploadedPaths, rows };
};

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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", published_at: "", featured: false });
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editFileKey, setEditFileKey] = useState(0);
  const [editMedia, setEditMedia] = useState<NewsMedia[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

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
      const list = (data ?? []) as NewsItem[];
      list.forEach((it) => it.news_media.sort((a, b) => a.position - b.position));
      setItems(list);
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

    let uploaded: string[] = [];
    try {
      const { uploadedPaths, rows } = await uploadFiles(created.id, files, 0);
      uploaded = uploadedPaths;
      if (rows.length > 0) {
        const { error: mErr } = await (supabase as any).from("news_media").insert(rows);
        if (mErr) throw mErr;
      }

      toast({ title: "Noticia publicada" });
      resetForm();
      await fetchItems();
    } catch {
      if (uploaded.length > 0) await supabase.storage.from(BUCKET).remove(uploaded);
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

  const startEdit = async (item: NewsItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      content: item.content,
      published_at: format(new Date(item.published_at), "yyyy-MM-dd"),
      featured: item.featured,
    });
    setEditFiles([]);
    setEditFileKey((k) => k + 1);
    // Load signed URLs for previews
    const media: NewsMedia[] = [];
    for (const m of item.news_media) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(m.storage_path, 60 * 60);
      media.push({ ...m, url: signed?.signedUrl });
    }
    setEditMedia(media);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMedia([]);
    setEditFiles([]);
  };

  const removeExistingMedia = async (media: NewsMedia) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    try {
      await supabase.storage.from(BUCKET).remove([media.storage_path]);
      const { error } = await (supabase as any).from("news_media").delete().eq("id", media.id);
      if (error) throw error;
      setEditMedia((prev) => prev.filter((m) => m.id !== media.id));
      toast({ title: "Archivo eliminado" });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el archivo.", variant: "destructive" });
    }
  };

  const makeCover = async (media: NewsMedia) => {
    // Swap position with current position-0 media
    try {
      const others = editMedia.filter((m) => m.id !== media.id);
      // Update target to position 0
      await (supabase as any).from("news_media").update({ position: 0 }).eq("id", media.id);
      // Shift others to positions 1..n
      for (let i = 0; i < others.length; i++) {
        await (supabase as any).from("news_media").update({ position: i + 1 }).eq("id", others[i].id);
      }
      const newOrder: NewsMedia[] = [{ ...media, position: 0 }, ...others.map((m, i) => ({ ...m, position: i + 1 }))];
      setEditMedia(newOrder);
      toast({ title: "Portada actualizada" });
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar la portada.", variant: "destructive" });
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast({ title: "Campos requeridos", description: "Título y contenido son obligatorios.", variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      const { error: uErr } = await (supabase as any)
        .from("news")
        .update({
          title: editForm.title.trim(),
          content: editForm.content.trim(),
          published_at: new Date(`${editForm.published_at}T12:00:00`).toISOString(),
          featured: editForm.featured,
        })
        .eq("id", editingId);
      if (uErr) throw uErr;

      if (editFiles.length > 0) {
        const startPos = editMedia.length > 0
          ? Math.max(...editMedia.map((m) => m.position)) + 1
          : 0;
        const { rows, uploadedPaths } = await uploadFiles(editingId, editFiles, startPos);
        if (rows.length > 0) {
          const { error: mErr } = await (supabase as any).from("news_media").insert(rows);
          if (mErr) {
            await supabase.storage.from(BUCKET).remove(uploadedPaths);
            throw mErr;
          }
        }
      }

      toast({ title: "Noticia actualizada" });
      cancelEdit();
      await fetchItems();
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-accent font-semibold uppercase tracking-wider">Noticias</p>
        <h2 className="font-display text-2xl font-bold text-foreground mt-2">Publicar noticia o actividad</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Suba noticias, actividades o actos del colegio con fotos o videos. El primer archivo será la portada. Las imágenes se comprimen automáticamente.
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
            <p className="text-xs text-muted-foreground">
              {files.length} archivo(s) seleccionado(s). El primero será la portada.
            </p>
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
                {editingId === item.id ? (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Input type="date" value={editForm.published_at}
                          onChange={(e) => setEditForm({ ...editForm, published_at: e.target.value })} />
                      </div>
                      <div className="space-y-2 flex flex-col justify-end">
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editForm.featured}
                            onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })} />
                          Destacada
                        </label>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Título</Label>
                        <Input value={editForm.title} maxLength={150}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Contenido</Label>
                        <Textarea rows={5} value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
                      </div>
                    </div>

                    {editMedia.length > 0 && (
                      <div>
                        <Label className="mb-2 block">Archivos actuales</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {editMedia.map((m, idx) => (
                            <div key={m.id} className="relative group border border-border rounded-lg overflow-hidden bg-muted">
                              {m.media_type === "image" ? (
                                <img src={m.url} alt="" className="w-full h-24 object-cover" />
                              ) : (
                                <video src={m.url} className="w-full h-24 object-cover bg-black" muted />
                              )}
                              {idx === 0 && (
                                <span className="absolute top-1 left-1 bg-accent text-accent-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                  Portada
                                </span>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                {idx !== 0 && (
                                  <Button type="button" size="icon" variant="secondary" className="h-7 w-7"
                                    onClick={() => void makeCover(m)} title="Poner como portada">
                                    <Star className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button type="button" size="icon" variant="destructive" className="h-7 w-7"
                                  onClick={() => void removeExistingMedia(m)} title="Eliminar">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Agregar más archivos</Label>
                      <Input key={editFileKey} type="file" multiple accept="image/*,video/*"
                        onChange={(e) => setEditFiles(Array.from(e.target.files ?? []))} />
                      {editFiles.length > 0 && (
                        <p className="text-xs text-muted-foreground">{editFiles.length} nuevo(s) archivo(s).</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={cancelEdit} disabled={savingEdit} className="gap-2">
                        <X className="w-4 h-4" /> Cancelar
                      </Button>
                      <Button type="button" onClick={() => void saveEdit()} disabled={savingEdit} className="gap-2">
                        {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                ) : (
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
                      <Button type="button" variant="ghost" size="icon" onClick={() => void startEdit(item)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => void toggleFeatured(item)} title="Destacar">
                        {item.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive"
                        onClick={() => void handleDelete(item)} disabled={deletingId === item.id}>
                        {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsManager;
