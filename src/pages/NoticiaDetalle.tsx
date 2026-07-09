import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Loader2, Star, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

const NoticiaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("news")
        .select("id, title, content, published_at, featured, news_media (id, storage_path, media_type, position)")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const news = data as NewsItem;
      news.news_media.sort((a, b) => a.position - b.position);
      for (const m of news.news_media) {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(m.storage_path, 60 * 60);
        m.url = signed?.signedUrl;
      }
      setItem(news);
      setLoading(false);
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-background flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="text-muted-foreground">La noticia no existe o fue eliminada.</p>
          <Button asChild variant="outline" className="mt-6 gap-2">
            <Link to="/noticias"><ArrowLeft className="w-4 h-4" /> Volver a Noticias</Link>
          </Button>
        </div>
      </div>
    );
  }

  const cover = item.news_media[0];
  const rest = item.news_media.slice(1);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2 -ml-2">
          <Link to="/noticias"><ArrowLeft className="w-4 h-4" /> Volver</Link>
        </Button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
        >
          {cover && (
            <div className="w-full bg-black">
              {cover.media_type === "image" ? (
                <img src={cover.url} alt={item.title} className="w-full max-h-[520px] object-cover" />
              ) : (
                <video src={cover.url} controls className="w-full max-h-[520px] object-contain bg-black" />
              )}
            </div>
          )}

          <div className="p-6 md:p-10">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
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
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{item.title}</h1>
            <p className="text-foreground/90 mt-6 whitespace-pre-line leading-relaxed text-base md:text-lg">
              {item.content}
            </p>

            {rest.length > 0 && (
              <div className="mt-10 pt-8 border-t border-border">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Galería</h2>
                <div className={`grid gap-3 ${rest.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                  {rest.map((m) =>
                    m.media_type === "image" ? (
                      <img key={m.id} src={m.url} alt={item.title}
                        className="w-full rounded-lg object-cover max-h-[420px]" />
                    ) : (
                      <video key={m.id} src={m.url} controls
                        className="w-full rounded-lg object-cover max-h-[420px] bg-black" />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default NoticiaDetalle;
