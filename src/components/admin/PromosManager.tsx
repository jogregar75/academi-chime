import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Save, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const BUCKET = "authority-photos";
const FOLDER = "promos";

type Row = { id: string; promo_year: number; image_url: string; display_order: number };

const PromosManager = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ promo_year: new Date().getFullYear(), display_order: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("promo_logos").select("*").order("display_order").order("promo_year");
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const reset = () => {
    setForm({ promo_year: new Date().getFullYear(), display_order: rows.length });
    setFile(null);
    setShowForm(false);
  };

  const removeFile = async (url: string) => {
    const marker = `/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx >= 0) await supabase.storage.from(BUCKET).remove([url.substring(idx + marker.length)]);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast({ title: "Seleccione una imagen", variant: "destructive" }); return; }
    setSaving(true);
    const ext = file.name.split(".").pop();
    const path = `${FOLDER}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (upErr) { toast({ title: "Error subiendo imagen", variant: "destructive" }); setSaving(false); return; }
    const image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const { error } = await (supabase as any).from("promo_logos").insert({
      promo_year: form.promo_year,
      image_url,
      display_order: form.display_order,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Logo agregado" });
    reset(); void fetchRows();
  };

  const remove = async (r: Row) => {
    if (!window.confirm("¿Eliminar este logo?")) return;
    if (r.image_url) await removeFile(r.image_url);
    await (supabase as any).from("promo_logos").delete().eq("id", r.id);
    toast({ title: "Eliminado" });
    void fetchRows();
  };

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-accent font-semibold uppercase tracking-wider">Promociones</p>
          <h2 className="font-display text-2xl font-bold text-foreground mt-1">Logos de promociones</h2>
        </div>
        <Button onClick={() => { reset(); setShowForm(true); }} className="gap-2"><Plus className="w-4 h-4" /> Nuevo</Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="border border-border rounded-lg p-4 mb-6 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex justify-between items-center">
            <h3 className="font-bold">Nuevo logo</h3>
            <Button type="button" variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-2"><Label>Año de la promoción</Label><Input type="number" value={form.promo_year} onChange={(e) => setForm({ ...form, promo_year: parseInt(e.target.value, 10) || 0 })} required /></div>
          <div className="space-y-2"><Label>Orden de aparición</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })} /></div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Imagen del logo</Label>
            <div className="flex items-center gap-3 rounded-md border-2 border-dashed border-input bg-background p-3 cursor-pointer" onClick={() => fileRef.current?.click()}>
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">{file ? file.name : "Seleccionar imagen"}</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={reset}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar</Button>
          </div>
        </form>
      )}

      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {rows.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-3 flex flex-col items-center gap-2">
              <img src={r.image_url} alt={`Promo ${r.promo_year}`} className="w-full h-28 object-contain" />
              <span className="text-sm font-bold">Promo {r.promo_year}</span>
              <Button variant="ghost" size="sm" onClick={() => remove(r)} className="text-destructive gap-1"><Trash2 className="w-4 h-4" /> Eliminar</Button>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-4">Sin logos aún.</p>}
        </div>
      )}
    </section>
  );
};

export default PromosManager;
