import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const BUCKET = "news-media";
const ITEMS_PER_PAGE = 9;

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
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("news")
        .select("id, title, content, published_at, featured, news_media (id, storage_path, media_type, position)")
        .order("published_at", { ascending: false });

      const list = (data ?? []) as NewsItem[];
      for (const item of list) {
        item.news_media.sort((a, b) => a.position - b.position);
        const cover = item.news_media[0];
        if (cover) {
          const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(cover.storage_path, 60 * 60);
          cover.url = signed?.signedUrl;
        }
      }
      setItems(list);
      setLoading(false);
    };
    void load();
  }, []);

  const totalPages = useMemo(() => Math.ceil(items.length / ITEMS_PER_PAGE), [items.length]);
  const paginatedItems = useMemo(
    () => items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE),
    [items, currentPage]
  );

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const excerpt = (text: string, n = 110) =>
    text.length > n ? text.slice(0, n).trimEnd() + "…" : text;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
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
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((item, i) => {
                const cover = item.news_media[0];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      to={`/noticias/${item.id}`}
                      className="block text-left bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group"
                    >
                      <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                        {cover ? (
                          cover.media_type === "image" ? (
                            <img src={cover.url} alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy" />
                          ) : (
                            <video src={cover.url} className="w-full h-full object-cover bg-black" muted />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Sin imagen
                          </div>
                        )}
                        {item.featured && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-semibold shadow">
                            <Star className="w-3 h-3" /> Destacada
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(item.published_at), "d MMM yyyy", { locale: es })}
                        </div>
                        <h3 className="font-display font-bold text-foreground leading-tight line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {excerpt(item.content, 140)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0} className="gap-1">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage + 1} de {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1} className="gap-1">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Noticias;
