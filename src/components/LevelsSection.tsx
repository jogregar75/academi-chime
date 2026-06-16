import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import inicialImg from "@/assets/level-inicial.jpg";
import primariaImg from "@/assets/level-primaria.jpg";
import secundariaImg from "@/assets/level-secundaria.jpg";

type LevelLink = { label: string; to: string };

const levels: {
  title: string;
  age: string;
  img: string;
  description: string;
  features: string[];
  links: LevelLink[];
}[] = [
  {
    title: "Educación Inicial",
    age: "3 a 5 años",
    img: inicialImg,
    description:
      "Estimulación temprana, juego dirigido y desarrollo de habilidades sociales en un ambiente cálido y seguro. Nuestros pequeños aprenden a explorar el mundo con curiosidad y creatividad.",
    features: ["Psicomotricidad", "Arte y música", "Inglés básico", "Desarrollo socioemocional"],
    links: [{ label: "Ver Inicial", to: "/niveles/inicial" }],
  },
  {
    title: "Educación Primaria",
    age: "6 a 11 años",
    img: primariaImg,
    description:
      "Consolidación de competencias académicas fundamentales con metodologías activas e innovadoras. Fomentamos el pensamiento crítico y el amor por el aprendizaje.",
    features: ["Matemáticas aplicadas", "Comprensión lectora", "Ciencias y tecnología", "Formación en valores"],
    links: [
      { label: "Primera Etapa", to: "/niveles/primaria/primera-etapa" },
      { label: "Segunda Etapa", to: "/niveles/primaria/segunda-etapa" },
    ],
  },
  {
    title: "Educación Secundaria",
    age: "12 a 16 años",
    img: secundariaImg,
    description:
      "Preparación integral para la educación superior con énfasis en ciencias y orientación vocacional. Formamos líderes del mañana.",
    features: ["Laboratorios equipados", "Orientación vocacional", "Proyectos de investigación", "Preparación preuniversitaria"],
    links: [
      { label: "1er Año", to: "/niveles/secundaria/1" },
      { label: "2do Año", to: "/niveles/secundaria/2" },
      { label: "3er Año", to: "/niveles/secundaria/3" },
      { label: "4to Año", to: "/niveles/secundaria/4" },
      { label: "5to Año", to: "/niveles/secundaria/5" },
    ],
  },
];

const LevelsSection = () => (
  <section id="niveles" className="py-24">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="text-accent font-semibold uppercase tracking-widest text-lg">Niveles Educativos</span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
          Una educación para cada etapa
        </h2>
      </motion.div>

      <div className="flex flex-col gap-20">
        {levels.map((level, i) => (
          <motion.div
            key={level.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 items-center`}
          >
            <div className="lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img src={level.img} alt={level.title} className="w-full h-72 lg:h-96 object-cover" />
                <div className="absolute top-4 left-4 bg-accent px-4 py-1 rounded-full text-sm font-bold text-accent-foreground">
                  {level.age}
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <h3 className="font-display text-3xl font-bold text-foreground mb-4">{level.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{level.description}</p>
              <ul className="grid grid-cols-2 gap-3 mb-6">
                {level.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {level.links.map((l) => (
                  <Button key={l.to} asChild variant="default" size="sm" className="gap-2">
                    <Link to={l.to}>
                      {l.label} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default LevelsSection;
