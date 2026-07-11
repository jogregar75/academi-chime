import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, LogOut, Loader2, ArrowLeft,
  ClipboardList, CalendarDays, Users, UserCog, Network, Award, Newspaper, ShieldCheck,
} from "lucide-react";
import { isAdminUser } from "@/lib/admin-auth";
import WeeklyTasksManager from "@/components/admin/WeeklyTasksManager";
import SchoolActivitiesManager from "@/components/admin/SchoolActivitiesManager";
import AuthoritiesManager from "@/components/admin/AuthoritiesManager";
import OrgChartManager from "@/components/admin/OrgChartManager";
import CoordinatorsManager from "@/components/admin/CoordinatorsManager";
import TeachersManager from "@/components/admin/TeachersManager";
import PromosManager from "@/components/admin/PromosManager";
import NewsManager from "@/components/admin/NewsManager";
import UsersManager from "@/components/admin/UsersManager";

type SectionKey =
  | "tareas" | "actividades" | "autoridades" | "coordinadores"
  | "docentes" | "organigrama" | "promos" | "noticias" | "usuarios";

const SECTIONS: { key: SectionKey; title: string; description: string; icon: React.ElementType; color: string }[] = [
  { key: "noticias", title: "Noticias", description: "Noticias, actos y actividades con fotos/videos", icon: Newspaper, color: "bg-indigo-500" },
  { key: "tareas", title: "Tareas Semanales", description: "Asignaciones por semana y nivel", icon: ClipboardList, color: "bg-blue-500" },
  { key: "actividades", title: "Actividades del Colegio", description: "Eventos y actividades escolares", icon: CalendarDays, color: "bg-emerald-500" },
  { key: "autoridades", title: "Autoridades", description: "Directivos y personal jerárquico", icon: Users, color: "bg-amber-500" },
  { key: "coordinadores", title: "Coordinadores", description: "Coordinadores por nivel y año", icon: UserCog, color: "bg-purple-500" },
  { key: "docentes", title: "Docentes", description: "Profesores y secciones", icon: GraduationCap, color: "bg-rose-500" },
  { key: "organigrama", title: "Organigrama", description: "Imagen institucional", icon: Network, color: "bg-cyan-500" },
  { key: "promos", title: "Promociones", description: "Logos de promociones", icon: Award, color: "bg-orange-500" },
  { key: "usuarios", title: "Usuarios", description: "Administradores con acceso al panel", icon: ShieldCheck, color: "bg-slate-600" },
];

const renderSection = (key: SectionKey) => {
  switch (key) {
    case "noticias": return <NewsManager />;
    case "tareas": return <WeeklyTasksManager />;
    case "actividades": return <SchoolActivitiesManager />;
    case "autoridades": return <AuthoritiesManager />;
    case "coordinadores": return <CoordinatorsManager />;
    case "docentes": return <TeachersManager />;
    case "organigrama": return <OrgChartManager />;
    case "promos": return <PromosManager />;
    case "usuarios": return <UsersManager />;
  }
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const active = params.get("s") as SectionKey | null;
  const activeSection = SECTIONS.find((s) => s.key === active);

  useEffect(() => {
    // IMPORTANT: never `await` Supabase calls inside onAuthStateChange —
    // it deadlocks the SDK and causes subsequent inserts/updates to hang
    // until the page is refreshed. Subscribe first (sync-only handler),
    // then do the async access check separately.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        navigate("/admin/login");
      }
    });

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      const ok = await isAdminUser(session.user.id);
      if (!ok) {
        await supabase.auth.signOut();
        toast({ title: "Acceso denegado", variant: "destructive" });
        navigate("/admin/login"); return;
      }
      setCheckingAccess(false);
    };
    void check();

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (checkingAccess) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
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
            <Link to="/" className="text-primary-foreground/70 hover:text-accent text-sm hidden sm:block">Ver sitio web</Link>
            <Button variant="secondary" size="sm" onClick={handleLogout} className="gap-2"><LogOut className="w-4 h-4" /> Salir</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!activeSection ? (
          <>
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Elige qué sección querés gestionar</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setParams({ s: s.key })}
                    className="group text-left bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-foreground group-hover:text-accent transition-colors">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setParams({})}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al dashboard
            </button>
            {renderSection(activeSection.key)}
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
