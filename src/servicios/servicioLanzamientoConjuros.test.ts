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
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Un rayo de energia crepitante...",
    dadosDaño: "1d10",
    tipoDaño: "fuerza",
    ataqueCd: "ATAQUE",
    requiereAtaque: true
  };

  const conjuroEjemplo: HechizoBase = {
    id: "bola-de-fuego",
    nombre: "Bola de fuego",
    nivel: 3,
    escuela: "Evocacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "150 pies",
    componentesSeleccionados: { verbal: true, somatico: true, material: true },
    duracion: "Instantaneo",
    concentracion: false,
    ritual: false,
    descripcion: "Un haz brillante surge de tu dedo...",
    dadosDaño: "8d6",
    tipoDaño: "fuego",
    dadosDañoNivelSuperior: "1d6",
    ataqueCd: "CD"
  };

  const conjuroConcentracionRitual: HechizoBase = {
    id: "detectar-magia",
    nombre: "Detectar magia",
    nivel: 1,
    escuela: "Adivinacion",
    tiempoLanzamiento: "1 Accion",
    alcance: "Personal",
    componentesSeleccionados: { verbal: true, somatico: true, material: false },
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
          componentesSeleccionados: { verbal: true, somatico: true, material: true },
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

    it("Estrategia Espacio (Proyectiles Múltiples): Proyectil Mágico lanza grupos individuales de dardos", () => {
      const proyectilMagico: HechizoBase = {
        id: "h_proyectil-magico",
        nombre: "Proyectil mágico",
        nivel: 1,
        escuela: "Evocacion",
        tiempoLanzamiento: "1 Accion",
        alcance: "120 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Instantaneo",
        concentracion: false,
        ritual: false,
        descripcion: "Creas tres dardos...",
        dadosDaño: "1d4+1",
        dadosDañoNivelSuperior: "1d4+1",
        tipoDaño: "fuerza",
        requiereAtaque: false
      };

      // Nivel 1 -> 3 dardos de 1d4+1
      const solNv1: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: proyectilMagico,
        nivelLanzamiento: 1,
        nombrePersonaje: "Mago"
      };
      const prepNv1 = prepararLanzamiento(solNv1, contextoLimpio);
      expect(prepNv1.formula.formulaTaleSpire).toBe(
        "!Daño Dardo 1 (fuerza):1d4+1/Daño Dardo 2 (fuerza):1d4+1/Daño Dardo 3 (fuerza):1d4+1"
      );
      expect(prepNv1.formula.etiquetaLog).toContain("3 dardos");

      // Upcast Nivel 2 -> 4 dardos de 1d4+1
      const solNv2: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: proyectilMagico,
        nivelLanzamiento: 2,
        nombrePersonaje: "Mago"
      };
      const prepNv2 = prepararLanzamiento(solNv2, contextoLimpio);
      expect(prepNv2.formula.formulaTaleSpire).toBe(
        "!Daño Dardo 1 (fuerza):1d4+1/Daño Dardo 2 (fuerza):1d4+1/Daño Dardo 3 (fuerza):1d4+1/Daño Dardo 4 (fuerza):1d4+1"
      );
      expect(prepNv2.formula.etiquetaLog).toContain("Nv.2 -> 4 dardos");
    });

    it("Estrategia Espacio (Proyectiles Múltiples): Rayo Abrasador lanza grupos individuales con ataque y daño por rayo", () => {
      const rayoAbrasador: HechizoBase = {
        id: "h_rayo-abrasador",
        nombre: "Rayo abrasador",
        nivel: 2,
        escuela: "Evocacion",
        tiempoLanzamiento: "1 Accion",
        alcance: "120 pies",
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
        duracion: "Instantaneo",
        concentracion: false,
        ritual: false,
        descripcion: "Lanzas tres rayos...",
        dadosDaño: "2d6",
        dadosDañoNivelSuperior: "2d6",
        tipoDaño: "fuego",
        requiereAtaque: true
      };

      // Nivel 2 -> 3 rayos de 2d6 con ataque individual
      const solNv2: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: rayoAbrasador,
        nivelLanzamiento: 2,
        bonoAtaqueMagico: 5,
        nombrePersonaje: "Hechicero"
      };
      const prepNv2 = prepararLanzamiento(solNv2, contextoLimpio);
      expect(prepNv2.formula.formulaTaleSpire).toBe(
        "!Ataque Rayo 1:1d20+5/Daño Rayo 1 (fuego):2d6/Ataque Rayo 2:1d20+5/Daño Rayo 2 (fuego):2d6/Ataque Rayo 3:1d20+5/Daño Rayo 3 (fuego):2d6"
      );
      expect(prepNv2.formula.etiquetaLog).toContain("3 rayos");

      // Upcast Nivel 3 -> 4 rayos
      const solNv3: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: rayoAbrasador,
        nivelLanzamiento: 3,
        bonoAtaqueMagico: 5,
        nombrePersonaje: "Hechicero"
      };
      const prepNv3 = prepararLanzamiento(solNv3, contextoLimpio);
      expect(prepNv3.formula.formulaTaleSpire).toContain("Ataque Rayo 4:1d20+5/Daño Rayo 4 (fuego):2d6");
      expect(prepNv3.formula.etiquetaLog).toContain("Nv.3 -> 4 rayos");
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
        componentesSeleccionados: { verbal: true, somatico: true, material: true },
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
        componentesSeleccionados: { verbal: true, somatico: true, material: false },
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

    it("Estrategia Gratuito Innato (1/Descanso Largo de linaje/especie): genera gasto gratuitoInnato sin consumir ranuras ni puntos", () => {
      const solicitudGratuita: SolicitudLanzamiento = {
        modo: "gratuitoInnato",
        hechizo: conjuroConcentracionRitual, // Detectar magia (nivel 1, concentración)
        nivelLanzamiento: 1,
        nombrePersonaje: "Alto Elfo Nv3"
      };

      const preparado = prepararLanzamiento(solicitudGratuita, contextoLimpio);
      expect(preparado.gasto).toEqual({ tipo: "gratuitoInnato", hechizoId: "detectar-magia" });
      expect(preparado.activarConcentracion).toBe(true);
      expect(preparado.formula.etiquetaLog).toContain("Alto Elfo Nv3 - Detectar magia");
    });

    it("Aplica bonoDanoMagico (+PB / Revelación celestial) directamente a la fórmula de daño en TaleSpire", () => {
      const solicitudConBono: SolicitudLanzamiento = {
        modo: "espacio",
        hechizo: conjuroEjemplo, // Bola de fuego (8d6 de fuego)
        nivelLanzamiento: 3,
        bonoAtaqueMagico: 5,
        bonoDanoMagico: 2, // +PB
        nombrePersonaje: "Asimar Piromante"
      };

      const preparado = prepararLanzamiento(solicitudConBono, contextoLimpio);
      expect(preparado.formula.formulaTaleSpire).toBe("!Daño Bola de fuego(fuego):8d6+2");
      expect(preparado.formula.etiquetaLog).toContain("Asimar Piromante - Bola de fuego");
    });
  });
});
