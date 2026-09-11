import { describe, it, expect, beforeEach } from "vitest";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import {
  obtenerDadoInspiracionBardica,
  calcularDefensaSinArmaduraRasgos,
  evaluarAtaqueDesarmadoEspecial,
  obtenerCompetenciasExtraRasgos,
  obtenerConjurosOtorgadosPorRasgos,
  tieneConjuroGratuitoActivo,
  obtenerCompetenciasEfectivasTexto,
  obtenerMaestriasArmasAprendidas,
  personajeTieneMaestriaArma
} from "@/servicios/evaluadorEfectosRasgos";
import { EFECTOS_PREDEFINIDOS } from "@/utiles/datosIniciales";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { aplicarBuildClaseAPersonaje } from "@/servicios/gestorClases";
import { aplicarResultadoHpTemporalEnEstado } from "@/utiles/lanzadorDados";
import { prepararLanzamiento, type SolicitudLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import type { PersonajeJugador, RasgoPersonaje, ObjetoInventario, HechizoBase } from "@/tipos";

function crearRasgoMock(parcial: Partial<RasgoPersonaje> & { id: string; nombre: string }): RasgoPersonaje {
  return {
    fuente: "General",
    origen: "clase",
    tipoAccion: "pasivo",
    tieneUsosLimitados: false,
    recuperacion: "ninguno",
    personalizado: false,
    activo: true,
    descripcion: "",
    notas: "",
    ...parcial
  };
}

function crearObjetoMock(parcial: Partial<ObjetoInventario> & { idInstancia: string; idObjeto: string; nombre: string }): ObjetoInventario {
  return {
    cantidad: 1,
    equipado: false,
    sintonizado: false,
    notas: "",
    pesoLb: 0,
    tipoPrincipal: "Equipo de Aventuras",
    esMagico: false,
    rareza: "Común",
    equipable: false,
    sintonizacionRequerida: false,
    ...parcial
  };
}

describe("D&D 5.5e - Bardo, Subclases y Hotfix Bárbaro", () => {
  beforeEach(() => {
    usarAlmacenDM.setState({
      personajes: [],
      idPersonajeActivo: null
    });
  });

  describe("Hotfix Bárbaro: Furia Persistente", () => {
    it("al activar Furia Persistente restaura los usos de Furia y se auto-desactiva inmediatamente", () => {
      const pjBarbaro: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-barbaro-15",
        nombre: "Conan",
        clase: "Bárbaro",
        nivel: 15,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_cls_barbaro_furia",
            nombre: "Furia",
            descripcion: "Entras en furia primigenia",
            tipoAccion: "accion_adicional",
            tieneUsosLimitados: true,
            usosMaximos: 5,
            usosRestantes: 0,
            recuperacion: "descanso_largo",
            esActivable: true,
            activo: false
          }),
          crearRasgoMock({
            id: "rasgo_cls_barbaro_furia_persistente",
            nombre: "Furia persistente",
            descripcion: "Restaura los usos de furia",
            tipoAccion: "especial",
            tieneUsosLimitados: true,
            usosMaximos: 1,
            usosRestantes: 1,
            recuperacion: "descanso_largo",
            esActivable: true,
            autoDesactivar: true,
            activo: false
          })
        ]
      };

      usarAlmacenDM.setState({
        personajes: [pjBarbaro],
        idPersonajeActivo: "pj-barbaro-15"
      });

      const { alternarActivoRasgo } = usarAlmacenDM.getState();
      alternarActivoRasgo("pj-barbaro-15", "rasgo_cls_barbaro_furia_persistente");

      const pjActualizado = usarAlmacenDM.getState().personajes[0];
      const rasgoFuria = pjActualizado.rasgos?.find((r) => r.id === "rasgo_cls_barbaro_furia");
      const rasgoPersistente = pjActualizado.rasgos?.find((r) => r.id === "rasgo_cls_barbaro_furia_persistente");

      // Furia debe haber recuperado sus usos máximos
      expect(rasgoFuria?.usosRestantes).toBe(5);
      // Furia persistente debe haber consumido 1 uso
      expect(rasgoPersistente?.usosRestantes).toBe(0);
      // Furia persistente debe haberse auto-desactivado inmediatamente (activo: false)
      expect(rasgoPersistente?.activo).toBe(false);
    });
  });

  describe("Bardo: Tabla de Inspiración Bárdica y Escalado de Dados", () => {
    it("escala el dado de inspiración según los niveles oficiales D&D 5.5e", () => {
      expect(obtenerDadoInspiracionBardica(1)).toBe("1d6");
      expect(obtenerDadoInspiracionBardica(4)).toBe("1d6");
      expect(obtenerDadoInspiracionBardica(5)).toBe("1d8");
      expect(obtenerDadoInspiracionBardica(9)).toBe("1d8");
      expect(obtenerDadoInspiracionBardica(10)).toBe("1d10");
      expect(obtenerDadoInspiracionBardica(14)).toBe("1d10");
      expect(obtenerDadoInspiracionBardica(15)).toBe("1d12");
      expect(obtenerDadoInspiracionBardica(20)).toBe("1d12");
    });

    it("calcula los usos de Inspiración bárdica a partir del modificador de Carisma", () => {
      const pjBardo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-bardo-1",
        nombre: "Jaskier",
        clase: "Bardo",
        clases: [{ nombre: "Bardo", subclase: "", nivel: 3 }],
        nivel: 3,
        caracteristicas: {
          ...PERSONAJE_POR_DEFECTO.caracteristicas,
          carisma: 16 // Modificador +3
        }
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pjBardo);
      const rasgoInspiracion = rasgosSincronizados.find((r) => r.nombre.includes("Inspiración bárdica"));

      expect(rasgoInspiracion).toBeDefined();
      expect(rasgoInspiracion?.usosMaximos).toBe(3);
      expect(rasgoInspiracion?.formulaDados).toBe("1d6");
    });

    it("garantiza al menos 1 uso de Inspiración bárdica si Carisma es bajo", () => {
      const pjBardo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-bardo-bajo",
        nombre: "Bardo Torpe",
        clase: "Bardo",
        clases: [{ nombre: "Bardo", subclase: "", nivel: 1 }],
        nivel: 1,
        caracteristicas: {
          ...PERSONAJE_POR_DEFECTO.caracteristicas,
          carisma: 8 // Modificador -1
        }
      };

      const rasgosSincronizados = sincronizarRasgosAutomaticos(pjBardo);
      const rasgoInspiracion = rasgosSincronizados.find((r) => r.nombre.includes("Inspiración bárdica"));

      expect(rasgoInspiracion?.usosMaximos).toBe(1);
    });

    it("actualiza dinámicamente en caliente los usos máximos de Inspiración bárdica al modificar Carisma en el almacén", () => {
      const idPj = "pj-bardo-caliente";
      const pjInicial: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: idPj,
        nombre: "Bardo Dinámico",
        clase: "Bardo",
        nivel: 1,
        caracteristicas: {
          ...PERSONAJE_POR_DEFECTO.caracteristicas,
          carisma: 14 // Modificador +2 -> 2 usos
        },
        rasgos: [
          crearRasgoMock({
            id: "rasgo_cls_bardo_inspiracion_bardica",
            nombre: "Inspiración bárdica",
            descripcion: "Modificador por carisma",
            tieneUsosLimitados: true,
            usosMaximos: 2,
            usosRestantes: 2
          })
        ]
      };

      usarAlmacenDM.setState({
        personajes: [pjInicial],
        idPersonajeActivo: idPj
      });

      const { modificarCaracteristicaBasePersonaje } = usarAlmacenDM.getState();
      // Aumentar Carisma a 18 (Modificador +4)
      modificarCaracteristicaBasePersonaje(idPj, "carisma", 18);

      const pjSubido = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      const rasgoSubido = pjSubido?.rasgos?.find((r) => r.id === "rasgo_cls_bardo_inspiracion_bardica");
      expect(rasgoSubido?.usosMaximos).toBe(4);
      expect(rasgoSubido?.usosRestantes).toBe(4);

      // Reducir Carisma a 8 (Modificador -1 -> mínimo 1 uso)
      modificarCaracteristicaBasePersonaje(idPj, "carisma", 8);
      const pjBajado = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      const rasgoBajado = pjBajado?.rasgos?.find((r) => r.id === "rasgo_cls_bardo_inspiracion_bardica");
      expect(rasgoBajado?.usosMaximos).toBe(1);
      expect(rasgoBajado?.usosRestantes).toBe(1);
    });
  });

  describe("Bardo: Aprendiz de Mucho (Jack of All Trades)", () => {
    it("suma la mitad del bono de competencia a habilidades sin competencia", () => {
      const pjBardo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-aprendiz",
        nombre: "Bardo Aprendiz",
        clase: "Bardo",
        nivel: 5, // Bono de competencia = +3, mitad redondeada abajo = +1
        caracteristicas: {
          fuerza: 10, // mod 0
          destreza: 14, // mod +2
          constitucion: 10,
          inteligencia: 10,
          sabiduria: 10,
          carisma: 16
        },
        gradosHabilidades: {
          ...PERSONAJE_POR_DEFECTO.gradosHabilidades,
          acrobacias: "competente", // +2 (DES) + 3 (comp) = +5
          atletismo: "ninguna",     // 0 (FUE) + 1 (aprendiz) = +1
          sigilo: "ninguna"        // +2 (DES) + 1 (aprendiz) = +3
        },
        rasgos: [
          crearRasgoMock({
            id: "rasgo_aprendiz",
            nombre: "Aprendiz de mucho",
            descripcion: "Suma la mitad de competencia",
            efectos: [
              {
                id: "ef_aprendiz",
                tipo: "medio_bono_habilidades",
                objetivo: "habilidades_sin_competencia",
                valor: "mitad_competencia",
                activo: true
              }
            ]
          })
        ]
      };

      const stats = calcularEstadisticasPersonaje(pjBardo);

      // Acrobacias (competente): mod 2 + comp 3 = 5
      expect(stats.habilidades.acrobacias).toBe(5);
      // Atletismo (no competente): mod 0 + medio bono 1 = 1
      expect(stats.habilidades.atletismo).toBe(1);
      // Sigilo (no competente): mod 2 + medio bono 1 = 3
      expect(stats.habilidades.sigilo).toBe(3);

      // Comprobación de gradosHabilidadesEfectivos
      expect(stats.gradosHabilidadesEfectivos.acrobacias).toBe("competente");
      expect(stats.gradosHabilidadesEfectivos.atletismo).toBe("medio");
      expect(stats.gradosHabilidadesEfectivos.sigilo).toBe("medio");
    });

    it("asigna automáticamente grado 'medio' a habilidades sin competencia al aplicar build de Bardo nivel 2", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-build-bardo",
        nombre: "Bardo Novato",
        clase: "Bardo",
        nivel: 1,
        gradosHabilidades: {
          ...PERSONAJE_POR_DEFECTO.gradosHabilidades,
          persuasion: "competente",
          historia: "pericia",
          atletismo: "ninguna",
          sigilo: "ninguna"
        }
      };

      // Subir a Bardo Nivel 2
      const pjNivel2 = aplicarBuildClaseAPersonaje(pjBase, "Bardo", 2, undefined, {
        sincronizarRasgos: true
      });

      // Debe preservar competente y pericia
      expect(pjNivel2.gradosHabilidades.persuasion).toBe("competente");
      expect(pjNivel2.gradosHabilidades.historia).toBe("pericia");
      // Debe haber asignado grado 'medio' a las no competentes
      expect(pjNivel2.gradosHabilidades.atletismo).toBe("medio");
      expect(pjNivel2.gradosHabilidades.sigilo).toBe("medio");
    });

    it("respeta 'medio' como piso mínimo al ciclar habilidades de un bardo con Aprendiz de mucho", () => {
      const almacen = usarAlmacenDM.getState();
      const idPj = almacen.crearPersonaje({
        nombre: "Bardo Ciclo",
        clase: "Bardo",
        nivel: 3,
        gradosHabilidades: {
          ...PERSONAJE_POR_DEFECTO.gradosHabilidades,
          atletismo: "pericia"
        },
        rasgos: [
          crearRasgoMock({
            id: "rasgo_aprendiz",
            nombre: "Aprendiz de mucho",
            activo: true
          })
        ]
      });

      // Ciclar desde 'pericia' en un bardo con Aprendiz de mucho
      almacen.ciclarGradoHabilidadPersonaje(idPj, "atletismo");

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      expect(pjActualizado?.gradosHabilidades.atletismo).toBe("medio");
    });
  });

  describe("Colegio de la Danza", () => {
    it("calcula CA base 10 + DES + CAR sin armadura ni escudo", () => {
      const pjDanza: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-danza",
        nombre: "Bailarín",
        clase: "Bardo",
        subclase: "Colegio de la Danza",
        nivel: 3,
        caracteristicas: {
          ...PERSONAJE_POR_DEFECTO.caracteristicas,
          destreza: 16, // +3
          carisma: 16   // +3
        },
        inventario: [], // Sin armadura ni escudo
        rasgos: [
          crearRasgoMock({
            id: "rasgo_juego_pies",
            nombre: "Juego de pies deslumbrante",
            descripcion: "Defensa sin armadura",
            origen: "subclase",
            efectos: [
              {
                id: "ef_ca_danza",
                tipo: "modificador_ca",
                objetivo: "defensa_sin_armadura",
                valor: "carisma",
                permiteEscudo: false,
                activo: true
              }
            ]
          })
        ]
      };

      const defSinArmadura = calcularDefensaSinArmaduraRasgos(pjDanza, {
        fuerza: 0,
        destreza: 3,
        constitucion: 0,
        inteligencia: 0,
        sabiduria: 0,
        carisma: 3
      });

      expect(defSinArmadura?.aplica).toBe(true);
      expect(defSinArmadura?.caracteristicaExtra).toBe("carisma");
      expect(defSinArmadura?.bonoExtra).toBe(3);

      const stats = calcularEstadisticasPersonaje(pjDanza);
      // CA = 10 + 3 (DES) + 3 (CAR) = 16
      expect(stats.claseArmadura.total).toBe(16);
    });

    it("no aplica Defensa sin armadura de la Danza si tiene escudo equipado", () => {
      const pjDanzaConEscudo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-danza-escudo",
        nombre: "Bailarín con Escudo",
        clase: "Bardo",
        subclase: "Colegio de la Danza",
        nivel: 3,
        caracteristicas: {
          ...PERSONAJE_POR_DEFECTO.caracteristicas,
          destreza: 16,
          carisma: 16
        },
        inventario: [
          crearObjetoMock({
            idInstancia: "escudo-1",
            idObjeto: "escudo",
            nombre: "Escudo",
            tipoPrincipal: "Armadura",
            equipado: true,
            pesoLb: 6
          })
        ],
        rasgos: [
          crearRasgoMock({
            id: "rasgo_juego_pies",
            nombre: "Juego de pies deslumbrante",
            descripcion: "Defensa sin armadura",
            origen: "subclase",
            efectos: [
              {
                id: "ef_ca_danza",
                tipo: "modificador_ca",
                objetivo: "defensa_sin_armadura",
                valor: "carisma",
                permiteEscudo: false,
                activo: true
              }
            ]
          })
        ]
      };

      const defSinArmadura = calcularDefensaSinArmaduraRasgos(pjDanzaConEscudo, {
        fuerza: 0,
        destreza: 3,
        constitucion: 0,
        inteligencia: 0,
        sabiduria: 0,
        carisma: 3
      });

      // Debe ser null porque permiteEscudo es false y tiene escudo
      expect(defSinArmadura).toBeNull();
    });

    it("evalúa Golpe sin armas especial con Destreza y dado de Inspiración bárdica", () => {
      const pjDanza: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-danza-ataque",
        nombre: "Bailarín Ofensivo",
        clase: "Bardo",
        subclase: "Colegio de la Danza",
        nivel: 5, // A nivel 5 el dado es 1d8
        inventario: [],
        rasgos: [
          crearRasgoMock({
            id: "rasgo_juego_pies",
            nombre: "Juego de pies deslumbrante",
            descripcion: "Daño bárdico",
            origen: "subclase",
            efectos: [
              {
                id: "ef_ataque_danza",
                tipo: "ataque_desarmado",
                objetivo: "destreza",
                valor: "dado_inspiracion",
                condicion: "sin_armadura_ni_escudo",
                activo: true
              }
            ]
          })
        ]
      };

      const ataqueEsp = evaluarAtaqueDesarmadoEspecial(pjDanza);

      expect(ataqueEsp.aplica).toBe(true);
      expect(ataqueEsp.caracteristicaSugerida).toBe("destreza");
      expect(ataqueEsp.dadoDanoBase).toBe("1d8");
    });
  });

  describe("Colegio del Valor: Entrenamiento Marcial", () => {
    it("otorga competencias en armas marciales, armaduras medias y escudos", () => {
      const pjValor: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-valor",
        nombre: "Skald",
        clase: "Bardo",
        subclase: "Colegio del Valor",
        nivel: 3,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_entrenamiento_marcial",
            nombre: "Entrenamiento marcial",
            descripcion: "Competencia con armas marciales y armaduras medias",
            origen: "subclase",
            efectos: [
              { id: "ef_armas", tipo: "competencia", objetivo: "armas_marciales", valor: "marciales", activo: true },
              { id: "ef_armaduras", tipo: "competencia", objetivo: "armaduras_medias", valor: "medias", activo: true },
              { id: "ef_escudos", tipo: "competencia", objetivo: "escudos", valor: "escudos", activo: true }
            ]
          })
        ]
      };

      const compExtra = obtenerCompetenciasExtraRasgos(pjValor);

      expect(compExtra.armasGrupos).toContain("marciales");
      expect(compExtra.armadurasGrupos).toContain("medias");
      expect(compExtra.armadurasGrupos).toContain("escudos");
    });
  });

  describe("Consumo de Usos Delegado (gastarDePadre)", () => {
    it("al gastar uso en un rasgo con gastarDePadre, consume del rasgo Inspiración bárdica", () => {
      const pjBardo: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-bardo-hijo",
        nombre: "Bardo Glamour",
        clase: "Bardo",
        subclase: "Colegio del Glamour",
        nivel: 3,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_cls_bardo_inspiracion_bardica",
            nombre: "Inspiración bárdica",
            descripcion: "Reserva de inspiración",
            tipoAccion: "accion_adicional",
            tieneUsosLimitados: true,
            usosMaximos: 4,
            usosRestantes: 4,
            recuperacion: "descanso_largo"
          }),
          crearRasgoMock({
            id: "rasgo_manto_inspiracion",
            nombre: "Manto de inspiración",
            descripcion: "Usa 1 inspiración bárdica",
            origen: "subclase",
            tipoAccion: "accion_adicional",
            gastarDePadre: true,
            heredarDadosPadre: true
          })
        ]
      };

      usarAlmacenDM.setState({
        personajes: [pjBardo],
        idPersonajeActivo: "pj-bardo-hijo"
      });

      const { gastarUsoRasgoPersonaje } = usarAlmacenDM.getState();
      // Gastar uso del rasgo hijo
      gastarUsoRasgoPersonaje("pj-bardo-hijo", "rasgo_manto_inspiracion");

      const pjActualizado = usarAlmacenDM.getState().personajes[0];
      const rasgoPadre = pjActualizado.rasgos?.find((r) => r.id === "rasgo_cls_bardo_inspiracion_bardica");

      // La Inspiración bárdica (padre) debe haberse decrementado de 4 a 3
      expect(rasgoPadre?.usosRestantes).toBe(3);
    });
  });

  describe("Colegio del Glamour: Manto de Inspiración y Manto de Majestad", () => {
    it("aplica el doble del resultado de dados como HP temporal al personaje activo", () => {
      const idPj = "pj-glamour-hp";
      const pjGlamour: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: idPj,
        nombre: "Bardo Glamoroso",
        clase: "Bardo",
        subclase: "Colegio del Glamour",
        nivel: 3,
        hpTemporal: 0
      };

      usarAlmacenDM.setState({
        personajes: [pjGlamour],
        idPersonajeActivo: idPj
      });

      // Simular tirada de dado de inspiración (resultado 4) -> Manto de Inspiración otorga 2 * 4 = 8 HP temporal
      aplicarResultadoHpTemporalEnEstado(idPj, 8);

      const pjActualizado = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      expect(pjActualizado?.hpTemporal).toBe(8);

      // Regla D&D: Si ya tiene 8 y recibe 5, se mantiene 8 (el mayor)
      aplicarResultadoHpTemporalEnEstado(idPj, 5);
      const pjSinReducir = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      expect(pjSinReducir?.hpTemporal).toBe(8);

      // Si recibe 12, se actualiza a 12
      aplicarResultadoHpTemporalEnEstado(idPj, 12);
      const pjAumentado = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      expect(pjAumentado?.hpTemporal).toBe(12);
    });

    it("permite lanzar Orden imperiosa de forma gratuita cuando Manto de Majestad está activo", () => {
      const pjManto: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-manto-majestad",
        nombre: "Bardo Majestuoso",
        clase: "Bardo",
        subclase: "Colegio del Glamour",
        nivel: 6,
        condicionesActivas: ["Manto de Majestad (Mantle of Majesty)"],
        espaciosConjuroMaximos: { "1": 4 },
        espaciosConjuroGastados: { "1": 0 }
      };

      // 1. Validar función pura
      const esGratis = tieneConjuroGratuitoActivo(pjManto, "Orden imperiosa");
      expect(esGratis).toBe(true);

      // 2. Validar que otro conjuro NO sea gratis
      const otroGratis = tieneConjuroGratuitoActivo(pjManto, "Curar heridas");
      expect(otroGratis).toBe(false);

      // 3. Preparar lanzamiento y comprobar que el gasto es 'ninguno'
      const hechizoOrden: HechizoBase = {
        id: "hechizo_orden_imperiosa",
        nombre: "Orden imperiosa",
        nivel: 1,
        escuela: "Encantamiento",
        tiempoLanzamiento: "1 acción adicional",
        alcance: "60 pies",
        componentesSeleccionados: { verbal: true, somatico: false, material: false },
        duracion: "1 asalto",
        descripcion: "Das una orden de una palabra a una criatura..."
      };

      const solicitud: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: hechizoOrden,
        nivelLanzamiento: 1
      };

      const preparado = prepararLanzamiento(solicitud, {
        espaciosConjuroMaximos: { "1": 4 },
        conjurosGratuitosActivos: ["Orden imperiosa"]
      });

      expect(preparado.gasto.tipo).toBe("ninguno");
    });
  });

  describe("Colegio del Valor: Sincronización y Visualización de Competencias", () => {
    it("incluye Armas Marciales, Armaduras Medias y Escudos en competenciasEfectivas y en el build aplicado", () => {
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-valor-build",
        nombre: "Guerrero Bardo",
        clase: "Bardo",
        nivel: 1,
        competenciasArmas: "Armas Sencillas",
        competenciasArmaduras: "Armaduras Ligeras"
      };

      // Aplicar build de Colegio del Valor Nivel 3
      const pjValor = aplicarBuildClaseAPersonaje(pjBase, "Bardo", 3, "Colegio del Valor", {
        sincronizarRasgos: true,
        sobrescribirCompetenciasEquipo: true
      });

      // Comprobar competencias persistidas en el personaje
      expect(pjValor.competenciasArmas).toContain("Armas Marciales");
      expect(pjValor.competenciasArmaduras).toContain("Armaduras Medias");
      expect(pjValor.competenciasArmaduras).toContain("Escudos");
      expect(pjValor.competenciasArmadurasGrupos).toContain("medias");
      expect(pjValor.competenciasArmadurasGrupos).toContain("escudos");

      // Comprobar llamada directa a la función pura
      const compTextoDirecto = obtenerCompetenciasEfectivasTexto(pjValor);
      expect(compTextoDirecto.armasTexto).toContain("Armas Marciales");
      expect(compTextoDirecto.armadurasTexto).toContain("Armaduras Medias");
      expect(compTextoDirecto.armadurasTexto).toContain("Escudos");

      // Comprobar competenciasEfectivas en estadísticas calculadas
      const stats = calcularEstadisticasPersonaje(pjValor);
      expect(stats.competenciasEfectivas.armasTexto).toContain("Armas Marciales");
      expect(stats.competenciasEfectivas.armadurasTexto).toContain("Armaduras Medias");
      expect(stats.competenciasEfectivas.armadurasTexto).toContain("Escudos");
    });
  });

  describe("Nivel 20: Palabras de Creación", () => {
    it("obtiene siempre preparados los conjuros Palabra de poder: curar y Palabra de poder: matar", () => {
      const pjBardo20: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-bardo-20",
        nombre: "Gran Maestro Bardo",
        clase: "Bardo",
        nivel: 20,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_palabras_creacion",
            nombre: "Palabras de creación",
            descripcion: "Dominio de la vida y muerte",
            conjurosOtorgados: ["Palabra de poder: curar", "Palabra de poder: matar"]
          })
        ]
      };

      const conjurosOtorgados = obtenerConjurosOtorgadosPorRasgos(pjBardo20);

      expect(conjurosOtorgados).toContain("Palabra de poder: curar");
      expect(conjurosOtorgados).toContain("Palabra de poder: matar");
    });
  });

  describe("Bárbaro: Reglas D&D 5.5e (2024)", () => {
    it("Furia dura 100 rondas (10 minutos) en los efectos predefinidos", () => {
      const efectoFuria = EFECTOS_PREDEFINIDOS.find((ef) => ef.nombre === "Furia" || ef.nombre.includes("Furia (Rage)"));
      expect(efectoFuria).toBeDefined();
      expect(efectoFuria?.duracionEstandar).toBe(100);
    });

    it("escala maxSelecciones de Maestría con armas en caliente (2 a Nv 1, 3 a Nv 4, 4 a Nv 10) preservando elecciones del jugador", () => {
      // 1. Personaje Bárbaro Nivel 1 con selecciones personalizadas
      const pjNiv1: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-barb-dinamico",
        nombre: "Bárbaro Furia",
        clase: "Bárbaro",
        nivel: 1,
        rasgos: []
      };

      const rasgosNv1 = sincronizarRasgosAutomaticos(pjNiv1);
      const rasgoMaestriaNv1 = rasgosNv1.find((r) => r.nombre === "Maestría con armas");
      expect(rasgoMaestriaNv1).toBeDefined();
      expect(rasgoMaestriaNv1?.selectores?.[0].maxSelecciones).toBe(2);

      // Simular que el usuario eligió "topple" y "push" en el selector
      const rasgoModificado = {
        ...rasgoMaestriaNv1!,
        selectores: [
          {
            ...rasgoMaestriaNv1!.selectores![0],
            valorActual: ["topple", "push"]
          }
        ]
      };

      // 2. Subir a Nivel 4 (debe permitir hasta 3 armas y conservar las 2 elecciones previas)
      const pjNiv4: PersonajeJugador = {
        ...pjNiv1,
        nivel: 4,
        rasgos: [rasgoModificado]
      };

      const rasgosNv4 = sincronizarRasgosAutomaticos(pjNiv4);
      const rasgoMaestriaNv4 = rasgosNv4.find((r) => r.nombre === "Maestría con armas");
      expect(rasgoMaestriaNv4?.selectores?.[0].maxSelecciones).toBe(3);
      expect(rasgoMaestriaNv4?.selectores?.[0].valorActual).toEqual(["topple", "push"]);

      // 3. Subir a Nivel 10 (debe permitir hasta 4 armas y conservar las elecciones)
      const pjNiv10: PersonajeJugador = {
        ...pjNiv1,
        nivel: 10,
        rasgos: [rasgoMaestriaNv4!]
      };

      const rasgosNv10 = sincronizarRasgosAutomaticos(pjNiv10);
      const rasgoMaestriaNv10 = rasgosNv10.find((r) => r.nombre === "Maestría con armas");
      expect(rasgoMaestriaNv10?.selectores?.[0].maxSelecciones).toBe(4);
      expect(rasgoMaestriaNv10?.selectores?.[0].valorActual).toEqual(["topple", "push"]);
    });

    it("reconoce correctamente maestrías aprendidas y evalúa si un arma califica", () => {
      const pjConMaestrias: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-maestrias",
        nombre: "Bárbaro Maestro",
        clase: "Bárbaro",
        nivel: 5,
        rasgos: [
          crearRasgoMock({
            id: "rasgo_cls_barbaro_maestria_armas",
            nombre: "Maestría con armas",
            selectores: [
              {
                id: "maestrias_aprendidas",
                tipo: "multiple",
                etiqueta: "Propiedades de Maestría Elegidas",
                maxSelecciones: 3,
                opciones: [
                  { id: "cleave", nombre: "Cleave (Hender)", descripcion: "Hender objetivo adyacente" },
                  { id: "topple", nombre: "Topple (Derribar)", descripcion: "Derribar al objetivo" },
                  { id: "vex", nombre: "Vex (Molestar)", descripcion: "Ventaja en siguiente ataque" }
                ],
                valorActual: ["cleave", "topple"]
              }
            ]
          })
        ]
      };

      const aprendidas = obtenerMaestriasArmasAprendidas(pjConMaestrias);
      expect(aprendidas.has("cleave")).toBe(true);
      expect(aprendidas.has("topple")).toBe(true);
      expect(aprendidas.has("vex")).toBe(false);

      // Verificación directa de personajeTieneMaestriaArma
      expect(personajeTieneMaestriaArma(pjConMaestrias, "Cleave (Hender)")).toBe(true);
      expect(personajeTieneMaestriaArma(pjConMaestrias, "Topple (Derribar)")).toBe(true);
      expect(personajeTieneMaestriaArma(pjConMaestrias, "cleave")).toBe(true);
      expect(personajeTieneMaestriaArma(pjConMaestrias, "Vex (Molestar)")).toBe(false);
      expect(personajeTieneMaestriaArma(pjConMaestrias, "Graze (Rozar)")).toBe(false);

      // Un personaje sin rasgos de maestría no debe desbloquear ninguna
      const pjSinMaestrias: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: "pj-mago",
        nombre: "Mago Simple",
        clase: "Mago",
        nivel: 5,
        rasgos: []
      };
      expect(personajeTieneMaestriaArma(pjSinMaestrias, "Cleave (Hender)")).toBe(false);
    });
  });

  describe("Bardo Glamour: Sincronización Bidireccional de Condiciones (Manto de Majestad y Majestad Inquebrantable)", () => {
    it("activa y desactiva Manto de Majestad agregando y quitando su condición de forma bidireccional", () => {
      const idPj = "pj-bardo-glamour-sync";
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: idPj,
        nombre: "Barda Glamour",
        clase: "Bardo",
        subclase: "Colegio del Glamour",
        nivel: 6,
        condicionesActivas: [],
        rasgos: []
      };

      const pjGlamour = aplicarBuildClaseAPersonaje(pjBase, "Bardo", 6, "Colegio del Glamour", {
        sincronizarRasgos: true
      });

      usarAlmacenDM.setState({
        personajes: [pjGlamour],
        idPersonajeActivo: idPj
      });

      const { alternarActivoRasgo, aplicarCondicionPersonaje, quitarCondicionPersonaje } = usarAlmacenDM.getState();
      const rasgoManto = pjGlamour.rasgos.find((r) => r.nombre === "Manto de majestad");
      expect(rasgoManto).toBeDefined();
      expect(rasgoManto?.esActivable).toBe(true);

      // 1. Activar el rasgo Manto de majestad
      alternarActivoRasgo(idPj, rasgoManto!.id);
      let pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      let rasgoActual = pjActual?.rasgos.find((r) => r.id === rasgoManto!.id);
      expect(rasgoActual?.activo).toBe(true);
      expect(pjActual?.condicionesActivas.some((c) => c.toLowerCase().includes("manto de majestad"))).toBe(true);

      // 2. Desactivar el rasgo Manto de majestad
      alternarActivoRasgo(idPj, rasgoManto!.id);
      pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      rasgoActual = pjActual?.rasgos.find((r) => r.id === rasgoManto!.id);
      expect(rasgoActual?.activo).toBe(false);
      expect(pjActual?.condicionesActivas.some((c) => c.toLowerCase().includes("manto de majestad"))).toBe(false);

      // 3. Agregar la condición manualmente activa el rasgo
      aplicarCondicionPersonaje(idPj, "Manto de Majestad (Mantle of Majesty)");
      pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      rasgoActual = pjActual?.rasgos.find((r) => r.id === rasgoManto!.id);
      expect(rasgoActual?.activo).toBe(true);

      // 4. Quitar la condición manualmente desactiva el rasgo
      quitarCondicionPersonaje(idPj, "Manto de Majestad (Mantle of Majesty)");
      pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      rasgoActual = pjActual?.rasgos.find((r) => r.id === rasgoManto!.id);
      expect(rasgoActual?.activo).toBe(false);
    });

    it("activa y desactiva Majestad Inquebrantable agregando y quitando su condición de forma bidireccional", () => {
      const idPj = "pj-bardo-glamour-inquebrantable";
      const pjBase: PersonajeJugador = {
        ...PERSONAJE_POR_DEFECTO,
        id: idPj,
        nombre: "Barda Glamour 14",
        clase: "Bardo",
        subclase: "Colegio del Glamour",
        nivel: 14,
        condicionesActivas: [],
        rasgos: []
      };

      const pjGlamour = aplicarBuildClaseAPersonaje(pjBase, "Bardo", 14, "Colegio del Glamour", {
        sincronizarRasgos: true
      });

      usarAlmacenDM.setState({
        personajes: [pjGlamour],
        idPersonajeActivo: idPj
      });

      const { alternarActivoRasgo, aplicarCondicionPersonaje, quitarCondicionPersonaje } = usarAlmacenDM.getState();
      const rasgoInq = pjGlamour.rasgos.find((r) => r.nombre === "Majestad inquebrantable");
      expect(rasgoInq).toBeDefined();
      expect(rasgoInq?.esActivable).toBe(true);

      // 1. Activar el rasgo
      alternarActivoRasgo(idPj, rasgoInq!.id);
      let pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      let rasgoActual = pjActual?.rasgos.find((r) => r.id === rasgoInq!.id);
      expect(rasgoActual?.activo).toBe(true);
      expect(pjActual?.condicionesActivas.some((c) => c.toLowerCase().includes("majestad inquebrantable"))).toBe(true);

      // 2. Desactivar el rasgo
      alternarActivoRasgo(idPj, rasgoInq!.id);
      pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      rasgoActual = pjActual?.rasgos.find((r) => r.id === rasgoInq!.id);
      expect(rasgoActual?.activo).toBe(false);
      expect(pjActual?.condicionesActivas.some((c) => c.toLowerCase().includes("majestad inquebrantable"))).toBe(false);

      // 3. Agregar condición activa el rasgo
      aplicarCondicionPersonaje(idPj, "Majestad Inquebrantable (Unbreakable Majesty)");
      pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      rasgoActual = pjActual?.rasgos.find((r) => r.id === rasgoInq!.id);
      expect(rasgoActual?.activo).toBe(true);

      // 4. Quitar condición desactiva el rasgo
      quitarCondicionPersonaje(idPj, "Majestad Inquebrantable (Unbreakable Majesty)");
      pjActual = usarAlmacenDM.getState().personajes.find((p) => p.id === idPj);
      rasgoActual = pjActual?.rasgos.find((r) => r.id === rasgoInq!.id);
      expect(rasgoActual?.activo).toBe(false);
    });
  });
});
