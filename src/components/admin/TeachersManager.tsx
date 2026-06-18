import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Save, X, Upload, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/image-compress";

const BUCKET = "authority-photos";
const FOLDER = "teachers";

type Level = "inicial" | "primaria_1" | "primaria_2" | "bachillerato";
type Row = {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  level: Level;
  grades: string[] | null;
  subjects: string[] | null;
  years: string[] | null;
  section: string | null;
};

const LEVELS: { value: Level; label: string }[] = [
  { value: "inicial", label: "Educación Inicial" },
  { value: "primaria_1", label: "Primaria — Primera Etapa" },
  { value: "primaria_2", label: "Primaria — Segunda Etapa" },
  { value: "bachillerato", label: "Bachillerato" },
];

const YEAR_OPTIONS = ["1", "2", "3", "4", "5"];

const displayName = (r: Row) =>
  (r.name && r.name.trim()) || `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();

const TeachersManager = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    name: "",
    level: "inicial" as Level,
    section: "",
    grades: "",
    subjects: "",
    years: [] as string[],
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Level | "all">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any).from("teachers").select("*").order("name");
    if (filter !== "all") q = q.eq("level", filter);
    const { data } = await q;
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  const reset = () => {
    setEditing(null);
    setForm({ name: "", level: "inicial", section: "", grades: "", subjects: "", years: [] });
    setFile(null);
    setShowForm(false);
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({
      name: displayName(r),
      level: r.level,
      section: r.section ?? "",
      grades: (r.grades ?? []).join(", "),
      subjects: (r.subjects ?? []).join(", "),
      years: r.years ?? [],
    });
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
      try {
        const compressed = await compressImage(file, { maxSize: 800, quality: 0.82 });
        const ext = (compressed.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
        const path = `${FOLDER}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, { upsert: true, contentType: compressed.type });
        if (error) {
          toast({ title: "Error subiendo imagen", description: error.message, variant: "destructive" });
          setSaving(false);
          return;
        }
        if (editing?.photo_url) await removeFile(editing.photo_url);
        photo_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      } catch (err: any) {
        toast({ title: "Error procesando la imagen", description: err?.message ?? "", variant: "destructive" });
        setSaving(false);
        return;
      }
    }
    const isBach = form.level === "bachillerato";
    // Keep legacy first_name/last_name for compatibility (split on first space).
    const trimmed = form.name.trim();
    const firstSpace = trimmed.indexOf(" ");
    const legacyFirst = firstSpace >= 0 ? trimmed.slice(0, firstSpace) : trimmed;
    const legacyLast = firstSpace >= 0 ? trimmed.slice(firstSpace + 1) : "";

    const payload = {
      name: trimmed,
      first_name: legacyFirst,
      last_name: legacyLast,
      level: form.level,
      section: form.section.trim() || null,
      photo_url,
      grades: isBach ? [] : form.grades.split(",").map((s) => s.trim()).filter(Boolean),
      subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      years: isBach ? form.years : [],
    };
    const { error } = editing
      ? await (supabase as any).from("teachers").update(payload).eq("id", editing.id)
      : await (supabase as any).from("teachers").insert(payload);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "Docente actualizado" : "Docente creado" });
    reset(); void fetchRows();
  };

  const remove = async (r: Row) => {
    if (!window.confirm("¿Eliminar este docente?")) return;
    if (r.photo_url) await removeFile(r.photo_url);
    await (supabase as any).from("teachers").delete().eq("id", r.id);
    toast({ title: "Eliminado" });
    void fetchRows();
  };

  const labelFor = (l: Level) => LEVELS.find((x) => x.value === l)?.label ?? l;
  const isBach = form.level === "bachillerato";

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <p className="text-sm text-accent font-semibold uppercase tracking-wider">Docentes</p>
          <h2 className="font-display text-2xl font-bold text-foreground mt-1">Docentes por nivel</h2>
        </div>
        <div className="flex gap-2 items-center">
          <select value={filter} onChange={(e) => setFilter(e.target.value as Level | "all")} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">Todos</option>
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <Button onClick={() => { reset(); setShowForm(true); }} className="gap-2"><Plus className="w-4 h-4" /> Nuevo</Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={save} className="border border-border rounded-lg p-4 mb-6 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex justify-between items-center">
            <h3 className="font-bold">{editing ? "Editar" : "Nuevo"} docente</h3>
            <Button type="button" variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Nombre completo</Label>
            <Input placeholder="Ej: María Pérez González" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Nivel</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })}>
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Sección</Label>
            <Input placeholder="Ej: A, B, C..." value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
          </div>

          {!isBach ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Grado(s) (separados por coma)</Label>
              <Input placeholder="Ej: 1er grado, 2do grado" value={form.grades} onChange={(e) => setForm({ ...form, grades: e.target.value })} />
            </div>
          ) : null}

          <div className="space-y-2 sm:col-span-2">
            <Label>Espacio(s) curricular(es) (separados por coma)</Label>
            <Input placeholder="Ej: Informática, Matemática, Inglés" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} />
          </div>

          {isBach && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Año(s)</Label>
              <div className="flex flex-wrap gap-2">
                {YEAR_OPTIONS.map((y) => {
                  const active = form.years.includes(y);
                  return (
                    <button type="button" key={y} onClick={() =>
                      setForm({ ...form, years: active ? form.years.filter((x) => x !== y) : [...form.years, y] })}
                      className={`px-3 py-1.5 rounded-full text-sm border ${active ? "bg-accent text-accent-foreground border-accent" : "bg-background border-input"}`}>
                      {y}° año
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              {r.photo_url ? <img src={r.photo_url} alt={displayName(r)} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-muted" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{displayName(r)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {labelFor(r.level)}{r.section ? ` — Secc. ${r.section}` : ""}
                  {r.level === "bachillerato"
                    ? ` — ${(r.subjects ?? []).join(", ")} (${(r.years ?? []).map((y) => `${y}°`).join(", ")})`
                    : ` — ${(r.grades ?? []).join(", ")}${(r.subjects ?? []).length ? ` / ${(r.subjects ?? []).join(", ")}` : ""}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(r)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground sm:col-span-2 md:col-span-3 text-center py-4">Sin docentes aún.</p>}
        </div>
      )}
    </section>
  );
};

export default TeachersManager;
