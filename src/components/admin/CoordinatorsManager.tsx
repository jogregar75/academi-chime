import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Save, X, Upload, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const BUCKET = "authority-photos";
const FOLDER = "coordinators";

type Level = "inicial" | "primaria_1" | "primaria_2" | "bachillerato";
type Row = { id: string; name: string; photo_url: string | null; level: Level; section: string };

const SECTIONS: { level: Level; section: string; label: string }[] = [
  { level: "inicial", section: "inicial", label: "Educación Inicial" },
  { level: "primaria_1", section: "primera_etapa", label: "Primaria — Primera Etapa" },
  { level: "primaria_2", section: "segunda_etapa", label: "Primaria — Segunda Etapa" },
  { level: "bachillerato", section: "1", label: "Bachillerato — 1er Año" },
  { level: "bachillerato", section: "2", label: "Bachillerato — 2do Año" },
  { level: "bachillerato", section: "3", label: "Bachillerato — 3er Año" },
  { level: "bachillerato", section: "4", label: "Bachillerato — 4to Año" },
  { level: "bachillerato", section: "5", label: "Bachillerato — 5to Año" },
];

const CoordinatorsManager = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ name: "", level: "inicial" as Level, section: "inicial" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("coordinators").select("*").order("level").order("section");
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const reset = () => {
    setEditing(null); setForm({ name: "", level: "inicial", section: "inicial" }); setFile(null); setShowForm(false);
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({ name: r.name, level: r.level, section: r.section });
    setFile(null);
    setShowForm(true);
  };

  const removeFile = async (url: string) => {
    const marker = `/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx >= 0) await supabase.storage.from(BUCKET).remove([url.substring(idx + marker.length)]);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    let photo_url: string | null = editing?.photo_url ?? null;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${FOLDER}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) { toast({ title: "Error subiendo imagen", variant: "destructive" }); setSaving(false); return; }
      if (editing?.photo_url) await removeFile(editing.photo_url);
      photo_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    const payload = { name: form.name.trim(), level: form.level, section: form.section, photo_url };
    const { error } = editing
      ? await (supabase as any).from("coordinators").update(payload).eq("id", editing.id)
      : await (supabase as any).from("coordinators").upsert(payload, { onConflict: "level,section" });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Coordinador actualizado" : "Coordinador guardado" });
    reset(); void fetchRows();
  };

  const remove = async (r: Row) => {
    if (!window.confirm("¿Eliminar este coordinador?")) return;
    if (r.photo_url) await removeFile(r.photo_url);
    await (supabase as any).from("coordinators").delete().eq("id", r.id);
    toast({ title: "Eliminado" });
    void fetchRows();
  };

  const labelFor = (l: Level, s: string) => SECTIONS.find((x) => x.level === l && x.section === s)?.label ?? `${l} / ${s}`;

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-accent font-semibold uppercase tracking-wider">Coordinadores</p>
          <h2 className="font-display text-2xl font-bold text-foreground mt-1">Coordinadores por nivel / año</h2>
        </div>
        <Button onClick={() => { reset(); setShowForm(true); }} className="gap-2"><Plus className="w-4 h-4" /> Nuevo</Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="border border-border rounded-lg p-4 mb-6 grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2 flex justify-between items-center">
            <h3 className="font-bold">{editing ? "Editar" : "Nuevo"} coordinador</h3>
            <Button type="button" variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Nombre completo</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Nivel / Sección</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={`${form.level}|${form.section}`}
              onChange={(e) => {
                const [level, section] = e.target.value.split("|");
                setForm({ ...form, level: level as Level, section });
              }}
            >
              {SECTIONS.map((s) => (
                <option key={`${s.level}|${s.section}`} value={`${s.level}|${s.section}`}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Foto</Label>
            <div className="flex items-center gap-3 rounded-md border-2 border-dashed border-input bg-background p-3 cursor-pointer" onClick={() => fileRef.current?.click()}>
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">{file ? file.name : editing?.photo_url ? "Reemplazar imagen" : "Seleccionar imagen"}</span>
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
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
              {r.photo_url ? <img src={r.photo_url} alt={r.name} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-muted" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{labelFor(r.level, r.section)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(r)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground sm:col-span-2 md:col-span-3 text-center py-4">Sin coordinadores aún.</p>}
        </div>
      )}
    </section>
  );
};

export default CoordinatorsManager;
