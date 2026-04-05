import { motion } from "framer-motion";
import { Eye, Target, Heart, Users } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6 },
  }),
};

const values = [
  { icon: Target, title: "Misión", text: "La U.E. Colegio los Pirineos Don Bosco es una Institución Educativa que siguiendo las orientaciones del Sistema Preventivo de Don Bosco busca favorecer el desarrollo integral de los niños, adolescentes y jóvenes ofreciéndoles oportunidades formativas, académicas, culturales, recreativas y espirituales que les permitan resolver con provecho y eficacia los problemas, retos y desafíos de la vida tanto a nivel personal como social. Con este propósito de atención y cuidado de la formación académica y personal se propone como tarea y compromiso la constante adaptación y renovación pedagógica y formativa de sus estudiantes mediante la incorporación de los avances tecnológicos y científicos referidos a los procesos de enseñanza aprendizaje así como a los valores y principios morales y éticos de la identidad nacional. Finalmente, será prioridad de la acción educativa del colegio la formación de un ambiente de familia y fraternidad entre todos los miembros de la comunidad educativa para que los niños, adolescentes y jóvenes sean felices, educados y sientan el colegio como su verdadero segundo hogar al estilo de Don Bosco." },
  { icon: Eye, title: "Visión", text: "La U.E. Colegio Los Pirineos Don Bosco es una institución educativa ubicada en San Cristóbal, estado Táchira, que para cumplir su misión formativa no escatima esfuerzos ni dedicación en los aspectos fundamentales de la tarea educativa: cuenta con una edificación y planta física acordes con las más altas exigencias de la excelencia académica, ofreciendo a estudiantes y padres garantías en infraestructura, recursos humanos, materiales y pedagógicos para el logro de sus metas y expectativas; realiza una cuidadosa selección y formación del personal directivo, docente, administrativo y obrero, con el propósito de brindar un ambiente de armonía y afectividad que motive a niños, adolescentes y jóvenes a alcanzar una formación intelectual, afectiva y social de calidad que los prepare para una vida feliz y exitosa; y promueve el desarrollo del espíritu creativo e innovador, capacitando a sus estudiantes para afrontar los problemas de la vida con serenidad, objetividad y capacidad de resolución, así como para aprovechar las oportunidades de crecimiento, mejora y adaptación ante las distintas circunstancias." },
  { icon: Heart, title: "Valores", text: "Respeto, responsabilidad, solidaridad, honestidad y perseverancia son los pilares que guían nuestra comunidad educativa día a día." },
  { icon: Users, title: "Comunidad", text: "Más de 40 años formando generaciones de profesionales exitosos, con una comunidad activa de padres, docentes y estudiantes comprometidos." },
];

const AboutSection = () => (
  <section id="nosotros" className="py-24 bg-section-alt">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="text-accent font-semibold uppercase tracking-widest text-lg">Sobre Nosotros</span>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
          Nuestra Identidad Institucional
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto text-justify">
        {values.map((item, i) => (
          <motion.div
            key={item.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-card rounded-xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-5">
              <item.icon className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">{item.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
