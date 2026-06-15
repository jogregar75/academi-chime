import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Level = "inicial" | "primaria_1" | "primaria_2" | "bachillerato";

type Coordinator = {
  id: string;
  name: string;
  photo_url: string | null;
  level: Level;
  section: string;
};

type Teacher = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  level: Level;
  grades: string[];
  subjects: string[];
  years: string[];
};

interface Props {
  title: string;
  subtitle?: string;
  level: Level;
  /** For coordinator: section identifier. For bachillerato also used to filter teachers by year. */
  section: string;
}

const PersonCard = ({
  photo,
  title,
  subtitle,
  highlight,
}: {
  photo: string | null;
  title: string;
  subtitle?: string;
  highlight?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`flex flex-col items-center text-center bg-card rounded-xl p-5 border ${
      highlight ? "border-accent ring-1 ring-accent/30" : "border-border"
    } shadow-sm`}
  >
    {photo ? (
      <img
        src={photo}
        alt={title}
        className={`rounded-full object-cover mb-3 ${
          highlight ? "w-32 h-32 md:w-36 md:h-36" : "w-24 h-24 md:w-28 md:h-28"
        }`}
      />
    ) : (
      <div
        className={`rounded-full bg-muted flex items-center justify-center mb-3 ${
          highlight ? "w-32 h-32 md:w-36 md:h-36" : "w-24 h-24 md:w-28 md:h-28"
        }`}
      >
        <User className="w-10 h-10 text-muted-foreground" />
      </div>
    )}
    <h3 className={`font-display font-bold text-foreground ${highlight ? "text-base" : "text-sm"}`}>{title}</h3>
    {subtitle && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{subtitle}</p>}
  </motion.div>
);

const StaffSection = ({ title, subtitle, level, section }: Props) => {
  const [coord, setCoord] = useState<Coordinator | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: c } = await (supabase as any)
        .from("coordinators")
        .select("*")
        .eq("level", level)
        .eq("section", section)
        .maybeSingle();
      setCoord((c as Coordinator) ?? null);

      let q = (supabase as any).from("teachers").select("*").eq("level", level).order("last_name");
      const { data: t } = await q;
      let list = (t as Teacher[]) ?? [];
      if (level === "bachillerato") {
        list = list.filter((x) => (x.years ?? []).includes(section));
      }
      setTeachers(list);
      setLoading(false);
    };
    void load();
  }, [level, section]);

  const renderTeacherSubtitle = (t: Teacher) => {
    if (level === "bachillerato") {
      const subjects = (t.subjects ?? []).join(", ");
      const years = (t.years ?? []).map((y) => `${y}° año`).join(", ");
      return [subjects, years].filter(Boolean).join("\n");
    }
    return (t.grades ?? []).join(", ");
  };

  return (
    <section className="pt-24 md:pt-28 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="text-accent font-semibold uppercase tracking-widest text-lg">Niveles</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-lg">{subtitle}</p>}
        </motion.div>

        {loading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold text-center text-foreground mb-6">Coordinador</h2>
            <div className="flex justify-center mb-14">
              {coord ? (
                <div className="w-full max-w-xs">
                  <PersonCard photo={coord.photo_url} title={coord.name} subtitle="Coordinador" highlight />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Próximamente</p>
              )}
            </div>

            <h2 className="font-display text-2xl font-bold text-center text-foreground mb-6">Docentes</h2>
            {teachers.length === 0 ? (
              <p className="text-center text-muted-foreground">Próximamente</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
                {teachers.map((t) => (
                  <PersonCard
                    key={t.id}
                    photo={t.photo_url}
                    title={`${t.first_name} ${t.last_name}`}
                    subtitle={renderTeacherSubtitle(t)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default StaffSection;
