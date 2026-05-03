import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, Upload, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Authority = {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  display_order: number;
};

const BUCKET = "authority-photos";

const AuthoritiesManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Authority | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", display_order: 0 });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("authorities")
      .select("*")
      .order("display_order");
    if (error) {
      toast({ title: "Error", description: "No se pudo cargar.", variant: "destructive" });
    } else {
      setItems((data ?? []) as Authority[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const reset = () => {
    setEditing(null);
    setForm({ name: "", role: "", display_order: (items.at(-1)?.display_order ?? 0) + 10 });
    setPhotoFile(null);
    setShowForm(false);
  };

  const openEdit = (a: Authority) => {
    setEditing(a);
    setForm({ name: a.name, role: a.role, display_order: a.display_order });
    setPhotoFile(null);
    setShowForm(true);
  };

  const uploadPhoto = async (id: string): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop();
    const path = `${id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, photoFile, { upsert: true });
    if (error) {
      toast({ title: "Error", description: "No se pudo subir la foto.", variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast({ title: "Campos requeridos", description: "Nombre y cargo.", variant: "destructive" });
      return;
    }
    setSaving(true);

    let id = editing?.id;
    let photo_url = editing?.photo_url ?? null;

    if (editing) {
      const { error } = await (supabase as any)
        .from("authorities")
        .update({ name: form.name.trim(), role: form.role.trim(), display_order: form.display_order })
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await (supabase as any)
        .from("authorities")
        .insert({ name: form.name.trim(), role: form.role.trim(), display_order: form.display_order })
        .select("id")
        .single();
      if (error || !data) {
        toast({ title: "Error", description: "No se pudo crear.", variant: "destructive" });
        setSaving(false);
        return;
      }
      id = data.id;
    }

    if (photoFile && id) {
      const url = await uploadPhoto(id);
      if (url) {
        photo_url = url;
        await (supabase as any).from("authorities").update({ photo_url: url }).eq("id", id);
      }
    }

    setSaving(false);
    toast({ title: editing ? "Actualizado" : "Creado" });
    reset();
    void fetchItems();
  };

  const handleDelete = async (a: Authority) => {
    if (!window.confirm(`¿Eliminar a "${a.role}"?`)) return;
    if (a.photo_url) {
      // path is after bucket name in URL
      const marker = `/${BUCKET}/`;
      const idx = a.photo_url.indexOf(marker);
      if (idx >= 0) {
        const path = a.photo_url.substring(idx + marker.length);
        await supabase.storage.from(BUCKET).remove([path]);
      }
    }
    const { error } = await (supabase as any).from("authorities").delete().eq("id", a.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    } else {
      toast({ title: "Eliminado" });
      void fetchItems();
    }
  };

  return (
    <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-accent font-semibold uppercase tracking-wider">Autoridades</p>
          <h2 className="font-display text-2xl font-bold text-foreground mt-1">Equipo directivo</h2>
          <p className="text-muted-foreground text-sm mt-1">Administre nombre, cargo y foto de cada autoridad.</p>
        </div>
        <Button
          onClick={() => {
            reset();
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva autoridad
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 mb-8 p-4 rounded-xl border border-border bg-background">
          <div className="sm:col-span-2 flex items-center justify-between">
            <h3 className="font-display font-bold">{editing ? "Editar" : "Nueva"} autoridad</h3>
            <Button type="button" variant="ghost" size="icon" onClick={reset}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required maxLength={150} />
          </div>
          <div className="space-y-2">
            <Label>Orden</Label>
            <Input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Foto</Label>
            <div
              className="flex items-center gap-3 rounded-md border-2 border-dashed border-input bg-background p-3 cursor-pointer hover:border-accent transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {editing?.photo_url && !photoFile ? (
                <img src={editing.photo_url} alt="" className="w-12 h-12 rounded object-cover" />
              ) : (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm text-muted-foreground truncate">
                {photoFile ? photoFile.name : editing?.photo_url ? "Cambiar foto" : "Seleccionar foto"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={reset}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-7 h-7 animate-spin text-accent" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay autoridades.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <div className="w-14 h-14 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                {a.photo_url ? (
                  <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{a.name}</p>
                <p className="text-xs text-accent font-semibold truncate">{a.role}</p>
                <p className="text-[10px] text-muted-foreground">Orden: {a.display_order}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleDelete(a)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AuthoritiesManager;
