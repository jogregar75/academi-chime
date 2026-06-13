import { motion } from "framer-motion";
import enzoPhoto from "@/assets/enzo-guariento.png.asset.json";
import renatoPhoto from "@/assets/renato-marcuzzi.jpg.asset.json";
import guerrinoPhoto from "@/assets/guerrino-guariento.jpg.asset.json";

type Founder = {
  name: string;
  role: string;
  photo: string;
  bio: string[];
};

const founders: Founder[] = [
  {
    name: "Lcdo. Enzo Guariento",
    role: "Fundador",
    photo: enzoPhoto.url,
    bio: [
      "Enzo nació en Italia, en un pueblo pequeño de la campiña italiana llamado Canda, el día 07 de noviembre del año 1938, en medio de un clima mundial muy poco optimista y prometedor. España vivía su guerra civil, Alemania e Italia estaban sometidas a férreas dictaduras y el resto de Europa luchaba por defender la libertad y la democracia ante el poderío bélico del nazismo.",
      "Su primera infancia transcurrió en medio del terror de la Segunda Guerra Mundial. Había hambre y carestía, y sus padres —con un grupo familiar de 13 hermanos— hacían milagros diarios para alimentar a los niños. Terminada la guerra en 1945, en un clima de reconciliación, se forjó en él la conciencia ciudadana que más tarde lo llevaría a asumir la educación como la gran empresa de formar ciudadanos libres y comprometidos.",
      "Desde muy joven debió compaginar el trabajo en el campo con sus estudios, en medio de la escasez de cuadernos, libros y lápices. Orientado por los hijos de Don Bosco e iluminado por su pedagogía, decidió consagrarse al servicio de Dios a través de la vocación educativa propia de los sacerdotes salesianos.",
      "Siendo aún adolescente se embarcó hacia Venezuela siguiendo el camino de Don Bosco. Realizó estudios de filosofía y noviciado, un año de experiencia educativa en el colegio salesiano de Táriba, y partió a Turín para cursar teología y ordenarse sacerdote. De regreso, se dedicó por entero a la educación en Táriba, Mérida, Valera y Caracas, asumiendo grandes responsabilidades como Director de varios colegios y Coordinador Nacional de los Colegios Salesianos de Venezuela.",
      "Tras un profundo proceso de reflexión, decidió retirarse de la congregación para iniciar su propia experiencia educativa. Como profesor de la Universidad de Los Andes en Mérida, vino a San Cristóbal a la celebración del bautizo de su sobrina María Teresa, hija de su hermano Guerrino. Allí conoció al Sr. Renato Marcuzzi y comenzó la planificación del futuro Colegio Don Bosco de San Cristóbal, cumpliendo así la promesa hecha al P. Affanni: «prométeme que harás todo lo posible para que no desaparezca la presencia educativa de Don Bosco en el Táchira».",
      "Después de varios años al frente del colegio —los años decisivos que marcaron su identidad al estilo Don Bosco—, la enfermedad lo visitó de forma prematura. Acompañado por su fiel esposa, la Lcda. Mirna Herrera de Guariento, partió hacia el oriente del país. Su vida se extinguió como un cirio ofrecido a María Auxiliadora a favor de los niños y jóvenes de su Colegio Don Bosco. Falleció en Píritu, estado Anzoátegui, el 13 de noviembre de 2004.",
    ],
  },
  {
    name: "Sr. Renato Marcuzzi",
    role: "Fundador",
    photo: renatoPhoto.url,
    bio: [
      "Renato Marcuzzi Marcuzzi nació en Italia en el año 1928, en Pielungo, un alejado y muy pequeño pueblo de alta montaña en el norte de Italia. Ese origen humilde y comunitario explica la mentalidad y el actuar de toda su vida: enfoque directo al trabajo, esfuerzo propio, responsabilidad extraordinaria con todos los que le rodeaban, fueran familia o no, en cualquier ámbito social o empresarial.",
      "Tras el final de la Segunda Guerra Mundial, frente a la desolación y la miseria, viajó a Ventimiglia, cerca de Génova, donde aprendió el oficio de albañil y se familiarizó con los materiales de construcción, las técnicas de acabado y el manejo de cuadrillas, desarrollando la destreza y la pasión por levantar obras con sus propias manos.",
      "Animado por un tío suyo de nombre Doménico, emprendió la aventura de venir a Venezuela. Trabajó en Caracas durante la época de Pérez Jiménez en obras emblemáticas como el Estadio Universitario, los edificios de Altamira y la autopista Caracas–La Guaira, ascendiendo de obrero a jefe de cuadrillas. Una oportunidad lo llevó tierra adentro a Santa Cruz de Mora, en el estado Mérida, y posteriormente a San Cristóbal, donde construyó el edificio Doña Lina e inició una simbiosis con la ciudad que los uniría para siempre.",
      "Se dedicó incansablemente a construir casas, edificios, locales, galpones, escuelas, ambulatorios, vías, obras hidráulicas, urbanismos e instalaciones industriales. Paralelamente impulsó empresas en carpintería industrial y metalúrgica, distribuidora y arrendadora de materiales, premezclado, picadora, concretera, transporte, inmobiliaria y educación.",
      "Entre sus obras más destacadas registradas en la Constructora COMARCA se cuentan: la Av. Carabobo, el Centro Cívico de San Cristóbal, las autopistas San Cristóbal–La Fría, Petare–Guarenas y Puerto Ordaz–Bolívar, el dique base de la ampliación de la Represa del Guri, los Colegios Don Bosco, Juan de Maldonado —hoy sede de la UNEFA— y Metropolitano, las sedes administrativas de la UNET, la segunda etapa del Acueducto Regional del Táchira y numerosas urbanizaciones populares y de clase media en los estados Mérida y Táchira.",
      "Junto a sus hijos —John Renato, Marielena y Patricia— sembró la pasión por imaginar y construir, transmitiéndoles la convicción de que la vida es una aventura para seguir soñando y materializando ideas en favor de la gente, la ciudad y el país. El Sr. Renato Marcuzzi partió al encuentro con Dios el 22 de junio del año 2015.",
    ],
  },
  {
    name: "Lcdo. Guerrino Guariento",
    role: "Fundador",
    photo: guerrinoPhoto.url,
    bio: [
      "Nació en un pueblito del norte de Italia, en la Región del Véneto, el día 19 de octubre de 1942, en plena Segunda Guerra Mundial y en un país ocupado por las tropas nazis. Fue el sexto de trece hermanos en una familia humilde de campesinos, donde reinaba la pobreza pero no la miseria, pues el amor, la comprensión, la alegría y las ganas de vivir fueron la roca sobre la que sus padres fundamentaron la educación de sus hijos.",
      "Realizó sus estudios de primaria en su pueblo natal y el «gimnasio clásico» con los Padres Salesianos de Bagnolo, pequeño pueblo cercano a Turín, muy cerca de Chieri, aldea natal de San Juan Bosco, Patrono de la Juventud.",
      "Finalizado el bachillerato en Italia, vino a Venezuela para acompañar a su hermano, el Lcdo. Enzo Guariento Tinazo, en la Comunidad Salesiana del Colegio Don Bosco de Altamira, en Caracas. Allí realizó la equivalencia de su Gimnasio Clásico italiano con el bachillerato en humanidades venezolano y obtuvo el título de Maestro Normalista.",
      "Posteriormente retornó a Italia para cursar estudios superiores en la Universidad de Padua (Padova), donde estudió Idiomas Clásicos y modernos. De vuelta en Venezuela ejerció la docencia de latín e italiano en la Universidad de Los Andes, núcleo Táchira, así como en los Colegios Salesiano y La Consolación de Táriba, María Auxiliadora de San Cristóbal, Juan de Maldonado y en el Seminario Diocesano Sto. Tomás de Aquino de Palmira.",
      "En su constante afán de superación cursó la Licenciatura en Educación, Mención Ciencias Biológicas, en la Universidad Católica Andrés Bello, Extensión Táchira (UCABET). Con este nuevo aval académico desempeñó funciones docentes en la Escuela Normal Gervasio Rubio, el Liceo Carlos Rángel Lamus y el Liceo Las Américas, todos en Rubio, y como asesor pedagógico en la Escuela Granja del Rodeo.",
      "Tras prolongadas discusiones con su hermano Enzo y el Sr. Renato Marcuzzi, asumieron el reto de fundar un colegio privado regido por los principios y el espíritu de San Juan Bosco. En 1981, en el marco del bautismo sacramental de su hija María Teresa, los tres acordaron dar inicio al proyecto del Colegio Los Pirineos Don Bosco. El Arquitecto Pablo Vivas plasmó el proyecto en planos y la Empresa Constructora «Comarca» del Sr. Renato lo hizo surgir como árbol de la ciencia y el conocimiento.",
      "En tiempo récord se construyó la sede actual y el 1.º de octubre de 1984, cerca de 960 alumnos iniciaron su travesía educativa. En la organización inicial, Enzo fungió como Director y Guerrino como Subdirector. A partir de allí ha asumido los cargos de Profesor de Latín y Griego, Coordinador de Disciplina, Coordinador de los 3.º años de Bachillerato, Coordinador General de Cultura y Relaciones Públicas, y actualmente Gerente General Académico de los Colegios Don Bosco y Metropolitano, con la misma intensidad y entrega de los primeros tiempos.",
    ],
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

      <div className="max-w-5xl mx-auto space-y-12">
        {founders.map((f, i) => (
          <motion.article
            key={f.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden md:flex md:items-stretch"
          >
            <div className="md:w-1/3 bg-muted flex items-center justify-center p-6">
              <img
                src={f.photo}
                alt={`Retrato de ${f.name}`}
                className="w-full max-w-[280px] object-contain rounded-lg shadow-sm"
                loading="lazy"
              />
            </div>
            <div className="p-8 md:w-2/3">
              <p className="text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                {f.role}
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                {f.name}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-justify">
                {f.bio.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

export default FoundersSection;
