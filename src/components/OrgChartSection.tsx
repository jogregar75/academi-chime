import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const OrgChartSection = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("org_chart_settings")
        .select("image_url")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setImageUrl((data?.image_url as string | null) ?? null);
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
          className="text-center mb-12"
        >
          <span className="text-accent font-semibold uppercase tracking-widest text-sm">
            Organización
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Organigrama
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Estructura organizativa de la U.E. Colegio Los Pirineos Don Bosco.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : imageUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl shadow-sm p-4 md:p-6"
            >
              <img
                src={imageUrl}
                alt="Organigrama institucional"
                className="w-full h-auto rounded-lg"
                loading="lazy"
              />
            </motion.div>
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <ImageOff className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Aún no se ha publicado el organigrama.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OrgChartSection;
