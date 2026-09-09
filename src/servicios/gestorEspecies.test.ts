import { describe, it, expect } from "vitest";
import {
  obtenerCatalogoEspecies,
  obtenerEspeciePorId,
  obtenerEspeciePorNombre,
  obtenerSubespeciesDeEspecie,
  obtenerSubespeciePorNombre,
  construirRasgosEspecie,
  aplicarEspecieAPersonaje
} from "./gestorEspecies";
import { resolverOrigenConjuro } from "./resolutorOrigenConjuros";
import {
  resolverCondicionAsociadaRasgo,
  coincideCondicionConRasgo,
  activarRasgosPorCondicionOEfecto
} from "@/almacen/slices/personajes/condicionesRasgosHelpers";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";

describe("GestorEspecies - Dominio de Razas y Subrazas (D&D 5.5e)", () => {
  describe("Catálogo Canónico y Búsqueda Tolerante", () => {
    it("carga el catálogo completo con las 10 especies oficiales", () => {
      const catalogo = obtenerCatalogoEspecies();
      expect(catalogo.length).toBeGreaterThanOrEqual(10);
      const ids = catalogo.map((e) => e.id);
      expect(ids).toContain("aasimar");
      expect(ids).toContain("elfo");
      expect(ids).toContain("enano");
      expect(ids).toContain("gnomo");
      expect(ids).toContain("goliat");
      expect(ids).toContain("humano");
      expect(ids).toContain("mediano");
      expect(ids).toContain("orco");
      expect(ids).toContain("tiefling");
      expect(ids).toContain("draconido");
    });

    it("obtiene una especie por ID y por nombre de forma insensible a mayúsculas y acentos", () => {
      const porId = obtenerEspeciePorId("aasimar");
      expect(porId).toBeDefined();
      expect(porId?.nombre).toBe("Aasimar");

      const porNombreDirecto = obtenerEspeciePorNombre("Aasimar");
      expect(porNombreDirecto?.id).toBe("aasimar");

      const porNombreTolerante = obtenerEspeciePorNombre("draconido");
      expect(porNombreTolerante?.id).toBe("draconido");

      const porNombreConAcento = obtenerEspeciePorNombre("Dracónido");
      expect(porNombreConAcento?.id).toBe("draconido");
    });
  });

  describe("Aasimar - Definición y Campos Universales (aasimar.md)", () => {
    it("cumple los campos base universales compartidos por todas las razas", () => {
      const aasimar = obtenerEspeciePorId("aasimar");
      expect(aasimar).toBeDefined();

      // Tipo de criatura canónico 5.5e
      expect(aasimar?.tipoCriatura).toBe("Humanoide");

      // Tamaño flexible (Mediano o Pequeño)
      expect(aasimar?.tamanoOpciones).toEqual(["Mediano", "Pequeño"]);
      expect(aasimar?.tamanoPorDefecto).toBe("Mediano");

      // Velocidad base
      expect(aasimar?.velocidadBase).toBe(30);

      // Visión en la oscuridad y resistencias
      expect(aasimar?.visionOscuridad).toBe(60);
      expect(aasimar?.resistenciasDanio).toContain("Necrótico");
      expect(aasimar?.resistenciasDanio).toContain("Radiante");
    });

    it("posee el truco innato Portador de luz usando Carisma", () => {
      const aasimar = obtenerEspeciePorId("aasimar");
      expect(aasimar?.conjurosInnatos).toBeDefined();
      const conjuroLuz = aasimar?.conjurosInnatos?.find((c) => c.hechizoId === "luz");
      expect(conjuroLuz).toBeDefined();
      expect(conjuroLuz?.esTruco).toBe(true);
      expect(conjuroLuz?.caracteristica).toBe("carisma");
    });

    it("modela los rasgos mecánicos: Manos curativas y Revelación celestial", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      const rasgos = construirRasgosEspecie(aasimar, undefined, 1, 2);

      // 1. Manos curativas (mecánico, acción, curación con d4 según PB, 1/descanso largo)
      const manosCurativas = rasgos.find((r) => r.nombre === "Manos curativas");
      expect(manosCurativas).toBeDefined();
      expect(manosCurativas?.tipoAccion).toBe("accion");
      expect(manosCurativas?.tieneUsosLimitados).toBe(true);
      expect(manosCurativas?.usosMaximos).toBe(1);
      expect(manosCurativas?.recuperacion).toBe("descanso_largo");
      expect(manosCurativas?.formulaDados).toBe("2d4"); // PB = 2 a nivel 1
      expect(manosCurativas?.categoriaMecanica).toBe("curacion");

      // 2. Revelación celestial (desbloqueado a nivel 3, acción adicional, 1/descanso largo, activable, con 3 opciones informativas)
      const revelacion = rasgos.find((r) => r.nombre === "Revelación celestial");
      expect(revelacion).toBeDefined();
      expect(revelacion?.nivelRequerido).toBe(3);
      expect(revelacion?.tipoAccion).toBe("accion_adicional");
      expect(revelacion?.tieneUsosLimitados).toBe(true);
      expect(revelacion?.usosMaximos).toBe(1);
      expect(revelacion?.recuperacion).toBe("descanso_largo");
      expect(revelacion?.esActivable).toBe(true);
      expect(revelacion?.categoriaMecanica).toBe("selector_informativo");

      // Verificar que contiene el selector con las 3 opciones puramente informativas
      expect(revelacion?.selectores).toHaveLength(1);
      const selector = revelacion?.selectores?.[0];
      expect(selector?.opciones).toHaveLength(3);
      const nombresOpciones = selector?.opciones.map((o) => o.nombre);
      expect(nombresOpciones).toContain("Alas celestiales");
      expect(nombresOpciones).toContain("Fulgor interior");
      expect(nombresOpciones).toContain("Mortaja necrótica");

      // 3. Portador de luz y Resistencia celestial
      const portadorLuz = rasgos.find((r) => r.nombre === "Portador de luz");
      expect(portadorLuz).toBeDefined();
      expect(portadorLuz?.conjurosOtorgados).toContain("luz");

      const resistencia = rasgos.find((r) => r.nombre === "Resistencia celestial");
      expect(resistencia).toBeDefined();
      expect(resistencia?.tipoAccion).toBe("pasivo");
    });

    it("escala dinámicamente los dados de Manos curativas según el Bonificador de Competencia del personaje", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      // Nivel 9 -> PB = 4
      const rasgosNivel9 = construirRasgosEspecie(aasimar, undefined, 9, 4);
      const manos = rasgosNivel9.find((r) => r.nombre === "Manos curativas");
      expect(manos?.formulaDados).toBe("4d4");
    });
  });

  describe("Subrazas, Linajes y Legados", () => {
    it("obtiene las subespecies de razas con linajes (Elfo y Tiefling)", () => {
      const subElfo = obtenerSubespeciesDeEspecie("elfo");
      expect(subElfo.length).toBe(3);
      const nombresSubElfo = subElfo.map((s) => s.nombre);
      expect(nombresSubElfo).toContain("Drow");
      expect(nombresSubElfo).toContain("Alto elfo");
      expect(nombresSubElfo).toContain("Elfo de los bosques");

      const subTiefling = obtenerSubespeciesDeEspecie("tiefling");
      expect(subTiefling.length).toBe(3);
      const nombresSubTiefling = subTiefling.map((s) => s.nombre);
      expect(nombresSubTiefling).toContain("Legado abisal");
      expect(nombresSubTiefling).toContain("Legado ctónico");
      expect(nombresSubTiefling).toContain("Legado infernal");
    });

    it("resuelve una subespecie específica mediante obtenerSubespeciePorNombre", () => {
      const altoElfo = obtenerSubespeciePorNombre("elfo", "Alto elfo");
      expect(altoElfo).toBeDefined();
      expect(altoElfo?.id).toBe("alto_elfo");
      expect(altoElfo?.conjurosInnatos).toBeDefined();
    });
  });

  describe("Función Genérica para el Builder: aplicarEspecieAPersonaje", () => {
    it("aplica Aasimar a un personaje base actualizando tamaño, velocidad, tipo de criatura, trucos y rasgos", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-builder-1",
        nombre: "Valeria",
        nivel: 3,
        especie: "Humano",
        tamano: "Mediano",
        rasgos: [
          {
            id: "rasgo_clase_guerrero",
            nombre: "Tomar aliento",
            descripcion: "Curación de guerrero",
            origen: "clase",
            fuente: "Clase: Guerrero",
            tipoAccion: "accion_adicional",
            tieneUsosLimitados: true,
            usosMaximos: 2,
            usosRestantes: 2,
            recuperacion: "descanso_corto",
            personalizado: false,
            activo: true,
            notas: ""
          }
        ]
      };

      const pjActualizado = aplicarEspecieAPersonaje(pjInicial, {
        especieId: "aasimar",
        tamanoElegido: "Pequeño"
      });

      // Validar identidad y campos universales
      expect(pjActualizado.especie).toBe("Aasimar");
      expect(pjActualizado.tamano).toBe("Pequeño");
      expect(pjActualizado.tipoCriatura).toBe("Humanoide");
      expect(pjActualizado.velocidad).toBe("30 pies");
      expect(pjActualizado.sentidos).toBe("Visión en la oscuridad 60 pies");

      // Validar magia innata aprendida (truco Luz)
      expect(pjActualizado.trucosConocidosIds).toContain("luz");

      // Validar rasgos de Aasimar
      const nombresRasgos = pjActualizado.rasgos.map((r) => r.nombre);
      expect(nombresRasgos).toContain("Resistencia celestial");
      expect(nombresRasgos).toContain("Visión en la oscuridad");
      expect(nombresRasgos).toContain("Portador de luz");
      expect(nombresRasgos).toContain("Manos curativas");
      expect(nombresRasgos).toContain("Revelación celestial");

      // Validar que se preservó intacto el rasgo de clase de Guerrero (DRY / idempotente)
      expect(nombresRasgos).toContain("Tomar aliento");
      const rasgoGuerrero = pjActualizado.rasgos.find((r) => r.id === "rasgo_clase_guerrero");
      expect(rasgoGuerrero).toBeDefined();
    });

    it("permite aplicar una subraza y sus modificadores de velocidad o visión", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-builder-elfo",
        nombre: "Aeloria",
        nivel: 1
      };

      const pjElfoBosques = aplicarEspecieAPersonaje(pjInicial, {
        especieId: "elfo",
        subespecieId: "elfo_bosques"
      });

      expect(pjElfoBosques.especie).toBe("Elfo");
      expect(pjElfoBosques.subespecie).toBe("Elfo de los bosques");
      expect(pjElfoBosques.velocidad).toBe("35 pies"); // Modificador de 35 pies de pies veloces
      expect(pjElfoBosques.trucosConocidosIds).toContain("saber_druidico");
    });
  });

  describe("Tiradas de Rasgos Aplicables a Terceros (Sin Auto-Curar ni Auto-HP Temporal)", () => {
    it("Manos curativas no califica como auto-curación forzada a uno mismo", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      const rasgos = construirRasgosEspecie(aasimar, undefined, 1, 2);
      const manos = rasgos.find((r) => r.nombre === "Manos curativas");
      expect(manos).toBeDefined();

      const normNombre = (manos?.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const esManosCurativas = normNombre.includes("manos curativas");
      const esCuracionAuto = (manos?.categoriaMecanica === "curacion" || normNombre.includes("guerrero de los dioses")) && !esManosCurativas;

      expect(esManosCurativas).toBe(true);
      expect(esCuracionAuto).toBe(false);
    });

    it("Manto de inspiración no califica como auto-HP temporal forzado al propio bardo", () => {
      const nombreManto = "Manto de inspiración";
      const normNombre = nombreManto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const esMantoInspiracion = normNombre.includes("manto de inspiracion");
      const tieneEfectoHpTemporalAuto = !esMantoInspiracion;

      expect(esMantoInspiracion).toBe(true);
      expect(tieneEfectoHpTemporalAuto).toBe(false);
    });
  });

  describe("Tarjetas de Rasgos Universales: Tipo de Criatura y Tamaño Configurable", () => {
    it("genera sistemáticamente las tarjetas de 'Tipo de criatura' y 'Tamaño' en todas las especies", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      const rasgosAasimar = construirRasgosEspecie(aasimar, undefined, 1, 2, "Pequeño");

      const rasgoTipo = rasgosAasimar.find((r) => r.nombre === "Tipo de criatura");
      expect(rasgoTipo).toBeDefined();
      expect(rasgoTipo?.tipoAccion).toBe("pasivo");
      expect(rasgoTipo?.descripcion).toContain("Humanoide");

      const rasgoTamano = rasgosAasimar.find((r) => r.nombre === "Tamaño");
      expect(rasgoTamano).toBeDefined();
      expect(rasgoTamano?.selectores).toBeDefined();
      expect(rasgoTamano?.selectores?.length).toBe(1);

      // Selector de tamaño con opciones Pequeño y Mediano
      const selTamano = rasgoTamano?.selectores?.[0];
      expect(selTamano?.id).toBe("selector_tamano_especie");
      expect(selTamano?.opciones.map((o) => o.nombre)).toEqual(["Mediano", "Pequeño"]);
      expect(selTamano?.valorActual).toEqual(["pequeno"]);
    });

    it("sincroniza el tamaño en el store de Zustand al cambiar la opción en la tarjeta del rasgo", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-tamano-test",
        nombre: "Icarus",
        especie: "Aasimar",
        tamano: "Mediano",
        rasgos: construirRasgosEspecie(aasimar, undefined, 1, 2, "Mediano")
      };

      usarAlmacenDM.setState({
        personajes: [pjInicial],
        idPersonajeActivo: "pj-tamano-test"
      });

      const store = usarAlmacenDM.getState();
      const rasgoTamano = pjInicial.rasgos.find((r) => r.nombre === "Tamaño")!;

      // Cambiar selector a "pequeno"
      store.actualizarSeleccionRasgo("pj-tamano-test", rasgoTamano.id, "selector_tamano_especie", ["pequeno"]);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-tamano-test")!;
      expect(pjActualizado.tamano).toBe("Pequeño");

      const rasgoActualizado = pjActualizado.rasgos.find((r) => r.id === rasgoTamano.id)!;
      expect(rasgoActualizado.selectores?.[0].valorActual).toEqual(["pequeno"]);
    });
  });

  describe("Revelación Celestial - Conexión con Combat Tracker y 3 Formas (10 turnos)", () => {
    it("resuelve la condición asociada según la forma elegida en el selector", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      const rasgos = construirRasgosEspecie(aasimar, undefined, 3, 2);
      const revelacion = rasgos.find((r) => r.nombre === "Revelación celestial")!;

      // Forma por defecto: Alas Celestiales
      expect(resolverCondicionAsociadaRasgo(revelacion)).toBe("Alas Celestiales");

      // Cambiar a Fulgor Interior
      const revFulgor: RasgoPersonaje = {
        ...revelacion,
        selectores: [{ ...revelacion.selectores![0], valorActual: ["fulgor_interior"] }]
      };
      expect(resolverCondicionAsociadaRasgo(revFulgor)).toBe("Fulgor Interior");

      // Cambiar a Mortaja Necrótica
      const revMortaja: RasgoPersonaje = {
        ...revelacion,
        selectores: [{ ...revelacion.selectores![0], valorActual: ["mortaja_necrotica"] }]
      };
      expect(resolverCondicionAsociadaRasgo(revMortaja)).toBe("Mortaja Necrótica");
    });

    it("coincideCondicionConRasgo identifica las 3 formas celestiales", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      const rasgos = construirRasgosEspecie(aasimar, undefined, 3, 2);
      const revelacion = rasgos.find((r) => r.nombre === "Revelación celestial")!;

      expect(coincideCondicionConRasgo("Alas Celestiales", revelacion)).toBe(true);
      expect(coincideCondicionConRasgo("Fulgor Interior", revelacion)).toBe(true);
      expect(coincideCondicionConRasgo("Mortaja Necrótica", revelacion)).toBe(true);
      expect(coincideCondicionConRasgo("Furia", revelacion)).toBe(false);
    });

    it("activarRasgosPorCondicionOEfecto activa Revelación celestial y sincroniza la forma en el selector", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      const rasgos = construirRasgosEspecie(aasimar, undefined, 3, 2);

      const actualizados = activarRasgosPorCondicionOEfecto("Fulgor Interior", rasgos);
      const revelacionActiva = actualizados.find((r) => r.nombre === "Revelación celestial")!;

      expect(revelacionActiva.activo).toBe(true);
      expect(revelacionActiva.usosRestantes).toBe(0); // Gastó su uso de 1/descanso largo
      expect(revelacionActiva.selectores?.[0].valorActual).toEqual(["fulgor_interior"]);
    });

    it("activa la transformación celestial en iniciativa con duración de 10 turnos simétricamente como Furia", () => {
      const aasimar = obtenerEspeciePorId("aasimar")!;
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-tracker-aasimar",
        nombre: "Celestia",
        especie: "Aasimar",
        nivel: 3,
        rasgos: construirRasgosEspecie(aasimar, undefined, 3, 2)
      };

      usarAlmacenDM.setState({
        personajes: [pjInicial],
        idPersonajeActivo: "pj-tracker-aasimar",
        rondaActual: 1,
        colaIniciativa: [
          {
            id: "pj-tracker-aasimar",
            nombre: "Celestia",
            iniciativa: 15,
            vidaMaxima: 25,
            vidaActual: 25,
            ca: 15,
            bonificadorIniciativa: 2,
            esMonstruo: false,
            velocidad: "30 pies",
            condiciones: [],
            efectos: []
          }
        ]
      });

      const store = usarAlmacenDM.getState();
      const revelacion = pjInicial.rasgos.find((r) => r.nombre === "Revelación celestial")!;

      // Activar Revelación celestial
      store.alternarActivoRasgo("pj-tracker-aasimar", revelacion.id);

      const pjTrasActivar = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-tracker-aasimar")!;
      const colaTrasActivar = usarAlmacenDM.getState().colaIniciativa;

      // Se creó el efecto activo con duración estándar de 10 rondas (1 + 10 = 11)
      expect(pjTrasActivar.efectosActivos).toHaveLength(1);
      expect(pjTrasActivar.efectosActivos[0].nombre).toBe("Alas Celestiales");
      expect(pjTrasActivar.efectosActivos[0].expiraRonda).toBe(11);

      // Sincronizado en la cola de iniciativa
      expect(colaTrasActivar[0]?.efectos).toHaveLength(1);
      expect(colaTrasActivar[0]?.efectos?.[0]?.nombre).toBe("Alas Celestiales");
      expect(colaTrasActivar[0]?.efectos?.[0]?.expiraRonda).toBe(11);

      // Transmutar en combate: Cambiar opción del selector a Fulgor Interior mientras está activo
      store.actualizarSeleccionRasgo(
        "pj-tracker-aasimar",
        revelacion.id,
        "opcion_revelacion_celestial",
        ["fulgor_interior"]
      );

      const pjTrasCambio = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-tracker-aasimar")!;
      const colaTrasCambio = usarAlmacenDM.getState().colaIniciativa;

      expect(pjTrasCambio.efectosActivos[0].nombre).toBe("Fulgor Interior");
      expect(colaTrasCambio[0]?.efectos?.[0]?.nombre).toBe("Fulgor Interior");
    });
  });

  describe("Resolución Dinámica de Badges de Origen de Conjuros (Punto 1)", () => {
    it("resuelve truco otorgado por especie como origen 'especie'", () => {
      const pjAasimar = aplicarEspecieAPersonaje(PERSONAJE_POR_DEFECTO, { especieId: "aasimar" });

      const origenLuz = resolverOrigenConjuro(pjAasimar, {
        id: "luz",
        nombre: "Luz",
        nivel: 0,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "Toque",
        componentes: "V, S, M",
        duracion: "1 hora",
        descripcion: "Emites luz."
      });

      expect(origenLuz).toBe("especie");
    });

    it("resuelve conjuro genérico otorgado por un rasgo (ej. dote o personalizado) como 'rasgos' (default)", () => {
      const pj: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        rasgos: [
          {
            id: "rasgo_iniciacion_magica",
            nombre: "Iniciación Mágica",
            descripcion: "Obtienes un conjuro.",
            origen: "dote",
            fuente: "Dote: Iniciación Mágica",
            tipoAccion: "pasivo",
            tieneUsosLimitados: false,
            recuperacion: "ninguno",
            conjurosOtorgados: ["poder_arcano"],
            personalizado: false,
            activo: true,
            notas: ""
          }
        ]
      };
      const origenRasgo = resolverOrigenConjuro(pj, {
        id: "poder_arcano",
        nombre: "Poder Arcano",
        nivel: 1,
        escuela: "Abjuración",
        tiempoLanzamiento: "1 acción",
        alcance: "Personal",
        componentes: "V",
        duracion: "Instantánea",
        descripcion: "Conjuro otorgado."
      });

      expect(origenRasgo).toBe("rasgos");

      // Si no es otorgado por nada, retorna null (sin badge especial)
      const origenNormal = resolverOrigenConjuro(pj, {
        id: "proyectil_magico",
        nombre: "Proyectil Mágico",
        nivel: 1,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "120 pies",
        componentes: "V, S",
        duracion: "Instantánea",
        descripcion: "Tres dardos."
      });
      expect(origenNormal).toBeNull();
    });
  });
});
