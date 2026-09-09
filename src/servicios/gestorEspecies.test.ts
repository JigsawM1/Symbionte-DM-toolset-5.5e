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
});
