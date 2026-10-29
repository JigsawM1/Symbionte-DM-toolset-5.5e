import { describe, it, expect, beforeEach } from "vitest";
import type { PersonajeJugador, RasgoPersonaje, ObjetoInventario } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import {
  calcularReglasFormaSalvaje,
  esBestiaValidaParaDruida,
  calcularHpTemporalFormaSalvaje,
  obtenerBestiaFormaActiva,
  puedeLanzarConjuroEnFormaSalvaje,
  filtrarRasgosFormaSalvaje,
  extraerRasgosBestia
} from "./reglasFormaSalvaje";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { generarListaAtaquesFisicos } from "./calculadorAtaquesArmas";
import {
  obtenerVelocidadesEfectivas,
  obtenerSentidosEfectivos
} from "@/servicios/rasgos/evaluadorMovilidadRasgos";
import { MONSTRUOS_INICIALES } from "@/utiles/datosIniciales";

describe("Druida D&D 5.5e (2024) - Reglas y Mecánicas de Forma Salvaje", () => {
  const lobo = MONSTRUOS_INICIALES.find((m) => m.id === "m_lobo")!;
  const cuervo = MONSTRUOS_INICIALES.find((m) => m.id === "m_cuervo")!;

  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [],
      idPersonajeActivo: null
    });
  });

  it("mantiene IDs, categorías, orden y notas al integrar rasgos, acciones adicionales y reacciones de bestia", () => {
    const bestia = {
      ...structuredClone(lobo),
      id: "bestia_prueba",
      nombre: "Bestia de prueba",
      rasgos: [{ nombre: "  Olfáto agudo  ", descripcion: "Detecta presas" }],
      accionesAdicionales: [{ nombre: "  Salto ágil ", descripcion: "" }],
      reacciones: [{ nombre: "Salto ágil", descripcion: "Esquiva" }]
    };
    const entrada = structuredClone(bestia);
    const rasgos = extraerRasgosBestia(bestia);
    expect(rasgos.map(({ id, tipoAccion, descripcion, notas }) => ({ id, tipoAccion, descripcion, notas }))).toEqual([
      { id: "rasgo_bestia_bestia_prueba_0_olfato_agudo", tipoAccion: "pasivo", descripcion: "Detecta presas", notas: "Rasgo de Bestia de prueba." },
      { id: "acc_adic_bestia_bestia_prueba_0_salto_agil", tipoAccion: "accion_adicional", descripcion: "", notas: "Acción adicional de Bestia de prueba." },
      { id: "reac_bestia_bestia_prueba_0_salto_agil", tipoAccion: "reaccion", descripcion: "Esquiva", notas: "Reacción de Bestia de prueba." }
    ]);
    expect(bestia).toEqual(entrada);
    expect(filtrarRasgosFormaSalvaje([], bestia)).toEqual(rasgos);
  });

  describe("1. Reglas Canónicas por Nivel (Límites, VD y Vuelo)", () => {
    it("Nivel 2: 4 formas conocidas, VD máx 1/4, No vuela", () => {
      const reglas = calcularReglasFormaSalvaje(2, false);
      expect(reglas.maxFormasConocidas).toBe(4);
      expect(reglas.vdMaximo).toBe(0.25);
      expect(reglas.puedeVolar).toBe(false);

      expect(esBestiaValidaParaDruida(lobo, 2, false)).toBe(true); // Lobo es VD 1/4
      expect(esBestiaValidaParaDruida(cuervo, 2, false)).toBe(false); // Cuervo vuela, no permitida a nivel 2
    });

    it("Nivel 4: 6 formas conocidas, VD máx 1/2, No vuela", () => {
      const reglas = calcularReglasFormaSalvaje(4, false);
      expect(reglas.maxFormasConocidas).toBe(6);
      expect(reglas.vdMaximo).toBe(0.5);
      expect(reglas.puedeVolar).toBe(false);
    });

    it("Nivel 8: 8 formas conocidas, VD máx 1, Sí vuela", () => {
      const reglas = calcularReglasFormaSalvaje(8, false);
      expect(reglas.maxFormasConocidas).toBe(8);
      expect(reglas.vdMaximo).toBe(1);
      expect(reglas.puedeVolar).toBe(true);

      expect(esBestiaValidaParaDruida(cuervo, 8, false)).toBe(true);
    });

    it("Círculo de la Luna: Escala el VD máx a Nivel/3", () => {
      const reglasNv3 = calcularReglasFormaSalvaje(3, true);
      expect(reglasNv3.vdMaximo).toBe(1); // floor(3/3) = 1

      const reglasNv6 = calcularReglasFormaSalvaje(6, true);
      expect(reglasNv6.vdMaximo).toBe(2); // floor(6/3) = 2
    });
  });

  describe("2. Puntos de Golpe Temporales según Reglas 2024", () => {
    it("Druida base recibe PG temporales iguales a su nivel", () => {
      expect(calcularHpTemporalFormaSalvaje(2, false)).toBe(2);
      expect(calcularHpTemporalFormaSalvaje(5, false)).toBe(5);
    });

    it("Druida Círculo de la Luna recibe 3x su nivel en PG temporales", () => {
      expect(calcularHpTemporalFormaSalvaje(3, true)).toBe(9);
      expect(calcularHpTemporalFormaSalvaje(6, true)).toBe(18);
    });
  });

  describe("3. Estado del Personaje, Adopción de Estadísticas y Combate", () => {
    it("Adopta Fuerza y Destreza de la bestia pero mantiene Sabiduría, Inteligencia y Carisma", () => {
      const store = usarAlmacenDM.getState();
      const idPj = store.crearPersonaje({
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 3,
        caracteristicas: {
          fuerza: 8,
          destreza: 12,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 16,
          carisma: 10
        },
        rasgos: [
          {
            id: "rasgo_forma_salvaje",
            nombre: "Forma salvaje",
            origen: "clase",
            fuente: "PHB 2024",
            tipoAccion: "accion_adicional",
            personalizado: false,
            activo: false,
            notas: "",
            categoriaMecanica: "consumible",
            esActivable: true,
            tieneUsosLimitados: true,
            usosMaximos: 2,
            usosRestantes: 2,
            recuperacion: "descanso_dinamico",
            descripcion: ""
          }
        ]
      });

      // Transformar en Lobo (Lobo tiene FUE 12, DES 15, CA 13)
      store.transformarEnFormaSalvaje(idPj, "m_lobo");

      const pjTransformado = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      expect(pjTransformado.formaSalvaje.formaActivaId).toBe("m_lobo");
      expect(pjTransformado.condicionesActivas).toContain("Forma salvaje");
      expect(pjTransformado.hpTemporal).toBe(3); // Nivel 3 = 3 PG temporales

      // Gasto de 1 uso
      const rasgoActual = pjTransformado.rasgos.find((r) => r.nombre === "Forma salvaje");
      expect(rasgoActual?.usosRestantes).toBe(1);

      // Estadísticas calculadas
      const stats = calcularEstadisticasPersonaje(pjTransformado);
      expect(stats.puntuacionesEfectivas.fuerza).toBe(lobo.caracteristicas.fuerza); // 12 de Lobo
      expect(stats.puntuacionesEfectivas.destreza).toBe(lobo.caracteristicas.destreza); // 15 de Lobo
      expect(stats.puntuacionesEfectivas.sabiduria).toBe(16); // Mantiene druida
      expect(stats.puntuacionesEfectivas.inteligencia).toBe(10); // Mantiene druida

      // CA adoptada
      expect(stats.claseArmadura.total).toBe(lobo.ca);

      // Ataques de la bestia generados en combate
      const ataques = generarListaAtaquesFisicos({
        personajeActivo: pjTransformado,
        statsCalculadas: stats,
        baseDatosObjetos: [],
        caracteristicasArmas: {}
      });

      const ataqueMordisco = ataques.find((a) => a.nombre.includes("Mordisco") || a.subtipo === "Forma Salvaje");
      expect(ataqueMordisco).toBeDefined();

      // Revertir forma
      store.revertirFormaSalvaje(idPj);
      const pjRevertido = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      expect(pjRevertido.formaSalvaje.formaActivaId).toBeNull();
      expect(pjRevertido.condicionesActivas).not.toContain("Forma salvaje");

      const statsRevertidas = calcularEstadisticasPersonaje(pjRevertido);
      expect(statsRevertidas.puntuacionesEfectivas.fuerza).toBe(8);
      expect(statsRevertidas.puntuacionesEfectivas.destreza).toBe(12);
    });

    it("Respeta el límite del pool de formas conocidas al guardarlas", () => {
      const store = usarAlmacenDM.getState();
      const idPj = store.crearPersonaje({
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 2 // Límite de 4 formas conocidas
      });

      store.establecerFormasConocidasDruida(idPj, [
        "m_lobo",
        "m_rata",
        "m_arana",
        "m_caballo_de_monta",
        "m_vaca" // 5 formas: debe recortar a 4
      ]);

      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      expect(pj.formaSalvaje.formasConocidasIds).toHaveLength(4);
      expect(pj.formaSalvaje.formasConocidasIds).toEqual([
        "m_lobo",
        "m_rata",
        "m_arana",
        "m_caballo_de_monta"
      ]);
    });
  });

  describe("4. Reglas Canónicas Avanzadas PHB 2024 (Constitución, Salvaciones, Velocidades, Sentidos y Magia)", () => {
    it("Reemplaza FUE, DES y CON, y usa el modificador superior en salvaciones y habilidades de la bestia", () => {
      const store = usarAlmacenDM.getState();
      const idPj = store.crearPersonaje({
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 3,
        caracteristicas: {
          fuerza: 8,
          destreza: 10,
          constitucion: 12,
          inteligencia: 10,
          sabiduria: 16,
          carisma: 10
        },
        gradosHabilidades: {
          ...PERSONAJE_POR_DEFECTO.gradosHabilidades,
          percepcion: "competente",
          sigilo: "ninguna"
        }
      });

      // Lobo: FUE 14, DES 15, CON 12. Habilidades: Percepción +3, Sigilo +4.
      store.transformarEnFormaSalvaje(idPj, "m_lobo");
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      const stats = calcularEstadisticasPersonaje(pj);

      // Adopta características físicas
      expect(stats.puntuacionesEfectivas.fuerza).toBe(lobo.caracteristicas.fuerza);
      expect(stats.puntuacionesEfectivas.destreza).toBe(lobo.caracteristicas.destreza);
      expect(stats.puntuacionesEfectivas.constitucion).toBe(lobo.caracteristicas.constitucion);

      // Si la bestia tiene mayor bono en sigilo (+4), lo adopta
      expect(stats.habilidades.sigilo).toBeGreaterThanOrEqual(4);
    });

    it("Adopta la velocidad al caminar y modos de movimiento de la bestia (sin vuelo hasta nv 8)", () => {
      const store = usarAlmacenDM.getState();
      // Druida nivel 4 (no puede volar todavía)
      const idPj = store.crearPersonaje({
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 4,
        velocidad: "30 pies"
      });

      // Lobo tiene velocidad 40 pies
      store.transformarEnFormaSalvaje(idPj, "m_lobo");
      let pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      let velocidades = obtenerVelocidadesEfectivas(pj);
      expect(velocidades.caminar).toBe(40);

      // Si se transforma en cuervo pero es nivel 4, no puede volar
      store.revertirFormaSalvaje(idPj);
      store.transformarEnFormaSalvaje(idPj, "m_cuervo");
      pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      velocidades = obtenerVelocidadesEfectivas(pj);
      expect(velocidades.volar).toBeUndefined();

      // Subimos a nivel 8: ahora sí puede volar con la velocidad del cuervo (50 pies)
      pj.nivel = 8;
      velocidades = obtenerVelocidadesEfectivas(pj);
      expect(velocidades.volar).toBe(50);
    });

    it("Adopta sentidos de la bestia (visión en la oscuridad y percepción pasiva)", () => {
      const store = usarAlmacenDM.getState();
      const idPj = store.crearPersonaje({
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 3,
        sentidos: "visión en la oscuridad 0 pies, percepción pasiva 10"
      });

      // Lobo no tiene visión en la oscuridad pero tiene percepción pasiva 13
      store.transformarEnFormaSalvaje(idPj, "m_lobo");
      const pj = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj)!;
      const sentidos = obtenerSentidosEfectivos(pj);
      expect(sentidos.percepcionPasiva).toBeGreaterThanOrEqual(13);
      expect(sentidos.visionOscuridad).toBe(60);
    });

    it("Círculo de la Luna nivel 6+ imbuye Resplandor Lunar (daño Radiante)", () => {
      const pjLuna: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        subclase: "Círculo de la Luna",
        nivel: 6,
        formaSalvaje: {
          formasConocidasIds: ["m_lobo"],
          formaActivaId: "m_lobo",
          hpTemporalAlTransformar: 18
        },
        condicionesActivas: ["Forma salvaje"]
      };

      const stats = calcularEstadisticasPersonaje(pjLuna);
      const ataques = generarListaAtaquesFisicos({
        personajeActivo: pjLuna,
        statsCalculadas: stats,
        baseDatosObjetos: [],
        caracteristicasArmas: {}
      });

      const mordisco = ataques.find((a) => a.nombre.includes("Mordisco"));
      expect(mordisco).toBeDefined();
      expect(mordisco?.propiedades).toContain("Resplandor lunar (Radiante)");
      expect(mordisco?.tipoDano).toContain("radiante");
      expect(mordisco?.esMagico).toBe(true);
    });

    it("Restricción canónica de conjuros: Druida base bloqueado, Luna permite su lista, Nv 18 desbloquea", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 5,
        formaSalvaje: {
          formasConocidasIds: ["m_lobo"],
          formaActivaId: "m_lobo",
          hpTemporalAlTransformar: 5
        },
        condicionesActivas: ["Forma salvaje"]
      };

      // Druida base no puede lanzar conjuros en forma salvaje
      expect(puedeLanzarConjuroEnFormaSalvaje(pjBase, "Curar heridas")).toBe(false);
      expect(puedeLanzarConjuroEnFormaSalvaje(pjBase, "Rayo lunar")).toBe(false);

      // Círculo de la Luna sí puede lanzar los conjuros preparados de su subclase
      const pjLuna: PersonajeJugador = {
        ...pjBase,
        subclase: "Círculo de la Luna"
      };
      expect(puedeLanzarConjuroEnFormaSalvaje(pjLuna, "Curar heridas")).toBe(true);
      expect(puedeLanzarConjuroEnFormaSalvaje(pjLuna, "Rayo lunar")).toBe(true);
      expect(puedeLanzarConjuroEnFormaSalvaje(pjLuna, "Bola de fuego")).toBe(false);

      // Druida Nivel 18 (Bestia lanzadora) puede lanzar conjuros en forma salvaje
      const pjArchidruida: PersonajeJugador = {
        ...pjBase,
        nivel: 18
      };
      expect(puedeLanzarConjuroEnFormaSalvaje(pjArchidruida, "Cualquier conjuro")).toBe(true);
    });

    it("Condición Incapacitado finaliza la Forma Salvaje automáticamente", () => {
      const pjTransformado: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 3,
        formaSalvaje: {
          formasConocidasIds: ["m_lobo"],
          formaActivaId: "m_lobo",
          hpTemporalAlTransformar: 3
        },
        condicionesActivas: ["Forma salvaje", "Incapacitado"]
      };

      // Al estar incapacitado, obtenerBestiaFormaActiva devuelve null
      expect(obtenerBestiaFormaActiva(pjTransformado)).toBeNull();
    });

    it("No se pueden usar armas ni armadura: se ocultan armas/ataques humanoides y solo quedan los ataques de la bestia", () => {
      const pjEquipado: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        nivel: 5, // PB = +3
        caracteristicas: {
          fuerza: 10,
          destreza: 14,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 16,
          carisma: 10
        },
        inventario: [
          {
            idInstancia: "arma-1",
            nombre: "Cimitarra",
            categoria: "armas",
            equipado: true,
            cantidad: 1
          },
          {
            idInstancia: "arma-2",
            nombre: "Arco corto",
            categoria: "armas",
            equipado: true,
            cantidad: 1
          },
          {
            idInstancia: "armadura-1",
            nombre: "Cota de malla", // Armadura pesada con desventaja en sigilo
            categoria: "armaduras",
            equipado: true,
            caBase: 16,
            desventajaSigilo: true,
            cantidad: 1
          },
          {
            idInstancia: "escudo-1",
            nombre: "Escudo",
            categoria: "escudos",
            equipado: true,
            caBase: 2,
            cantidad: 1
          }
        ] as unknown as ObjetoInventario[],
        formaSalvaje: {
          formasConocidasIds: ["m_lobo"],
          formaActivaId: "m_lobo",
          hpTemporalAlTransformar: 5
        },
        condicionesActivas: ["Forma salvaje"]
      };

      const stats = calcularEstadisticasPersonaje(pjEquipado);

      // CA usa puramente la bestia (Lobo = 12), ignora la cota de malla y el escudo
      expect(stats.claseArmadura.total).toBe(12);
      expect(stats.claseArmadura.base).toBe(12);
      expect(stats.claseArmadura.bonoEscudo).toBe(0);
      expect(stats.claseArmadura.tipoArmadura).toBe("Sin Armadura");
      expect(stats.claseArmadura.armaduraEquipadaNombre).toBeNull();
      expect(stats.claseArmadura.escudoEquipadoNombre).toBeNull();
      // No sufre desventaja en sigilo por armadura pesada humanoide
      expect(stats.desventajaSigiloArmadura).toBe(false);
      // No sufre penalización por falta de competencia
      expect(stats.penalizacionArmadura.sinCompetencia).toBe(false);

      // Generación de ataques
      const ataques = generarListaAtaquesFisicos({
        personajeActivo: pjEquipado,
        statsCalculadas: stats,
        baseDatosObjetos: [],
        caracteristicasArmas: {}
      });

      // Solo contiene los ataques de la bestia (Mordisco)
      expect(ataques).toHaveLength(1);
      const mordisco = ataques[0];
      expect(mordisco.nombre).toBe("Mordisco (Lobo)");
      expect(mordisco.subtipo).toBe("Forma Salvaje");

      // No contiene armas equipadas ni ataques humanoides
      expect(ataques.some((a) => a.nombre.includes("Cimitarra"))).toBe(false);
      expect(ataques.some((a) => a.nombre.includes("Arco corto"))).toBe(false);
      expect(ataques.some((a) => a.nombre.includes("Improvisada"))).toBe(false);
      expect(ataques.some((a) => a.nombre.includes("Desarmado"))).toBe(false);

      // Escalado D&D 2024: PB = 3, FUE del lobo = 14 (mod +2) -> Bono impacto = +5 (mayor que el +4 del compendio)
      expect(mordisco.bonoAtaque).toBe(5);
      expect(mordisco.dadoDano).toBe("1d6 + 2");

      // Rasgos tácticos de la bestia integrados en el ataque
      expect(mordisco.propiedades).toContain("Atacar en manada (Ventaja con aliado a 5 ft)");
      expect(mordisco.propiedades).toContain("Efecto: Derribo");
      expect(mordisco.notas).toContain("Atacar en manada");
    });

    it("Círculo de la Luna: la CA en Forma salvaje es igual a la CA de la bestia + mod de Sabiduría (sin sumar nada más)", () => {
      const pjLuna: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        clase: "Druida",
        subclase: "Círculo de la Luna",
        nivel: 3,
        caracteristicas: {
          fuerza: 10,
          destreza: 12,
          constitucion: 14,
          inteligencia: 10,
          sabiduria: 16, // mod +3
          carisma: 10
        },
        formaSalvaje: {
          formasConocidasIds: ["m_lobo"],
          formaActivaId: "m_lobo",
          hpTemporalAlTransformar: 9
        },
        condicionesActivas: ["Forma salvaje"]
      };

      const stats = calcularEstadisticasPersonaje(pjLuna);
      // Lobo tiene CA 12. En Círculo de la Luna: 12 + 3 (SAB) = 15.
      expect(stats.claseArmadura.total).toBe(15);
      expect(stats.claseArmadura.base).toBe(15);
      expect(stats.claseArmadura.bonoEscudo).toBe(0);
      expect(stats.claseArmadura.bonosMagicos).toBe(0);
      expect(stats.claseArmadura.desglose).toContain("Lobo 12");
      expect(stats.claseArmadura.desglose).toContain("SAB +3");
    });

    it("Filtrado estricto de rasgos: solo conserva rasgos de la bestia + rasgos de Druida", () => {
      const rasgosPersonaje = [
        {
          id: "rasgo_druida_forma_salvaje",
          nombre: "Forma salvaje",
          origen: "clase",
          fuente: "Druida PHB 2024",
          tipoAccion: "accion_adicional",
          activo: true,
          tieneUsosLimitados: true,
          recuperacion: "descanso_dinamico"
        },
        {
          id: "rasgo_druida_conjuros",
          nombre: "Lanzamiento de conjuros",
          origen: "clase",
          fuente: "Druida PHB 2024",
          tipoAccion: "pasivo",
          activo: true,
          tieneUsosLimitados: false,
          recuperacion: "ninguno"
        },
        {
          id: "rasgo_especie_elfo",
          nombre: "Linaje élfico",
          origen: "especie",
          fuente: "Especie: Elfo",
          tipoAccion: "pasivo",
          activo: true,
          tieneUsosLimitados: false,
          recuperacion: "ninguno"
        },
        {
          id: "rasgo_dote_alerta",
          nombre: "Alerta",
          origen: "dote",
          fuente: "Dote general",
          tipoAccion: "pasivo",
          activo: true,
          tieneUsosLimitados: false,
          recuperacion: "ninguno"
        },
        {
          id: "rasgo_barbaro_furia",
          nombre: "Furia",
          origen: "clase",
          fuente: "Bárbaro",
          tipoAccion: "accion_adicional",
          activo: false,
          tieneUsosLimitados: true,
          recuperacion: "descanso_largo"
        }
      ] as unknown as RasgoPersonaje[];

      expect(extraerRasgosBestia(lobo).length).toBeGreaterThan(0);
      const rasgosFiltrados = filtrarRasgosFormaSalvaje(rasgosPersonaje, lobo);

      // Debe contener el rasgo de la bestia (Atacar en manada)
      const tieneManada = rasgosFiltrados.some((r) => r.nombre.includes("Atacar en manada"));
      expect(tieneManada).toBe(true);

      // Debe contener los rasgos de Druida
      expect(rasgosFiltrados.some((r) => r.nombre === "Forma salvaje")).toBe(true);
      expect(rasgosFiltrados.some((r) => r.nombre === "Lanzamiento de conjuros")).toBe(true);

      // No debe contener especie, dotes ni otras clases
      expect(rasgosFiltrados.some((r) => r.nombre === "Linaje élfico")).toBe(false);
      expect(rasgosFiltrados.some((r) => r.nombre === "Alerta")).toBe(false);
      expect(rasgosFiltrados.some((r) => r.nombre === "Furia")).toBe(false);
    });
  });
});
