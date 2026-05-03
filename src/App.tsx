import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import FooterSection from "@/components/FooterSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Institucion from "./pages/Nosotros";
import Autoridades from "./pages/Autoridades";
import Niveles from "./pages/Niveles";
import Actividades from "./pages/Actividades";
import Actividadesinical from "./pages/ActividadesInicial";
import Actividadesprimaria from "./pages/ActividadesPrimaria";
import Comunicados from "./pages/Comunicados";
import Contacto from "./pages/Contacto";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* <BrowserRouter> */}
      <HashRouter>
        <ScrollToTop />
        <Navbar />
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/nosotros" element={<Institucion />} />
              <Route path="/nosotros/autoridades" element={<Autoridades />} />
              <Route path="/niveles" element={<Niveles />} />
              <Route path="/actividades/inicial" element={<Actividadesinical />} />
              <Route path="/actividades/primaria" element={<Actividadesprimaria />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/comunicados" element={<Comunicados />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <FooterSection />
        </div>
        <ScrollToTopButton />
      {/* </BrowserRouter> */}
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
