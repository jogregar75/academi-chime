import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Download, Loader2, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  buildAnnouncementFilePath,
  downloadAnnouncementFile,
  formatFileSize,
  removeAnnouncementFiles,
  uploadAnnouncementFile,
} from "@/lib/announcement-files";

type AnnouncementFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string | null;
  urgent: boolean;
  published_at: string;
  created_at: string;
  announcement_files: AnnouncementFile[];
};

const AnnouncementsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    urgent: false,
    published_at: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("announcements")
      .select(`
        id, title, content, urgent, published_at, created_at,
        announcement_files ( id, file_name, file_path, file_size, mime_type, created_at )
      `)
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los comunicados.", variant: "destructive" });
      setItems([]);
    } else {
      const normalized = ((data ?? []) as Announcement[]).map((a) => ({
        ...a,
        announcement_files: [...(a.announcement_files ?? [])].sort((x, y) => (x.created_at < y.created_at ? 1 : -1)),
      }));
      setItems(normalized);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setFormData({ title: "", content: "", urgent: false, published_at: format(new Date(), "yyyy-MM-dd") });
    setSelectedFiles([]);
    setFileInputKey((k) => k + 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: "Campo requerido", description: "Ingrese un título.", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { data: created, error: insertError } = await (supabase as any)
      .from("announcements")
      .insert({
        title: formData.title.trim(),
        content: formData.content.trim() || null,
        urgent: formData.urgent,
        published_at: formData.published_at,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      setSaving(false);
      toast({ title: "Error", description: "No se pudo crear el comunicado.", variant: "destructive" });
      return;
    }

    const uploadedPaths: string[] = [];
    try {
      if (selectedFiles.length > 0) {
        const rows = [];
        for (const file of selectedFiles) {
          const filePath = buildAnnouncementFilePath(created.id, file.name);
          await uploadAnnouncementFile(filePath, file);
          uploadedPaths.push(filePath);
          rows.push({
            announcement_id: created.id,
            file_name: file.name,
            file_path: filePath,
            mime_type: file.type || null,
            file_size: file.size,
          });
        }
        const { error: filesError } = await (supabase as any).from("announcement_files").insert(rows);
        if (filesError) throw filesError;
      }

      toast({ title: "Comunicado publicado", description: "Ya está visible en la sección Comunicados." });
      resetForm();
      await fetchItems();
    } catch {
      await removeAnnouncementFiles(uploadedPaths);
      await (supabase as any).from("announcements").delete().eq("id", created.id);
      toast({ title: "Error", description: "No se pudo publicar el comunicado.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Announcement) => {
    if (!window.confirm("¿Desea eliminar este comunicado y sus archivos?")) return;
    setDeletingId(item.id);
    try {
      const paths = item.announcement_files.map((f) => f.file_path);
      await removeAnnouncementFiles(paths);
      const { error } = await (supabase as any).from("announcements").delete().eq("id", item.id);
      if (error) throw error;
      toast({ title: "Comunicado eliminado" });
      await fetchItems();
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el comunicado.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (file: AnnouncementFile) => {
    try {
      setDownloadingPath(file.file_path);
      await downloadAnnouncementFile(file.file_path, file.file_name);
    } catch {
      toast({ title: "Error", description: "No se pudo descargar el archivo.", variant: "destructive" });
    } finally {
      setDownloadingPath(null);
    }
  };

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-accent font-semibold uppercase tracking-wider">Comunicados</p>
        <h2 className="font-display text-2xl font-bold text-foreground mt-2">Publicar comunicado</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Los archivos adjuntos son opcionales. Puede publicar un comunicado solo con texto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ann-date">Fecha</Label>
          <Input
            id="ann-date"
            type="date"
            value={formData.published_at}
            onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2 flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer h-10">
            <Checkbox
              id="ann-urgent"
              checked={formData.urgent}
              onCheckedChange={(v) => setFormData({ ...formData, urgent: v === true })}
            />
            <span className="text-sm font-medium text-foreground inline-flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-destructive" /> Marcar como urgente
            </span>
          </label>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ann-title">Título</Label>
          <Input
            id="ann-title"
            placeholder="Ej: Suspensión de clases"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            maxLength={160}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ann-content">Contenido</Label>
          <Textarea
            id="ann-content"
            placeholder="Describa el comunicado..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            maxLength={2000}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ann-files">Archivos adjuntos (opcional)</Label>
          <Input
            key={fileInputKey}
            id="ann-files"
            type="file"
            multiple
            onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
          />
          {selectedFiles.length > 0 && (
            <div className="rounded-xl border border-border bg-background p-4 space-y-2">
              {selectedFiles.map((file) => (
                <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground truncate">{file.name}</span>
                  <span className="text-muted-foreground whitespace-nowrap">{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Publicar comunicado
          </Button>
        </div>
      </form>

      <div className="mt-10 pt-8 border-t border-border">
        <h3 className="font-display text-xl font-bold text-foreground mb-6">Comunicados publicados</h3>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-accent" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-background">
            <p className="text-foreground font-medium">Todavía no hay comunicados publicados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className={`rounded-xl border p-5 ${item.urgent ? "border-destructive/40 bg-destructive/5" : "border-border bg-background"}`}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {item.urgent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-bold uppercase">
                          <AlertCircle className="w-3 h-3" /> Urgente
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(`${item.published_at}T00:00:00`), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground text-lg">{item.title}</h4>
                    {item.content && <p className="text-sm text-muted-foreground mt-2 max-w-3xl whitespace-pre-line">{item.content}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void handleDelete(item)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>

                {item.announcement_files.length > 0 && (
                  <div className="grid gap-3 mt-5">
                    {item.announcement_files.map((file) => (
                      <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border bg-card p-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.mime_type || "Archivo"}{file.file_size ? ` • ${formatFileSize(file.file_size)}` : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 w-full sm:w-auto"
                          disabled={downloadingPath === file.file_path}
                          onClick={() => void handleDownload(file)}
                        >
                          {downloadingPath === file.file_path ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          Descargar
                        </Button>
                      </div>
                    ))}
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

export default AnnouncementsManager;
