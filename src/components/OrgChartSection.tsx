import { motion } from "framer-motion";

const orgData = [
  { role: "Director General", name: "Dr. Carlos Mendoza", level: 0 },
  { role: "Subdirectora Académica", name: "Lic. María García", level: 1 },
  { role: "Subdirector Administrativo", name: "Mg. Roberto Pérez", level: 1 },
  { role: "Coordinadora de Inicial", name: "Lic. Ana Torres", level: 2 },
  { role: "Coordinador de Primaria", name: "Lic. Jorge Ramírez", level: 2 },
  { role: "Coordinadora de Secundaria", name: "Mg. Patricia López", level: 2 },
];

const OrgChartSection = () => (
  <section className="py-24 bg-section-alt">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="text-accent font-semibold uppercase tracking-widest text-sm">Organización</span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
          Nuestro Equipo Directivo
        </h2>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        {/* Director */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <div className="bg-primary text-primary-foreground rounded-xl px-8 py-5 text-center shadow-lg">
            <p className="font-display text-lg font-bold">{orgData[0].name}</p>
            <p className="text-accent text-sm font-medium">{orgData[0].role}</p>
          </div>
        </motion.div>

        {/* Connector */}
        <div className="flex justify-center mb-8">
          <div className="w-px h-8 bg-border" />
        </div>

        {/* Sub-directors */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {orgData.filter((d) => d.level === 1).map((person, i) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl px-6 py-4 text-center shadow-sm"
            >
              <p className="font-display text-lg font-bold text-foreground">{person.name}</p>
              <p className="text-accent text-sm font-medium">{person.role}</p>
            </motion.div>
          ))}
        </div>

        {/* Connector */}
        <div className="flex justify-center mb-8">
          <div className="w-px h-8 bg-border" />
        </div>

        {/* Coordinators */}
        <div className="grid md:grid-cols-3 gap-6">
          {orgData.filter((d) => d.level === 2).map((person, i) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl px-5 py-4 text-center shadow-sm"
            >
              <p className="font-display font-bold text-foreground">{person.name}</p>
              <p className="text-accent text-sm font-medium">{person.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default OrgChartSection;
