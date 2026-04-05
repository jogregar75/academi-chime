import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, BookOpen, ClipboardList, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isAfter } from "date-fns";
import { es } from "date-fns/locale";

type WeeklyTask = {
  id: string;
  week_start: string;
  week_end: string;
  level: string;
  subject: string;
  task_description: string;
  attachment_url: string | null;
};

const schoolEvents = [
  { date: "15 Mar", title: "Día de la Familia", desc: "Jornada de integración con actividades deportivas y culturales." },
  { date: "22 Mar", title: "Feria de Ciencias", desc: "Exposición de proyectos de investigación de primaria y secundaria." },
  { date: "5 Abr", title: "Olimpiadas Matemáticas", desc: "Competencia interescolar de matemáticas para todos los niveles." },
  { date: "20 Abr", title: "Festival Cultural", desc: "Presentaciones artísticas, danzas típicas y muestra gastronómica." },
];

const levelConfig = {
  inicial: { label: "Educación Inicial", icon: BookOpen },
  primaria: { label: "Educación Primaria", icon: ClipboardList },
};

const ActivitiesSection = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
  const isCurrentOrFuture = !isAfter(startOfWeek(new Date(), { weekStartsOn: 1 }), currentWeekStart);

  // Fetch available weeks
  useEffect(() => {
    const fetchWeeks = async () => {
      const { data } = await supabase
        .from("weekly_tasks")
        .select("week_start")
        .order("week_start", { ascending: false });
      if (data) {
        const unique = [...new Set(data.map((d) => d.week_start))];
        setAvailableWeeks(unique);
      }
    };
    fetchWeeks();
  }, []);

  // Fetch tasks for current week
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
      const { data } = await supabase
        .from("weekly_tasks")
        .select("*")
        .eq("week_start", weekStartStr)
        .order("level")
        .order("subject");
      setTasks(data || []);
      setLoading(false);
    };
    fetchTasks();
  }, [currentWeekStart]);

  const goToPrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const downloadTasksPDF = () => {
    // Generate a simple text-based download of the tasks
    const grouped = tasks.reduce((acc, t) => {
      if (!acc[t.level]) acc[t.level] = [];
      acc[t.level].push(t);
      return acc;
    }, {} as Record<string, WeeklyTask[]>);

    let content = `TAREAS SEMANALES - ${weekLabel}\n${"=".repeat(50)}\n\n`;
    for (const [level, levelTasks] of Object.entries(grouped)) {
      const config = levelConfig[level as keyof typeof levelConfig];
      content += `📚 ${config?.label || level}\n${"-".repeat(30)}\n`;
      for (const t of levelTasks) {
        content += `• ${t.subject}: ${t.task_description}\n`;
      }
      content += "\n";
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tareas-semana-${format(currentWeekStart, "yyyy-MM-dd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tasksByLevel = tasks.reduce((acc, t) => {
    if (!acc[t.level]) acc[t.level] = [];
    acc[t.level].push(t);
    return acc;
  }, {} as Record<string, WeeklyTask[]>);

  return (
    <section id="actividades" className="py-24 bg-section-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold uppercase tracking-widest text-lg">Actividades</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Tareas Semanales y Eventos
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
          {tasks.length > 0 && (
            <Button variant="secondary" onClick={downloadTasksPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Descargar Tareas
            </Button>
          )}
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
          <div className="text-center py-16 mb-20">
            <p className="text-muted-foreground text-lg">No hay tareas publicadas para esta semana.</p>
            <p className="text-muted-foreground text-sm mt-2">Seleccione otra semana o vuelva más tarde.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 mb-20 max-w-5xl mx-auto">
            {Object.entries(tasksByLevel).map(([level, levelTasks], i) => {
              const config = levelConfig[level as keyof typeof levelConfig];
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
                  <ul className="space-y-4">
                    {levelTasks.map((t) => (
                      <li key={t.id} className="border-l-2 border-accent pl-4">
                        <span className="text-sm font-bold text-foreground">{t.subject}</span>
                        <p className="text-sm text-muted-foreground">{t.task_description}</p>
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
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* School events */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Calendar className="w-6 h-6 text-accent" />
            <h3 className="font-display text-2xl font-bold text-foreground">Próximas Actividades del Colegio</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {schoolEvents.map((event, i) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                <div className="bg-primary rounded-lg px-3 py-2 h-fit text-center min-w-[60px]">
                  <span className="text-accent text-xs font-bold uppercase block">{event.date.split(" ")[1]}</span>
                  <span className="text-primary-foreground text-2xl font-bold">{event.date.split(" ")[0]}</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">{event.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivitiesSection;
