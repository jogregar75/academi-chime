import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ClipboardList, ChevronLeft, ChevronRight, Download, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { downloadActivityFile, formatFileSize } from "@/lib/activity-files";
import { useToast } from "@/hooks/use-toast";

type AttachedFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
};

type UnifiedItem = {
  id: string;
  source: "task" | "activity";
  level: string;
  title: string;
  description: string;
  attachment_url: string | null;
  files: AttachedFile[];
  // The date used to bucket into a week
  reference_date: string;
};

const levelConfig: Record<string, { label: string; icon: typeof BookOpen }> = {
  inicial: { label: "Educación Inicial", icon: BookOpen },
  primaria: { label: "Educación Primaria", icon: ClipboardList },
  secundaria: { label: "Educación Secundaria", icon: ClipboardList },
};

interface WeeklyTasksSectionProps {
  filterLevel?: string;
}

const toWeekStart = (dateStr: string) =>
  format(startOfWeek(parseISO(dateStr), { weekStartsOn: 1 }), "yyyy-MM-dd");

const WeeklyTasksSection = ({ filterLevel }: WeeklyTasksSectionProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const { toast } = useToast();

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
  const isCurrentOrFuture = !isAfter(startOfWeek(new Date(), { weekStartsOn: 1 }), currentWeekStart);
  const currentWeekStr = format(currentWeekStart, "yyyy-MM-dd");

  // Load all items (both sources) once, filter client-side per week
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      let tasksQ = (supabase as any)
        .from("weekly_tasks")
        .select(`*, task_files (id, file_name, file_path, file_size, mime_type)`);
      let actsQ = (supabase as any)
        .from("school_activities")
        .select(`*, activity_files (id, file_name, file_path, file_size, mime_type)`);

      if (filterLevel) {
        tasksQ = tasksQ.eq("level", filterLevel);
        actsQ = actsQ.eq("level", filterLevel);
      }

      const [{ data: tasks }, { data: acts }] = await Promise.all([tasksQ, actsQ]);

      const unified: UnifiedItem[] = [
        ...((tasks || []) as any[]).map((t) => ({
          id: `t-${t.id}`,
          source: "task" as const,
          level: t.level,
          title: t.subject,
          description: t.task_description,
          attachment_url: t.attachment_url,
          files: t.task_files || [],
          reference_date: t.week_start,
        })),
        ...((acts || []) as any[]).map((a) => ({
          id: `a-${a.id}`,
          source: "activity" as const,
          level: a.level,
          title: a.title,
          description: a.description || "",
          attachment_url: null,
          files: a.activity_files || [],
          reference_date: a.activity_date,
        })),
      ];

      setItems(unified);

      const weeks = new Set<string>();
      unified.forEach((u) => weeks.add(toWeekStart(u.reference_date)));
      setAvailableWeeks([...weeks].sort((a, b) => (a < b ? 1 : -1)));

      setLoading(false);
    };
    fetchAll();
  }, [filterLevel]);

  const goToPrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const handleDownload = async (file: AttachedFile) => {
    try {
      setDownloadingPath(file.file_path);
      await downloadActivityFile(file.file_path, file.file_name);
    } catch {
      toast({ title: "Error", description: "No se pudo descargar el archivo.", variant: "destructive" });
    } finally {
      setDownloadingPath(null);
    }
  };

  const weekItems = items.filter((i) => toWeekStart(i.reference_date) === currentWeekStr);
  const itemsByLevel = weekItems.reduce((acc, t) => {
    if (!acc[t.level]) acc[t.level] = [];
    acc[t.level].push(t);
    return acc;
  }, {} as Record<string, UnifiedItem[]>);

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
            Tareas y Actividades Semanales {levelLabel ? `- ${levelLabel}` : ""}
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
              const d = parseISO(ws);
              const isActive = currentWeekStr === ws;
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

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : weekItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No hay tareas ni actividades publicadas para esta semana.</p>
            <p className="text-muted-foreground text-sm mt-2">Seleccione otra semana o vuelva más tarde.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {Object.entries(itemsByLevel).map(([level, levelItems], i) => {
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
                  <ul className="space-y-5">
                    {levelItems.map((t) => (
                      <li key={t.id} className="border-l-2 border-accent pl-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{t.title}</span>
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            t.source === "task"
                              ? "bg-primary/10 text-primary"
                              : "bg-accent/10 text-accent"
                          }`}>
                            {t.source === "task" ? "Tarea" : "Actividad"}
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                        )}

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

                        {t.files.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {t.files.map((file) => (
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
