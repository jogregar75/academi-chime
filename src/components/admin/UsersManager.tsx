import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Trash2, KeyRound, Users as UsersIcon } from "lucide-react";

type AdminUser = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) {
    // Try to read the actual server message.
    try {
      const anyErr = error as any;
      if (anyErr?.context && typeof anyErr.context.text === "function") {
        const text = await anyErr.context.text();
        throw new Error(text || error.message);
      }
    } catch (e) {
      if (e instanceof Error) throw e;
    }
    throw new Error(error.message);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
};

const UsersManager = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });

  const load = async () => {
    setLoading(true);
    try {
      const data = await invoke({ action: "list" });
      setUsers(data.users ?? []);
    } catch (e) {
      toast({ title: "No se pudieron cargar los usuarios", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke({ action: "create", ...form });
      toast({ title: "Usuario creado", description: `${form.first_name} ${form.last_name} ahora tiene acceso al panel.` });
      setForm({ first_name: "", last_name: "", email: "", password: "" });
      setCreateOpen(false);
      await load();
    } catch (e) {
      toast({ title: "Error al crear usuario", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await invoke({ action: "delete", user_id: deleteTarget.id });
      toast({ title: "Usuario eliminado" });
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast({ title: "Error al eliminar", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleReset = async (user: AdminUser) => {
    if (!user.email) return;
    setResettingId(user.id);
    try {
      const redirectTo = `${window.location.origin}/#/reset-password`;
      await invoke({ action: "reset-password", email: user.email, redirect_to: redirectTo });
      toast({ title: "Email enviado", description: `Se envió un enlace de recuperación a ${user.email}.` });
    } catch (e) {
      toast({ title: "Error al enviar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-accent" /> Usuarios
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Administradores con acceso al panel</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Nuevo usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear nuevo usuario</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input id="first_name" value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })} required maxLength={80} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input id="last_name" value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })} required maxLength={80} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña temporal</Label>
                <Input id="password" type="text" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres" minLength={8} required />
                <p className="text-xs text-muted-foreground">
                  Comparte esta contraseña con el usuario. Podrá cambiarla desde "¿Olvidó su contraseña?".
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Crear usuario
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay usuarios aún.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Correo</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Alta</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                  const created = new Date(u.created_at).toLocaleDateString();
                  return (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-4 py-3">{fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-medium">
                          {u.roles[0] ?? "sin rol"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{created}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="outline" className="gap-1.5"
                            disabled={resettingId === u.id}
                            onClick={() => handleReset(u)}>
                            {resettingId === u.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <KeyRound className="w-3.5 h-3.5" />}
                            Resetear
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1.5"
                            onClick={() => setDeleteTarget(u)}>
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente a <b>{deleteTarget?.email}</b>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManager;
