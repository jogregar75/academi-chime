import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ClipboardList, ChevronLeft, ChevronRight, Download, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { downloadActivityFile, formatFileSize } from "@/lib/activity-files";
import { useToast } from "@/hooks/use-toast";

type TaskFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
};

type WeeklyTask = {
  id: string;
  week_start: string;
  week_end: string;
  level: string;
  subject: string;
  task_description: string;
  attachment_url: string | null;
  task_files: TaskFile[];
};

const levelConfig: Record<string, { label: string; icon: typeof BookOpen }> = {
  inicial: { label: "Educación Inicial", icon: BookOpen },
  primaria: { label: "Educación Primaria", icon: ClipboardList },
};

interface WeeklyTasksSectionProps {
  filterLevel?: string;
}

const WeeklyTasksSection = ({ filterLevel }: WeeklyTasksSectionProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const { toast } = useToast();

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
  const isCurrentOrFuture = !isAfter(startOfWeek(new Date(), { weekStartsOn: 1 }), currentWeekStart);

  useEffect(() => {
    const fetchWeeks = async () => {
      let query = supabase
        .from("weekly_tasks")
        .select("week_start")
        .order("week_start", { ascending: false });
      if (filterLevel) query = query.eq("level", filterLevel);
      const { data } = await query;
      if (data) {
        const unique = [...new Set(data.map((d) => d.week_start))];
        setAvailableWeeks(unique);
      }
    };
    fetchWeeks();
  }, [filterLevel]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
      let query = (supabase as any)
        .from("weekly_tasks")
        .select(`*, task_files (id, file_name, file_path, file_size, mime_type)`)
        .eq("week_start", weekStartStr)
        .order("level")
        .order("subject");
      if (filterLevel) query = query.eq("level", filterLevel);
      const { data } = await query;
      setTasks(
        ((data || []) as WeeklyTask[]).map((t) => ({
          ...t,
          task_files: t.task_files || [],
        }))
      );
      setLoading(false);
    };
    fetchTasks();
  }, [currentWeekStart, filterLevel]);

  const goToPrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const handleDownload = async (file: TaskFile) => {
    try {
      setDownloadingPath(file.file_path);
      await downloadActivityFile(file.file_path, file.file_name);
    } catch {
      toast({ title: "Error", description: "No se pudo descargar el archivo.", variant: "destructive" });
    } finally {
      setDownloadingPath(null);
    }
  };

  const tasksByLevel = tasks.reduce((acc, t) => {
    if (!acc[t.level]) acc[t.level] = [];
    acc[t.level].push(t);
    return acc;
  }, {} as Record<string, WeeklyTask[]>);

  const levelLabel = filterLevel ? levelConfig[filterLevel]?.label || filterLevel : null;

  return (
    <section id="actividades" className="py-24 bg-section-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold uppercase tracking-widest text-lg">
            {levelLabel || "Actividades"}
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Tareas Semanales {levelLabel ? `- ${levelLabel}` : ""}
          </h2>
        </motion.div>

        {/* Week navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={goToPrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center min-w-[220px]">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Semana</p>
              <p className="font-display text-lg font-bold text-foreground">{weekLabel}</p>
            </div>
            <Button variant="outline" size="icon" onClick={goToNextWeek} disabled={isCurrentOrFuture}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Available weeks quick access */}
        {availableWeeks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <span className="text-sm text-muted-foreground self-center mr-2">Semanas disponibles:</span>
            {availableWeeks.slice(0, 8).map((ws) => {
              const d = new Date(ws + "T00:00:00");
              const isActive = format(currentWeekStart, "yyyy-MM-dd") === ws;
              return (
                <Button
                  key={ws}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentWeekStart(d)}
                  className="text-xs"
                >
                  {format(d, "d MMM", { locale: es })}
                </Button>
              );
            })}
          </div>
        )}

        {/* Weekly tasks */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No hay tareas publicadas para esta semana.</p>
            <p className="text-muted-foreground text-sm mt-2">Seleccione otra semana o vuelva más tarde.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {Object.entries(tasksByLevel).map(([level, levelTasks], i) => {
              const config = levelConfig[level];
              const Icon = config?.icon || BookOpen;
              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="bg-card rounded-xl p-8 shadow-sm border border-border"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {config?.label || level}
                    </h3>
                  </div>
                  <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-4">
                    Tareas de la Semana
                  </p>
                  <ul className="space-y-5">
                    {levelTasks.map((t) => (
                      <li key={t.id} className="border-l-2 border-accent pl-4">
                        <span className="text-sm font-bold text-foreground">{t.subject}</span>
                        <p className="text-sm text-muted-foreground">{t.task_description}</p>

                        {/* Legacy attachment URL */}
                        {t.attachment_url && (
                          <a
                            href={t.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1"
                          >
                            <Download className="w-3 h-3" /> Descargar adjunto
                          </a>
                        )}

                        {/* Uploaded files */}
                        {t.task_files.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {t.task_files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background p-3"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-accent shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{file.file_name}</p>
                                    {file.file_size && (
                                      <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 shrink-0 text-xs"
                                  disabled={downloadingPath === file.file_path}
                                  onClick={() => void handleDownload(file)}
                                >
                                  {downloadingPath === file.file_path ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3" />
                                  )}
                                  Descargar
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default WeeklyTasksSection;
