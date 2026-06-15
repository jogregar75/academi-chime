import { motion } from "framer-motion";
import terreno from "@/assets/historia-terreno-1984.jpg.asset.json";
import inauguracion from "@/assets/historia-inauguracion.jpg.asset.json";
import ciencias from "@/assets/historia-ciencias.jpg.asset.json";
import logo40 from "@/assets/logo-40-anos.jpg.asset.json";

const ResenaHistorica = () => (
  <div className="pt-24 md:pt-28 pb-20">
    <div className="container mx-auto px-4 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <span className="text-accent font-semibold uppercase tracking-widest text-lg">Nosotros</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">Reseña Histórica</h1>
      </motion.div>

      <div className="prose prose-lg max-w-none text-foreground/90 space-y-6">
        <p>La Unidad Educativa Colegio Los Pirineos Don Bosco nace el año académico 1984 – 1985 como una respuesta a las exigencias educativas y pedagógicas del Táchira que durante muchos años había disfrutado de las enseñanzas del gran educador del Siglo XIX, San Juan Bosco.</p>
        <p>Los padres y artífices de esta experiencia educativa fueron los hermanos Enzo y Guerrino Guariento y el Sr. Renato Marcuzzi, quienes llenos de ilusiones y sueños aceptan el reto de fundar un colegio inspirado en las pautas pedagógicas de Don Bosco.</p>
        <p>Por ser el Sr. Marcuzzi un empresario del área de la construcción el edificio fue ejecutado de forma rápida de manera que el 12 de octubre de 1984 se realizaba la bendición del edificio y el inicio del año escolar con los primeros alumnos.</p>

        <figure className="my-8">
          <img src={terreno.url} alt="Terreno antes de la construcción - Archivo 1984" className="w-full rounded-xl shadow-lg" />
          <figcaption className="text-sm text-muted-foreground text-center mt-2">Fuente: Archivo 1984. Terreno antes de la construcción.</figcaption>
        </figure>

        <p>Desde sus comienzos el colegio inició actividades desde Primer Nivel de Preescolar hasta el Quinto Año de Diversificado en las menciones de ciencias y humanidades. La primera promoción de bachilleres egresa ese mismo año escolar con una sección de más de 30 alumnos.</p>
        <p>Las autoridades con las que se iniciaron las actividades académicas fueron: Lcdo. Enzo Guariento (Director), Lcdo. Guerrino Guariento (Subdirector) y Lcda. María Elena Marcuzzi (Administradora).</p>

        <figure className="my-8">
          <img src={inauguracion.url} alt="Inauguración del Colegio 1984" className="w-full rounded-xl shadow-lg" />
          <figcaption className="text-sm text-muted-foreground text-center mt-2">Fuente: Archivo 1984. Inauguración del Colegio.</figcaption>
        </figure>

        <p>En el año escolar 1991 – 1992 el colegio se enriquece con la presencia de la Pedagoga Mirna Herrera de Guariento, y la organización directiva académica y disciplinar se estructura en cuatro seccionales: Preescolar, Primaria, Ciclo Básico y Diversificado.</p>
        <p>En 1992 – 1993 se conforma un nuevo tren directivo con la Pedagoga Mirna de Guariento como Directora y la Lcda. Zoraida León como Subdirectora.</p>
        <p>Para el año escolar 1998 – 1999 asume la dirección el Lcdo. Trino Camacho, manteniendo la filosofía original y siendo seguidor del Lcdo. Enzo.</p>
        <p>En el año 2006 – 2007 asume la dirección la Lcda. Carmen de Peña, con el Lcdo. Fernando Franco en la Subdirección, organizándose el Consejo Técnico Directivo con Gerencias Generales, Direcciones y Coordinaciones por etapa.</p>
        <p>En el transcurso de los primeros 25 años, el colegio ha egresado varios miles de Bachilleres en Ciencias, Humanidades y Administración Procesamiento de Datos. En la actualidad solo se imparte el Bachillerato en Ciencias.</p>
        <p>Para el año escolar 2008 – 2009 celebramos las <strong>Bodas de Plata del Colegio</strong>.</p>
        <p>En 2009 – 2010 inicia una reestructuración general: Director Académico, Lcdo. Fernando Franco; Subdirector, Lcdo. José M. Ortiz. Se crean las Subdirecciones de Educación Inicial y de Primaria.</p>
        <p>Para 2010 – 2011 se incorpora la Lcda. Erlyn Sierra a la Subdirección de Primaria y se crea la Coordinación de Tecnología, Informática y Comunicación.</p>
        <p>En 2014 – 2015 regresa la Lcda. Yesenia Ocando, asumiendo en 2015 – 2016 la Dirección del Colegio, con el Lcdo. Ivanosky Quevedo en la Subdirección. Se incorpora el Modelo de las Naciones Unidas (DBMUN).</p>
        <p>En 2018 – 2019 asume la dirección el Lcdo. Ivanosky Quevedo, acompañado en la Subdirección por el Lcdo. Francisco Chacón. En 2019 – 2020 se inauguró el <strong>Centro de Ciencias “Luis Arraiz”</strong> y se enfrentó la pandemia mundial por el Covid-19.</p>

        <figure className="my-8">
          <img src={ciencias.url} alt="Inauguración del Centro de Ciencias 2019" className="w-full rounded-xl shadow-lg" />
          <figcaption className="text-sm text-muted-foreground text-center mt-2">Fuente: Archivo 2019. Inauguración del Centro de Ciencias.</figcaption>
        </figure>

        <p>Para el año escolar 2024 – 2025 el colegio alcanza sus 40 años al servicio del Táchira. Destaca la incorporación de la <strong>Robótica</strong> mediante alianza con KURIOS EDUCATION y la metodología STEM, así como la participación en el Torneo Nacional de Robótica, la sala de audiovisuales y la instalación pionera de paneles solares.</p>

        <figure className="my-8">
          <img src={logo40.url} alt="40 años Forjando el futuro" className="w-full max-w-md mx-auto rounded-xl shadow-lg" />
        </figure>

        <p>En el periodo 2025 – 2026, nuestro Colegio llega a sus 42 años. Asume la Dirección la Lcda. María Alejandra Salas y la Subdirección General el Lcdo. Francisco Chacón, acompañado en la Subdirección de Inicial por la Lcda. Marvelia Mora de Duque. Por segunda vez participamos en el Torneo Nacional de Robótica y consolidamos el proyecto DAWERE INTERNACIONAL para brindar doble titulación en Educación Media General, junto con universidades en Bucaramanga (Colombia) y ANÁHUAC (México).</p>
      </div>
    </div>
  </div>
);

export default ResenaHistorica;
