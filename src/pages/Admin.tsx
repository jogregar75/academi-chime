import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, LogOut, Plus, Pencil, Trash2, Loader2, BookOpen, ClipboardList, Save, X,
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";
import { isAdminUser } from "@/lib/admin-auth";
import SchoolActivitiesManager from "@/components/admin/SchoolActivitiesManager";

type WeeklyTask = Tables<"weekly_tasks">;

const levelOptions = [
  { value: "inicial", label: "Educación Inicial", icon: BookOpen },
  { value: "primaria", label: "Educación Primaria", icon: ClipboardList },
];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<WeeklyTask | null>(null);
  const [formData, setFormData] = useState({
    week_start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    level: "inicial",
    subject: "",
    task_description: "",
    attachment_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const isAdmin = await isAdminUser(session.user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast({ title: "Acceso denegado", description: "Este usuario no tiene permisos de administrador.", variant: "destructive" });
        navigate("/admin/login");
        return;
      }

      setCheckingAccess(false);
    };

    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const isAdmin = await isAdminUser(session.user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("weekly_tasks").select("*").order("week_start", { ascending: false }).order("level").order("subject");
    if (filterLevel !== "all") query = query.eq("level", filterLevel);
    const { data, error } = await query;
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las tareas.", variant: "destructive" });
    }
    setTasks(data || []);
    setLoading(false);
  }, [filterLevel, toast]);

  useEffect(() => {
    if (!checkingAccess) void fetchTasks();
  }, [checkingAccess, fetchTasks]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const resetForm = () => {
    setFormData({
      week_start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
      level: "inicial",
      subject: "",
      task_description: "",
      attachment_url: "",
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const openEdit = (task: WeeklyTask) => {
    setEditingTask(task);
    setFormData({
      week_start: task.week_start,
      level: task.level,
      subject: task.subject,
      task_description: task.task_description,
      attachment_url: task.attachment_url || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.task_description.trim()) {
      toast({ title: "Campos requeridos", description: "Complete la materia y la descripción.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const weekStart = new Date(formData.week_start + "T00:00:00");
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const payload = {
      week_start: formData.week_start,
      week_end: format(weekEnd, "yyyy-MM-dd"),
      level: formData.level,
      subject: formData.subject.trim(),
      task_description: formData.task_description.trim(),
      attachment_url: formData.attachment_url.trim() || null,
    };

    let error;
    if (editingTask) {
      ({ error } = await supabase.from("weekly_tasks").update(payload).eq("id", editingTask.id));
    } else {
      ({ error } = await supabase.from("weekly_tasks").insert(payload));
    }
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo guardar la tarea.", variant: "destructive" });
    } else {
      toast({ title: editingTask ? "Tarea actualizada" : "Tarea creada", description: "Los cambios se guardaron correctamente." });
      resetForm();
      void fetchTasks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar esta tarea?")) return;
    const { error } = await supabase.from("weekly_tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    } else {
      toast({ title: "Eliminada", description: "La tarea fue eliminada." });
      void fetchTasks();
    }
  };

  const grouped = tasks.reduce((acc, t) => {
    const key = t.week_start;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, WeeklyTask[]>);

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary border-b border-primary-foreground/10 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2 text-primary-foreground">
            <GraduationCap className="w-7 h-7 text-accent" />
            <span className="font-display text-lg font-bold">Panel Administrativo</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-primary-foreground/70 hover:text-accent text-sm transition-colors hidden sm:block">
              Ver sitio web
            </a>
            <Button variant="secondary" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-10">
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Tareas Semanales</h1>
              <p className="text-muted-foreground text-sm">Gestione las tareas asignadas por semana y nivel</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos los niveles</option>
                {levelOptions.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Nueva Tarea
              </Button>
            </div>
          </div>

          {showForm && (
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {editingTask ? "Editar Tarea" : "Nueva Tarea"}
                </h2>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inicio de semana (lunes)</Label>
                  <Input
                    type="date"
                    value={formData.week_start}
                    onChange={(e) => setFormData({ ...formData, week_start: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nivel</Label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {levelOptions.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Materia</Label>
                  <Input
                    placeholder="Ej: Matemáticas"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL del adjunto (opcional)</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.attachment_url}
                    onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                    maxLength={500}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Descripción de la tarea</Label>
                  <Textarea
                    placeholder="Describe la tarea asignada..."
                    value={formData.task_description}
                    onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                    required
                    maxLength={1000}
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingTask ? "Guardar Cambios" : "Crear Tarea"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground text-lg">No hay tareas registradas</p>
              <p className="text-muted-foreground text-sm mt-1">Presione "Nueva Tarea" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([weekStart, weekTasks]) => {
                const ws = new Date(weekStart + "T00:00:00");
                const we = endOfWeek(ws, { weekStartsOn: 1 });
                return (
                  <div key={weekStart}>
                    <h3 className="font-display text-lg font-bold text-foreground mb-3 border-b border-border pb-2">
                      Semana del {format(ws, "d MMM", { locale: es })} al {format(we, "d MMM yyyy", { locale: es })}
                    </h3>
                    <div className="space-y-3">
                      {weekTasks.map((task) => {
                        const levelCfg = levelOptions.find((l) => l.value === task.level);
                        const Icon = levelCfg?.icon || BookOpen;
                        return (
                          <div
                            key={task.id}
                            className="bg-card rounded-lg p-4 border border-border flex items-start gap-4 group hover:shadow-sm transition-shadow"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
                              <Icon className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                                  {levelCfg?.label}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-sm font-bold text-foreground">{task.subject}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{task.task_description}</p>
                              {task.attachment_url && (
                                <a href={task.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-1 inline-block">
                                  📎 Adjunto
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(task)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <SchoolActivitiesManager />
      </main>
    </div>
  );
};

export default Admin;
