import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { GraduationCap, LogIn, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAdminUser } from "@/lib/admin-auth";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const isAdmin = await isAdminUser(session.user.id);
      if (isAdmin) navigate("/admin");
      else await supabase.auth.signOut();
    };
    void checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't hijack the recovery flow — let ResetPassword handle it.
      if (event === "PASSWORD_RECOVERY") return;
      if (session) {
        void isAdminUser(session.user.id).then((ok) => { if (ok) navigate("/admin"); });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      setLoading(false);
      toast({ title: "Error de acceso", description: "Credenciales incorrectas. Intente de nuevo.", variant: "destructive" });
      return;
    }

    const isAdmin = data.user ? await isAdminUser(data.user.id) : false;
    setLoading(false);

    if (!isAdmin) {
      await supabase.auth.signOut();
      toast({ title: "Acceso denegado", description: "Este usuario no tiene permisos de administrador.", variant: "destructive" });
      return;
    }
    navigate("/admin");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setSendingReset(true);
    const redirectTo = `${window.location.origin}/#/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), { redirectTo });
    setSendingReset(false);
    // Never reveal whether the email exists.
    toast({
      title: "Revisa tu correo",
      description: "Si el correo está registrado, recibirás un enlace para restablecer la contraseña.",
    });
    if (!error) {
      setForgotOpen(false);
      setForgotEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <GraduationCap className="w-12 h-12 text-accent mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-primary-foreground">Panel Administrativo</h1>
          <p className="text-primary-foreground/60 mt-2">Ingrese sus credenciales para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-xl p-8 shadow-lg space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" placeholder="admin@colegio.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <button type="button" onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                className="text-xs text-accent hover:underline">
                ¿Olvidó su contraseña?
              </button>
            </div>
            <Input id="password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Iniciar Sesión
          </Button>
          <div className="text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              ← Volver al sitio web
            </a>
          </div>
        </form>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar contraseña</DialogTitle>
            <DialogDescription>
              Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecer la contraseña.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Correo electrónico</Label>
              <Input id="forgot-email" type="email" value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)} required maxLength={255} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} disabled={sendingReset}>
                Cancelar
              </Button>
              <Button type="submit" disabled={sendingReset} className="gap-2">
                {sendingReset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Enviar enlace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLogin;
