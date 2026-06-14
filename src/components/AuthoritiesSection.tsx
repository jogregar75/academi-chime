import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Authority = {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  display_order: number;
};

const AuthoritiesSection = () => {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("authorities")
        .select("id, name, role, photo_url, display_order")
        .order("display_order", { ascending: true });
      setAuthorities((data ?? []) as Authority[]);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="py-24 bg-section-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold uppercase tracking-widest text-sm">
            Nuestro equipo
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Autoridades
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Conoce al equipo directivo y de coordinación que guía la formación de nuestros estudiantes.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          (() => {
            const isGerencia = (r: string) => /gerente\s+general/i.test(r);
            const gerentes = authorities.filter((a) => isGerencia(a.role));
            const resto = authorities.filter((a) => !isGerencia(a.role));
            const renderCard = (a: Authority, i: number, highlight = false) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className={
                  highlight
                    ? "bg-card border-2 border-accent rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow flex flex-col ring-1 ring-accent/30"
                    : "bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                }
              >
                <div
                  className={
                    (highlight
                      ? "w-32 h-32 md:w-36 md:h-36 "
                      : "w-24 h-24 md:w-28 md:h-28 ") +
                    "mt-4 mx-auto rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-border"
                  }
                >
                  {a.photo_url ? (
                    <img
                      src={a.photo_url}
                      alt={a.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-4 text-center flex-1 flex flex-col justify-center">
                  <p className={highlight ? "font-display font-bold text-foreground leading-tight text-base" : "font-display font-bold text-foreground leading-tight text-sm"}>
                    {a.name}
                  </p>
                  <p className={(highlight ? "text-accent text-xs font-bold" : "text-accent text-[11px] font-semibold") + " uppercase tracking-wider mt-2"}>
                    {a.role}
                  </p>
                </div>
              </motion.article>
            );
            return (
              <div className="max-w-6xl mx-auto space-y-8">
                {gerentes.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
                    {gerentes.map((a, i) => renderCard(a, i, true))}
                  </div>
                )}
                {resto.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
                    {resto.map((a, i) => renderCard(a, i + gerentes.length))}
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </section>
  );
};

export default AuthoritiesSection;
