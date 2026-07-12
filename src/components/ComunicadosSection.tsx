import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Bell, CalendarDays, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadAnnouncementFile, formatFileSize } from "@/lib/announcement-files";

type AnnouncementFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string | null;
  urgent: boolean;
  published_at: string;
  created_at: string;
  announcement_files: AnnouncementFile[];
};

const ComunicadosSection = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("announcements")
        .select(`
          id, title, content, urgent, published_at, created_at,
          announcement_files ( id, file_name, file_path, file_size, mime_type, created_at )
        `)
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Error", description: "No se pudieron cargar los comunicados.", variant: "destructive" });
        setItems([]);
      } else {
        const normalized = ((data ?? []) as Announcement[]).map((a) => ({
          ...a,
          announcement_files: [...(a.announcement_files ?? [])].sort((x, y) => (x.created_at < y.created_at ? 1 : -1)),
        }));
        setItems(normalized);
      }
      setLoading(false);
    };
    void fetch();
  }, [toast]);

  const handleDownload = async (file: AnnouncementFile) => {
    try {
      setDownloadingPath(file.file_path);
      await downloadAnnouncementFile(file.file_path, file.file_name);
    } catch {
      toast({ title: "Error", description: "No se pudo descargar el archivo.", variant: "destructive" });
    } finally {
      setDownloadingPath(null);
    }
  };

  return (
    <section id="comunicados" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold uppercase tracking-widest text-lg">Comunicados</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Información para Representantes
          </h2>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : items.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-16 bg-card border border-border rounded-2xl">
            <p className="text-foreground text-xl font-semibold">Aún no hay comunicados publicados.</p>
            <p className="text-muted-foreground mt-2">Los nuevos comunicados aparecerán aquí automáticamente.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {items.map((item, i) => {
              const Icon = item.urgent ? AlertCircle : Bell;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-card rounded-xl p-6 shadow-sm border ${item.urgent ? "border-destructive/40 bg-destructive/5" : "border-border"}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.urgent ? "bg-destructive/10" : "bg-accent/10"}`}>
                      <Icon className={`w-5 h-5 ${item.urgent ? "text-destructive" : "text-accent"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${item.urgent ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                          {item.urgent ? "Urgente" : "Comunicado"}
                        </span>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(`${item.published_at}T00:00:00`), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground mb-2">{item.title}</h4>
                      {item.content && (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
                      )}

                      {item.announcement_files.length > 0 && (
                        <div className="grid gap-2 mt-4">
                          {item.announcement_files.map((file) => (
                            <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border bg-background p-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.mime_type || "Archivo"}{file.file_size ? ` • ${formatFileSize(file.file_size)}` : ""}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2 w-full sm:w-auto"
                                disabled={downloadingPath === file.file_path}
                                onClick={() => void handleDownload(file)}
                              >
                                {downloadingPath === file.file_path ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Descargar
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ComunicadosSection;
