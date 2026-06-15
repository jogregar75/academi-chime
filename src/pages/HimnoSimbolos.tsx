import { motion } from "framer-motion";
import coral from "@/assets/himno-coral.jpg.asset.json";
import logo from "@/assets/logo-colegio.jpg.asset.json";

const HimnoSimbolos = () => (
  <div className="pt-24 md:pt-28 pb-20">
    <div className="container mx-auto px-4 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <span className="text-accent font-semibold uppercase tracking-widest text-lg">Nosotros</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">Himno y Símbolos</h1>
      </motion.div>

      <figure className="my-8">
        <img src={coral.url} alt="Coral del Colegio y Prof. Richard Assaf - 12 de Octubre de 1984" className="w-full rounded-xl shadow-lg" />
        <figcaption className="text-sm text-muted-foreground text-center mt-2">Fuente: Archivo 12 de Octubre de 1984. Coral del Colegio y Prof. Richard Assaf.</figcaption>
      </figure>

      <section className="bg-card border border-border rounded-xl p-8 my-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">Himno del Colegio</h2>
        <div className="grid md:grid-cols-2 gap-8 text-foreground/90">
          <div>
            <h3 className="font-bold text-accent mb-2">I</h3>
            <p className="italic leading-relaxed">
              En tus manos está el futuro<br />
              con estudio estarás más seguro,<br />
              y ese sueño que has de alcanzar<br />
              con calor de tu hogar lograrás.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-accent mb-2">II</h3>
            <p className="italic leading-relaxed">
              La esperanza de un padre eres tú<br />
              de la patria el futuro eres tú<br />
              no desvíes la huella que el hombre<br />
              con valor bajo un sol libertó.
            </p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <h3 className="font-bold text-accent mb-2">Coro</h3>
          <p className="italic leading-relaxed">
            “Don Bosco” es el Colegio que te brindará<br />
            cultura, educación y buena formación,<br />
            te sentirás como en familia<br />
            y en él tu vivirás y aprenderás a conocer<br />
            que en esta vida hay que saber.
          </p>
          <p className="text-sm text-muted-foreground mt-4">Letra y Música: Prof. Richard Assaf</p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-8 my-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">Himno a Don Bosco</h2>
        <div className="grid md:grid-cols-2 gap-8 text-foreground/90">
          <div>
            <h3 className="font-bold text-accent mb-2">I</h3>
            <p className="italic leading-relaxed">
              Su concierto han entonado<br />
              las campanas clamorosas<br />
              al que viene coronado<br />
              de laureles y de rosas<br />
              un vibrar de corazones<br />
              de sonrisas y cantares<br />
              acompaña entre oraciones<br />
              al que brilla en los altares.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-accent mb-2">II</h3>
            <p className="italic leading-relaxed">
              Triunfa padre cariñoso<br />
              ya tus sueños terminaron<br />
              y en un hecho esplendoroso<br />
              para el mundo se troncaron<br />
              mira en torno cuantos miles<br />
              de tus hijos te proclaman<br />
              cuantos pechos juveniles<br />
              como padre te reclaman.
            </p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <h3 className="font-bold text-accent mb-2">Coro</h3>
          <p className="italic leading-relaxed">
            Don Bosco te aclaman cual padre y pastor<br />
            legiones inmensas con himnos de amor. (bis)
          </p>
        </div>
      </section>

      <section className="my-12 text-center">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">Logo</h2>
        <img src={logo.url} alt="Logo del Colegio Los Pirineos Don Bosco" className="max-w-xs mx-auto rounded-xl shadow" />
      </section>

      <section className="bg-card border border-border rounded-xl p-8 my-8 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4 text-center">Interpretación del Logo</h2>
        <p className="text-foreground/90 leading-relaxed">
          El colegio, identificado por un bloque compacto y fuerte, tiene por lema los valores fundamentales
          <strong> “ciencia y trabajo”</strong> que son los ejes sobre los que gira y se desarrolla toda su tarea
          educativa; de ese desarrollo y crecimiento surge vigorosa la llama tricolor de la <strong>alegría amarilla</strong>,
          el <strong>estudio azul</strong> y el <strong>rojo de la amistad</strong>, tricolor de luz y calor que ilumina
          y alienta en el corazón de todos los que forman el ser y quehacer del Colegio, y al mismo tiempo se propaga
          como antorcha que orienta y fuego que hace hogar para todos los que están bajo su influencia de cerca y de lejos,
          como nos enseña nuestro tutor y mentor San Juan Bosco.
        </p>
      </section>
    </div>
  </div>
);

export default HimnoSimbolos;
