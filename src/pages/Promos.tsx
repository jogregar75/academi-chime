import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Promo = { id: string; promo_year: number; image_url: string; display_order: number };

export default function Promos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("promo_logos")
        .select("*")
        .order("display_order")
        .order("promo_year");
      setPromos((data as Promo[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="pt-24 md:pt-28 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="text-accent font-semibold uppercase tracking-widest text-lg">Actividades</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">Nuestras Promociones</h1>
          <p className="text-muted-foreground mt-2 text-lg">Logos de las 39 promociones del Colegio Los Pirineos Don Bosco</p>
        </motion.div>

        {loading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : promos.length === 0 ? (
          <p className="text-center text-muted-foreground">Aún no se han cargado logos.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {promos.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-4 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
              >
                <img src={p.image_url} alt={`Promoción ${p.promo_year}`} className="w-full h-40 object-contain mb-3" />
                <span className="text-sm font-bold text-foreground">Promoción {p.promo_year}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
