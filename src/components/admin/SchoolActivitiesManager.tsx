import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Download, Loader2, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  downloadActivityFile,
  formatFileSize,
  sanitizeFileName,
} from "@/lib/activity-files";

type ActivityLevel = "inicial" | "primaria";

type ActivityFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

type SchoolActivity = {
  id: string;
  level: ActivityLevel;
  title: string;
  description: string | null;
  activity_date: string;
  created_at: string;
  activity_files: ActivityFile[];
};

const levelOptions = [
  { value: "inicial", label: "Educación Inicial" },
  { value: "primaria", label: "Educación Primaria" },
] as const;

const SchoolActivitiesManager = () => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<SchoolActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [formData, setFormData] = useState({
    level: "inicial" as ActivityLevel,
    title: "",
    description: "",
    activity_date: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchActivities = useCallback(async () => {
    setLoading(true);

    const { data, error } = await (supabase as any)
      .from("school_activities")
      .select(
        `
          id,
          level,
          title,
          description,
          activity_date,
          created_at,
          activity_files (
            id,
            file_name,
            file_path,
            file_size,
            mime_type,
            created_at
          )
        `,
      )
      .order("activity_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades.",
        variant: "destructive",
      });
      setActivities([]);
    } else {
      const normalized = ((data ?? []) as SchoolActivity[]).map((activity) => ({
        ...activity,
        activity_files: [...(activity.activity_files ?? [])].sort((a, b) =>
          a.created_at < b.created_at ? 1 : -1,
        ),
      }));

      setActivities(normalized);
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void fetchActivities();
  }, [fetchActivities]);

  const resetForm = () => {
    setFormData({
      level: "inicial",
      title: "",
      description: "",
      activity_date: format(new Date(), "yyyy-MM-dd"),
    });
    setSelectedFiles([]);
    setFileInputKey((current) => current + 1);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(event.target.files ?? []));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingrese un título para la actividad.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "Archivos requeridos",
        description: "Seleccione al menos un archivo para publicar la actividad.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { data: createdActivity, error: activityError } = await (supabase as any)
      .from("school_activities")
      .insert({
        level: formData.level,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        activity_date: formData.activity_date,
      })
      .select("id")
      .single();

    if (activityError || !createdActivity) {
      setSaving(false);
      toast({
        title: "Error",
        description: "No se pudo crear la actividad.",
        variant: "destructive",
      });
      return;
    }

    const uploadedPaths: string[] = [];

    try {
      const fileRows = [];

      for (const file of selectedFiles) {
        const filePath = `${createdActivity.id}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

        const { error: uploadError } = await supabase.storage
          .from("activity-files")
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        uploadedPaths.push(filePath);
        fileRows.push({
          activity_id: createdActivity.id,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type || null,
          file_size: file.size,
        });
      }

      const { error: filesError } = await (supabase as any).from("activity_files").insert(fileRows);
      if (filesError) throw filesError;

      toast({
        title: "Actividad publicada",
        description: "Los archivos ya están visibles para los usuarios.",
      });

      resetForm();
      await fetchActivities();
    } catch {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("activity-files").remove(uploadedPaths);
      }

      await (supabase as any).from("school_activities").delete().eq("id", createdActivity.id);

      toast({
        title: "Error",
        description: "No se pudo publicar la actividad con sus archivos.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity: SchoolActivity) => {
    if (!window.confirm("¿Desea eliminar esta actividad y todos sus archivos?")) return;

    setDeletingId(activity.id);

    try {
      const filePaths = activity.activity_files.map((file) => file.file_path);

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from("activity-files").remove(filePaths);
        if (storageError) throw storageError;
      }

      const { error } = await (supabase as any).from("school_activities").delete().eq("id", activity.id);
      if (error) throw error;

      toast({
        title: "Actividad eliminada",
        description: "La actividad y sus archivos fueron eliminados correctamente.",
      });

      await fetchActivities();
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar la actividad.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (file: ActivityFile) => {
    try {
      setDownloadingPath(file.file_path);
      await downloadActivityFile(file.file_path, file.file_name);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPath(null);
    }
  };

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-accent font-semibold uppercase tracking-wider">Actividades del colegio</p>
        <h2 className="font-display text-2xl font-bold text-foreground mt-2">Subir actividades con archivos</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Seleccione uno o varios archivos y la actividad se mostrará automáticamente en la sección pública correspondiente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="activity-level">Nivel</Label>
          <select
            id="activity-level"
            value={formData.level}
            onChange={(event) => setFormData({ ...formData, level: event.target.value as ActivityLevel })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="activity-date">Fecha</Label>
          <Input
            id="activity-date"
            type="date"
            value={formData.activity_date}
            onChange={(event) => setFormData({ ...formData, activity_date: event.target.value })}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="activity-title">Título de la actividad</Label>
          <Input
            id="activity-title"
            placeholder="Ej: Feria de ciencias de primaria"
            value={formData.title}
            onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            maxLength={120}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="activity-description">Descripción</Label>
          <Textarea
            id="activity-description"
            placeholder="Describa brevemente la actividad realizada..."
            value={formData.description}
            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            rows={3}
            maxLength={1000}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="activity-files">Archivos</Label>
          <Input
            key={fileInputKey}
            id="activity-files"
            type="file"
            multiple
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">Puede seleccionar varios archivos para una misma actividad.</p>
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
            Publicar actividad
          </Button>
        </div>
      </form>

      <div className="mt-10 pt-8 border-t border-border">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">Actividades publicadas</h3>
            <p className="text-sm text-muted-foreground">Aquí puede revisar y eliminar las actividades ya publicadas.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-accent" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-background">
            <p className="text-foreground font-medium">Todavía no hay actividades cargadas.</p>
            <p className="text-sm text-muted-foreground mt-1">Publique la primera actividad usando el formulario superior.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const levelLabel = levelOptions.find((option) => option.value === activity.level)?.label ?? activity.level;

              return (
                <article key={activity.id} className="rounded-xl border border-border bg-background p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                          {levelLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(`${activity.activity_date}T00:00:00`), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-lg">{activity.title}</h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-2 max-w-3xl">{activity.description}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(activity)}
                      disabled={deletingId === activity.id}
                    >
                      {deletingId === activity.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-3 mt-5">
                    {activity.activity_files.map((file) => (
                      <div
                        key={file.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border bg-card p-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.mime_type || "Archivo"}
                            {file.file_size ? ` • ${formatFileSize(file.file_size)}` : ""}
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
                          {downloadingPath === file.file_path ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Descargar
                        </Button>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default SchoolActivitiesManager;
