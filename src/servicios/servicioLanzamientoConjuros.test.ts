import { describe, it, expect } from "vitest";
import type { HechizoBase } from "@/tipos";
import {
  validarLanzamiento,
  prepararLanzamiento,
  type SolicitudLanzamiento,
  type ContextoMagicoPersonaje
} from "./servicioLanzamientoConjuros";

describe("servicioLanzamientoConjuros - Patrón Facade + Strategy", () => {
  const trucoEjemplo: HechizoBase = {
    id: "descarga-sobrenatural",
    nombre: "Descarga sobrenatural",
    nivel: 0,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "120 pies",
    componentes: "V, S",
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Un rayo de energia crepitante...",
    dadosDaño: "1d10",
    tipoDaño: "fuerza",
    ataqueCd: "Ataque Magico a Distancia",
    requiereAtaque: true
  };

  const conjuroEjemplo: HechizoBase = {
    id: "bola-de-fuego",
    nombre: "Bola de fuego",
    nivel: 3,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "150 pies",
    componentes: "V, S, M",
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Un haz brillante surge de tu dedo...",
    dadosDaño: "8d6",
    tipoDaño: "fuego",
    dadosDañoNivelSuperior: "1d6",
    ataqueCd: "Salvacion DES"
  };

  const conjuroConcentracionRitual: HechizoBase = {
    id: "detectar-magia",
    nombre: "Detectar magia",
    nivel: 1,
    escuela: "Adivinacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "Personal",
    componentes: "V, S",
    duracion: "Hasta 10 minutos",
    concentracion: true,
    ritual: true,
    descripcion: "Durante la duracion, percibes la presencia de magia..."
  };

  const contextoLimpio: ContextoMagicoPersonaje = {
    penalizacionArmadura: null,
    espaciosConjuroMaximos: { "1": 4, "2": 3, "3": 3, "4": 1 },
    nivelConjuroMaximo: 4,
    sistemaMagia: "espacios",
    esLanzadorPacto: false,
    nivelEspacioPacto: 0,
    espaciosPactoMaximos: 0,
    espaciosPactoGastados: 0,
    arcanoMisticoGastados: []
  };

  describe("Validación de Precondiciones (Guards)", () => {
    it("bloquea el lanzamiento de cualquier conjuro si viste armadura o escudo sin competencia", () => {
      const contextoConPenalizacion: ContextoMagicoPersonaje = {
        ...contextoLimpio,
        penalizacionArmadura: {
          sinCompetencia: true,
          armaduraNoCompetente: "Armadura Pesada (Placas)",
          escudoNoCompetente: null
        }
      };

      const solicitud: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: conjuroEjemplo,
        nivelLanzamiento: 3
      };

      const resultado = validarLanzamiento(solicitud, contextoConPenalizacion);
      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toContain("Reglas D&D 5.5e");
      expect(resultado.motivo).toContain("Armadura Pesada (Placas)");
    });

    it("permite el lanzamiento si el personaje es competente con su equipo", () => {
      const solicitud: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: conjuroEjemplo,
        nivelLanzamiento: 3
      };

      const resultado = validarLanzamiento(solicitud, contextoLimpio);
      expect(resultado.permitido).toBe(true);
    });

    it("bloquea hechizo de objeto si no tiene suficientes cargas", () => {
      const contextoObjeto: ContextoMagicoPersonaje = {
        ...contextoLimpio,
        cargasObjetoActuales: 1
      };

      const solicitud: SolicitudLanzamiento = {
        modo: "objetoMagico",
        hechizo: conjuroEjemplo,
        objetoNombre: "Varita de Fuego",
        costeCargasObjeto: 3
      };

      const resultado = validarLanzamiento(solicitud, contextoObjeto);
      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toContain("Cargas insuficientes");
    });

    it("bloquea Arcano Místico si ya fue gastado hoy", () => {
      const contextoArcano: ContextoMagicoPersonaje = {
        ...contextoLimpio,
        arcanoMisticoGastados: ["6", "7"]
      };

      const solicitud: SolicitudLanzamiento = {
        modo: "arcanoMistico",
        hechizo: {
          id: "desintegrar",
          nombre: "Desintegrar",
          nivel: 6,
          escuela: "Transmutacion",
          tiempoLanzamiento: "1 Accion",
          alcance: "60 pies",
          componentes: "V, S, M",
          duracion: "Instantaneo",
          concentracion: false,
          ritual: false,
          descripcion: "Un fino rayo verde..."
        },
        nivelLanzamiento: 6
      };

      const resultado = validarLanzamiento(solicitud, contextoArcano);
      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toContain("Arcano Místico de nivel 6 ya ha sido utilizado hoy");
    });
  });

  describe("Preparación y Estrategias de Lanzamiento", () => {
    it("Estrategia Truco: escala dados a nivel 5+ con múltiples rayos / dados y gasto ninguno", () => {
      const solicitud: SolicitudLanzamiento = {
        modo: "truco",
        hechizo: trucoEjemplo,
        nivelPersonaje: 5,
        bonoAtaqueMagico: 4,
        nombrePersonaje: "Valeros"
      };

      const preparado = prepararLanzamiento(solicitud, contextoLimpio);
      expect(preparado.gasto).toEqual({ tipo: "ninguno" });
      expect(preparado.activarConcentracion).toBe(false);
      // Descarga sobrenatural genera 2 rayos a nivel 5
      expect(preparado.formula.formulaTaleSpire).toContain("Rayo 1");
      expect(preparado.formula.formulaTaleSpire).toContain("Rayo 2");
    });

    it("Estrategia Espacio: calcula upcasting y gasto de ranura estándar", () => {
      const solicitud: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: conjuroEjemplo, // Base 8d6 (Nv 3)
        nivelLanzamiento: 5, // Upcast a Nv 5 (+2d6 -> 10d6)
        nivelPersonaje: 9,
        bonoAtaqueMagico: 4,
        nombrePersonaje: "Mago Gandalf"
      };

      const preparado = prepararLanzamiento(solicitud, contextoLimpio);
      expect(preparado.gasto).toEqual({ tipo: "espacio", nivel: 5 });
      expect(preparado.formula.formulaTaleSpire).toContain("10d6");
      expect(preparado.formula.etiquetaLog).toContain("Nv.5");
    });

    it("Estrategia Ritual: no gasta ranuras y añade etiqueta +10 min", () => {
      const solicitud: SolicitudLanzamiento = {
        modo: "ritual",
        hechizo: conjuroConcentracionRitual,
        nombrePersonaje: "Valeros"
      };

      const preparado = prepararLanzamiento(solicitud, contextoLimpio);
      expect(preparado.gasto).toEqual({ tipo: "ninguno" });
      expect(preparado.activarConcentracion).toBe(true);
      expect(preparado.formula.formulaTaleSpire).toContain("+10 min");
      expect(preparado.formula.etiquetaLog).toContain("RITUAL - 10 min");
    });

    it("Estrategia Magia de Pacto: gasta espacio de pacto cuando corresponde", () => {
      const contextoBrujo: ContextoMagicoPersonaje = {
        ...contextoLimpio,
        esLanzadorPacto: true,
        nivelEspacioPacto: 3,
        espaciosPactoMaximos: 2,
        espaciosPactoGastados: 0,
        espaciosConjuroMaximos: {}
      };

      const solicitud: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: conjuroEjemplo,
        nivelLanzamiento: 3,
        nombrePersonaje: "Brujo"
      };

      const preparado = prepararLanzamiento(solicitud, contextoBrujo);
      expect(preparado.gasto).toEqual({ tipo: "pacto", nivel: 3 });
    });

    it("Estrategia Arcano Místico: registra concentración si el hechizo lo requiere", () => {
      const hechizoConcentracionNv6: HechizoBase = {
        id: "globo-de-invulnerabilidad",
        nombre: "Globo de invulnerabilidad",
        nivel: 6,
        escuela: "Abjuracion",
        tiempoLanzamiento: "1 Accion",
        alcance: "Personal",
        componentes: "V, S, M",
        duracion: "Hasta 1 minuto",
        concentracion: true,
        ritual: false,
        descripcion: "Una barrera brillante de 10 pies..."
      };

      const solicitud: SolicitudLanzamiento = {
        modo: "arcanoMistico",
        hechizo: hechizoConcentracionNv6,
        nivelLanzamiento: 6,
        nombrePersonaje: "Brujo Nv11"
      };

      const preparado = prepararLanzamiento(solicitud, contextoLimpio);
      expect(preparado.gasto).toEqual({ tipo: "arcanoMistico", nivel: 6 });
      expect(preparado.activarConcentracion).toBe(true);
    });

    it("Estrategia Espacio (Conjuro Utilitario / Defensivo sin daño como Escudo): descuenta la ranura correctamente", () => {
      const conjuroEscudo: HechizoBase = {
        id: "escudo",
        nombre: "Escudo",
        nivel: 1,
        escuela: "Abjuracion",
        tiempoLanzamiento: "1 Reaccion",
        alcance: "Personal",
        componentes: "V, S",
        duracion: "1 ronda",
        concentracion: false,
        ritual: false,
        descripcion: "Una barrera invisible de fuerza mágica aparece y te protege..."
      };

      const solicitud: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: conjuroEscudo,
        nivelLanzamiento: 1,
        nombrePersonaje: "Ezren"
      };

      const preparado = prepararLanzamiento(solicitud, contextoLimpio);
      expect(preparado.gasto).toEqual({ tipo: "espacio", nivel: 1 });
      expect(preparado.activarConcentracion).toBe(false);
      expect(preparado.formula.formulaTaleSpire).toContain("Escudo");
      expect(preparado.formula.etiquetaLog).toContain("Ezren - Escudo");
    });
  });
});
