import { motion } from "framer-motion";
import { Bell, FileText, AlertCircle } from "lucide-react";

const announcements = [
  {
    type: "Urgente",
    icon: AlertCircle,
    title: "Suspensión de clases - Viernes 28 de Febrero",
    date: "24 Feb 2026",
    content: "Se comunica a los padres de familia que el día viernes 28 de febrero no habrá clases por jornada pedagógica institucional.",
    urgent: true,
  },
  {
    type: "Comunicado",
    icon: FileText,
    title: "Inicio de matrículas 2026-II",
    date: "20 Feb 2026",
    content: "Informamos que el proceso de matrícula para el segundo semestre estará abierto del 1 al 15 de marzo. Acercarse a secretaría con los documentos requeridos.",
    urgent: false,
  },
  {
    type: "Comunicado",
    icon: Bell,
    title: "Reunión de padres de familia - Primaria",
    date: "18 Feb 2026",
    content: "Se convoca a todos los padres de familia del nivel primaria a la reunión informativa del primer bimestre. Sábado 8 de marzo, 9:00 AM en el auditorio principal.",
    urgent: false,
  },
  {
    type: "Comunicado",
    icon: Bell,
    title: "Uso obligatorio del uniforme completo",
    date: "15 Feb 2026",
    content: "Recordamos que a partir del lunes 24 de febrero es obligatorio el uso del uniforme completo según el reglamento interno.",
    urgent: false,
  },
];

const AnnouncementsSection = () => (
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

      <div className="max-w-3xl mx-auto space-y-6">
        {announcements.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`bg-card rounded-xl p-6 shadow-sm border ${item.urgent ? "border-destructive/40 bg-destructive/5" : "border-border"}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.urgent ? "bg-destructive/10" : "bg-accent/10"}`}>
                <item.icon className={`w-5 h-5 ${item.urgent ? "text-destructive" : "text-accent"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${item.urgent ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
                <h4 className="font-bold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AnnouncementsSection;
