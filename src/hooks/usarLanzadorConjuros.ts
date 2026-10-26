import { obtenerVarianteConjuro, obtenerOpcionesRecursoConjuro } from "@/servicios/rasgos/lanzamientoRecursoRasgos";
import { elegirVarianteConjuro, elegirOpcionLanzamiento } from "@/componentes/caracteristicas/rasgos/elegirVarianteConjuro";
import { resolverRecuperacionDiferida } from "@/servicios/rasgos/emitirRecuperacionDiferida";
import { emitirTiradaConRasgos } from "@/servicios/rasgos/emisionTiradaRasgos";
import { obtenerMaximosEspaciosEfectivos } from "@/servicios/rasgos/conversionRecursosRasgos";
import { aplicarConfiguracionConjurosRasgos } from "@/servicios/rasgos/conjurosGratuitosRasgos";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useMemo } from "react";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import type { PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import { logger } from "@/utiles/logger";
import {
  validarLanzamiento,
  prepararLanzamiento,
  type ModoLanzamiento,
  type SolicitudLanzamiento,
  type ContextoMagicoPersonaje,
  type ResultadoValidacion
} from "@/servicios/servicioLanzamientoConjuros";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarAccionesConfiguracion, usarSistemaMagia } from "@/almacen/selectores/usarEstadoConfiguracion";
import { tieneConjuroGratuitoActivo, obtenerBonoDanoConjuroExtra } from "@/servicios/evaluadorEfectosRasgos";
import { obtenerModificadorAptitudMagica } from "@/servicios/calculadorMagia";
import { tieneRestriccionRasgos } from "@/servicios/rasgos/restriccionesRasgos";
import { opcionesLanzamientoEstado, obtenerLanzamientoEstado } from "@/servicios/rasgos/lanzamientoEstadoRasgo";
import { rasgoMagicoHabilitado } from "@/servicios/rasgos/ampliacionesListaConjuros";
import { normalizar } from "@/servicios/rasgos/utilidadesRasgos";
import { nivelEspacioGastado } from "@/servicios/rasgos/curacionDeclarativa";

export interface OpcionesLanzadorConjuros {
  personaje?: PersonajeJugador | null;
  claseLanzamiento?: string;
  penalizacionArmadura?: PenalizacionArmadura | null;
  bonoAtaqueMagico?: number;
  cdSalvacionPersonaje?: number;
  permitirUpcastLibre?: boolean;
  sistemaMagia?: "espacios" | "puntos";
}

export interface ControlLanzadorConjuros {
  puedeLanzar: boolean;
  motivoBloqueo?: string;
  validar: (solicitud: Partial<SolicitudLanzamiento> & { hechizo: HechizoBase; modo: ModoLanzamiento }) => ResultadoValidacion;
  lanzar: (solicitud: Partial<SolicitudLanzamiento> & { hechizo: HechizoBase; modo: ModoLanzamiento }) => Promise<boolean>;
}

import { operacionesMagicasEnCurso as lanzamientosEnCurso } from "@/servicios/rasgos/bloqueoOperacionesMagicas";

function contextoVigente(contexto: ContextoMagicoPersonaje, personaje?: PersonajeJugador | null): ContextoMagicoPersonaje {
  const actual = personaje ? usarAlmacenDM.getState().personajes.find(p => p.id === personaje.id) ?? personaje : undefined;
  if (!actual) return contexto;
  return { ...contexto, personajeActual: actual, espaciosConjuroMaximos: obtenerMaximosEspaciosEfectivos(actual),
    espaciosConjuroGastados: actual.espaciosConjuroGastados, puntosConjuroDisponibles: actual.puntosConjuroMaximos - actual.puntosConjuroGastados,
    espaciosPactoGastados: actual.espaciosPactoGastados, espaciosPactoMaximos: actual.espaciosPactoMaximos,
    nivelEspacioPacto: actual.nivelEspacioPacto, arcanoMisticoGastados: actual.arcanoMisticoGastados };
}

/**
 * Hook centralizado para orquestar la validación, construcción de fórmulas,
 * tirada de dados 3D en TaleSpire, deducción de recursos mágicos en Zustand
 * y gestión de concentración.
 */
