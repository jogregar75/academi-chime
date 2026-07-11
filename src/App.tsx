import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import FooterSection from "@/components/FooterSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Institucion from "./pages/Nosotros";
import Autoridades from "./pages/Autoridades";
import Fundadores from "./pages/Fundadores";
import Organigrama from "./pages/Organigrama";
import ResenaHistorica from "./pages/ResenaHistorica";
import HimnoSimbolos from "./pages/HimnoSimbolos";
import Patrono from "./pages/Patrono";
import Niveles from "./pages/Niveles";
import NivelInicial from "./pages/NivelInicial";
import NivelPrimariaPrimera from "./pages/NivelPrimariaPrimera";
import NivelPrimariaSegunda from "./pages/NivelPrimariaSegunda";
import NivelSecundaria from "./pages/NivelSecundaria";
import Actividadesinical from "./pages/ActividadesInicial";
import Actividadesprimaria from "./pages/ActividadesPrimaria";
import Promos from "./pages/Promos";
import Comunicados from "./pages/Comunicados";
import Noticias from "./pages/Noticias";
import NoticiaDetalle from "./pages/NoticiaDetalle";
import Contacto from "./pages/Contacto";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <ScrollToTop />
        <Navbar />
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/nosotros" element={<Institucion />} />
              <Route path="/nosotros/autoridades" element={<Autoridades />} />
              <Route path="/nosotros/fundadores" element={<Fundadores />} />
              <Route path="/nosotros/organigrama" element={<Organigrama />} />
              <Route path="/nosotros/resena" element={<ResenaHistorica />} />
              <Route path="/nosotros/himno" element={<HimnoSimbolos />} />
              <Route path="/nosotros/patrono" element={<Patrono />} />
              <Route path="/niveles" element={<Niveles />} />
              <Route path="/niveles/inicial" element={<NivelInicial />} />
              <Route path="/niveles/primaria/primera-etapa" element={<NivelPrimariaPrimera />} />
              <Route path="/niveles/primaria/segunda-etapa" element={<NivelPrimariaSegunda />} />
              <Route path="/niveles/secundaria/:year" element={<NivelSecundaria />} />
              <Route path="/actividades/inicial" element={<Actividadesinical />} />
              <Route path="/actividades/primaria" element={<Actividadesprimaria />} />
              <Route path="/actividades/promos" element={<Promos />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/comunicados" element={<Comunicados />} />
              <Route path="/noticias" element={<Noticias />} />
              <Route path="/noticias/:id" element={<NoticiaDetalle />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <FooterSection />
        </div>
        <ScrollToTopButton />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
