import type { StateCreator } from "zustand";
import type { EstadoDM } from "@/almacen/usarAlmacenDM";
import { construirDoteDeMejoraCaracteristica, construirDoteDeDonEpico, construirDoteDeEstiloCombate, obtenerNivelEfectivoParaRasgo } from "@/servicios/gestorClases";
import { construirDoteDeVersatil } from "@/servicios/gestorEspecies";
import { calcularBonoHPMaximoRasgos, esRasgoHabilitadoPorOpcion } from "@/servicios/evaluadorEfectosRasgos";
import { esSelectorDeConjuros, esSelectorSoloLibro, agregarValoresSelectorAListas, quitarValoresSelectorDeListas, type ListasConjurosSelector } from "@/utiles/selectoresConjuros";
import { aplicarCondicion } from "@/servicios/procesadorCondiciones";
import { mutarPersonaje } from "../helpers/mutarPersonaje";
import type { SubSliceRasgos } from "./slicePersonajesTipos";
import type { TamanoPersonaje } from "@/tipos";
import { normalizarTextoSeguro } from "./condicionesRasgosHelpers";
import { generarId } from "@/utiles/generarId";

export const crearSliceSelectoresRasgos: StateCreator<EstadoDM, [], [], Pick<SubSliceRasgos, "actualizarSeleccionRasgo">> = (set, get) => ({
actualizarSeleccionRasgo: (idPj, idRasgo, idSelector, valorActual) => {
    mutarPersonaje(set, idPj, (pj) => {
      let tamanoActualizado = pj.tamano;
      const esSelectorTamano =
        idSelector === "selector_tamano_especie" || idSelector.toLowerCase().includes("tamano");

      if (esSelectorTamano && valorActual && valorActual.length > 0) {
        const valNorm = normalizarTextoSeguro(valorActual[0]);
        if (valNorm.startsWith("pequen")) {
          tamanoActualizado = "Pequeño";
        } else if (valNorm.startsWith("median")) {
          tamanoActualizado = "Mediano";
        } else if (valNorm.startsWith("grand")) {
          tamanoActualizado = "Grande";
        } else if (valorActual[0]) {
          tamanoActualizado = valorActual[0] as TamanoPersonaje;
        }
      }

      let rasgoObjetivoActivo = false;
      let esRevelacionCelestial = false;

      const rasgosActualizados = (pj.rasgos || []).map((r) => {
        if (r.id === idRasgo && Array.isArray(r.selectores)) {
          if (r.activo) rasgoObjetivoActivo = true;
          const rNom = normalizarTextoSeguro(r.nombre);
          if (rNom.includes("revelacion celestial") || r.id.includes("revelacion_celestial")) {
            esRevelacionCelestial = true;
          }

          const selectoresActualizados = r.selectores.map((s) => {
            if (s.id !== idSelector) return s;
            let maxSel = s.maxSelecciones;
            if (s.escaladoMaxSelecciones?.length) {
              const nivelRasgo = obtenerNivelEfectivoParaRasgo(pj, r);
              const entrada = [...s.escaladoMaxSelecciones]
                .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
                .find((e) => nivelRasgo >= e.nivelMinimo);
              if (entrada) maxSel = entrada.valor;
            }
            return {
              ...s,
              maxSelecciones: maxSel,
              valorActual
            };
          });

          // Sincronizar reactivamente conjurosOtorgados a partir de los selectores de magia/conjuros
          const esRasgoConMagia =
            r.conjurosOtorgados !== undefined ||
            r.selectores.some((s) => esSelectorDeConjuros(s));

          let conjurosOtorgadosActualizados = r.conjurosOtorgados ? [...r.conjurosOtorgados] : [];

          if (esRasgoConMagia) {
            const nuevosMagicos: string[] = [];
            const idsOpcionesSelectoresMagicos = new Set<string>();

            for (const s of selectoresActualizados) {
              if (esSelectorDeConjuros(s) && !esSelectorSoloLibro(s)) {
                (s.opciones || []).forEach((o) => idsOpcionesSelectoresMagicos.add(o.id));
                for (const v of s.valorActual || []) {
                  if (v && !nuevosMagicos.includes(v)) {
                    nuevosMagicos.push(v);
                  }
                }
              }
            }

            // Preservar conjuros predefinidos del rasgo que no procedan de opciones dinámicas de selector
            const conjurosFijosPredefinidos = (r.conjurosOtorgados || []).filter(
              (cId) => !idsOpcionesSelectoresMagicos.has(cId)
            );

            conjurosOtorgadosActualizados = Array.from(
              new Set([...conjurosFijosPredefinidos, ...nuevosMagicos])
            );
          }

          const usosRestantesActualizados =
            r.tieneUsosLimitados && r.usosRestantes === undefined
              ? (r.usosMaximos ?? 1)
              : r.usosRestantes;

          return {
            ...r,
            conjurosOtorgados: conjurosOtorgadosActualizados,
            usosRestantes: usosRestantesActualizados,
            selectores: selectoresActualizados
          };
        }
        return r;
      });

      // Sincronizar reactivamente dote asociada al rasgo de Mejora de Característica, Don Épico, Versátil (Humano) o Estilo de Combate
      const rasgoPadreMejora = rasgosActualizados.find((r) => r.id === idRasgo);
      const nomRasgoPadre = rasgoPadreMejora ? normalizarTextoSeguro(rasgoPadreMejora.nombre) : "";
      const esMejora = nomRasgoPadre === "mejora de caracteristica";
      const esDonEpico = nomRasgoPadre === "don epico";
      const esVersatil = nomRasgoPadre === "versatil" || nomRasgoPadre.includes("versatil");
      const esEstilo = nomRasgoPadre === "estilo de combate" || nomRasgoPadre.startsWith("estilo de combate");
      const esSelectorDoteASI = idSelector.includes("dote_asi") || (esMejora && idSelector.toLowerCase().includes("dote"));
      const esSelectorDoteDon = idSelector.includes("dote_don") || (esDonEpico && idSelector.toLowerCase().includes("dote"));
      const esSelectorDoteOrigen = idSelector.includes("dote_origen") || (esVersatil && idSelector.toLowerCase().includes("dote"));
      const esSelectorDoteEstilo = idSelector.includes("dote_estilo") || (esEstilo && idSelector.toLowerCase().includes("dote"));

      if (esSelectorDoteASI && rasgoPadreMejora && Array.isArray(valorActual) && valorActual.length > 0) {
        const idDoteElegida = valorActual[0];
        const idDoteAsi = `dote_asi_${normalizarTextoSeguro(idRasgo)}`;
        const indexDoteExistente = rasgosActualizados.findIndex(
          (r) => r.id === idDoteAsi || (r.origen === "dote" && r.ligadoA === idRasgo)
        );

        const nuevaDote = construirDoteDeMejoraCaracteristica(rasgoPadreMejora, idDoteElegida);
        if (indexDoteExistente !== -1) {
          rasgosActualizados[indexDoteExistente] = {
            ...nuevaDote,
            usosRestantes: rasgosActualizados[indexDoteExistente].usosRestantes ?? nuevaDote.usosRestantes,
            activo: rasgosActualizados[indexDoteExistente].activo ?? true
          };
        } else {
          rasgosActualizados.push(nuevaDote);
        }
      } else if (esSelectorDoteDon && rasgoPadreMejora && Array.isArray(valorActual) && valorActual.length > 0) {
        const idDoteElegida = valorActual[0];
        const idDoteDon = `dote_don_${normalizarTextoSeguro(idRasgo)}`;
        const indexDoteExistente = rasgosActualizados.findIndex(
          (r) => r.id === idDoteDon || (r.origen === "dote" && r.ligadoA === idRasgo)
        );

        const nuevaDote = construirDoteDeDonEpico(rasgoPadreMejora, idDoteElegida);
        if (indexDoteExistente !== -1) {
          rasgosActualizados[indexDoteExistente] = {
            ...nuevaDote,
            usosRestantes: rasgosActualizados[indexDoteExistente].usosRestantes ?? nuevaDote.usosRestantes,
            activo: rasgosActualizados[indexDoteExistente].activo ?? true
          };
        } else {
          rasgosActualizados.push(nuevaDote);
        }
      } else if (esSelectorDoteOrigen && rasgoPadreMejora && Array.isArray(valorActual) && valorActual.length > 0) {
        const idDoteElegida = valorActual[0];
        const idDoteOrigen = `dote_origen_${normalizarTextoSeguro(idRasgo)}`;
        const indexDoteExistente = rasgosActualizados.findIndex(
          (r) => r.id === idDoteOrigen || (r.origen === "dote" && r.ligadoA === idRasgo)
        );

        const nuevaDote = construirDoteDeVersatil(rasgoPadreMejora, idDoteElegida);
        if (indexDoteExistente !== -1) {
          rasgosActualizados[indexDoteExistente] = {
            ...nuevaDote,
            usosRestantes: rasgosActualizados[indexDoteExistente].usosRestantes ?? nuevaDote.usosRestantes,
            activo: rasgosActualizados[indexDoteExistente].activo ?? true
          };
        } else {
          rasgosActualizados.push(nuevaDote);
        }
      } else if (esSelectorDoteEstilo && rasgoPadreMejora && Array.isArray(valorActual) && valorActual.length > 0) {
        const idDoteElegida = valorActual[0];
        const idDoteEstilo = `dote_estilo_${normalizarTextoSeguro(idRasgo)}`;
        const indexDoteExistente = rasgosActualizados.findIndex(
          (r) => r.id === idDoteEstilo || (r.origen === "dote" && r.ligadoA === idRasgo)
        );

        const nuevaDote = construirDoteDeEstiloCombate(rasgoPadreMejora, idDoteElegida);
        if (indexDoteExistente !== -1) {
          rasgosActualizados[indexDoteExistente] = {
            ...nuevaDote,
            usosRestantes: rasgosActualizados[indexDoteExistente].usosRestantes ?? nuevaDote.usosRestantes,
            activo: rasgosActualizados[indexDoteExistente].activo ?? true
          };
        } else {
          rasgosActualizados.push(nuevaDote);
        }
      }

      // Sincronizar trucosConocidosIds del personaje
      let trucosConocidosActualizados = pj.trucosConocidosIds || [];

      let conjurosSiempreActualizados = pj.conjurosSiemprePreparadosIds || [];
      let conjurosPreparadosActualizados = pj.conjurosPreparadosIds || [];
      let conjurosConocidosActualizados = pj.conjurosConocidosIds || [];

      // Sincronizar selectores de trucos y conjuros (ej. Iniciado en la Magia, Lanzador Ritual, Erudito)
      const rasgoPrevio = (pj.rasgos || []).find((r) => r.id === idRasgo);
      const selectorPrevio = rasgoPrevio?.selectores?.find((s) => s.id === idSelector);
      const rasgoActual = rasgosActualizados.find((r) => r.id === idRasgo);
      const selectorActual = rasgoActual?.selectores?.find((s) => s.id === idSelector) || selectorPrevio;

      if (selectorActual && esSelectorDeConjuros(selectorActual) && Array.isArray(valorActual)) {
        const valoresViejos = selectorPrevio?.valorActual || [];
        let listas: ListasConjurosSelector = {
          siempre: conjurosSiempreActualizados,
          preparados: conjurosPreparadosActualizados,
          conocidos: conjurosConocidosActualizados,
          trucos: trucosConocidosActualizados
        };
        listas = quitarValoresSelectorDeListas(selectorActual, valoresViejos, listas);
        listas = agregarValoresSelectorAListas(selectorActual, valorActual, listas);
        conjurosSiempreActualizados = listas.siempre;
        conjurosPreparadosActualizados = listas.preparados;
        conjurosConocidosActualizados = listas.conocidos;
        trucosConocidosActualizados = listas.trucos;
      }

      // Sincronizar reactivamente estado activo, trucos y conjuros procedentes de rasgos hijos condicionados por requiereOpcion
      for (const r of rasgosActualizados) {
        if (r.requiereOpcion && r.ligadoA) {
          const estaHabilitado = esRasgoHabilitadoPorOpcion(r, rasgosActualizados);
          if (!estaHabilitado) {
            r.activo = false;
          } else if (!r.esActivable) {
            r.activo = true;
          }
          if (Array.isArray(r.selectores)) {
            for (const s of r.selectores) {
              if (esSelectorDeConjuros(s) && Array.isArray(s.valorActual)) {
                let listas: ListasConjurosSelector = {
                  siempre: conjurosSiempreActualizados,
                  preparados: conjurosPreparadosActualizados,
                  conocidos: conjurosConocidosActualizados,
                  trucos: trucosConocidosActualizados
                };
                if (estaHabilitado) {
                  listas = agregarValoresSelectorAListas(s, s.valorActual, listas);
                } else {
                  listas = quitarValoresSelectorDeListas(s, s.valorActual, listas);
                }
                conjurosSiempreActualizados = listas.siempre;
                conjurosPreparadosActualizados = listas.preparados;
                conjurosConocidosActualizados = listas.conocidos;
                trucosConocidosActualizados = listas.trucos;
              }
            }
          }
        }
      }

      let efectosActualizados = pj.efectosActivos || [];
      let condicionesActualizadas = pj.condicionesActivas || [];

      // Si se cambia la opción de Revelación celestial mientras está activa, sincronizar los efectos y condiciones
      if (esRevelacionCelestial && rasgoObjetivoActivo && valorActual && valorActual.length > 0) {
        const selVal = normalizarTextoSeguro(valorActual[0]);
        let nuevoNombreEfecto = "Alas Celestiales";
        if (selVal.includes("fulgor")) nuevoNombreEfecto = "Fulgor Interior";
        else if (selVal.includes("mortaja")) nuevoNombreEfecto = "Mortaja Necrótica";

        const efectoPrevio = efectosActualizados.find((e) => {
          const eNorm = normalizarTextoSeguro(e.nombre);
          return (
            eNorm.includes("alas celestiales") ||
            eNorm.includes("fulgor interior") ||
            eNorm.includes("mortaja necrotica")
          );
        });

        const rondaActual = get().rondaActual || 1;
        const expiraRonda =
          efectoPrevio?.expiraRonda && efectoPrevio.expiraRonda > rondaActual
            ? efectoPrevio.expiraRonda
            : rondaActual + 10;

        // Purgar efectos y condiciones previos de revelación
        efectosActualizados = efectosActualizados.filter((e) => {
          const eNorm = normalizarTextoSeguro(e.nombre);
          return (
            !eNorm.includes("alas celestiales") &&
            !eNorm.includes("fulgor interior") &&
            !eNorm.includes("mortaja necrotica")
          );
        });

        condicionesActualizadas = condicionesActualizadas.filter((c) => {
          const cNorm = normalizarTextoSeguro(c);
          return (
            !cNorm.includes("alas celestiales") &&
            !cNorm.includes("fulgor interior") &&
            !cNorm.includes("mortaja necrotica")
          );
        });

        efectosActualizados.push({
          id: generarId(nuevoNombreEfecto.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 20)),
          nombre: nuevoNombreEfecto,
          expiraRonda,
          concentracion: false
        });

        condicionesActualizadas = aplicarCondicion(condicionesActualizadas, nuevoNombreEfecto);
      }

      const bonoPrevio = calcularBonoHPMaximoRasgos(pj);
      const bonoNuevo = calcularBonoHPMaximoRasgos({ ...pj, rasgos: rasgosActualizados });
      const deltaBono = bonoNuevo - bonoPrevio;
      const hpMaximoBase = deltaBono !== 0 ? Math.max(1, (pj.hpMaximoBase || pj.hpMaximo || 10) + deltaBono) : pj.hpMaximoBase;
      const hpMaximo = deltaBono !== 0 ? Math.max(1, (pj.hpMaximo || 1) + deltaBono) : pj.hpMaximo;
      const hpActual = deltaBono > 0 ? pj.hpActual + deltaBono : Math.min(pj.hpActual, hpMaximo || pj.hpActual);

      return {
        ...pj,
        hpMaximoBase,
        hpMaximo,
        hpActual,
        tamano: tamanoActualizado,
        trucosConocidosIds: trucosConocidosActualizados,
        conjurosSiemprePreparadosIds: conjurosSiempreActualizados,
        conjurosPreparadosIds: conjurosPreparadosActualizados,
        conjurosConocidosIds: conjurosConocidosActualizados,
        rasgos: rasgosActualizados,
        efectosActivos: efectosActualizados,
        condicionesActivas: condicionesActualizadas
      };
    });

    // Sincronizar cola de iniciativa si cambió revelación celestial
    const state = get();
    if (state.colaIniciativa && state.colaIniciativa.length > 0) {
      const pjActualizado = state.personajes.find((p) => p.id === idPj);
      if (pjActualizado) {
        const nombreNorm = (pjActualizado.nombre || "").trim().toLowerCase();
        const nuevaCola = state.colaIniciativa.map((c) => {
          const coincide =
            c.id === pjActualizado.id ||
            (pjActualizado.idMiniaturaTS && c.id === pjActualizado.idMiniaturaTS) ||
            (nombreNorm && c.nombre.trim().toLowerCase() === nombreNorm);
          if (!coincide) return c;

          const efectosPj = pjActualizado.efectosActivos || [];
          const nombresEfectos = new Set(efectosPj.map((e) => e.nombre.toLowerCase().trim()));
          const tieneEfectoConcentracion = efectosPj.some(
            (ef) => ef.concentracion || ef.nombre.toLowerCase().startsWith("concentra")
          );
          const condicionesSinDuplicados = (pjActualizado.condicionesActivas || []).filter((cond) => {
            const cNorm = cond.toLowerCase().trim();
            const cBase = cond.split(" (")[0].toLowerCase().trim();
            if (tieneEfectoConcentracion && cNorm.includes("concentra")) return false;
            if (nombresEfectos.has(cNorm) || nombresEfectos.has(cBase)) return false;
            return true;
          });

          return { ...c, condiciones: condicionesSinDuplicados, efectos: efectosPj };
        });
        set({ colaIniciativa: nuevaCola });
      }
    }
  }
});