export function usarLanzadorConjuros(opciones: OpcionesLanzadorConjuros): ControlLanzadorConjuros {
  const {
    personaje,
    penalizacionArmadura,
    bonoAtaqueMagico = 0,
    cdSalvacionPersonaje,
    sistemaMagia: sistemaMagiaProp
  } = opciones;

  const sistemaMagiaConfigurado = usarSistemaMagia();
  const sistemaMagiaEfectivo = sistemaMagiaProp ?? sistemaMagiaConfigurado ?? "espacios";

  const { consumirRecursoConjuro, establecerConcentracion } = usarAlmacenDM(useShallow(s => ({
    consumirRecursoConjuro: s.consumirRecursoConjuro, establecerConcentracion: s.establecerConcentracion,
  })));

  const { agregarNotificacion } = usarAccionesConfiguracion();

  // 1. Construir contexto del personaje
  const contexto = useMemo<ContextoMagicoPersonaje>(() => {
    if (!personaje) {
      return {
        penalizacionArmadura: penalizacionArmadura ?? null,
        espaciosConjuroMaximos: {},
        nivelConjuroMaximo: 0,
        sistemaMagia: sistemaMagiaEfectivo,
        esLanzadorPacto: false,
        nivelEspacioPacto: 0,
        espaciosPactoMaximos: 0,
        espaciosPactoGastados: 0,
        arcanoMisticoGastados: []
      };
    }

    const tienePacto =
      (personaje.espaciosPactoMaximos || 0) > 0 ||
      (personaje.clasesLanzadoras || []).some((c) => c.tipoLanzador === "pacto");

    // Identificar conjuros que sustituyen obligatoriamente el gasto de espacio al lanzar rápido (ej: Orden imperiosa con Manto de Majestad)
    const conjurosGratuitosActivos: string[] = [];
    if (tieneConjuroGratuitoActivo(personaje, "Orden imperiosa")) {
      conjurosGratuitosActivos.push("Orden imperiosa");
    }

    return {
      personajeActual: personaje,
      penalizacionArmadura: penalizacionArmadura ?? null,
      espaciosConjuroMaximos: personaje.espaciosConjuroMaximos || {},
      espaciosConjuroGastados: personaje.espaciosConjuroGastados,
      puntosConjuroDisponibles: personaje.puntosConjuroMaximos - personaje.puntosConjuroGastados,
      nivelConjuroMaximo: personaje.nivelConjuroMaximo || 0,
      sistemaMagia: sistemaMagiaEfectivo,
      costePuntosPorNivel: COSTE_PUNTOS_POR_NIVEL,
      esLanzadorPacto: tienePacto,
      nivelEspacioPacto: personaje.nivelEspacioPacto || 0,
      espaciosPactoMaximos: personaje.espaciosPactoMaximos || 0,
      espaciosPactoGastados: personaje.espaciosPactoGastados || 0,
      arcanoMisticoGastados: personaje.arcanoMisticoGastados || [],
      conjurosGratuitosActivos
    };
  }, [personaje, penalizacionArmadura, sistemaMagiaEfectivo]);

  // 2. Estado general de bloqueo por armadura
  const estaBloqueadoPorArmadura = Boolean(penalizacionArmadura?.sinCompetencia);
  const estaBloqueadoPorRasgo = useMemo(() => Boolean(personaje && tieneRestriccionRasgos(personaje, "conjuros")), [personaje]);
  const motivoBloqueoArmadura = estaBloqueadoPorArmadura
    ? `No puedes lanzar conjuros mientras vistas ${[
        penalizacionArmadura?.armaduraNoCompetente,
        penalizacionArmadura?.escudoNoCompetente
      ]
        .filter(Boolean)
        .join(" o ")} sin competencia.`
    : undefined;

  // 3. Validador reactivo
  const validar = useCallback(
    (solicitudIncompleta: Partial<SolicitudLanzamiento> & { hechizo: HechizoBase; modo: ModoLanzamiento }): ResultadoValidacion => {
      if (personaje && lanzamientosEnCurso.has(personaje.id)) return { permitido: false, motivo: "Ya hay un lanzamiento en curso." };
      let contextoEfectivo = contextoVigente(contexto, personaje);
      if (solicitudIncompleta.modo === "objetoMagico" && solicitudIncompleta.objetoInstanciaId) {
        const objEnInventario = (personaje?.inventario || []).find(
          (o) => o.idInstancia === solicitudIncompleta.objetoInstanciaId
        );
        if (objEnInventario) {
          const cMax = objEnInventario.cargasMaximas ?? 0;
          const cAct = objEnInventario.cargasActuales !== undefined ? objEnInventario.cargasActuales : cMax;
          contextoEfectivo = {
            ...contextoEfectivo,
            cargasObjetoActuales: cAct
          };
        }
      }

      const bonoDanoMagico = personaje
        ? obtenerBonoDanoConjuroExtra(personaje, {
            esTruco: solicitudIncompleta.hechizo.nivel === 0,
            nivelLanzamiento: solicitudIncompleta.nivelLanzamiento ?? solicitudIncompleta.hechizo.nivel,
            escuela: solicitudIncompleta.hechizo.escuela,
            tipoDano: solicitudIncompleta.hechizo.tipoDaño,
            nombreConjuro: solicitudIncompleta.hechizo.nombre
          })
        : 0;

      const clase = solicitudIncompleta.claseLanzamiento ?? opciones.claseLanzamiento;
      const aptitud = personaje?.clasesLanzadoras.find(c => c.clase === clase)?.habilidadConjuro;
      const modificadorHabilidad = personaje ? obtenerModificadorAptitudMagica(personaje, aptitud ?? undefined) : 0;

      const solicitudCompleta: SolicitudLanzamiento = aplicarConfiguracionConjurosRasgos(contextoEfectivo.personajeActual, {
        claseLanzamiento: opciones.claseLanzamiento,
        nombrePersonaje: personaje?.nombre || "Personaje",
        nivelPersonaje: personaje?.nivel || 1,
        bonoAtaqueMagico,
        bonoDanoMagico,
        modificadorHabilidad,
        cdSalvacionPersonaje,
        ...solicitudIncompleta
      });
      return validarLanzamiento(solicitudCompleta, contextoEfectivo);
    },
    [personaje, bonoAtaqueMagico, cdSalvacionPersonaje, contexto, opciones.claseLanzamiento]
  );

  // 4. Ejecutor central de lanzamiento
  const lanzar = useCallback(
    async (
      solicitudIncompleta: Partial<SolicitudLanzamiento> & { hechizo: HechizoBase; modo: ModoLanzamiento }
    ): Promise<boolean> => {
      if (personaje && lanzamientosEnCurso.has(personaje.id)) return false;
      const actual = personaje && usarAlmacenDM.getState().personajes.find(p => p.id === personaje.id);
      const alternativas = actual && solicitudIncompleta.modo === "espacio" ? obtenerOpcionesRecursoConjuro(actual,
        solicitudIncompleta.hechizo, solicitudIncompleta.claseLanzamiento ?? opciones.claseLanzamiento) : [];
      const estados = actual && solicitudIncompleta.modo === "espacio" ? opcionesLanzamientoEstado(actual, solicitudIncompleta.hechizo, solicitudIncompleta.claseLanzamiento ?? opciones.claseLanzamiento) : [];
      if (actual && (alternativas.length || estados.length)) {
        const normal = validarLanzamiento({ ...solicitudIncompleta, modo: "espacio" }, contextoVigente(contexto, personaje));
        const eleccion = await elegirOpcionLanzamiento(actual.id, { nombre: solicitudIncompleta.hechizo.nombre,
          etiqueta: `Lanzamiento de ${solicitudIncompleta.hechizo.nombre}`, descripcion: "Elige cómo pagar este lanzamiento. Solo se gastará el recurso elegido.",
          opciones: [{ id: "normal", texto: contexto.sistemaMagia === "puntos" ? "Con puntos de conjuro" : "Con espacio de conjuro",
            detalle: `Nivel ${solicitudIncompleta.nivelLanzamiento ?? solicitudIncompleta.hechizo.nivel}${normal.motivo ? ` · ${normal.motivo}` : ""}`, deshabilitado: !normal.permitido },
          ...estados.map(r => ({ id: r.id, texto: `Con ${r.nombre}`, detalle: `Acción adicional · ${r.activo ? "Repetir sin gastar usos" : "1 uso · Concentración, 1 minuto"}`,
            deshabilitado: !obtenerLanzamientoEstado(actual, r.id, solicitudIncompleta.hechizo, r.lanzamientoConActivacion!.nivel) })), ...alternativas.map(a => {
            const disponibles = a.recurso.usosRestantes ?? a.recurso.usosMaximos ?? 0;
            const unidad = a.rasgo.lanzamientoConRecurso?.costeFijo ? "usos" : "puntos";
            return { id: a.rasgo.id, texto: `Con ${a.coste} ${unidad} de ${a.recurso.nombre}`,
              detalle: `${a.rasgo.nombre} · Nivel ${solicitudIncompleta.hechizo.nivel} · ${disponibles} ${unidad} disponibles.`,
              deshabilitado: disponibles < a.coste || Boolean(a.recurso.recuperacionDiferida) };
          })] });
        if (eleccion === undefined) return false;
        const elegida = alternativas.find(a => a.rasgo.id === eleccion);
        const estadoElegido = estados.find(r => r.id === eleccion);
        if (eleccion !== "normal" && !elegida && !estadoElegido) return false;
        if (estadoElegido) solicitudIncompleta = { ...solicitudIncompleta, modo: "estadoRasgo", idRasgoOrigen: estadoElegido.id,
          nivelLanzamiento: estadoElegido.lanzamientoConActivacion!.nivel, claseLanzamiento: estadoElegido.claseConjurosOtorgados };
        if (elegida) solicitudIncompleta = { ...solicitudIncompleta, modo: "recursoRasgo", idRasgoOrigen: elegida.rasgo.id,
          nivelLanzamiento: solicitudIncompleta.hechizo.nivel, claseLanzamiento: elegida.clase ?? solicitudIncompleta.claseLanzamiento };
      }
      const vigenteTrasEleccion = personaje && usarAlmacenDM.getState().personajes.find(p => p.id === personaje.id);
      if (vigenteTrasEleccion && solicitudIncompleta.modo !== "objetoMagico" && solicitudIncompleta.sinConcentracion === undefined
        && obtenerVarianteConjuro(vigenteTrasEleccion, solicitudIncompleta.hechizo)) {
        const variante = await elegirVarianteConjuro(vigenteTrasEleccion.id, solicitudIncompleta.hechizo.nombre);
        if (variante === undefined) return false;
        solicitudIncompleta = { ...solicitudIncompleta, sinConcentracion: variante };
      }
      let contextoEfectivo = contextoVigente(contexto, personaje);
      if (solicitudIncompleta.modo === "objetoMagico" && solicitudIncompleta.objetoInstanciaId) {
        const objEnInventario = (personaje?.inventario || []).find(
          (o) => o.idInstancia === solicitudIncompleta.objetoInstanciaId
        );
        if (objEnInventario) {
          const cMax = objEnInventario.cargasMaximas ?? 0;
          const cAct = objEnInventario.cargasActuales !== undefined ? objEnInventario.cargasActuales : cMax;
          contextoEfectivo = {
            ...contextoEfectivo,
            cargasObjetoActuales: cAct
          };
        }
      }

      const bonoDanoMagico = personaje
        ? obtenerBonoDanoConjuroExtra(personaje, {
            esTruco: solicitudIncompleta.hechizo.nivel === 0,
            nivelLanzamiento: solicitudIncompleta.nivelLanzamiento ?? solicitudIncompleta.hechizo.nivel,
            escuela: solicitudIncompleta.hechizo.escuela,
            tipoDano: solicitudIncompleta.hechizo.tipoDaño,
            nombreConjuro: solicitudIncompleta.hechizo.nombre
          })
        : 0;

      const clase = solicitudIncompleta.claseLanzamiento ?? opciones.claseLanzamiento;
      const aptitud = personaje?.clasesLanzadoras.find(c => c.clase === clase)?.habilidadConjuro;
      const modificadorHabilidad = personaje ? obtenerModificadorAptitudMagica(personaje, aptitud ?? undefined) : 0;

      const solicitudCompleta: SolicitudLanzamiento = aplicarConfiguracionConjurosRasgos(contextoEfectivo.personajeActual, {
        claseLanzamiento: opciones.claseLanzamiento,
        nombrePersonaje: personaje?.nombre || "Personaje",
        nivelPersonaje: personaje?.nivel || 1,
        bonoAtaqueMagico,
        bonoDanoMagico,
        modificadorHabilidad,
        cdSalvacionPersonaje,
        ...solicitudIncompleta
      });

      // A. Preparar estrategia una sola vez y validar precondiciones
      let preparado = prepararLanzamiento(solicitudCompleta, contextoEfectivo);
      const resultadoValidacion = validarLanzamiento(solicitudCompleta, contextoEfectivo, preparado);
      if (!resultadoValidacion.permitido) {
        if (resultadoValidacion.motivo) {
          agregarNotificacion(resultadoValidacion.motivo, "advertencia");
        }
        return false;
      }

      if (personaje && lanzamientosEnCurso.has(personaje.id)) return false;
      if (personaje) lanzamientosEnCurso.add(personaje.id);
      try {
        const pjCuracion = contextoEfectivo.personajeActual;
        if (pjCuracion && solicitudCompleta.hechizo.curacion?.tipo === "directa" && nivelEspacioGastado(preparado.gasto) !== undefined
          && pjCuracion.rasgos.some(r => r.curacionConjuros?.bonoPorEspacio && rasgoMagicoHabilitado(pjCuracion, r))) {
          const eleccion = await elegirOpcionLanzamiento(pjCuracion.id, { nombre: "Curación del conjuro", etiqueta: "Confirmar curación en el turno del lanzamiento",
            descripcion: "El bono por espacio solo se aplica a criaturas que recuperen PG en el turno en que lanzas el conjuro.",
            opciones: [{ id: "si", texto: "Sí, recuperan PG en este turno" }, { id: "no", texto: "Resolver sin el bono condicionado" }] });
          if (eleccion === undefined) return false;
          const contextoActual = contextoVigente(contexto, personaje);
          preparado = prepararLanzamiento({ ...solicitudCompleta, curacionEnTurno: eleccion === "si" }, contextoActual);
          if (!validarLanzamiento(solicitudCompleta, contextoActual, preparado).permitido) return false;
        }
        const emitir = () => lanzarDadosTaleSpire(preparado.formula.formulaTaleSpire,
          preparado.formula.etiquetaLog, undefined, undefined, preparado.tipoTirada);
        const vigente = contextoEfectivo.personajeActual;
        const emitido = vigente && /\bd20|\b1d20/.test(preparado.formula.formulaTaleSpire)
          ? await emitirTiradaConRasgos(vigente, "ataque", emitir, (id, consumir) => {
              const estado = usarAlmacenDM.getState();
              if (consumir) estado.operarRecursoRasgoPersonaje(vigente.id, { tipo: "finalizarPreparacion", idRasgo: id });
              else estado.alternarActivoRasgo(vigente.id, id);
            }) : await emitir();
        if (!emitido) return false;
        if (solicitudCompleta.hechizo.curacion?.tipo === "directa")
          agregarNotificacion(`${solicitudCompleta.hechizo.nombre} · Curación: ${preparado.formula.formulaTaleSpire.split(":").at(-1)} PG por destinatario. Aplica el resultado a quienes hayan recuperado PG.`, "info");
        if (personaje) {
          const consumo = consumirRecursoConjuro(personaje.id, { ...preparado.gasto, ronda: usarAlmacenDM.getState().rondaActual });
          if (!consumo.permitido) {
            agregarNotificacion(consumo.motivo ?? "Los recursos cambiaron durante el lanzamiento.", "advertencia");
            return false;
          }
          if (preparado.activarConcentracion && solicitudCompleta.hechizo.id)
            establecerConcentracion(personaje.id, solicitudCompleta.hechizo.id, solicitudCompleta.hechizo.nombre);
          if (preparado.gasto.tipo === "recursoRasgo") await resolverRecuperacionDiferida(personaje.id, preparado.gasto.idRasgo);
        }

        if (personaje && (preparado.gasto.tipo === "espacio" || preparado.gasto.tipo === "pacto")) {
          const pj = usarAlmacenDM.getState().personajes.find(p => p.id === personaje.id);
          const posteriores = pj?.rasgos.filter(r => r.trasLanzarConjuro && rasgoMagicoHabilitado(pj, r)
            && r.trasLanzarConjuro.escuelas.some(e => normalizar(e) === normalizar(solicitudCompleta.hechizo.escuela))) ?? [];
          if (pj && posteriores.length) {
            const opcion = await elegirOpcionLanzamiento(pj.id, { nombre: "Tras el lanzamiento", etiqueta: "Capacidad opcional tras lanzar un conjuro",
              descripcion: "El conjuro ya se ha lanzado. Puedes usar una capacidad disponible; la salvación y sus destinatarios se resuelven manualmente.",
              opciones: posteriores.map(r => ({ id: r.id, texto: r.nombre, detalle: "Gastar 1 uso", deshabilitado: (r.usosRestantes ?? r.usosMaximos ?? 0) < 1 })) });
            if (opcion && posteriores.some(r => r.id === opcion)) usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, opcion);
          }
        }

        return true;
      } catch (err) {
        logger.error("[usarLanzadorConjuros] Error al ejecutar lanzamiento:", err);
        agregarNotificacion("Error al procesar el lanzamiento del conjuro.", "error");
        return false;
      } finally {
        if (personaje) lanzamientosEnCurso.delete(personaje.id);
      }
    },
    [
      personaje,
      opciones.claseLanzamiento,
      bonoAtaqueMagico,
      cdSalvacionPersonaje,
      contexto,
      agregarNotificacion,
      consumirRecursoConjuro,
      establecerConcentracion,
    ]
  );

  return {
    puedeLanzar: !estaBloqueadoPorArmadura && !estaBloqueadoPorRasgo,
    motivoBloqueo: estaBloqueadoPorRasgo ? "Un rasgo activo impide lanzar conjuros." : motivoBloqueoArmadura,
    validar,
    lanzar
  };
}
