import { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type {
  PersonajeJugador,
  Caracteristica,
  Habilidad,
  GradoCompetencia,
  ObjetoInventario,
  ObjetoJuego,
  BolsaMonedas,
  TipoMonedaClave,
  TipoContenedor
} from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { generarId } from "@/utiles/generarId";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "@/servicios/procesadorDescansos";
import { aplicarCondicion, quitarCondicion } from "@/servicios/procesadorCondiciones";
import { contarSintonizaciones, desempaquetarPaqueteInventario } from "@/servicios/calculadorInventario";
import {
  calcularTodosRecursosMagicos,
  detectarTipoLanzador,
  obtenerConjurosSubclasePersonaje
} from "@/servicios/calculadorMagia";
import { coincideHechizoId, deduplicarListaIds } from "@/servicios/comparadorHechizos";
import { sincronizarConjurosSubclaseHelper } from "@/servicios/sincronizadorConjurosSubclase";
import { procesarAlternarEquipado } from "@/servicios/procesadorEquipamiento";
import { mutarPersonaje } from "./helpers/mutarPersonaje";

// Re-exportaciones de compatibilidad retroactiva
export { coincideHechizoId, deduplicarListaIds, sincronizarConjurosSubclaseHelper };


// ==========================================
// 1. INTERFAZ DEL SLICE DE PERSONAJES
// ==========================================

export interface SlicePersonajes {
  personajes: PersonajeJugador[];
  idPersonajeActivo: string | null;

  crearPersonaje: (datosIniciales?: Partial<PersonajeJugador>) => string;
  actualizarPersonaje: (id: string, cambios: Partial<PersonajeJugador>) => void;
  eliminarPersonaje: (id: string) => void;
  duplicarPersonaje: (id: string) => string;
  seleccionarPersonajeActivo: (id: string | null) => void;

  modificarHPPersonaje: (id: string, delta: number) => void;
  aplicarCuracionPersonaje: (id: string, cantidad: number) => void;
  aplicarDanoPersonaje: (id: string, cantidad: number) => void;
  establecerHPActualPersonaje: (id: string, valor: number) => void;
  modificarHPMaximoEfectivoPersonaje: (id: string, nuevoMax: number) => void;
  modificarHPMaximoBasePersonaje: (id: string, nuevoBase: number) => void;
  modificarHPTemporalPersonaje: (id: string, valor: number) => void;
  gastarDadoGolpePersonaje: (id: string, tiradas?: number[]) => void;
  ejecutarDescansoPersonaje: (
    id: string,
    tipo: "corto" | "largo",
    dadosAGastar?: number,
    tiradas?: number[]
  ) => void;
  alternarInspiracionPersonaje: (id: string) => void;
  modificarSalvacionesMuertePersonaje: (id: string, tipo: "exitos" | "fallos", delta: number) => void;
  establecerSalvacionesMuertePersonaje: (id: string, tipo: "exitos" | "fallos", valor: number) => void;
  reiniciarSalvacionesMuertePersonaje: (id: string) => void;
  modificarCansancioPersonaje: (id: string, delta: number) => void;

  modificarCaracteristicaBasePersonaje: (id: string, carac: Caracteristica, valor: number) => void;
  alternarSalvacionPersonaje: (id: string, carac: Caracteristica) => void;
  ciclarGradoHabilidadPersonaje: (id: string, hab: Habilidad) => void;
  establecerGradoHabilidadPersonaje: (id: string, hab: Habilidad, grado: GradoCompetencia) => void;
  personalizarHabilidadPersonaje: (
    id: string,
    hab: Habilidad,
    datos: Partial<import("@/tipos").PersonalizacionHabilidad>
  ) => void;
  personalizarCaracteristicaPersonaje: (
    id: string,
    carac: Caracteristica,
    datos: Partial<import("@/tipos").PersonalizacionCaracteristica>
  ) => void;

  aplicarCondicionPersonaje: (id: string, condicion: string) => void;
  quitarCondicionPersonaje: (id: string, condicion: string) => void;
  limpiarCondicionesPersonaje: (id: string) => void;
  vincularMiniaturaTSPersonaje: (id: string, idMiniatura: string | null) => void;

  // Lanzamiento de Conjuros y Magia
  configurarLanzadorConjuros: (
    id: string,
    config: {
      esLanzador: boolean;
      clasesLanzadoras: import("@/tipos").ClaseLanzadora[];
    }
  ) => void;
  establecerConcentracion: (id: string, hechizoId: string, nombreHechizo: string) => void;
  romperConcentracion: (id: string) => void;

  agregarTrucoConocido: (id: string, hechizoId: string) => void;
  quitarTrucoConocido: (id: string, hechizoId: string) => void;

  agregarConjuroConocido: (id: string, hechizoId: string) => void;
  quitarConjuroConocido: (id: string, hechizoId: string) => void;
  alternarConjuroPreparado: (id: string, hechizoId: string) => void;

  gastarEspacioConjuro: (id: string, nivel: number) => void;
  recuperarEspacioConjuro: (id: string, nivel: number) => void;
  recuperarTodosEspaciosConjuro: (id: string) => void;

  gastarPuntosConjuro: (id: string, cantidad: number) => void;
  recuperarPuntosConjuro: (id: string, cantidad: number) => void;
  recuperarTodosPuntosConjuro: (id: string) => void;

  gastarEspacioPacto: (id: string) => void;
  recuperarEspaciosPacto: (id: string) => void;

  modificarPuntosHechiceria: (id: string, delta: number) => void;
  asignarArcanoMistico: (id: string, nivel: number, hechizoId: string) => void;
  quitarArcanoMistico: (id: string, nivel: number) => void;
  gastarArcanoMistico: (id: string, nivel: number) => void;
  recuperarArcanoMistico: (id: string, nivel: number) => void;
  sincronizarConjurosSubclase: (id: string) => void;

  establecerOverridesMagia: (
    id: string,
    overrides: {
      overrideEspacios?: Record<string, number> | null;
      overridePuntos?: number | null;
    }
  ) => void;

  establecerOverrideEspacios: (id: string, overrides: Record<string, number> | null) => void;
  establecerOverridePuntos: (id: string, override: number | null) => void;
  recalcularRecursosMagicos: (id: string) => void;

  // Inventario y Monedas (Apartado E)
  agregarObjetoInventario: (idPj: string, objeto: ObjetoInventario) => void;
  quitarObjetoInventario: (idPj: string, idInstancia: string) => void;
  modificarCantidadObjeto: (idPj: string, idInstancia: string, delta: number) => void;
  alternarEquipadoObjeto: (idPj: string, idInstancia: string) => void;
  alternarSintonizadoObjeto: (idPj: string, idInstancia: string) => void;
  actualizarNotasObjeto: (idPj: string, idInstancia: string, notas: string) => void;
  actualizarObjetoInventario: (idPj: string, idInstancia: string, cambios: Partial<ObjetoInventario>) => void;
  modificarCargasObjeto: (idPj: string, idInstancia: string, delta: number) => void;
  cambiarContenedorObjeto: (idPj: string, idInstancia: string, contenedor: TipoContenedor) => void;
  desempaquetarPaquete: (idPj: string, idInstancia: string, baseDatosObjetos: ObjetoJuego[]) => void;
  establecerMonedas: (idPj: string, monedas: Partial<BolsaMonedas>) => void;
  modificarMoneda: (idPj: string, tipo: TipoMonedaClave, delta: number) => void;
}


const ORDEN_CICLO_HABILIDAD: Record<GradoCompetencia, GradoCompetencia> = {
  ninguna: "medio",
  medio: "competente",
  competente: "pericia",
  pericia: "ninguna"
};

// ==========================================
// 2. CREADOR DEL SLICE
// ==========================================

export const crearSlicePersonajes: StateCreator<
  EstadoDM,
  [],
  [],
  SlicePersonajes
> = (set, get) => ({
  personajes: [PERSONAJE_POR_DEFECTO],
  idPersonajeActivo: PERSONAJE_POR_DEFECTO.id,

  crearPersonaje: (datosIniciales) => {
    const nuevoId = generarId("pj");
    let nuevoPersonaje: PersonajeJugador = {
      ...PERSONAJE_POR_DEFECTO,
      ...datosIniciales,
      id: nuevoId,
      nombre: datosIniciales?.nombre || "Nuevo Personaje"
    };

    // Auto-detección o cálculo de recursos mágicos al crear personaje
    if (nuevoPersonaje.clasesLanzadoras && nuevoPersonaje.clasesLanzadoras.length > 0) {
      const recursos = calcularTodosRecursosMagicos(
        nuevoPersonaje.clasesLanzadoras,
        nuevoPersonaje.overrideEspaciosConjuro,
        nuevoPersonaje.overridePuntosConjuro
      );
      nuevoPersonaje = {
        ...nuevoPersonaje,
        esLanzador: true,
        espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
        puntosConjuroMaximos: recursos.puntosConjuroMaximos,
        nivelConjuroMaximo: recursos.nivelConjuroMaximo,
        espaciosPactoMaximos: recursos.espaciosPactoMaximos,
        nivelEspacioPacto: recursos.nivelEspacioPacto
      };
    } else {
      const infoLanzador = detectarTipoLanzador(nuevoPersonaje.clase, nuevoPersonaje.subclase);
      if (infoLanzador) {
        const clases = [
          {
            clase: nuevoPersonaje.clase || "Lanzador",
            nivel: nuevoPersonaje.nivel || 1,
            tipoLanzador: infoLanzador.tipo,
            habilidadConjuro: infoLanzador.habilidad,
            modeloConjuros: infoLanzador.modelo
          }
        ];
        const recursos = calcularTodosRecursosMagicos(
          clases,
          nuevoPersonaje.overrideEspaciosConjuro,
          nuevoPersonaje.overridePuntosConjuro
        );
        nuevoPersonaje = {
          ...nuevoPersonaje,
          esLanzador: true,
          clasesLanzadoras: clases,
          espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
          puntosConjuroMaximos: recursos.puntosConjuroMaximos,
          nivelConjuroMaximo: recursos.nivelConjuroMaximo,
          espaciosPactoMaximos: recursos.espaciosPactoMaximos,
          nivelEspacioPacto: recursos.nivelEspacioPacto
        };
      }
    }

    // Auto-detección y sincronización de conjuros de subclase al crear
    nuevoPersonaje = sincronizarConjurosSubclaseHelper(nuevoPersonaje);

    set((state) => ({
      personajes: [...state.personajes, nuevoPersonaje],
      idPersonajeActivo: nuevoId
    }));

    return nuevoId;
  },

  actualizarPersonaje: (id, cambios) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;

        let fusionado = { ...pj, ...cambios };

        // Si se cambia la clase o subclase y no se pasaron clasesLanzadoras explícitas
        if (
          (cambios.clase !== undefined || cambios.subclase !== undefined || cambios.clases !== undefined) &&
          cambios.clasesLanzadoras === undefined
        ) {
          const info = detectarTipoLanzador(fusionado.clase, fusionado.subclase);
          if (info) {
            const clases = [
              {
                clase: fusionado.clase,
                nivel: fusionado.nivel,
                tipoLanzador: info.tipo,
                habilidadConjuro: info.habilidad,
                modeloConjuros: info.modelo
              }
            ];
            const recursos = calcularTodosRecursosMagicos(clases, fusionado.overrideEspaciosConjuro, fusionado.overridePuntosConjuro);
            fusionado = {
              ...fusionado,
              esLanzador: true,
              clasesLanzadoras: clases,
              espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
              puntosConjuroMaximos: recursos.puntosConjuroMaximos,
              nivelConjuroMaximo: recursos.nivelConjuroMaximo,
              espaciosPactoMaximos: recursos.espaciosPactoMaximos,
              nivelEspacioPacto: recursos.nivelEspacioPacto
            };
          }
        }

        // Sincronizar dinámicamente conjuros de subclase (limpiando los que ya no correspondan al nivel/subclase)
        return sincronizarConjurosSubclaseHelper(
          fusionado,
          cambios.clases !== undefined ? fusionado.clases : undefined,
          cambios.clase !== undefined ? fusionado.clase : undefined,
          cambios.subclase !== undefined ? fusionado.subclase : undefined,
          cambios.nivel !== undefined ? fusionado.nivel : undefined
        );
      })
    }));
  },

  eliminarPersonaje: (id) => {
    set((state) => {
      const restantes = state.personajes.filter((pj) => pj.id !== id);
      let nuevoActivo = state.idPersonajeActivo;

      if (state.idPersonajeActivo === id) {
        nuevoActivo = restantes.length > 0 ? restantes[0].id : null;
      }

      return {
        personajes: restantes,
        idPersonajeActivo: nuevoActivo
      };
    });
  },

  duplicarPersonaje: (id) => {
    const state = get();
    const original = state.personajes.find((pj) => pj.id === id);
    if (!original) return "";

    const nuevoId = generarId("pj");
    const duplicado: PersonajeJugador = {
      ...original,
      id: nuevoId,
      nombre: `${original.nombre} (Copia)`
    };

    set((s) => ({
      personajes: [...s.personajes, duplicado],
      idPersonajeActivo: nuevoId
    }));

    return nuevoId;
  },

  seleccionarPersonajeActivo: (id) => {
    set({ idPersonajeActivo: id });
  },

  aplicarCuracionPersonaje: (id, cantidad) => {
    if (cantidad <= 0) return;
    mutarPersonaje(set, id, (pj) => {
      const maxEfectivo = pj.hpMaximo || pj.hpMaximoBase || 10;
      const hpNuevo = Math.min(maxEfectivo, pj.hpActual + cantidad);
      return { ...pj, hpActual: hpNuevo };
    });
  },

  aplicarDanoPersonaje: (id, cantidad) => {
    if (cantidad <= 0) return;
    mutarPersonaje(set, id, (pj) => {
      const temp = pj.hpTemporal || 0;

      if (temp > 0) {
        if (cantidad <= temp) {
          // El daño es absorbido completamente por el escudo (HP temporal)
          return { ...pj, hpTemporal: temp - cantidad };
        } else {
          // El escudo se rompe y el excedente daña la vida actual
          const excedente = cantidad - temp;
          const hpNuevo = Math.max(0, pj.hpActual - excedente);
          return { ...pj, hpTemporal: 0, hpActual: hpNuevo };
        }
      } else {
        // Sin escudo, todo el daño va directo a la vida actual
        const hpNuevo = Math.max(0, pj.hpActual - cantidad);
        return { ...pj, hpActual: hpNuevo };
      }
    });
  },

  modificarHPPersonaje: (id, delta) => {
    if (delta > 0) {
      get().aplicarCuracionPersonaje(id, delta);
    } else if (delta < 0) {
      get().aplicarDanoPersonaje(id, Math.abs(delta));
    }
  },

  establecerHPActualPersonaje: (id, valor) => {
    mutarPersonaje(set, id, (pj) => {
      const maxEfectivo = pj.hpMaximo || pj.hpMaximoBase || 10;
      const hpNuevo = Math.max(0, Math.min(maxEfectivo, valor));
      return { ...pj, hpActual: hpNuevo };
    });
  },

  modificarHPMaximoEfectivoPersonaje: (id, nuevoMax) => {
    mutarPersonaje(set, id, (pj) => {
      const maxValido = Math.max(1, nuevoMax || 1);
      return {
        ...pj,
        hpMaximo: maxValido,
        hpActual: Math.min(pj.hpActual, maxValido)
      };
    });
  },

  modificarHPMaximoBasePersonaje: (id, nuevoBase) => {
    mutarPersonaje(set, id, (pj) => {
      const baseValido = Math.max(1, nuevoBase || 1);
      return {
        ...pj,
        hpMaximoBase: baseValido,
        hpMaximo: baseValido,
        hpActual: Math.min(pj.hpActual, baseValido)
      };
    });
  },

  modificarHPTemporalPersonaje: (id, valor) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      hpTemporal: Math.max(0, valor)
    }));
  },

  gastarDadoGolpePersonaje: (id, tiradas = []) => {
    const pj = get().personajes.find((p) => p.id === id);
    if (!pj || pj.dadosGolpeRestantes <= 0) return;

    const { personajeActualizado } = ejecutarDescansoCorto(pj, 1, tiradas);
    get().actualizarPersonaje(id, personajeActualizado);
  },

  ejecutarDescansoPersonaje: (id, tipo, dadosAGastar = 0, tiradas = []) => {
    const pj = get().personajes.find((p) => p.id === id);
    if (!pj) return;

    const { personajeActualizado } =
      tipo === "largo"
        ? ejecutarDescansoLargo(pj)
        : ejecutarDescansoCorto(pj, dadosAGastar, tiradas);

    get().actualizarPersonaje(id, personajeActualizado);
  },

  alternarInspiracionPersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      inspiracion: !pj.inspiracion
    }));
  },

  modificarSalvacionesMuertePersonaje: (id, tipo, delta) => {
    mutarPersonaje(set, id, (pj) => {
      const valorActual = pj.salvacionesMuerte[tipo];
      const valorNuevo = Math.max(0, Math.min(3, valorActual + delta));
      return {
        ...pj,
        salvacionesMuerte: {
          ...pj.salvacionesMuerte,
          [tipo]: valorNuevo
        }
      };
    });
  },

  establecerSalvacionesMuertePersonaje: (id, tipo, valor) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      salvacionesMuerte: {
        ...pj.salvacionesMuerte,
        [tipo]: Math.max(0, Math.min(3, valor))
      }
    }));
  },

  reiniciarSalvacionesMuertePersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      salvacionesMuerte: { exitos: 0, fallos: 0 }
    }));
  },

  modificarCansancioPersonaje: (id, delta) => {
    mutarPersonaje(set, id, (pj) => {
      const nuevoCansancio = Math.max(0, Math.min(6, (pj.cansancio || 0) + delta));
      const condicionesFiltradas = (pj.condicionesActivas || []).filter(
        (c) => !c.toLowerCase().startsWith("cansado") && !c.toLowerCase().startsWith("agotado")
      );
      const nuevasCondiciones =
        nuevoCansancio > 0
          ? [...condicionesFiltradas, `Cansado (Niv. ${nuevoCansancio})`]
          : condicionesFiltradas;

      return {
        ...pj,
        cansancio: nuevoCansancio,
        condicionesActivas: nuevasCondiciones
      };
    });
  },

  modificarCaracteristicaBasePersonaje: (id, carac, valor) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      caracteristicas: {
        ...pj.caracteristicas,
        [carac]: Math.max(1, Math.min(30, valor || 10))
      }
    }));
  },

  alternarSalvacionPersonaje: (id, carac) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      competenciasSalvacion: {
        ...pj.competenciasSalvacion,
        [carac]: !pj.competenciasSalvacion[carac]
      }
    }));
  },

  ciclarGradoHabilidadPersonaje: (id, hab) => {
    mutarPersonaje(set, id, (pj) => {
      const gradoActual = pj.gradosHabilidades[hab] || "ninguna";
      const nuevoGrado = ORDEN_CICLO_HABILIDAD[gradoActual] || "ninguna";
      return {
        ...pj,
        gradosHabilidades: {
          ...pj.gradosHabilidades,
          [hab]: nuevoGrado
        }
      };
    });
  },

  establecerGradoHabilidadPersonaje: (id, hab, grado) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      gradosHabilidades: {
        ...pj.gradosHabilidades,
        [hab]: grado
      }
    }));
  },

  personalizarHabilidadPersonaje: (id, hab, datos) => {
    mutarPersonaje(set, id, (pj) => {
      const actual = pj.personalizacionesHabilidades?.[hab] || {
        modificadorExtra: 0,
        valorFijo: null,
        notas: ""
      };
      return {
        ...pj,
        personalizacionesHabilidades: {
          ...pj.personalizacionesHabilidades,
          [hab]: { ...actual, ...datos }
        }
      };
    });
  },

  personalizarCaracteristicaPersonaje: (id, carac, datos) => {
    mutarPersonaje(set, id, (pj) => {
      const actual = pj.personalizacionesCaracteristicas?.[carac] || {
        modificadorExtra: 0,
        valorFijo: null,
        bonoSalvacionExtra: 0,
        notas: ""
      };
      return {
        ...pj,
        personalizacionesCaracteristicas: {
          ...pj.personalizacionesCaracteristicas,
          [carac]: { ...actual, ...datos }
        }
      };
    });
  },

  aplicarCondicionPersonaje: (id, condicion) => {
    mutarPersonaje(set, id, (pj) => {
      const normalizada = condicion.trim().toLowerCase();
      const esCansancio =
        normalizada.includes("cansado") ||
        normalizada.includes("exhausted") ||
        normalizada.includes("agotado");

      if (esCansancio) {
        const nuevoCansancio = Math.min(6, (pj.cansancio || 0) + 1);
        const condicionesFiltradas = (pj.condicionesActivas || []).filter(
          (c) => !c.toLowerCase().startsWith("cansado") && !c.toLowerCase().startsWith("agotado")
        );
        return {
          ...pj,
          cansancio: nuevoCansancio,
          condicionesActivas: [...condicionesFiltradas, `Cansado (Niv. ${nuevoCansancio})`]
        };
      }

      const nuevasCondiciones = aplicarCondicion(pj.condicionesActivas, condicion);
      return { ...pj, condicionesActivas: nuevasCondiciones };
    });
  },

  quitarCondicionPersonaje: (id, condicion) => {
    mutarPersonaje(set, id, (pj) => {
      const normalizada = condicion.trim().toLowerCase();
      const esCansancio =
        normalizada.includes("cansado") ||
        normalizada.includes("exhausted") ||
        normalizada.includes("agotado");

      if (esCansancio) {
        const condicionesFiltradas = (pj.condicionesActivas || []).filter(
          (c) => !c.toLowerCase().startsWith("cansado") && !c.toLowerCase().startsWith("agotado")
        );
        return {
          ...pj,
          cansancio: 0,
          condicionesActivas: condicionesFiltradas
        };
      }

      const nuevasCondiciones = quitarCondicion(pj.condicionesActivas, condicion);
      return { ...pj, condicionesActivas: nuevasCondiciones };
    });
  },

  limpiarCondicionesPersonaje: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      condicionesActivas: [],
      cansancio: 0
    }));
  },

  vincularMiniaturaTSPersonaje: (id, idMiniatura) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      idMiniaturaTS: idMiniatura
    }));
  },


  // ==========================================
  // MÉTODOS DE LANZAMIENTO DE CONJUROS Y MAGIA
  // ==========================================

  recalcularRecursosMagicos: (id) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;

        const resultadoSubclase = obtenerConjurosSubclasePersonaje(
          pj.clases,
          pj.clase,
          pj.subclase,
          pj.nivel
        );

        const siemprePreparadosNuevos = Array.from(
          new Set([...(resultadoSubclase.conjuros || [])])
        );

        const preparadosActuales = new Set(pj.conjurosPreparadosIds || []);
        siemprePreparadosNuevos.forEach((c) => preparadosActuales.add(c));

        const trucosActuales = new Set(pj.trucosConocidosIds || []);
        (resultadoSubclase.trucos || []).forEach((t) => trucosActuales.add(t));

        if (!pj.esLanzador || pj.clasesLanzadoras.length === 0) {
          return {
            ...pj,
            conjurosSiemprePreparadosIds: siemprePreparadosNuevos,
            conjurosPreparadosIds: Array.from(preparadosActuales),
            trucosConocidosIds: Array.from(trucosActuales),
            espaciosConjuroMaximos: pj.overrideEspaciosConjuro || {},
            puntosConjuroMaximos: pj.overridePuntosConjuro || 0,
            nivelConjuroMaximo: 0,
            espaciosPactoMaximos: 0,
            nivelEspacioPacto: 0
          };
        }

        const recursos = calcularTodosRecursosMagicos(
          pj.clasesLanzadoras,
          pj.overrideEspaciosConjuro,
          pj.overridePuntosConjuro
        );

        return {
          ...pj,
          conjurosSiemprePreparadosIds: siemprePreparadosNuevos,
          conjurosPreparadosIds: Array.from(preparadosActuales),
          trucosConocidosIds: Array.from(trucosActuales),
          espaciosConjuroMaximos: recursos.espaciosConjuroMaximos,
          puntosConjuroMaximos: recursos.puntosConjuroMaximos,
          nivelConjuroMaximo: recursos.nivelConjuroMaximo,
          espaciosPactoMaximos: recursos.espaciosPactoMaximos,
          nivelEspacioPacto: recursos.nivelEspacioPacto
        };
      })
    }));
  },

  configurarLanzadorConjuros: (id, config) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      esLanzador: config.esLanzador,
      clasesLanzadoras: config.clasesLanzadoras
    }));
    get().recalcularRecursosMagicos(id);
  },

  establecerConcentracion: (id, hechizoId, nombreHechizo) => {
    mutarPersonaje(set, id, (pj) => {
      const condiciones = pj.condicionesActivas || [];
      const tieneCondicion = condiciones.some((c) => c.toLowerCase().includes("concentra"));
      const nuevasCondiciones = tieneCondicion ? condiciones : [...condiciones, "Concentración"];

      return {
        ...pj,
        concentracionActiva: { hechizoId, nombreHechizo },
        condicionesActivas: nuevasCondiciones
      };
    });
  },

  romperConcentracion: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const nuevasCondiciones = (pj.condicionesActivas || []).filter(
        (c) => !c.toLowerCase().includes("concentra")
      );
      return {
        ...pj,
        concentracionActiva: null,
        condicionesActivas: nuevasCondiciones
      };
    });
  },

  agregarTrucoConocido: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      const listaActual = pj.trucosConocidosIds || [];
      if (listaActual.some((hId) => coincideHechizoId(hId, hechizoId))) return pj;
      return { ...pj, trucosConocidosIds: [...listaActual, hechizoId] };
    });
  },

  quitarTrucoConocido: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      trucosConocidosIds: (pj.trucosConocidosIds || []).filter((hId) => !coincideHechizoId(hId, hechizoId))
    }));
  },

  agregarConjuroConocido: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      const listaActual = pj.conjurosConocidosIds || [];
      if (listaActual.some((hId) => coincideHechizoId(hId, hechizoId))) return pj;
      return { ...pj, conjurosConocidosIds: [...listaActual, hechizoId] };
    });
  },

  quitarConjuroConocido: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      conjurosConocidosIds: (pj.conjurosConocidosIds || []).filter((hId) => !coincideHechizoId(hId, hechizoId)),
      conjurosPreparadosIds: (pj.conjurosPreparadosIds || []).filter((hId) => !coincideHechizoId(hId, hechizoId))
    }));
  },

  alternarConjuroPreparado: (id, hechizoId) => {
    mutarPersonaje(set, id, (pj) => {
      const preparados = pj.conjurosPreparadosIds || [];
      const estaPreparado = preparados.some((hId) => coincideHechizoId(hId, hechizoId));
      const nuevaLista = estaPreparado
        ? preparados.filter((hId) => !coincideHechizoId(hId, hechizoId))
        : [...preparados, hechizoId];

      return { ...pj, conjurosPreparadosIds: nuevaLista };
    });
  },

  gastarEspacioConjuro: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const max = pj.espaciosConjuroMaximos?.[nivelClave] || 0;
      const gastados = pj.espaciosConjuroGastados?.[nivelClave] || 0;
      if (gastados >= max) return pj;

      return {
        ...pj,
        espaciosConjuroGastados: {
          ...pj.espaciosConjuroGastados,
          [nivelClave]: gastados + 1
        }
      };
    });
  },

  recuperarEspacioConjuro: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.espaciosConjuroGastados?.[nivelClave] || 0;
      if (gastados <= 0) return pj;

      return {
        ...pj,
        espaciosConjuroGastados: {
          ...pj.espaciosConjuroGastados,
          [nivelClave]: gastados - 1
        }
      };
    });
  },

  recuperarTodosEspaciosConjuro: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      espaciosConjuroGastados: {}
    }));
  },

  gastarPuntosConjuro: (id, cantidad) => {
    if (cantidad <= 0) return;
    mutarPersonaje(set, id, (pj) => {
      const max = pj.puntosConjuroMaximos || 0;
      const gastados = pj.puntosConjuroGastados || 0;
      const nuevosGastados = Math.min(max, gastados + cantidad);
      return { ...pj, puntosConjuroGastados: nuevosGastados };
    });
  },

  recuperarPuntosConjuro: (id, cantidad) => {
    if (cantidad <= 0) return;
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.puntosConjuroGastados || 0;
      const nuevosGastados = Math.max(0, gastados - cantidad);
      return { ...pj, puntosConjuroGastados: nuevosGastados };
    });
  },

  recuperarTodosPuntosConjuro: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      puntosConjuroGastados: 0
    }));
  },

  gastarEspacioPacto: (id) => {
    mutarPersonaje(set, id, (pj) => {
      const max = pj.espaciosPactoMaximos || 0;
      const gastados = pj.espaciosPactoGastados || 0;
      if (gastados >= max) return pj;
      return { ...pj, espaciosPactoGastados: gastados + 1 };
    });
  },

  recuperarEspaciosPacto: (id) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      espaciosPactoGastados: 0
    }));
  },

  modificarPuntosHechiceria: (id, delta) => {
    mutarPersonaje(set, id, (pj) => {
      const max = pj.puntosHechiceriaMaximos || 0;
      const actual = pj.puntosHechiceriaActuales ?? max;
      const nuevo = Math.max(0, Math.min(max, actual + delta));
      return { ...pj, puntosHechiceriaActuales: nuevo };
    });
  },

  asignarArcanoMistico: (id, nivel, hechizoId) => {
    const nivelClave = String(nivel);
    const entrada = `${nivelClave}:${hechizoId}`;
    mutarPersonaje(set, id, (pj) => {
      const anteriores = (pj.arcanoMisticoIds || []).filter(
        (item) => !item.startsWith(`${nivelClave}:`) && item !== hechizoId
      );
      return {
        ...pj,
        arcanoMisticoIds: [...anteriores, entrada]
      };
    });
  },

  quitarArcanoMistico: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const filtrados = (pj.arcanoMisticoIds || []).filter(
        (item) => !item.startsWith(`${nivelClave}:`)
      );
      return { ...pj, arcanoMisticoIds: filtrados };
    });
  },

  gastarArcanoMistico: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.arcanoMisticoGastados || [];
      if (gastados.includes(nivelClave)) return pj;
      return { ...pj, arcanoMisticoGastados: [...gastados, nivelClave] };
    });
  },

  recuperarArcanoMistico: (id, nivel) => {
    const nivelClave = String(nivel);
    mutarPersonaje(set, id, (pj) => {
      const gastados = pj.arcanoMisticoGastados || [];
      return { ...pj, arcanoMisticoGastados: gastados.filter((n) => n !== nivelClave) };
    });
  },

  sincronizarConjurosSubclase: (id) => {
    mutarPersonaje(set, id, (pj) => sincronizarConjurosSubclaseHelper(pj));
  },

  establecerOverridesMagia: (id, overrides) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      overrideEspaciosConjuro:
        overrides.overrideEspacios !== undefined ? overrides.overrideEspacios : pj.overrideEspaciosConjuro,
      overridePuntosConjuro:
        overrides.overridePuntos !== undefined ? overrides.overridePuntos : pj.overridePuntosConjuro
    }));
    get().recalcularRecursosMagicos(id);
  },

  establecerOverrideEspacios: (id, overrides) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      overrideEspaciosConjuro: overrides
    }));
    get().recalcularRecursosMagicos(id);
  },

  establecerOverridePuntos: (id, override) => {
    mutarPersonaje(set, id, (pj) => ({
      ...pj,
      overridePuntosConjuro: override
    }));
    get().recalcularRecursosMagicos(id);
  },

  // ==========================================
  // MÉTODOS DE INVENTARIO Y MONEDAS (Apartado E)
  // ==========================================

  agregarObjetoInventario: (idPj, objeto) => {
    mutarPersonaje(set, idPj, (pj) => {
      const inventarioActual = pj.inventario || [];
      const normalizar = (s: string) => s.toLowerCase().trim();

      // Buscar si ya existe un objeto IDÉNTICO NO EQUIPADO en la mochila para fusionar
      const indiceExistente = inventarioActual.findIndex((o) => {
        if (o.equipado || objeto.equipado) return false;
        // Si ambos provienen del compendio y tienen idObjeto válido
        if (
          o.idObjeto &&
          objeto.idObjeto &&
          !o.idObjeto.startsWith("obj_custom") &&
          !objeto.idObjeto.startsWith("obj_custom")
        ) {
          return o.idObjeto === objeto.idObjeto;
        }
        // Comparación por nombre normalizado y tipo principal
        return (
          normalizar(o.nombre) === normalizar(objeto.nombre) &&
          o.tipoPrincipal === objeto.tipoPrincipal
        );
      });

      if (indiceExistente !== -1) {
        const copia = [...inventarioActual];
        const exist = copia[indiceExistente];
        copia[indiceExistente] = {
          ...exist,
          cantidad: (exist.cantidad || 1) + (objeto.cantidad || 1)
        };
        return {
          ...pj,
          inventario: copia
        };
      }

      return {
        ...pj,
        inventario: [...inventarioActual, objeto]
      };
    });
  },

  quitarObjetoInventario: (idPj, idInstancia) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).filter((o) => o.idInstancia !== idInstancia)
    }));
  },

  modificarCantidadObjeto: (idPj, idInstancia, delta) => {
    mutarPersonaje(set, idPj, (pj) => {
      const inventarioActual = pj.inventario || [];
      const actualizado = inventarioActual
        .map((o) => {
          if (o.idInstancia !== idInstancia) return o;
          const nuevaCantidad = o.cantidad + delta;
          return nuevaCantidad <= 0 ? null : { ...o, cantidad: nuevaCantidad };
        })
        .filter((o): o is ObjetoInventario => o !== null);
      return {
        ...pj,
        inventario: actualizado
      };
    });
  },

  alternarEquipadoObjeto: (idPj, idInstancia) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: procesarAlternarEquipado(pj.inventario || [], idInstancia)
    }));
  },

  alternarSintonizadoObjeto: (idPj, idInstancia) => {
    mutarPersonaje(set, idPj, (pj) => {
      const inventarioActual = pj.inventario || [];
      const objTarget = inventarioActual.find((o) => o.idInstancia === idInstancia);
      if (!objTarget || !objTarget.sintonizacionRequerida) return pj;

      const totalSintonizados = contarSintonizaciones(inventarioActual);
      // Si no está sintonizado y ya hay 3 activos, bloquear la sintonización
      if (!objTarget.sintonizado && totalSintonizados >= 3) {
        return pj;
      }

      return {
        ...pj,
        inventario: inventarioActual.map((o) =>
          o.idInstancia === idInstancia ? { ...o, sintonizado: !o.sintonizado } : o
        )
      };
    });
  },

  actualizarNotasObjeto: (idPj, idInstancia, notas) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).map((o) =>
        o.idInstancia === idInstancia ? { ...o, notas } : o
      )
    }));
  },

  actualizarObjetoInventario: (idPj, idInstancia, cambios) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).map((o) =>
        o.idInstancia === idInstancia ? { ...o, ...cambios } : o
      )
    }));
  },

  modificarCargasObjeto: (idPj, idInstancia, delta) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).map((o) => {
        if (o.idInstancia !== idInstancia || o.cargasMaximas === undefined) return o;
        const actuales = o.cargasActuales !== undefined ? o.cargasActuales : o.cargasMaximas;
        const nuevas = Math.max(0, Math.min(o.cargasMaximas, actuales + delta));
        return { ...o, cargasActuales: nuevas };
      })
    }));
  },

  cambiarContenedorObjeto: (idPj, idInstancia, contenedor) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: (pj.inventario || []).map((o) => {
        if (o.idInstancia !== idInstancia) return o;
        // Si se traslada a un contenedor no-mochila (Bolsa de Contención, Montura, Almacén),
        // se desequipa automáticamente si estaba equipado.
        const desequipar = contenedor !== "mochila";
        return {
          ...o,
          contenedor,
          equipado: desequipar ? false : o.equipado
        };
      })
    }));
  },

  desempaquetarPaquete: (idPj, idInstancia, baseDatosObjetos) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      inventario: desempaquetarPaqueteInventario(pj.inventario || [], idInstancia, baseDatosObjetos)
    }));
  },

  establecerMonedas: (idPj, monedas) => {
    mutarPersonaje(set, idPj, (pj) => {
      const actual = pj.bolsaMonedas || { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 };
      return {
        ...pj,
        bolsaMonedas: {
          pc: Math.max(0, monedas.pc !== undefined ? monedas.pc : actual.pc),
          pp: Math.max(0, monedas.pp !== undefined ? monedas.pp : actual.pp),
          pe: Math.max(0, monedas.pe !== undefined ? monedas.pe : actual.pe),
          po: Math.max(0, monedas.po !== undefined ? monedas.po : actual.po),
          ppt: Math.max(0, monedas.ppt !== undefined ? monedas.ppt : actual.ppt)
        }
      };
    });
  },

  modificarMoneda: (idPj, tipo, delta) => {
    mutarPersonaje(set, idPj, (pj) => {
      const actual = pj.bolsaMonedas || { pc: 0, pp: 0, pe: 0, po: 0, ppt: 0 };
      const valorActual = actual[tipo] || 0;
      const nuevoValor = Math.max(0, valorActual + delta);
      return {
        ...pj,
        bolsaMonedas: {
          ...actual,
          [tipo]: nuevoValor
        }
      };
    });
  }
});

