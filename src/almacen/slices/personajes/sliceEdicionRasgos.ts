import { reconciliarConjurosRasgos } from "@/servicios/rasgos/reconciliarConjurosRasgos";
import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { migrarMetadatosRasgos } from "@/servicios/migradorRasgosHeredados";
import { calcularBonoHPMaximoRasgos, calcularUsosMaximosRasgo, esRasgoHabilitadoPorOpcion } from "@/servicios/evaluadorEfectosRasgos";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceRasgos } from "./slicePersonajesTipos";

export const crearSliceEdicionRasgos: StateCreator<
  EstadoDM,
  [],
  [],
  Pick<
    SubSliceRasgos,
    | "agregarRasgoPersonaje"
    | "actualizarRasgoPersonaje"
    | "eliminarRasgoPersonaje"
    | "sincronizarRasgosPersonaje"
    | "alternarOcultarRasgo"
    | "desocultarTodosLosRasgos"
    | "alternarOcultarConjuro"
    | "desocultarTodosLosConjuros"
  >
> = (set) => ({
agregarRasgoPersonaje: (idPj, rasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      let rasgoAjustado = rasgo;
      if (rasgo.tieneUsosLimitados) {
        const maxUsos = rasgo.formulaEscalado
          ? calcularUsosMaximosRasgo(rasgo, pj)
          : (rasgo.usosMaximos ?? 1);
        rasgoAjustado = {
          ...rasgo,
          usosMaximos: maxUsos,
          usosRestantes: rasgo.usosRestantes !== undefined ? rasgo.usosRestantes : maxUsos
        };
      }
      const rasgosActuales = migrarMetadatosRasgos([...(pj.rasgos || []), rasgoAjustado]);
      const pjTemp = { ...pj, rasgos: rasgosActuales };
      const bonoPrevio = calcularBonoHPMaximoRasgos(pj);
      const bonoNuevo = calcularBonoHPMaximoRasgos(pjTemp);
      const deltaBono = bonoNuevo - bonoPrevio;
      const nuevoBase = Math.max(1, (pj.hpMaximoBase || pj.hpMaximo || 10) + deltaBono);
      const nuevoMax = Math.max(1, (pj.hpMaximo || 1) + deltaBono);


      return {
        ...pjTemp,
        hpMaximoBase: nuevoBase,
        hpMaximo: nuevoMax,
        hpActual: Math.min(pj.hpActual + (deltaBono > 0 ? deltaBono : 0), nuevoMax),
        ...reconciliarConjurosRasgos(pj, rasgosActuales)
      };
    });
  },

actualizarRasgoPersonaje: (idPj, idRasgo, cambios) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosActuales = (pj.rasgos || []).map((r) =>
        r.id === idRasgo ? { ...r, ...cambios } : r
      );
      const pjTemp = { ...pj, rasgos: rasgosActuales };
      const bonoPrevio = calcularBonoHPMaximoRasgos(pj);
      const bonoNuevo = calcularBonoHPMaximoRasgos(pjTemp);
      const deltaBono = bonoNuevo - bonoPrevio;
      const nuevoBase = Math.max(1, (pj.hpMaximoBase || pj.hpMaximo || 10) + deltaBono);
      const nuevoMax = Math.max(1, (pj.hpMaximo || 1) + deltaBono);
      return {
        ...pjTemp,
        ...reconciliarConjurosRasgos(pj, rasgosActuales),
        hpMaximoBase: nuevoBase,
        hpMaximo: nuevoMax,
        hpActual: Math.min(pj.hpActual + (deltaBono > 0 ? deltaBono : 0), nuevoMax)
      };
    });
  },

eliminarRasgoPersonaje: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosFiltrados = (pj.rasgos || []).filter((r) => r.id !== idRasgo);
      const pjTemp = { ...pj, rasgos: rasgosFiltrados };

      const bonoPrevio = calcularBonoHPMaximoRasgos(pj);
      const bonoNuevo = calcularBonoHPMaximoRasgos(pjTemp);
      const deltaBono = bonoNuevo - bonoPrevio;
      const nuevoBase = Math.max(1, (pj.hpMaximoBase || pj.hpMaximo || 10) + deltaBono);
      const nuevoMax = Math.max(1, (pj.hpMaximo || 1) + deltaBono);
      return {
        ...pjTemp,
        hpMaximoBase: nuevoBase,
        hpMaximo: nuevoMax,
        hpActual: Math.min(pj.hpActual, nuevoMax),
        ...reconciliarConjurosRasgos(pj, rasgosFiltrados)
      };
    });
  },

sincronizarRasgosPersonaje: (idPj) => {
    mutarPersonaje(set, idPj, (pj) => {
      const rasgosBase = sincronizarRasgosAutomaticos(pj);
      const rasgosSincronizados = rasgosBase.map((r) => {
        if (r.tieneUsosLimitados && r.formulaEscalado) {
          const maxUsos = calcularUsosMaximosRasgo(r, pj);
          return {
            ...r,
            usosMaximos: maxUsos,
            usosRestantes: r.usosRestantes !== undefined ? Math.min(r.usosRestantes, maxUsos) : maxUsos
          };
        }
        return r;
      });
      const pjConRasgos = { ...pj, rasgos: rasgosSincronizados };
      // Sincronizar trucos de rasgos habilitados
      let trucosActualizados = [...(pj.trucosConocidosIds || [])];
      for (const r of rasgosSincronizados) {
        if (r.activo !== false && esRasgoHabilitadoPorOpcion(r, rasgosSincronizados)) {
          if (Array.isArray(r.selectores)) {
            for (const s of r.selectores) {
              const sid = s.id.toLowerCase();
              if (sid.includes("truco") || sid.includes("cantrip")) {
                for (const v of s.valorActual || []) {
                  if (v && !trucosActualizados.includes(v)) {
                    trucosActualizados.push(v);
                  }
                }
              }
            }
          }
        }
      }

      return {
        ...pjConRasgos,
        trucosConocidosIds: trucosActualizados
      };
    });
  },

  alternarOcultarRasgo: (idPj, idRasgo) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      rasgos: (pj.rasgos || []).map((r) =>
        r.id === idRasgo ? { ...r, oculto: !r.oculto } : r
      )
    }));
  },

  desocultarTodosLosRasgos: (idPj) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      rasgos: (pj.rasgos || []).map((r) =>
        r.oculto ? { ...r, oculto: false } : r
      )
    }));
  },

  alternarOcultarConjuro: (idPj, idConjuro) => {
    mutarPersonaje(set, idPj, (pj) => {
      const prev = new Set(pj.conjurosOcultos || []);
      if (prev.has(idConjuro)) {
        prev.delete(idConjuro);
      } else {
        prev.add(idConjuro);
      }
      return {
        ...pj,
        conjurosOcultos: Array.from(prev)
      };
    });
  },

  desocultarTodosLosConjuros: (idPj) => {
    mutarPersonaje(set, idPj, (pj) => ({
      ...pj,
      conjurosOcultos: []
    }));
  }
});
