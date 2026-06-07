import { motion } from "framer-motion";
import { User } from "lucide-react";

type Founder = {
  name: string;
  role: string;
  bio: string;
};

const founders: Founder[] = [
  {
    name: "Enzo Guariento",
    role: "Fundador",
    bio: "Enzo Guariento fue uno de los pilares fundamentales en la creación de la U.E. Colegio Los Pirineos Don Bosco. Con una profunda vocación educativa y un compromiso inquebrantable con la formación integral de niños y jóvenes, dedicó su vida a sembrar los valores del Sistema Preventivo de Don Bosco en la comunidad tachirense. Su visión hizo posible que el colegio se convirtiera en un referente de excelencia académica y humana en San Cristóbal.",
  },
  {
    name: "Renato Marcuzzi",
    role: "Fundador",
    bio: "Renato Marcuzzi acompañó la fundación del colegio con un espíritu emprendedor y un profundo sentido de servicio. Su aporte fue decisivo en la consolidación institucional, aportando trabajo, dedicación y una mirada siempre orientada al bienestar de los estudiantes y sus familias. Su legado perdura en cada generación que se forma bajo el carisma salesiano que él ayudó a establecer.",
  },
  {
    name: "Guerrino Guariento",
    role: "Fundador",
    bio: "Guerrino Guariento fue un visionario que creyó en el poder transformador de la educación. Junto a sus compañeros fundadores, trabajó incansablemente para construir una institución donde la amistad, el estudio y la alegría —lema del colegio— fueran el norte de cada actividad educativa. Su entrega y compromiso siguen siendo inspiración para directivos, docentes y estudiantes.",
  },
];

const FoundersSection = () => (
  <section className="py-24 bg-section-alt">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="text-accent font-semibold uppercase tracking-widest text-sm">
          Nuestra historia
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
          Fundadores
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Conoce a quienes con su visión, esfuerzo y vocación hicieron posible la U.E. Colegio Los Pirineos Don Bosco.
        </p>
      </motion.div>

      <div className="max-w-5xl mx-auto space-y-8">
        {founders.map((f, i) => (
          <motion.article
            key={f.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden md:flex"
          >
            <div className="md:w-1/3 bg-muted flex items-center justify-center aspect-square md:aspect-auto">
              <User className="w-24 h-24 text-muted-foreground/40" />
            </div>
            <div className="p-8 md:w-2/3 flex flex-col justify-center">
              <p className="text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                {f.role}
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                {f.name}
              </h2>
              <p className="text-muted-foreground leading-relaxed text-justify">
                {f.bio}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

export default FoundersSection;
