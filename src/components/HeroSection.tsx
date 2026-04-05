import { motion } from "framer-motion";
import heroImg from "@/assets/hero-school.jpg";
import { Link } from "react-router-dom";

const HeroSection = () => (
  
  // <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-28 md:-mt-24">
  <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-24">
    <div className="absolute inset-0">
      <img src={heroImg} alt="Campus del colegio" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-primary/70" />
    </div>
    <div className="relative z-10 container mx-auto px-4 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight"
      >
        Formando el <span className="text-highlight">futuro</span>,<br />
        un estudiante a la vez
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body"
      >
        Educación integral con valores, innovación y excelencia académica desde educación inicial hasta secundaria.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        {/* <a href="#nosotros" className="bg-gold-gradient px-8 py-3 rounded-lg font-semibold text-primary shadow-lg hover:shadow-xl transition-shadow">
          Conócenos
        </a>
        <a href="#niveles" className="border-2 border-primary-foreground/30 px-8 py-3 rounded-lg font-semibold text-primary-foreground hover:border-accent hover:text-accent transition-colors">
          Nuestros Niveles
        </a> */}

        <Link
          to="/nosotros"
          className="bg-gold-gradient px-8 py-3 rounded-lg font-semibold text-primary shadow-lg hover:shadow-xl transition-shadow"
        >
          Conócenos
        </Link>

        <Link
          to="/niveles"
          className="border-2 border-primary-foreground/30 px-8 py-3 rounded-lg font-semibold text-primary-foreground hover:border-accent hover:text-accent transition-colors"
        >
          Nuestros Niveles
        </Link>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
