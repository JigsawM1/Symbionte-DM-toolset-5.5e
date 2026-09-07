import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import type { PersonajeJugador } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes";
import { generarId } from "@/utiles/generarId";
import { calcularTodosRecursosMagicos, detectarTipoLanzador } from "@/servicios/calculadorMagia";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { sincronizarConjurosSubclaseHelper } from "@/servicios/sincronizadorConjurosSubclase";
import { aplicarBuildClaseAPersonaje } from "@/servicios/gestorClases";
import type { SubSlicePersonajesBase } from "./slicePersonajesTipos";

export const crearSubSlicePersonajesBase: StateCreator<
  EstadoDM,
  [],
  [],
  SubSlicePersonajesBase
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

    // Auto-detección y sincronización de rasgos al crear
    if (!nuevoPersonaje.rasgos || nuevoPersonaje.rasgos.length === 0) {
      nuevoPersonaje = {
        ...nuevoPersonaje,
        rasgos: sincronizarRasgosAutomaticos(nuevoPersonaje)
      };
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

        // Auto-sincronizar rasgos estándar si cambia la identidad de clase, nivel o especie
        const clasesCambiadas =
          cambios.clases !== undefined &&
          JSON.stringify(cambios.clases) !== JSON.stringify(pj.clases);
        const claseCambiada = cambios.clase !== undefined && cambios.clase !== pj.clase;
        const subclaseCambiada = cambios.subclase !== undefined && cambios.subclase !== pj.subclase;
        const nivelCambiado = cambios.nivel !== undefined && cambios.nivel !== pj.nivel;
        const especieCambiada =
          (cambios.especie !== undefined && cambios.especie !== pj.especie) ||
          (cambios.subespecie !== undefined && cambios.subespecie !== pj.subespecie);

        const cambioIdentidadOProgreso =
          clasesCambiadas || claseCambiada || subclaseCambiada || nivelCambiado || especieCambiada;

        if (
          cambioIdentidadOProgreso ||
          (cambios.rasgos === undefined && (cambios.clase !== undefined || cambios.nivel !== undefined)) ||
          !fusionado.rasgos ||
          fusionado.rasgos.length === 0
        ) {
          fusionado = {
            ...fusionado,
            rasgos: sincronizarRasgosAutomaticos(fusionado)
          };
        } else if (cambios.caracteristicas?.carisma !== undefined || cambios.overridesFijos?.carisma !== undefined) {
          const scoreCar = fusionado.overridesFijos?.carisma ?? fusionado.caracteristicas?.carisma ?? 10;
          const modCar = Math.floor((scoreCar - 10) / 2);
          const usosNuevos = Math.max(1, modCar);

          fusionado = {
            ...fusionado,
            rasgos: (fusionado.rasgos || []).map((r) => {
              const norm = (r.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              if (
                norm.includes("inspiracion bardica") ||
                (r.tieneUsosLimitados && (r.formulaEscalado || "").toLowerCase().includes("carisma")) ||
                (r.tieneUsosLimitados && (r.descripcion || "").toLowerCase().includes("modificador por carisma"))
              ) {
                const diferencia = usosNuevos - (r.usosMaximos ?? 1);
                const restantes = r.usosRestantes ?? (r.usosMaximos ?? 1);
                return {
                  ...r,
                  usosMaximos: usosNuevos,
                  usosRestantes: Math.max(0, Math.min(usosNuevos, restantes + (diferencia > 0 ? diferencia : 0)))
                };
              }
              return r;
            })
          };
        }

        // Sincronizar dinámicamente conjuros de subclase
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

  aplicarBuildClasePersonaje: (id, claseNombre, nivel, subclaseNombre, opciones) => {
    set((state) => ({
      personajes: state.personajes.map((pj) => {
        if (pj.id !== id) return pj;
        return aplicarBuildClaseAPersonaje(pj, claseNombre, nivel, subclaseNombre, opciones);
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

  vincularMiniaturaTSPersonaje: (id, idMiniatura) => {
    set((state) => ({
      personajes: state.personajes.map((pj) =>
        pj.id === id ? { ...pj, idMiniaturaTS: idMiniatura } : pj
      )
    }));
  }
});
