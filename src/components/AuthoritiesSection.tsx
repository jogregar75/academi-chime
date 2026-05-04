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
            const renderCard = (a: Authority, i: number) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {a.photo_url ? (
                    <img
                      src={a.photo_url}
                      alt={a.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <User className="w-16 h-16 text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-4 text-center flex-1 flex flex-col justify-center">
                  <p className="font-display font-bold text-foreground leading-tight">
                    {a.name}
                  </p>
                  <p className="text-accent text-xs font-semibold uppercase tracking-wider mt-2">
                    {a.role}
                  </p>
                </div>
              </motion.article>
            );
            return (
              <div className="max-w-6xl mx-auto space-y-6">
                {gerentes.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {gerentes.map((a, i) => renderCard(a, i))}
                  </div>
                )}
                {resto.length > 0 && (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {resto.map((a, i) => renderCard(a, i + gerentes.length))}
                  </div>
                )}
              </div>
            );
          })()}
        )}
      </div>
    </section>
  );
};

export default AuthoritiesSection;
