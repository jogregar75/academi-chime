import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Save, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BUCKET = "authority-photos";
const FOLDER = "org-chart";

type Row = { id: string; image_url: string | null };

const OrgChartManager = () => {
  const { toast } = useToast();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchRow = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("org_chart_settings")
      .select("id, image_url")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      toast({ title: "Error", description: "No se pudo cargar.", variant: "destructive" });
    } else if (data) {
      setRow(data as Row);
    } else {
      const { data: ins } = await (supabase as any)
        .from("org_chart_settings")
        .insert({ image_url: null })
        .select("id, image_url")
        .single();
      setRow((ins as Row) ?? null);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void fetchRow();
  }, [fetchRow]);

  const removeOldFile = async (url: string) => {
    const marker = `/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx >= 0) {
      const path = url.substring(idx + marker.length);
      await supabase.storage.from(BUCKET).remove([path]);
    }
  };

  const handleSave = async () => {
    if (!file || !row) return;
    setSaving(true);
    const ext = file.name.split(".").pop();
    const path = `${FOLDER}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: "Error", description: "No se pudo subir la imagen.", variant: "destructive" });
      setSaving(false);
      return;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const newUrl = pub.publicUrl;

    if (row.image_url) await removeOldFile(row.image_url);

    const { error } = await (supabase as any)
      .from("org_chart_settings")
      .update({ image_url: newUrl })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    } else {
      toast({ title: "Organigrama actualizado" });
      setFile(null);
      void fetchRow();
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    if (!row?.image_url) return;
    if (!window.confirm("¿Eliminar la imagen del organigrama?")) return;
    await removeOldFile(row.image_url);
    await (supabase as any).from("org_chart_settings").update({ image_url: null }).eq("id", row.id);
    toast({ title: "Imagen eliminada" });
    void fetchRow();
  };

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-accent font-semibold uppercase tracking-wider">Organigrama</p>
        <h2 className="font-display text-2xl font-bold text-foreground mt-1">Imagen del organigrama</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Suba una imagen (PNG, JPG o SVG). Se mostrará en la página Nosotros → Organigrama.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-7 h-7 animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-5">
          {row?.image_url ? (
            <div className="rounded-lg border border-border bg-background p-3">
              <img src={row.image_url} alt="Organigrama actual" className="max-h-80 mx-auto" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
              No hay imagen publicada.
            </p>
          )}

          <div
            className="flex items-center gap-3 rounded-md border-2 border-dashed border-input bg-background p-3 cursor-pointer hover:border-accent transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground truncate">
              {file ? file.name : "Seleccionar nueva imagen"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex justify-end gap-3">
            {row?.image_url && (
              <Button variant="outline" onClick={() => void handleRemove()} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" /> Eliminar imagen
              </Button>
            )}
            <Button onClick={() => void handleSave()} disabled={!file || saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrgChartManager;
