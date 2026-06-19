import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "news-media";

type Media = { id: string; storage_path: string; media_type: "image" | "video"; position: number; url?: string };
type NewsItem = {
  id: string;
  title: string;
  content: string;
  published_at: string;
  featured: boolean;
  news_media: Media[];
};

const Noticias = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("news")
        .select("id, title, content, published_at, featured, news_media (id, storage_path, media_type, position)")
        .order("published_at", { ascending: false });

      const list = (data ?? []) as NewsItem[];
      for (const item of list) {
        item.news_media.sort((a, b) => a.position - b.position);
        for (const m of item.news_media) {
          const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(m.storage_path, 60 * 60);
          m.url = signed?.signedUrl;
        }
      }
      setItems(list);
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="text-accent font-semibold uppercase tracking-widest text-sm">Noticias</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Noticias y actividades del colegio
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Enterate de los actos, eventos y novedades de nuestra comunidad educativa.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aún no hay noticias publicadas.</p>
        ) : (
          <div className="space-y-10">
            {items.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              >
                {item.news_media.length > 0 && (
                  <div className={`grid gap-1 ${item.news_media.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"}`}>
                    {item.news_media.slice(0, 6).map((m) =>
                      m.media_type === "image" ? (
                        <img key={m.id} src={m.url} alt={item.title}
                          className="w-full h-56 object-cover" loading="lazy" />
                      ) : (
                        <video key={m.id} src={m.url} controls
                          className="w-full h-56 object-cover bg-black" />
                      )
                    )}
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {format(new Date(item.published_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                    {item.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent px-2 py-0.5 font-semibold">
                        <Star className="w-3 h-3" /> Destacada
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground">{item.title}</h2>
                  <p className="text-muted-foreground mt-3 whitespace-pre-line leading-relaxed">{item.content}</p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Noticias;
