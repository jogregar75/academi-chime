import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadActivityFile, formatFileSize } from "@/lib/activity-files";

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

const levelCopy: Record<ActivityLevel, { eyebrow: string; title: string; description: string }> = {
  inicial: {
    eyebrow: "Educación Inicial",
    title: "Actividades de Inicial",
    description: "Consulte las actividades publicadas para este nivel y descargue los archivos compartidos por el colegio.",
  },
  primaria: {
    eyebrow: "Educación Primaria",
    title: "Actividades de Primaria",
    description: "Revise las actividades del nivel primaria con sus materiales y archivos descargables.",
  },
};

interface SchoolActivitiesSectionProps {
  level: ActivityLevel;
}

const SchoolActivitiesSection = ({ level }: SchoolActivitiesSectionProps) => {
  const [activities, setActivities] = useState<SchoolActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchActivities = async () => {
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
        .eq("level", level)
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
    };

    void fetchActivities();
  }, [level, toast]);

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

  const copy = levelCopy[level];

  return (
    <section className="py-24 bg-section-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-accent font-semibold uppercase tracking-widest text-lg">{copy.eyebrow}</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">{copy.title}</h1>
          <p className="text-muted-foreground text-lg mt-4">{copy.description}</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : activities.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-16 bg-card border border-border rounded-2xl">
            <p className="text-foreground text-xl font-semibold">Aún no hay actividades publicadas.</p>
            <p className="text-muted-foreground mt-2">Cuando el colegio suba archivos, aparecerán aquí automáticamente.</p>
          </div>
        ) : (
          <div className="grid gap-6 max-w-5xl mx-auto">
            {activities.map((activity, index) => (
              <motion.article
                key={activity.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 text-sm text-accent font-semibold uppercase tracking-wider mb-3">
                      <CalendarDays className="w-4 h-4" />
                      {format(new Date(`${activity.activity_date}T00:00:00`), "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">{activity.title}</h2>
                    {activity.description && (
                      <p className="text-muted-foreground mt-3 max-w-3xl">{activity.description}</p>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground w-fit">
                    <FileText className="w-4 h-4" />
                    {activity.activity_files.length} archivo{activity.activity_files.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="grid gap-3">
                  {activity.activity_files.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border bg-background p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{file.file_name}</p>
                        <p className="text-sm text-muted-foreground">
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
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SchoolActivitiesSection;
