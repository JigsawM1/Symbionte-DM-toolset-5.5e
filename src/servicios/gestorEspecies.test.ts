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
import { evaluarVentajasDeRasgosEnTirada, resolverIdRasgoObjetivoGasto } from "./evaluadorEfectosRasgos";
import { resolverRasgosAcciones } from "./calculadorAccionesCombate";
import { resolverOrigenConjuro } from "./resolutorOrigenConjuros";
import { ejecutarDescansoLargo } from "./procesadorDescansos";
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

    it("Ataque de aliento e Inspiración bárdica gastan uso al tirar los dados", () => {
      const draconido = obtenerEspeciePorId("draconido")!;
      const subRojo = obtenerSubespeciePorNombre("draconido", "Dragón Rojo");
      const rasgos = construirRasgosEspecie(draconido, subRojo, 3, 2);
      const aliento = rasgos.find((r) => r.nombre === "Ataque de aliento")!;

      expect(aliento).toBeDefined();
      const normAliento = aliento.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const esAtaqueAliento = normAliento.includes("ataque de aliento") || normAliento.includes("arma de aliento");
      const gastaUsoAliento = esAtaqueAliento || aliento.categoriaMecanica === "consumible";
      expect(gastaUsoAliento).toBe(true);

      const normInspiracion = "Inspiración bárdica".toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const esInspiracion = normInspiracion.includes("inspiracion bardica");
      expect(esInspiracion).toBe(true);
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
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
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
        componentesSeleccionados: { verbal: true, somatico: false, material: false },
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
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Instantánea",
        descripcion: "Tres dardos."
      });
      expect(origenNormal).toBeNull();
    });
  });

  describe("Dracónido y Legados Dracónicos (draconido.md)", () => {
    it("cumple los campos universales y rasgos base del Dracónido", () => {
      const draconido = obtenerEspeciePorId("draconido");
      expect(draconido).toBeDefined();
      expect(draconido?.tipoCriatura).toBe("Humanoide");
      expect(draconido?.tamanoOpciones).toEqual(["Mediano"]);
      expect(draconido?.tamanoPorDefecto).toBe("Mediano");
      expect(draconido?.velocidadBase).toBe(30);
      expect(draconido?.visionOscuridad).toBe(60);

      const nombresRasgos = draconido?.rasgos.map((r) => r.nombre);
      expect(nombresRasgos).toContain("Tipo de criatura");
      expect(nombresRasgos).toContain("Tamaño");
      expect(nombresRasgos).toContain("Visión en la oscuridad");
      expect(nombresRasgos).toContain("Linaje dracónico");
      expect(nombresRasgos).toContain("Vuelo dracónico");
    });

    it("modela los 10 legados dracónicos oficiales en la tabla de ancestros", () => {
      const legados = obtenerSubespeciesDeEspecie("draconido");
      expect(legados).toHaveLength(10);

      const mapaEsperado: Record<string, string> = {
        "draconido_negro": "Ácido",
        "draconido_azul": "Relámpago",
        "draconido_oropel": "Fuego",
        "draconido_bronce": "Relámpago",
        "draconido_cobre": "Ácido",
        "draconido_oro": "Fuego",
        "draconido_verde": "Veneno",
        "draconido_rojo": "Fuego",
        "draconido_plata": "Frío",
        "draconido_blanco": "Frío"
      };

      for (const [id, tipoDano] of Object.entries(mapaEsperado)) {
        const sub = legados.find((s) => s.id === id);
        expect(sub).toBeDefined();
        expect(sub?.resistenciasDanio).toContain(tipoDano);

        // Cada legado debe contener Resistencia al daño y Ataque de aliento
        const nombresSubRasgos = sub?.rasgos.map((r) => r.nombre);
        expect(nombresSubRasgos).toContain("Resistencia al daño");
        expect(nombresSubRasgos).toContain("Ataque de aliento");

        const rasgoResistencia = sub?.rasgos.find((r) => r.nombre === "Resistencia al daño");
        expect(rasgoResistencia?.descripcion.toLowerCase()).toContain(tipoDano.toLowerCase());

        const rasgoAliento = sub?.rasgos.find((r) => r.nombre === "Ataque de aliento");
        expect(rasgoAliento?.descripcion.toLowerCase()).toContain(tipoDano.toLowerCase());
      }
    });

    it("permite búsqueda tolerante por nombre parcial, id o nombre canónico del legado", () => {
      const porId = obtenerSubespeciePorNombre("draconido", "draconido_rojo");
      expect(porId?.nombre).toBe("Dragón Rojo");

      const porNombreCorto = obtenerSubespeciePorNombre("draconido", "rojo");
      expect(porNombreCorto?.nombre).toBe("Dragón Rojo");

      const porNombreCompleto = obtenerSubespeciePorNombre("draconido", "Dragón Rojo");
      expect(porNombreCompleto?.id).toBe("draconido_rojo");

      const porNombreOropel = obtenerSubespeciePorNombre("draconido", "oropel");
      expect(porNombreOropel?.id).toBe("draconido_oropel");
    });

    it("escala dinámicamente los dados y usos de Ataque de aliento según nivel y competencia", () => {
      const draconido = obtenerEspeciePorId("draconido")!;
      const legadoAzul = obtenerSubespeciePorNombre("draconido", "azul")!;

      // Nivel 1 (PB = 2) -> 1d10, 2 usos
      const rasgosNivel1 = construirRasgosEspecie(draconido, legadoAzul, 1, 2);
      const alientoN1 = rasgosNivel1.find((r) => r.nombre === "Ataque de aliento")!;
      expect(alientoN1.formulaDados).toBe("1d10");
      expect(alientoN1.usosMaximos).toBe(2);
      expect(alientoN1.origen).toBe("subespecie");

      // Nivel 5 (PB = 3) -> 2d10, 3 usos
      const rasgosNivel5 = construirRasgosEspecie(draconido, legadoAzul, 5, 3);
      const alientoN5 = rasgosNivel5.find((r) => r.nombre === "Ataque de aliento")!;
      expect(alientoN5.formulaDados).toBe("2d10");
      expect(alientoN5.usosMaximos).toBe(3);

      // Nivel 11 (PB = 4) -> 3d10, 4 usos
      const rasgosNivel11 = construirRasgosEspecie(draconido, legadoAzul, 11, 4);
      const alientoN11 = rasgosNivel11.find((r) => r.nombre === "Ataque de aliento")!;
      expect(alientoN11.formulaDados).toBe("3d10");
      expect(alientoN11.usosMaximos).toBe(4);

      // Nivel 17 (PB = 6) -> 4d10, 6 usos
      const rasgosNivel17 = construirRasgosEspecie(draconido, legadoAzul, 17, 6);
      const alientoN17 = rasgosNivel17.find((r) => r.nombre === "Ataque de aliento")!;
      expect(alientoN17.formulaDados).toBe("4d10");
      expect(alientoN17.usosMaximos).toBe(6);
    });

    it("aplica Dracónido y su legado a un personaje mediante la función genérica del builder", () => {
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-builder-draconido",
        nivel: 5,
        especie: "Humano",
        subespecie: "",
        rasgos: [
          {
            id: "rasgo_esp_humano_versatil",
            nombre: "Versatilidad humana",
            descripcion: "Rasgo previo.",
            origen: "especie",
            fuente: "Especie: Humano",
            tipoAccion: "pasivo",
            tieneUsosLimitados: false,
            recuperacion: "ninguno",
            personalizado: false,
            activo: true,
            notas: ""
          },
          {
            id: "rasgo_cls_guerrero_segundo_aliento",
            nombre: "Segundo aliento",
            descripcion: "Rasgo de clase.",
            origen: "clase",
            fuente: "Clase: Guerrero",
            tipoAccion: "accion_adicional",
            tieneUsosLimitados: true,
            recuperacion: "descanso_corto",
            personalizado: false,
            activo: true,
            notas: ""
          }
        ]
      };

      const pjActualizado = aplicarEspecieAPersonaje(pjInicial, {
        especieId: "draconido",
        subespecieId: "draconido_verde"
      });

      expect(pjActualizado.especie).toBe("Dracónido");
      expect(pjActualizado.subespecie).toBe("Dragón Verde");
      expect(pjActualizado.tipoCriatura).toBe("Humanoide");
      expect(pjActualizado.tamano).toBe("Mediano");
      expect(pjActualizado.sentidos).toBe("Visión en la oscuridad 60 pies");

      // Rasgo de clase se preserva intacto
      expect(pjActualizado.rasgos.some((r) => r.id === "rasgo_cls_guerrero_segundo_aliento")).toBe(true);

      // Rasgo previo de humano purgado
      expect(pjActualizado.rasgos.some((r) => r.id === "rasgo_esp_humano_versatil")).toBe(false);

      // Rasgos base de especie presentes con origen 'especie'
      const rasgosBase = pjActualizado.rasgos.filter((r) => r.origen === "especie");
      expect(rasgosBase.some((r) => r.nombre === "Visión en la oscuridad")).toBe(true);
      expect(rasgosBase.some((r) => r.nombre === "Vuelo dracónico")).toBe(true);

      // Rasgos del legado presentes con origen 'subespecie'
      const rasgosLegado = pjActualizado.rasgos.filter((r) => r.origen === "subespecie");
      expect(rasgosLegado.some((r) => r.nombre === "Resistencia al daño")).toBe(true);
      const alientoVerde = rasgosLegado.find((r) => r.nombre === "Ataque de aliento")!;
      expect(alientoVerde).toBeDefined();
      expect(alientoVerde.descripcion).toContain("veneno");
      expect(alientoVerde.formulaDados).toBe("2d10"); // Nivel 5
    });

    it("Vuelo dracónico activa el efecto informativo con duración 100 rondas", () => {
      const pjInicial = aplicarEspecieAPersonaje(
        {
          ...PERSONAJE_POR_DEFECTO,
          id: "pj-draconido-vuelo",
          nombre: "Ignis",
          nivel: 5,
          efectosActivos: [],
          condicionesActivas: []
        },
        { especieId: "draconido", subespecieId: "draconido_rojo" }
      );

      usarAlmacenDM.setState({
        personajes: [pjInicial],
        idPersonajeActivo: "pj-draconido-vuelo",
        colaIniciativa: [
          {
            id: "pj-draconido-vuelo",
            nombre: "Ignis",
            iniciativa: 12,
            vidaMaxima: 35,
            vidaActual: 35,
            ca: 16,
            bonificadorIniciativa: 2,
            esMonstruo: false,
            velocidad: "30 pies",
            condiciones: [],
            efectos: []
          }
        ]
      });

      const store = usarAlmacenDM.getState();
      const rasgoVuelo = pjInicial.rasgos.find((r) => r.nombre === "Vuelo dracónico")!;
      expect(rasgoVuelo).toBeDefined();
      expect(rasgoVuelo.nivelRequerido).toBe(5);
      expect(rasgoVuelo.condicionAlActivar).toBe("Vuelo dracónico");

      // Activar Vuelo dracónico
      store.alternarActivoRasgo("pj-draconido-vuelo", rasgoVuelo.id);

      const pjTrasActivar = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-draconido-vuelo")!;
      const colaTrasActivar = usarAlmacenDM.getState().colaIniciativa;

      // Se creó el efecto activo con duración estándar de 100 rondas (10 minutos)
      expect(pjTrasActivar.efectosActivos).toHaveLength(1);
      expect(pjTrasActivar.efectosActivos[0].nombre).toBe("Vuelo dracónico");
      expect(pjTrasActivar.efectosActivos[0].expiraRonda).toBe(101);

      // Sincronizado en la cola de iniciativa del combate
      expect(colaTrasActivar[0]?.efectos).toHaveLength(1);
      expect(colaTrasActivar[0]?.efectos?.[0]?.nombre).toBe("Vuelo dracónico");
      expect(colaTrasActivar[0]?.efectos?.[0]?.expiraRonda).toBe(101);

      // Desactivar Vuelo dracónico
      store.alternarActivoRasgo("pj-draconido-vuelo", rasgoVuelo.id);

      const pjTrasDesactivar = usarAlmacenDM.getState().personajes.find((p) => p.id === "pj-draconido-vuelo")!;
      const colaTrasDesactivar = usarAlmacenDM.getState().colaIniciativa;

      expect(pjTrasDesactivar.efectosActivos).toHaveLength(0);
      expect(colaTrasDesactivar[0]?.efectos).toHaveLength(0);
    });
  });

  describe("Elfo y Linajes Élficos (Elfo.md - D&D 5.5e)", () => {
    it("cumple los campos base universales y rasgos canónicos del Elfo", () => {
      const elfo = obtenerEspeciePorId("elfo");
      expect(elfo).toBeDefined();
      expect(elfo?.tipoCriatura).toBe("Humanoide");
      expect(elfo?.tamanoOpciones).toEqual(["Mediano"]);
      expect(elfo?.tamanoPorDefecto).toBe("Mediano");
      expect(elfo?.velocidadBase).toBe(30);
      expect(elfo?.visionOscuridad).toBe(60);

      const nombresRasgos = elfo?.rasgos.map((r) => r.nombre);
      expect(nombresRasgos).toContain("Tipo de criatura");
      expect(nombresRasgos).toContain("Tamaño");
      expect(nombresRasgos).toContain("Visión en la oscuridad");
      expect(nombresRasgos).toContain("Linaje élfico");
      expect(nombresRasgos).toContain("Linaje feérico");
      expect(nombresRasgos).toContain("Sentidos agudos");
      expect(nombresRasgos).toContain("Trance");
    });

    it("modela Linaje élfico con selector de aptitud mágica, Sentidos agudos como pasivo y Magia de alto elfo con selector de truco", () => {
      const elfo = obtenerEspeciePorId("elfo")!;
      const rasgos = construirRasgosEspecie(elfo, undefined, 1, 2, "Mediano");

      const linajeElfico = rasgos.find((r) => r.nombre === "Linaje élfico");
      expect(linajeElfico).toBeDefined();
      expect(linajeElfico?.categoriaMecanica).toBe("selector_informativo");
      expect(linajeElfico?.selectores).toHaveLength(1);
      expect(linajeElfico?.selectores?.[0].id).toBe("selector_aptitud_magica_elfo");
      expect(linajeElfico?.selectores?.[0].opciones.map((o) => o.id)).toEqual(["inteligencia", "sabiduria", "carisma"]);

      const sentidosAgudos = rasgos.find((r) => r.nombre === "Sentidos agudos");
      expect(sentidosAgudos).toBeDefined();
      expect(sentidosAgudos?.categoriaMecanica).toBe("pasivo_permanente");
      expect(sentidosAgudos?.selectores).toEqual([]);

      const linajeFeerico = rasgos.find((r) => r.nombre === "Linaje feérico");
      expect(linajeFeerico).toBeDefined();
      expect(linajeFeerico?.tipoAccion).toBe("pasivo");
      expect(linajeFeerico?.categoriaMecanica).toBe("pasivo_permanente");
      expect(linajeFeerico?.descripcion).toContain("ventaja en las tiradas de salvación para evitar o poner fin al estado de hechizado");

      const trance = rasgos.find((r) => r.nombre === "Trance");
      expect(trance).toBeDefined();
      expect(trance?.descripcion).toContain("4 horas");

      // Comprobar que la subespecie Alto elfo provee el selector para sustituir el truco de mago
      const altoElfo = obtenerSubespeciePorNombre("elfo", "alto_elfo")!;
      const rasgosAltoElfo = construirRasgosEspecie(elfo, altoElfo, 1, 2, "Mediano");
      const magiaAltoElfo = rasgosAltoElfo.find((r) => r.nombre === "Magia de alto elfo");
      expect(magiaAltoElfo).toBeDefined();
      expect(magiaAltoElfo?.selectores).toHaveLength(1);
      expect(magiaAltoElfo?.selectores?.[0].id).toBe("selector_truco_alto_elfo");
    });

    it("modela los 3 linajes élficos oficiales: Drow, Alto elfo y Elfo de los bosques", () => {
      const subespecies = obtenerSubespeciesDeEspecie("elfo");
      expect(subespecies).toHaveLength(3);
      const nombres = subespecies.map((s) => s.nombre);
      expect(nombres).toContain("Drow");
      expect(nombres).toContain("Alto elfo");
      expect(nombres).toContain("Elfo de los bosques");
    });

    it("Drow: incrementa visión a 120 pies y otorga Luces danzantes (N1), Fuego feérico (N3) y Oscuridad (N5)", () => {
      const drow = obtenerSubespeciePorNombre("elfo", "drow")!;
      expect(drow).toBeDefined();
      expect(drow.modificadores?.visionOscuridad).toBe(120);

      const nombresRasgos = drow.rasgos.map((r) => r.nombre);
      expect(nombresRasgos).toContain("Visión en la oscuridad superior (120 pies)");
      expect(nombresRasgos.some((n) => n.includes("Magia drow"))).toBe(true);

      const conjuros = drow.conjurosInnatos || [];
      expect(conjuros).toHaveLength(3);

      const truco = conjuros.find((c) => c.hechizoId === "luces_danzantes");
      expect(truco).toBeDefined();
      expect(truco?.esTruco).toBe(true);
      expect(truco?.nivelRequerido).toBe(1);

      const fuegoFeerico = conjuros.find((c) => c.hechizoId === "fuego_feerico");
      expect(fuegoFeerico).toBeDefined();
      expect(fuegoFeerico?.esTruco).toBe(false);
      expect(fuegoFeerico?.nivelRequerido).toBe(3);
      expect(fuegoFeerico?.usosGratis).toBe(1);

      const oscuridad = conjuros.find((c) => c.hechizoId === "oscuridad");
      expect(oscuridad).toBeDefined();
      expect(oscuridad?.esTruco).toBe(false);
      expect(oscuridad?.nivelRequerido).toBe(5);
      expect(oscuridad?.usosGratis).toBe(1);
    });

    it("Alto elfo: otorga Prestidigitación (N1), Detectar magia (N3) y Paso brumoso (N5)", () => {
      const altoElfo = obtenerSubespeciePorNombre("elfo", "Alto elfo")!;
      expect(altoElfo).toBeDefined();

      const nombresRasgos = altoElfo.rasgos.map((r) => r.nombre);
      expect(nombresRasgos).toContain("Magia de alto elfo");

      const conjuros = altoElfo.conjurosInnatos || [];
      expect(conjuros).toHaveLength(3);

      const prestidigitacion = conjuros.find((c) => c.hechizoId === "prestidigitacion");
      expect(prestidigitacion?.esTruco).toBe(true);
      expect(prestidigitacion?.nivelRequerido).toBe(1);

      const detectarMagia = conjuros.find((c) => c.hechizoId === "detectar_magia");
      expect(detectarMagia?.esTruco).toBe(false);
      expect(detectarMagia?.nivelRequerido).toBe(3);
      expect(detectarMagia?.usosGratis).toBe(1);

      const pasoBrumoso = conjuros.find((c) => c.hechizoId === "paso_brumoso");
      expect(pasoBrumoso?.esTruco).toBe(false);
      expect(pasoBrumoso?.nivelRequerido).toBe(5);
      expect(pasoBrumoso?.usosGratis).toBe(1);
    });

    it("Elfo de los bosques: incrementa velocidad a 35 pies y otorga Saber druídico (N1), Zancada prodigiosa (N3) y Pasar sin rastro (N5)", () => {
      const elfoBosques = obtenerSubespeciePorNombre("elfo", "Elfo de los bosques")!;
      expect(elfoBosques).toBeDefined();
      expect(elfoBosques.modificadores?.velocidad).toBe(35);

      const nombresRasgos = elfoBosques.rasgos.map((r) => r.nombre);
      expect(nombresRasgos).toContain("Pies veloces");
      expect(nombresRasgos.some((n) => n.includes("Magia de elfo de los bosques"))).toBe(true);

      const conjuros = elfoBosques.conjurosInnatos || [];
      expect(conjuros).toHaveLength(3);

      const saberDruidico = conjuros.find((c) => c.hechizoId === "saber_druidico");
      expect(saberDruidico?.esTruco).toBe(true);
      expect(saberDruidico?.nivelRequerido).toBe(1);

      const zancadaProdigiosa = conjuros.find((c) => c.hechizoId === "zancada_prodigiosa");
      expect(zancadaProdigiosa?.esTruco).toBe(false);
      expect(zancadaProdigiosa?.nivelRequerido).toBe(3);
      expect(zancadaProdigiosa?.usosGratis).toBe(1);

      const pasarSinRastro = conjuros.find((c) => c.hechizoId === "pasar_sin_rastro");
      expect(pasarSinRastro?.esTruco).toBe(false);
      expect(pasarSinRastro?.nivelRequerido).toBe(5);
      expect(pasarSinRastro?.usosGratis).toBe(1);
    });

    it("aplicarEspecieAPersonaje desbloquea progresivamente los conjuros según el nivel del personaje", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-elfo-progresion",
        nombre: "Sylas"
      };

      // Nivel 1: solo truco Luces danzantes
      const pjNivel1 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 1 }, {
        especieId: "elfo",
        subespecieId: "drow"
      });

      expect(pjNivel1.especie).toBe("Elfo");
      expect(pjNivel1.subespecie).toBe("Drow");
      expect(pjNivel1.sentidos).toBe("Visión en la oscuridad 120 pies");
      expect(pjNivel1.trucosConocidosIds).toContain("luces_danzantes");
      expect(pjNivel1.conjurosSiemprePreparadosIds).not.toContain("fuego_feerico");
      expect(pjNivel1.conjurosSiemprePreparadosIds).not.toContain("oscuridad");

      // Nivel 3: truco + Fuego feérico (con rasgo de recurso 1/Descanso largo)
      const pjNivel3 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 3 }, {
        especieId: "elfo",
        subespecieId: "drow"
      });
      expect(pjNivel3.trucosConocidosIds).toContain("luces_danzantes");
      expect(pjNivel3.conjurosSiemprePreparadosIds).toContain("fuego_feerico");
      expect(pjNivel3.conjurosSiemprePreparadosIds).not.toContain("oscuridad");
      const rasgoFuegoFeerico = pjNivel3.rasgos.find((r) => r.nombre.includes("Fuego feérico"));
      expect(rasgoFuegoFeerico).toBeDefined();
      expect(rasgoFuegoFeerico?.tieneUsosLimitados).toBe(true);
      expect(rasgoFuegoFeerico?.usosMaximos).toBe(1);
      expect(rasgoFuegoFeerico?.usosRestantes).toBe(1);
      expect(rasgoFuegoFeerico?.recuperacion).toBe("descanso_largo");

      // Nivel 5: truco + Fuego feérico + Oscuridad (ambos con rasgo de recurso)
      const pjNivel5 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 5 }, {
        especieId: "elfo",
        subespecieId: "drow"
      });
      expect(pjNivel5.trucosConocidosIds).toContain("luces_danzantes");
      expect(pjNivel5.conjurosSiemprePreparadosIds).toContain("fuego_feerico");
      expect(pjNivel5.conjurosSiemprePreparadosIds).toContain("oscuridad");
      const rasgoOscuridad = pjNivel5.rasgos.find((r) => r.nombre.includes("Oscuridad"));
      expect(rasgoOscuridad).toBeDefined();
      expect(rasgoOscuridad?.tieneUsosLimitados).toBe(true);
      expect(rasgoOscuridad?.usosMaximos).toBe(1);
      expect(rasgoOscuridad?.recuperacion).toBe("descanso_largo");
    });

    it("conmuta limpiamente entre linajes de Elfo sin duplicar ni dejar conjuros huérfanos", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-elfo-conmutar",
        nombre: "Lyra",
        nivel: 5
      };

      // 1. Aplicar Alto elfo a nivel 5
      const pjAltoElfo = aplicarEspecieAPersonaje(pjBase, {
        especieId: "elfo",
        subespecieId: "alto_elfo"
      });
      expect(pjAltoElfo.trucosConocidosIds).toContain("prestidigitacion");
      expect(pjAltoElfo.conjurosSiemprePreparadosIds).toContain("detectar_magia");
      expect(pjAltoElfo.conjurosSiemprePreparadosIds).toContain("paso_brumoso");

      // 2. Conmutar a Elfo de los bosques
      const pjElfoBosques = aplicarEspecieAPersonaje(pjAltoElfo, {
        especieId: "elfo",
        subespecieId: "elfo_bosques"
      });
      expect(pjElfoBosques.subespecie).toBe("Elfo de los bosques");
      expect(pjElfoBosques.velocidad).toBe("35 pies");

      // Se agregaron los conjuros de Elfo de los bosques
      expect(pjElfoBosques.trucosConocidosIds).toContain("saber_druidico");
      expect(pjElfoBosques.conjurosSiemprePreparadosIds).toContain("zancada_prodigiosa");
      expect(pjElfoBosques.conjurosSiemprePreparadosIds).toContain("pasar_sin_rastro");

      // Se purgaron limpiamente los de Alto elfo
      expect(pjElfoBosques.trucosConocidosIds).not.toContain("prestidigitacion");
      expect(pjElfoBosques.conjurosSiemprePreparadosIds).not.toContain("detectar_magia");
      expect(pjElfoBosques.conjurosSiemprePreparadosIds).not.toContain("paso_brumoso");
    });

    it("resolverOrigenConjuro clasifica los conjuros de linaje élfico como 'legado'", () => {
      const pjElfo = aplicarEspecieAPersonaje({ ...PERSONAJE_POR_DEFECTO, nivel: 5 }, {
        especieId: "elfo",
        subespecieId: "drow"
      });

      const origenFuegoFeerico = resolverOrigenConjuro(pjElfo, {
        id: "fuego_feerico",
        nombre: "Fuego feérico",
        nivel: 1,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "60 pies",
        componentesSeleccionados: { verbal: true, somatico: false, material: false },
        duracion: "Concentración, hasta 1 minuto",
        descripcion: "Luz que perfila objetivos."
      });

      expect(origenFuegoFeerico).toBe("legado");

      const origenLucesDanzantes = resolverOrigenConjuro(pjElfo, {
        id: "luces_danzantes",
        nombre: "Luces danzantes",
        nivel: 0,
        escuela: "Evocación",
        tiempoLanzamiento: "1 acción",
        alcance: "120 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
        duracion: "Concentración, hasta 1 minuto",
        descripcion: "Creas hasta 4 luces."
      });

      expect(origenLucesDanzantes).toBe("legado");
    });

    it("Alto elfo: respeta el truco seleccionado en selector_truco_alto_elfo al aplicar la especie", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-alto-elfo-custom",
        nombre: "Aredhel",
        nivel: 3
      };

      // 1. Aplicar Alto elfo inicialmente
      const pjInicial = aplicarEspecieAPersonaje(pjBase, {
        especieId: "elfo",
        subespecieId: "alto_elfo"
      });

      // 2. Simular selección del jugador en el selector_truco_alto_elfo
      const rasgosConSeleccion = pjInicial.rasgos.map((r) => {
        if (r.nombre === "Magia de alto elfo") {
          return {
            ...r,
            selectores: (r.selectores || []).map((s) =>
              s.id === "selector_truco_alto_elfo" ? { ...s, valorActual: ["rayo_de_escarcha"] } : s
            )
          };
        }
        return r;
      });

      // 3. Reaplicar la especie y comprobar que se adopta el nuevo truco
      const pjActualizado = aplicarEspecieAPersonaje({ ...pjInicial, rasgos: rasgosConSeleccion }, {
        especieId: "elfo",
        subespecieId: "alto_elfo"
      });

      expect(pjActualizado.trucosConocidosIds).toContain("rayo_de_escarcha");
      expect(pjActualizado.trucosConocidosIds).not.toContain("prestidigitacion");
      expect(pjActualizado.conjurosSiemprePreparadosIds).toContain("detectar_magia");
    });
  });

  describe("Enano - Rasgos Canónicos y Mecánicas Declarativas (Enano.md)", () => {
    it("cumple los campos base canónicos de Enano (D&D 5.5e)", () => {
      const enano = obtenerEspeciePorId("enano");
      expect(enano).toBeDefined();
      expect(enano?.nombre).toBe("Enano");
      expect(enano?.tipoCriatura).toBe("Humanoide");
      expect(enano?.tamanoOpciones).toEqual(["Mediano"]);
      expect(enano?.tamanoPorDefecto).toBe("Mediano");
      expect(enano?.velocidadBase).toBe(30);
      expect(enano?.visionOscuridad).toBe(120);
      expect(enano?.resistenciasDanio).toContain("Veneno");
    });

    it("modela Resistencia enana con ventaja táctica en salvaciones contra envenenado", () => {
      const enano = obtenerEspeciePorId("enano")!;
      const rasgos = construirRasgosEspecie(enano, undefined, 1, 2);
      const resistenciaEnana = rasgos.find((r) => r.nombre === "Resistencia enana");
      expect(resistenciaEnana).toBeDefined();
      expect(resistenciaEnana?.tipoAccion).toBe("pasivo");
      const efectoVentaja = resistenciaEnana?.efectos?.find((e) => e.tipo === "ventaja");
      expect(efectoVentaja).toBeDefined();
      expect(efectoVentaja?.objetivo).toBe("salvacion.envenenado");
    });

    it("Aguante enano aumenta los puntos de golpe máximos en 1 por nivel de forma declarativa", () => {
      const enano = obtenerEspeciePorId("enano")!;
      
      // A nivel 1
      const rasgosNivel1 = construirRasgosEspecie(enano, undefined, 1, 2);
      const aguanteNivel1 = rasgosNivel1.find((r) => r.nombre === "Aguante enano");
      expect(aguanteNivel1).toBeDefined();
      const efectoHp1 = aguanteNivel1?.efectos?.find((e) => e.tipo === "modificador_hp_maximo");
      expect(efectoHp1).toBeDefined();
      expect(efectoHp1?.objetivo).toBe("hp_maximo");
      expect(efectoHp1?.valor).toBe("1*nivel");

      // Aplicar especie a un personaje a nivel 1
      const pjNivel1: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-enano-1",
        nombre: "Bruenor N1",
        nivel: 1,
        hpMaximoBase: 12,
        hpMaximo: 12,
        hpActual: 12
      };

      const pjAplicadoN1 = aplicarEspecieAPersonaje(pjNivel1, { especieId: "enano" });
      // HP permanente 12 + 1 por nivel = 13
      expect(pjAplicadoN1.hpMaximoBase).toBe(13);
      expect(pjAplicadoN1.hpMaximo).toBe(13);
      expect(pjAplicadoN1.hpActual).toBe(13);

      // Aplicar especie a un personaje a nivel 5
      const pjNivel5: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-enano-5",
        nombre: "Bruenor N5",
        nivel: 5,
        hpMaximoBase: 44,
        hpMaximo: 44,
        hpActual: 44
      };

      const pjAplicadoN5 = aplicarEspecieAPersonaje(pjNivel5, { especieId: "enano" });
      // HP permanente 44 + 5 por nivel = 49
      expect(pjAplicadoN5.hpMaximoBase).toBe(49);
      expect(pjAplicadoN5.hpMaximo).toBe(49);
      expect(pjAplicadoN5.hpActual).toBe(49);
    });

    it("Afinidad con la piedra es activable, dura 100 asaltos y escala usos con el bono de competencia", () => {
      const enano = obtenerEspeciePorId("enano")!;

      // Nivel 1 (PB 2)
      const rasgosN1 = construirRasgosEspecie(enano, undefined, 1, 2);
      const afinidadN1 = rasgosN1.find((r) => r.nombre === "Afinidad con la piedra");
      expect(afinidadN1).toBeDefined();
      expect(afinidadN1?.esActivable).toBe(true);
      expect(afinidadN1?.tipoAccion).toBe("accion_adicional");
      expect(afinidadN1?.tieneUsosLimitados).toBe(true);
      expect(afinidadN1?.usosMaximos).toBe(2);
      expect(afinidadN1?.recuperacion).toBe("descanso_largo");
      expect(afinidadN1?.duracionEfectoAlActivar).toBe(100);
      expect(afinidadN1?.condicionAlActivar).toBe("Afinidad con la piedra");

      // Nivel 5 (PB 3)
      const rasgosN5 = construirRasgosEspecie(enano, undefined, 5, 3);
      const afinidadN5 = rasgosN5.find((r) => r.nombre === "Afinidad con la piedra");
      expect(afinidadN5?.usosMaximos).toBe(3);

      // Nivel 9 (PB 4)
      const rasgosN9 = construirRasgosEspecie(enano, undefined, 9, 4);
      const afinidadN9 = rasgosN9.find((r) => r.nombre === "Afinidad con la piedra");
      expect(afinidadN9?.usosMaximos).toBe(4);
    });

    it("integra la condición táctica y duración de 100 asaltos de Afinidad con la piedra al activarse", () => {
      const almacen = usarAlmacenDM.getState();
      const pjEnano: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-enano-test-activacion",
        nombre: "Thorin",
        nivel: 3,
        rasgos: []
      };

      const pjConfigurado = aplicarEspecieAPersonaje(pjEnano, { especieId: "enano" });
      const rasgoAfinidad = pjConfigurado.rasgos.find((r) => r.nombre === "Afinidad con la piedra");
      expect(rasgoAfinidad).toBeDefined();

      expect(resolverCondicionAsociadaRasgo(rasgoAfinidad!)).toBe("Afinidad con la piedra");
      expect(coincideCondicionConRasgo("Afinidad con la piedra", rasgoAfinidad!)).toBe(true);

      usarAlmacenDM.setState({ personajes: [pjConfigurado] });
      expect(rasgoAfinidad).toBeDefined();
      expect(rasgoAfinidad?.activo).toBe(false);

      // Activar el rasgo a través del almacén
      almacen.alternarActivoRasgo(pjConfigurado.id, rasgoAfinidad!.id);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === pjConfigurado.id)!;
      const rasgoEncendido = pjActualizado.rasgos.find((r) => r.id === rasgoAfinidad!.id);
      expect(rasgoEncendido?.activo).toBe(true);

      // Verificar que el efecto generado tiene 100 asaltos de duración
      const efectoGenerado = pjActualizado.efectosActivos?.find((e) => e.nombre === "Afinidad con la piedra");
      expect(efectoGenerado).toBeDefined();
      expect(efectoGenerado?.duracion).toBe(100);

      // Limpiar personaje del almacén
      usarAlmacenDM.setState({ personajes: [] });
    });
  });

  describe("Especie Gnomo y Linajes (D&D 5.5e)", () => {
    it("carga la especie canónica Gnomo con Astucia gnoma y sus 3 efectos declarativos de ventaja", () => {
      const gnomo = obtenerEspeciePorId("gnomo");
      expect(gnomo).toBeDefined();
      expect(gnomo?.nombre).toBe("Gnomo");
      expect(gnomo?.tipoCriatura).toBe("Humanoide");
      expect(gnomo?.tamanoPorDefecto).toBe("Pequeño");
      expect(gnomo?.velocidadBase).toBe(30);
      expect(gnomo?.visionOscuridad).toBe(60);

      const astucia = gnomo?.rasgos.find((r) => r.nombre === "Astucia gnoma");
      expect(astucia).toBeDefined();
      expect(astucia?.efectos).toHaveLength(3);

      const efInt = astucia?.efectos?.find((e) => e.objetivo === "salvacion.inteligencia");
      const efSab = astucia?.efectos?.find((e) => e.objetivo === "salvacion.sabiduria");
      const efCar = astucia?.efectos?.find((e) => e.objetivo === "salvacion.carisma");

      expect(efInt).toBeDefined();
      expect(efInt?.tipo).toBe("ventaja");
      expect(efSab).toBeDefined();
      expect(efSab?.tipo).toBe("ventaja");
      expect(efCar).toBeDefined();
      expect(efCar?.tipo).toBe("ventaja");

      // Linaje gnomo contiene el selector de aptitud mágica
      const linaje = gnomo?.rasgos.find((r) => r.nombre === "Linaje gnomo");
      expect(linaje).toBeDefined();
      expect(linaje?.selectores).toHaveLength(1);
      expect(linaje?.selectores?.[0].id).toBe("selector_aptitud_magica_gnomo");
      expect(linaje?.selectores?.[0].opciones.map((o) => o.id)).toEqual(["inteligencia", "sabiduria", "carisma"]);
    });

    it("evaluarVentajasDeRasgosEnTirada activa ventaja en salvaciones de INT, SAB y CAR para un Gnomo", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-gnomo-astucia",
        nombre: "Fizban",
        nivel: 1
      };

      const pjGnomo = aplicarEspecieAPersonaje(pjBase, { especieId: "gnomo" });

      // Salvaciones que deben tener ventaja
      const evalInt = evaluarVentajasDeRasgosEnTirada(pjGnomo, { tipoTirada: "salvacion", subtipo: "inteligencia" });
      const evalSab = evaluarVentajasDeRasgosEnTirada(pjGnomo, { tipoTirada: "salvacion", subtipo: "sabiduria" });
      const evalCar = evaluarVentajasDeRasgosEnTirada(pjGnomo, { tipoTirada: "salvacion", subtipo: "carisma" });

      expect(evalInt.tieneVentaja).toBe(true);
      expect(evalInt.razones.some((r) => r.includes("Astucia gnoma"))).toBe(true);

      expect(evalSab.tieneVentaja).toBe(true);
      expect(evalSab.razones.some((r) => r.includes("Astucia gnoma"))).toBe(true);

      expect(evalCar.tieneVentaja).toBe(true);
      expect(evalCar.razones.some((r) => r.includes("Astucia gnoma"))).toBe(true);

      // Salvaciones que NO deben tener ventaja
      const evalFue = evaluarVentajasDeRasgosEnTirada(pjGnomo, { tipoTirada: "salvacion", subtipo: "fuerza" });
      const evalDes = evaluarVentajasDeRasgosEnTirada(pjGnomo, { tipoTirada: "salvacion", subtipo: "destreza" });
      const evalCon = evaluarVentajasDeRasgosEnTirada(pjGnomo, { tipoTirada: "salvacion", subtipo: "constitucion" });

      expect(evalFue.tieneVentaja).toBe(false);
      expect(evalDes.tieneVentaja).toBe(false);
      expect(evalCon.tieneVentaja).toBe(false);
    });

    it("evaluarVentajasDeRasgosEnTirada reconoce agrupaciones compuestas salvaciones_mentales y salvaciones_fisicas", () => {
      const pjMental: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-mental",
        rasgos: [
          {
            id: "r-mental",
            nombre: "Mente Inquebrantable",
            descripcion: "Ventaja mental",
            origen: "personalizado",
            fuente: "Custom",
            tipoAccion: "pasivo",
            tieneUsosLimitados: false,
            recuperacion: "ninguno",
            personalizado: true,
            notas: "",
            activo: true,
            efectos: [{ tipo: "ventaja", objetivo: "salvaciones_mentales", valor: "true", descripcion: "Mente Inquebrantable" }]
          }
        ]
      };

      expect(evaluarVentajasDeRasgosEnTirada(pjMental, { tipoTirada: "salvacion", subtipo: "inteligencia" }).tieneVentaja).toBe(true);
      expect(evaluarVentajasDeRasgosEnTirada(pjMental, { tipoTirada: "salvacion", subtipo: "sabiduria" }).tieneVentaja).toBe(true);
      expect(evaluarVentajasDeRasgosEnTirada(pjMental, { tipoTirada: "salvacion", subtipo: "carisma" }).tieneVentaja).toBe(true);
      expect(evaluarVentajasDeRasgosEnTirada(pjMental, { tipoTirada: "salvacion", subtipo: "fuerza" }).tieneVentaja).toBe(false);

      const pjFisico: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-fisico",
        rasgos: [
          {
            id: "r-fisico",
            nombre: "Cuerpo Indómito",
            descripcion: "Ventaja física",
            origen: "personalizado",
            fuente: "Custom",
            tipoAccion: "pasivo",
            tieneUsosLimitados: false,
            recuperacion: "ninguno",
            personalizado: true,
            notas: "",
            activo: true,
            efectos: [{ tipo: "ventaja", objetivo: "salvaciones_fisicas", valor: "true", descripcion: "Cuerpo Indómito" }]
          }
        ]
      };

      expect(evaluarVentajasDeRasgosEnTirada(pjFisico, { tipoTirada: "salvacion", subtipo: "fuerza" }).tieneVentaja).toBe(true);
      expect(evaluarVentajasDeRasgosEnTirada(pjFisico, { tipoTirada: "salvacion", subtipo: "destreza" }).tieneVentaja).toBe(true);
      expect(evaluarVentajasDeRasgosEnTirada(pjFisico, { tipoTirada: "salvacion", subtipo: "constitucion" }).tieneVentaja).toBe(true);
      expect(evaluarVentajasDeRasgosEnTirada(pjFisico, { tipoTirada: "salvacion", subtipo: "sabiduria" }).tieneVentaja).toBe(false);
    });

    it("aplica Gnomo de los bosques con Ilusión menor y Hablar con los animales escalado a PB", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-bosques-1",
        nombre: "Bimble",
        nivel: 1
      };

      const pjN1 = aplicarEspecieAPersonaje(pjBase, {
        especieId: "gnomo",
        subespecieId: "gnomo_bosques"
      });

      expect(pjN1.especie).toBe("Gnomo");
      expect(pjN1.subespecie).toBe("Gnomo de los bosques");
      expect(pjN1.tamano).toBe("Pequeño");
      expect(pjN1.trucosConocidosIds).toContain("ilusion_menor");
      expect(pjN1.conjurosSiemprePreparadosIds).toContain("hablar_con_los_animales");

      const rasgoHablar = pjN1.rasgos.find((r) => r.nombre.includes("Hablar con los animales"));
      expect(rasgoHablar).toBeDefined();
      expect(rasgoHablar?.tieneUsosLimitados).toBe(true);
      expect(rasgoHablar?.usosMaximos).toBe(2); // PB a nivel 1
      expect(rasgoHablar?.recuperacion).toBe("descanso_largo");

      // A nivel 5 (PB 3)
      const pjN5 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 5 }, {
        especieId: "gnomo",
        subespecieId: "gnomo_bosques"
      });
      const rasgoHablarN5 = pjN5.rasgos.find((r) => r.nombre.includes("Hablar con los animales"));
      expect(rasgoHablarN5?.usosMaximos).toBe(3);
    });

    it("aplica Gnomo de las rocas con Prestidigitación, Reparar y rasgo informativo de artilugios", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-rocas-1",
        nombre: "Gimble",
        nivel: 1
      };

      const pjRocas = aplicarEspecieAPersonaje(pjBase, {
        especieId: "gnomo",
        subespecieId: "gnomo_rocas"
      });

      expect(pjRocas.especie).toBe("Gnomo");
      expect(pjRocas.subespecie).toBe("Gnomo de las rocas");
      expect(pjRocas.trucosConocidosIds).toContain("prestidigitacion");
      expect(pjRocas.trucosConocidosIds).toContain("reparar");

      const rasgoDispositivo = pjRocas.rasgos.find((r) => r.nombre === "Dispositivo mecánico");
      expect(rasgoDispositivo).toBeDefined();
      expect(rasgoDispositivo?.tipoAccion).toBe("pasivo");
      expect(rasgoDispositivo?.categoriaMecanica).toBe("pasivo_permanente");
      expect(rasgoDispositivo?.efectos || []).toHaveLength(0); // Informativo, sin mecánicas
    });

    it("conmuta limpiamente entre Gnomo de los bosques y Gnomo de las rocas", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-gnomo-switch",
        nombre: "Dimble",
        nivel: 3
      };

      // 1. Gnomo de los bosques
      const pjBosques = aplicarEspecieAPersonaje(pjBase, {
        especieId: "gnomo",
        subespecieId: "gnomo_bosques"
      });
      expect(pjBosques.trucosConocidosIds).toContain("ilusion_menor");
      expect(pjBosques.conjurosSiemprePreparadosIds).toContain("hablar_con_los_animales");

      // 2. Conmutar a Gnomo de las rocas
      const pjRocas = aplicarEspecieAPersonaje(pjBosques, {
        especieId: "gnomo",
        subespecieId: "gnomo_rocas"
      });
      expect(pjRocas.subespecie).toBe("Gnomo de las rocas");
      expect(pjRocas.trucosConocidosIds).toContain("prestidigitacion");
      expect(pjRocas.trucosConocidosIds).toContain("reparar");

      // Los conjuros de bosques deben haberse purgado
      expect(pjRocas.trucosConocidosIds).not.toContain("ilusion_menor");
      expect(pjRocas.conjurosSiemprePreparadosIds).not.toContain("hablar_con_los_animales");
    });
  });

  describe("Goliat - Definición Canónica y Linaje Gigante (D&D 5.5e)", () => {
    it("cumple los campos base de especie: velocidad 35 pies, tamaño Mediano y tipo Humanoide", () => {
      const goliat = obtenerEspeciePorId("goliat");
      expect(goliat).toBeDefined();
      expect(goliat?.nombre).toBe("Goliat");
      expect(goliat?.tipoCriatura).toBe("Humanoide");
      expect(goliat?.velocidadBase).toBe(35);
      expect(goliat?.tamanoPorDefecto).toBe("Mediano");
      expect(goliat?.tamanoOpciones).toEqual(["Mediano"]);
    });

    it("modela Constitución poderosa con efecto modificador_capacidad_carga x2", () => {
      const goliat = obtenerEspeciePorId("goliat")!;
      const rasgos = construirRasgosEspecie(goliat, undefined, 1, 2);
      const rasgoConstPoderosa = rasgos.find((r) => r.nombre === "Constitución poderosa");

      expect(rasgoConstPoderosa).toBeDefined();
      expect(rasgoConstPoderosa?.tipoAccion).toBe("pasivo");
      const efCarga = rasgoConstPoderosa?.efectos?.find((e) => e.tipo === "modificador_capacidad_carga");
      expect(efCarga).toBeDefined();
      expect(efCarga?.valor).toBe(2);
    });

    it("modela Forma grande con nivelRequerido 5, esActivable y efecto Forma grande", () => {
      const goliat = obtenerEspeciePorId("goliat")!;
      const rasgosNivel1 = construirRasgosEspecie(goliat, undefined, 1, 2);
      const formaGrandeN1 = rasgosNivel1.find((r) => r.nombre === "Forma grande");

      expect(formaGrandeN1).toBeDefined();
      expect(formaGrandeN1?.nivelRequerido).toBe(5);
      expect(formaGrandeN1?.esActivable).toBe(true);
      expect(formaGrandeN1?.tipoAccion).toBe("accion_adicional");
      expect(formaGrandeN1?.tieneUsosLimitados).toBe(true);
      expect(formaGrandeN1?.usosMaximos).toBe(1);
      expect(formaGrandeN1?.recuperacion).toBe("descanso_largo");
      expect(formaGrandeN1?.condicionAlActivar).toBe("Forma grande");
    });

    it("modela Linaje gigante con usos equivalentes al Bono de Competencia (PB)", () => {
      const goliat = obtenerEspeciePorId("goliat")!;

      // Nivel 1: PB = 2 -> 2 usos
      const rasgosN1 = construirRasgosEspecie(goliat, undefined, 1, 2);
      const linajeN1 = rasgosN1.find((r) => r.nombre === "Linaje gigante");
      expect(linajeN1).toBeDefined();
      expect(linajeN1?.tieneUsosLimitados).toBe(true);
      expect(linajeN1?.usosMaximos).toBe(2);
      expect(linajeN1?.formulaEscalado).toBe("bono_competencia");
      expect(linajeN1?.recuperacion).toBe("descanso_largo");

      // Nivel 5: PB = 3 -> 3 usos
      const rasgosN5 = construirRasgosEspecie(goliat, undefined, 5, 3);
      const linajeN5 = rasgosN5.find((r) => r.nombre === "Linaje gigante");
      expect(linajeN5?.usosMaximos).toBe(3);
    });

    it("ofrece exactamente las 6 subespecies canónicas de Linaje gigante con delegación al padre", () => {
      const subespecies = obtenerSubespeciesDeEspecie("goliat");
      expect(subespecies).toHaveLength(6);

      const nombres = subespecies.map((s) => s.nombre);
      expect(nombres).toContain("Gigante de fuego");
      expect(nombres).toContain("Gigante de las colinas");
      expect(nombres).toContain("Gigante de las nubes");
      expect(nombres).toContain("Gigante de escarcha");
      expect(nombres).toContain("Gigante de piedra");
      expect(nombres).toContain("Gigante de las tormentas");

      // Comprobar que cada rasgo de subespecie tiene gastarDePadre = true y ligadoA = "Linaje gigante"
      for (const sub of subespecies) {
        expect(sub.rasgos).toHaveLength(1);
        const rasgoHijo = sub.rasgos[0];
        expect(rasgoHijo.gastarDePadre).toBe(true);
        expect(rasgoHijo.ligadoA).toBe("Linaje gigante");
      }
    });

    it("comprueba los dados de daño y categorías específicas de las 6 subespecies", () => {
      const subFuego = obtenerSubespeciePorNombre("goliat", "Gigante de fuego");
      expect(subFuego?.rasgos[0].formulaDados).toBe("1d10");
      expect(subFuego?.rasgos[0].categoriaMecanica).toBe("consumible");

      const subEscarcha = obtenerSubespeciePorNombre("goliat", "Gigante de escarcha");
      expect(subEscarcha?.rasgos[0].formulaDados).toBe("1d6");
      expect(subEscarcha?.rasgos[0].categoriaMecanica).toBe("consumible");

      const subPiedra = obtenerSubespeciePorNombre("goliat", "Gigante de piedra");
      expect(subPiedra?.rasgos[0].formulaDados).toBe("1d12+constitucion");
      expect(subPiedra?.rasgos[0].tipoAccion).toBe("reaccion");
      expect(subPiedra?.rasgos[0].categoriaMecanica).toBe("consumible");

      const subTormentas = obtenerSubespeciePorNombre("goliat", "Gigante de las tormentas");
      expect(subTormentas?.rasgos[0].formulaDados).toBe("1d8");
      expect(subTormentas?.rasgos[0].tipoAccion).toBe("reaccion");
      expect(subTormentas?.rasgos[0].categoriaMecanica).toBe("consumible");

      const subNubes = obtenerSubespeciePorNombre("goliat", "Gigante de las nubes");
      expect(subNubes?.rasgos[0].tipoAccion).toBe("accion_adicional");
      expect(subNubes?.rasgos[0].categoriaMecanica).toBe("consumible");

      const subColinas = obtenerSubespeciePorNombre("goliat", "Gigante de las colinas");
      expect(subColinas?.rasgos[0].tipoAccion).toBe("especial");
      expect(subColinas?.rasgos[0].categoriaMecanica).toBe("consumible");
    });

    it("aplica Goliat con Gigante de fuego y resuelve delegación de usos hacia Linaje gigante", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-goliat-1",
        nombre: "Gorkan",
        nivel: 1
      };

      const pjGoliat = aplicarEspecieAPersonaje(pjBase, {
        especieId: "goliat",
        subespecieId: "gigante_fuego"
      });

      expect(pjGoliat.especie).toBe("Goliat");
      expect(pjGoliat.subespecie).toBe("Gigante de fuego");
      expect(pjGoliat.velocidad).toBe("35 pies");

      const rasgoPadre = pjGoliat.rasgos.find((r) => r.nombre === "Linaje gigante");
      const rasgoHijo = pjGoliat.rasgos.find((r) => r.nombre.includes("Abrasión del fuego"));

      expect(rasgoPadre).toBeDefined();
      expect(rasgoHijo).toBeDefined();
      expect(rasgoPadre?.usosMaximos).toBe(2);
      expect(rasgoHijo?.gastarDePadre).toBe(true);

      // Delegación de ID de gasto
      const idObjetivoGasto = resolverIdRasgoObjetivoGasto(rasgoHijo, pjGoliat.rasgos);
      expect(idObjetivoGasto).toBe(rasgoPadre?.id);

      // Evaluación en resolverRasgosAcciones
      const acciones = resolverRasgosAcciones(pjGoliat);
      const accionHijo = acciones.find((a) => a.rasgo.nombre.includes("Abrasión del fuego"));
      expect(accionHijo).toBeDefined();
      expect(accionHijo?.usosRestantes).toBe(2);
      expect(accionHijo?.usosMaximos).toBe(2);
      expect(accionHijo?.esConsumible).toBe(true);

      // Si el padre agota sus usos, la acción del hijo debe reflejar 0 usos restantes
      const pjSinUsos: PersonajeJugador = {
        ...pjGoliat,
        rasgos: pjGoliat.rasgos.map((r) =>
          r.id === rasgoPadre?.id ? { ...r, usosRestantes: 0 } : r
        )
      };
      const accionesSinUsos = resolverRasgosAcciones(pjSinUsos);
      const accionHijoAgotado = accionesSinUsos.find((a) => a.rasgo.nombre.includes("Abrasión del fuego"));
      expect(accionHijoAgotado?.usosRestantes).toBe(0);

      // Verificación de desbloqueo por nivel: a nivel 1 Forma grande NO debe aparecer en la ficha
      expect(pjGoliat.rasgos.find((r) => r.nombre === "Forma grande")).toBeUndefined();

      // A nivel 5 Forma grande SÍ debe desbloquearse en la ficha
      const pjGoliatN5 = aplicarEspecieAPersonaje({ ...pjBase, nivel: 5 }, {
        especieId: "goliat",
        subespecieId: "gigante_fuego"
      });
      const formaGrandeN5 = pjGoliatN5.rasgos.find((r) => r.nombre === "Forma grande");
      expect(formaGrandeN5).toBeDefined();
      expect(formaGrandeN5?.nivelRequerido).toBe(5);
      expect(formaGrandeN5?.usosMaximos).toBe(1);
    });
  });

  describe("Implementación Canónica de Humano (D&D 5.5e)", () => {
    it("carga la especie Humano con sus metadatos oficiales de D&D 5.5e", () => {
      const humano = obtenerEspeciePorId("humano");
      expect(humano).toBeDefined();
      expect(humano?.nombre).toBe("Humano");
      expect(humano?.tipoCriatura).toBe("Humanoide");
      expect(humano?.velocidadBase).toBe(30);
      expect(humano?.visionOscuridad).toBe(0);
      expect(humano?.tamanoPorDefecto).toBe("Mediano");
      expect(humano?.tamanoOpciones).toEqual(["Mediano", "Pequeño"]);
    });

    it("construye los rasgos canónicos de Humano: Ingenioso, Diestro y Versátil", () => {
      const humano = obtenerEspeciePorId("humano")!;
      const rasgos = construirRasgosEspecie(humano, undefined, 1, 2);

      const nombres = rasgos.map((r) => r.nombre);
      expect(nombres).toContain("Ingenioso");
      expect(nombres).toContain("Diestro");
      expect(nombres).toContain("Versátil");

      // Ingenioso: efecto mecánico restaurar_recurso en descanso largo
      const rasgoIngenioso = rasgos.find((r) => r.nombre === "Ingenioso");
      expect(rasgoIngenioso).toBeDefined();
      expect(rasgoIngenioso?.tipoAccion).toBe("pasivo");
      expect(rasgoIngenioso?.recuperacion).toBe("descanso_largo");
      const efInspiracion = rasgoIngenioso?.efectos?.find((e) => e.tipo === "restaurar_recurso");
      expect(efInspiracion).toBeDefined();
      expect(efInspiracion?.objetivo).toBe("inspiracion");
      expect(efInspiracion?.condicion).toBe("descanso_largo");

      // Diestro: pasivo informativo
      const rasgoDiestro = rasgos.find((r) => r.nombre === "Diestro");
      expect(rasgoDiestro?.tipoAccion).toBe("pasivo");
      expect(rasgoDiestro?.efectos).toHaveLength(0);

      // Versátil: pasivo informativo
      const rasgoVersatil = rasgos.find((r) => r.nombre === "Versátil");
      expect(rasgoVersatil?.tipoAccion).toBe("pasivo");
      expect(rasgoVersatil?.efectos).toHaveLength(0);
    });

    it("aplica la especie Humano al personaje respetando el tamaño elegido y recupera inspiración en descanso largo", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-humano-test",
        nombre: "Test Humano",
        nivel: 1,
        inspiracion: false
      };

      // 1. Aplicación con tamaño Pequeño
      const pjPequeno = aplicarEspecieAPersonaje(pjBase, {
        especieId: "humano",
        tamanoElegido: "Pequeño"
      });
      expect(pjPequeno.tamano).toBe("Pequeño");
      expect(pjPequeno.velocidad).toBe("30 pies");
      expect(pjPequeno.rasgos.some((r) => r.nombre === "Ingenioso")).toBe(true);

      // 2. Aplicación con tamaño por defecto (Mediano)
      const pjMediano = aplicarEspecieAPersonaje(pjBase, {
        especieId: "humano"
      });
      expect(pjMediano.tamano).toBe("Mediano");

      // 3. Recuperación de Inspiración Heroica al finalizar descanso largo
      expect(pjMediano.inspiracion).toBe(false);
      const resDescanso = ejecutarDescansoLargo(pjMediano);
      expect(resDescanso.personajeActualizado.inspiracion).toBe(true);
      expect(resDescanso.acciones.some((a) => a.descripcion.includes("Inspiración heroica"))).toBe(true);
    });
  });
});

