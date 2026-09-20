import { useState, useMemo, useCallback, useEffect } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje,
  usarEstadoHomebrew,
  usarEstadoConfiguracion,
  usarAccionesConfiguracion
} from "@/almacen/selectores";
import { esLanzadorCarisma, esLanzadorSabiduria, esClasePacto } from "@/constantes";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
export type {
  AtaquePersonajeCalculado,
  TipoAccionConsumida
} from "./TarjetaAtaquePersonaje";
export type { ConsumibleAccionCalculado } from "./TarjetaConsumibleAccion.tipos";
import type { AtaquePersonajeCalculado } from "./TarjetaAtaquePersonaje";
import type { ConsumibleAccionCalculado } from "./TarjetaConsumibleAccion.tipos";
import { calcularBonoAtaqueConjuro, calcularCDConjuros } from "@/servicios/calculadorMagia";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import type { ObjetoJuego, HechizoBase, Caracteristica, RasgoPersonaje } from "@/tipos";
import { usarEstadoPersistido, usarLanzadorConjuros } from "@/hooks";
import { generarListaAtaquesFisicos } from "@/servicios/calculadorAtaquesArmas";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import {
  resolverConjurosAcciones,
  resolverConsumiblesCombate,
  resolverHechizosObjetosMagicos,
  resolverRasgosAcciones,
  HechizoObjetoMagicoAccion,
  ConjuroAccionElemento,
  RasgoAccionCombate,
  CategoriaCombateRasgo
} from "@/servicios/calculadorAccionesCombate";
import { verificarHechizoDeSubclase } from "@/servicios/logicaPertenenciaConjuros";
import {
  obtenerBloqueoToggleRasgo,
  resolverRecursosPadre,
  obtenerNivelEfectivoParaRasgo
} from "@/componentes/caracteristicas/rasgos/utilidadesProgresionRasgos";
import {
  ejecutarTiradaAtaqueFisico,
  ejecutarTiradaDanoFisico,
  ejecutarTiradaCritico,
  ejecutarUsoConsumible
} from "@/servicios/ejecutorTiradasCombate";

export type FiltroAccion =
  | "todas"
  | "accion"
  | "accionAdicional"
  | "reaccion"
  | "consumibles"
  | "activables";
export type { HechizoObjetoMagicoAccion, ConjuroAccionElemento, RasgoAccionCombate, CategoriaCombateRasgo };

export function usarCalculoAtaquesJugador() {
  const { personajes, personajeActivo } = usarEstadoPersonajes();
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const {
    seleccionarPersonajeActivo,
    gastarEspacioConjuro,
    recuperarEspacioConjuro,
    recuperarTodosEspaciosConjuro,
    gastarPuntosConjuro,
    recuperarPuntosConjuro,
    recuperarTodosPuntosConjuro,
    gastarEspacioPacto,
    recuperarEspaciosPacto,
    modificarCantidadObjeto,
    aplicarCuracionPersonaje,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    alternarActivoRasgo,
    sincronizarRasgosPersonaje,
    romperConcentracion
  } = usarAccionesPersonajes();

  const { objetosHomebrew, baseDatosHechizos } = usarEstadoHomebrew();
  const { sistemaMagia } = usarEstadoConfiguracion();

  // Filtro activo persistente
  const [filtro, setFiltro] = usarEstadoPersistido<FiltroAccion>("ts_acciones_filtro", "todas");

  // Control de secciones colapsables persistente
  const [seccionesAbiertas, setSeccionesAbiertas] = usarEstadoPersistido<Record<string, boolean>>(
    "ts_acciones_secciones",
    {
      recursos: true,
      fisicos: true,
      magicos: true,
      magicos_nv_0: true,
      magicos_nv_1: true,
      magicos_nv_2: true,
      magicos_nv_3: true,
      magicos_nv_4: true,
      magicos_nv_5: true,
      magicos_nv_6: true,
      magicos_nv_7: true,
      magicos_nv_8: true,
      magicos_nv_9: true,
      magicos_ocultos: true,
      rasgos: true,
      consumibles: true,
      hechizosObjetos: true
    }
  );

  const alternarSeccion = useCallback((seccion: string) => {
    setSeccionesAbiertas((prev) => {
      const estaAbierta = prev[seccion] !== false;
      return {
        ...prev,
        [seccion]: !estaAbierta
      };
    });
  }, [setSeccionesAbiertas]);

  // Modal de detalle de conjuro y de rasgo
  const [hechizoDetalle, setHechizoDetalle] = useState<HechizoBase | null>(null);
  const [rasgoDetalle, setRasgoDetalle] = useState<RasgoPersonaje | null>(null);

  // Overrides de característica por arma persistente por personaje
  const claveArmasPj = `ts_caracteristicas_armas_${personajeActivo?.id || "default"}`;
  const [caracteristicasArmas, setCaracteristicasArmas] = usarEstadoPersistido<Record<string, Caracteristica>>(
    claveArmasPj,
    {}
  );

  const manejarCambiarCaracteristicaArma = useCallback((idInstancia: string, nuevaCarac: Caracteristica) => {
    setCaracteristicasArmas((prev) => ({
      ...prev,
      [idInstancia]: nuevaCarac
    }));
  }, [setCaracteristicasArmas]);

  // Base de datos de objetos sin duplicados
  const baseDatosObjetos = useMemo<ObjetoJuego[]>(() => {
    return desduplicarEntidades(OBJETOS_INICIALES, objetosHomebrew);
  }, [objetosHomebrew]);

  const baseDatosConjuros = baseDatosHechizos || [];

  const statsCalculadas = useMemo(() => {
    if (!personajeActivo) return null;
    return calcularEstadisticasPersonaje(personajeActivo);
  }, [personajeActivo]);

  // Habilidad mágica del personaje
  const habilidadMagica: Caracteristica = useMemo(() => {
    if (personajeActivo?.clasesLanzadoras && personajeActivo.clasesLanzadoras.length > 0) {
      return personajeActivo.clasesLanzadoras[0].habilidadConjuro as Caracteristica;
    }
    const clase = personajeActivo?.clase || "";
    if (esLanzadorCarisma(clase)) {
      return "carisma";
    }
    if (esLanzadorSabiduria(clase)) {
      return "sabiduria";
    }
    return "inteligencia";
  }, [personajeActivo]);

  const modMagico = statsCalculadas ? statsCalculadas.modificadores[habilidadMagica] || 0 : 0;
  const bonoAtaqueMagico = statsCalculadas
    ? calcularBonoAtaqueConjuro(statsCalculadas.bonoCompetencia, modMagico)
    : 0;
  const cdSalvacionConjuros = statsCalculadas
    ? calcularCDConjuros(statsCalculadas.bonoCompetencia, modMagico)
    : 8 + modMagico;

  // Hook de lanzamiento de conjuros
  const { puedeLanzar, motivoBloqueo, lanzar } = usarLanzadorConjuros({
    personaje: personajeActivo,
    penalizacionArmadura: statsCalculadas?.penalizacionArmadura,
    bonoAtaqueMagico,
    sistemaMagia
  });

  const estaBloqueadoPorArmadura = !puedeLanzar;
  const motivoBloqueoArmadura = motivoBloqueo;

  // 1. Ataques Físicos
  const listaAtaquesFisicos = useMemo<AtaquePersonajeCalculado[]>(() => {
    if (!personajeActivo || !statsCalculadas) return [];
    return generarListaAtaquesFisicos({
      personajeActivo,
      statsCalculadas,
      baseDatosObjetos,
      caracteristicasArmas
    });
  }, [personajeActivo, statsCalculadas, baseDatosObjetos, caracteristicasArmas]);

  // 2. Conjuros por acción
  const conjurosAcciones = useMemo(() => {
    return resolverConjurosAcciones(personajeActivo, baseDatosConjuros);
  }, [personajeActivo, baseDatosConjuros]);

  // 3. Consumibles de combate
  const listaConsumibles = useMemo<ConsumibleAccionCalculado[]>(() => {
    return resolverConsumiblesCombate(personajeActivo);
  }, [personajeActivo]);

  // 4. Hechizos de objetos mágicos
  const hechizosObjetosMagicos = useMemo(() => {
    return resolverHechizosObjetosMagicos(personajeActivo, objetosHomebrew);
  }, [personajeActivo, objetosHomebrew]);

  // 5. Rasgos tácticos de combate (acciones, adicionales, reacciones, consumibles, activables)
  const listaRasgosCombate = useMemo<RasgoAccionCombate[]>(() => {
    if (!personajeActivo) return [];
    const rasgosSincronizados = sincronizarRasgosAutomaticos(personajeActivo);
    return resolverRasgosAcciones({ ...personajeActivo, rasgos: rasgosSincronizados });
  }, [personajeActivo]);

  // Auto-sincronizar rasgos en el almacén si faltan rasgos canónicos en el personaje activo
  useEffect(() => {
    if (!personajeActivo) return;
    const canonicos = sincronizarRasgosAutomaticos(personajeActivo);
    const idsActuales = new Set((personajeActivo.rasgos || []).map((r) => r.id));
    const faltanRasgos = canonicos.some((r) => !idsActuales.has(r.id));
    if (faltanRasgos) {
      sincronizarRasgosPersonaje(personajeActivo.id);
    }
  }, [personajeActivo?.id, personajeActivo?.rasgos, sincronizarRasgosPersonaje]);

  const furiaEstaActiva = useMemo(() => {
    if (!personajeActivo) return false;
    const tieneRasgoFuriaActivo = (personajeActivo.rasgos || []).some(
      (r) => (r.id === "rasgo_cls_barbaro_furia" || r.id === "furia") && r.activo
    );
    const tieneCondicionFuria = (personajeActivo.condicionesActivas || []).some(
      (c) => c.toLowerCase().includes("furia (rage)") || (c.toLowerCase().includes("furia") && !c.toLowerCase().includes("furia de los dioses"))
    );
    return tieneRasgoFuriaActivo || tieneCondicionFuria;
  }, [personajeActivo]);

  // Manejadores de tiradas delegados a servicios puros
  const manejarTirarAtaque = useCallback(async (ataque: AtaquePersonajeCalculado) => {
    await ejecutarTiradaAtaqueFisico({
      ataque,
      personajeActivo,
      statsCalculadas,
      baseDatosObjetos,
      modificarCantidadObjeto,
      agregarNotificacion
    });
  }, [personajeActivo, statsCalculadas, baseDatosObjetos, modificarCantidadObjeto, agregarNotificacion]);

  const manejarTirarDano = useCallback(async (ataque: AtaquePersonajeCalculado, esVersatil: boolean = false) => {
    await ejecutarTiradaDanoFisico(ataque, personajeActivo, esVersatil);
  }, [personajeActivo]);

  const manejarTirarCritico = useCallback(async (ataque: AtaquePersonajeCalculado, esVersatil: boolean = false) => {
    await ejecutarTiradaCritico(ataque, personajeActivo, esVersatil);
  }, [personajeActivo]);

  const manejarUsarConsumible = useCallback(async (consumible: ConsumibleAccionCalculado) => {
    await ejecutarUsoConsumible({
      consumible,
      personajeActivo,
      aplicarCuracionPersonaje,
      modificarCantidadObjeto,
      agregarNotificacion
    });
  }, [personajeActivo, aplicarCuracionPersonaje, modificarCantidadObjeto, agregarNotificacion]);

  const esHechizoDeSubclase = useCallback((hechizo: HechizoBase): boolean => {
    return verificarHechizoDeSubclase(hechizo, personajeActivo);
  }, [personajeActivo]);

  // Listas filtradas según filtro activo
  const ataquesFisicosFiltrados = useMemo(() => {
    if (filtro === "todas") return listaAtaquesFisicos;
    if (filtro === "consumibles" || filtro === "activables") return [];
    return listaAtaquesFisicos.filter((a) => a.tipoAccion === filtro);
  }, [listaAtaquesFisicos, filtro]);

  const conjurosFiltrados = useMemo(() => {
    if (filtro === "todas") return conjurosAcciones;
    if (filtro === "consumibles" || filtro === "activables") return [];
    return conjurosAcciones.filter((c) => c.tipoAccion === filtro);
  }, [conjurosAcciones, filtro]);

  const conjurosPorNivel = useMemo(() => {
    const agrupados: Record<number, ConjuroAccionElemento[]> = {};
    for (let i = 0; i <= 9; i++) {
      agrupados[i] = [];
    }
    for (const item of conjurosFiltrados) {
      const niv = item.hechizo.nivel || 0;
      if (agrupados[niv]) {
        agrupados[niv].push(item);
      }
    }
    return agrupados;
  }, [conjurosFiltrados]);

  const consumiblesFiltrados = useMemo(() => {
    if (filtro === "todas" || filtro === "consumibles") return listaConsumibles;
    if (filtro === "activables") return [];
    return listaConsumibles.filter((c) => c.tipoAccion === filtro);
  }, [listaConsumibles, filtro]);

  const hechizosObjetosFiltrados = useMemo(() => {
    if (filtro === "todas") return hechizosObjetosMagicos;
    if (filtro === "consumibles" || filtro === "activables") return [];
    return hechizosObjetosMagicos.filter((h) => h.tipoAccion === filtro);
  }, [hechizosObjetosMagicos, filtro]);

  const rasgosFiltrados = useMemo(() => {
    if (filtro === "todas") return listaRasgosCombate;
    if (filtro === "accion") return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("accion"));
    if (filtro === "accionAdicional") return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("accionAdicional"));
    if (filtro === "reaccion") return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("reaccion"));
    if (filtro === "consumibles") return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("consumible"));
    if (filtro === "activables") return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("activable"));
    return listaRasgosCombate;
  }, [listaRasgosCombate, filtro]);

  const rasgosAcciones = useMemo(() => {
    return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("accion"));
  }, [listaRasgosCombate]);

  const rasgosAccionesAdicionales = useMemo(() => {
    return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("accionAdicional"));
  }, [listaRasgosCombate]);

  const rasgosReacciones = useMemo(() => {
    return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("reaccion"));
  }, [listaRasgosCombate]);

  const rasgosConsumibles = useMemo(() => {
    return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("consumible"));
  }, [listaRasgosCombate]);

  const rasgosActivables = useMemo(() => {
    return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("activable"));
  }, [listaRasgosCombate]);

  // Conteos numéricos consolidados por tipo de acción
  const conteoAccion = useMemo(() => {
    return (
      listaAtaquesFisicos.filter((a) => a.tipoAccion === "accion").length +
      conjurosAcciones.filter((c) => c.tipoAccion === "accion").length +
      listaConsumibles.filter((c) => c.tipoAccion === "accion").length +
      hechizosObjetosMagicos.filter((h) => h.tipoAccion === "accion").length +
      listaRasgosCombate.filter((r) => r.categoriasCombate.includes("accion")).length
    );
  }, [listaAtaquesFisicos, conjurosAcciones, listaConsumibles, hechizosObjetosMagicos, listaRasgosCombate]);

  const conteoAccionAdicional = useMemo(() => {
    return (
      listaAtaquesFisicos.filter((a) => a.tipoAccion === "accionAdicional").length +
      conjurosAcciones.filter((c) => c.tipoAccion === "accionAdicional").length +
      listaConsumibles.filter((c) => c.tipoAccion === "accionAdicional").length +
      hechizosObjetosMagicos.filter((h) => h.tipoAccion === "accionAdicional").length +
      listaRasgosCombate.filter((r) => r.categoriasCombate.includes("accionAdicional")).length
    );
  }, [listaAtaquesFisicos, conjurosAcciones, listaConsumibles, hechizosObjetosMagicos, listaRasgosCombate]);

  const conteoReaccion = useMemo(() => {
    return (
      listaAtaquesFisicos.filter((a) => a.tipoAccion === "reaccion").length +
      conjurosAcciones.filter((c) => c.tipoAccion === "reaccion").length +
      listaConsumibles.filter((c) => c.tipoAccion === "reaccion").length +
      hechizosObjetosMagicos.filter((h) => h.tipoAccion === "reaccion").length +
      listaRasgosCombate.filter((r) => r.categoriasCombate.includes("reaccion")).length
    );
  }, [listaAtaquesFisicos, conjurosAcciones, listaConsumibles, hechizosObjetosMagicos, listaRasgosCombate]);

  const conteoConsumibles = useMemo(() => {
    return (
      listaConsumibles.length +
      listaRasgosCombate.filter((r) => r.categoriasCombate.includes("consumible")).length
    );
  }, [listaConsumibles, listaRasgosCombate]);

  const conteoActivables = useMemo(() => {
    return listaRasgosCombate.filter((r) => r.categoriasCombate.includes("activable")).length;
  }, [listaRasgosCombate]);

  const conteoTotal =
    listaAtaquesFisicos.length +
    conjurosAcciones.length +
    listaConsumibles.length +
    hechizosObjetosMagicos.length +
    listaRasgosCombate.length;

  const tieneEspaciosEstandar = Object.values(personajeActivo?.espaciosConjuroMaximos || {}).some((v) => (v || 0) > 0);
  const tienePuntosEstandar = (personajeActivo?.puntosConjuroMaximos || 0) > 0;
  const tieneMagiaEstandar = sistemaMagia === "puntos" ? tienePuntosEstandar : tieneEspaciosEstandar;
  const tienePacto = (personajeActivo?.espaciosPactoMaximos || 0) > 0 || esClasePacto(personajeActivo?.clase);

  return {
    personajes,
    personajeActivo,
    statsCalculadas,
    sistemaMagia,
    filtro,
    setFiltro,
    seccionesAbiertas,
    alternarSeccion,
    hechizoDetalle,
    setHechizoDetalle,
    rasgoDetalle,
    setRasgoDetalle,
    habilidadMagica,
    bonoAtaqueMagico,
    cdSalvacionConjuros,
    estaBloqueadoPorArmadura,
    motivoBloqueoArmadura,
    ataquesFisicosFiltrados,
    conjurosFiltrados,
    conjurosPorNivel,
    consumiblesFiltrados,
    hechizosObjetosFiltrados,
    listaRasgosCombate,
    rasgosFiltrados,
    rasgosAcciones,
    rasgosAccionesAdicionales,
    rasgosReacciones,
    rasgosConsumibles,
    rasgosActivables,
    conteoTotal,
    conteoAccion,
    conteoAccionAdicional,
    conteoReaccion,
    conteoConsumibles,
    conteoActivables,
    tieneMagiaEstandar,
    tienePacto,
    esHechizoDeSubclase,
    lanzar,
    seleccionarPersonajeActivo,
    gastarEspacioConjuro,
    recuperarEspacioConjuro,
    recuperarTodosEspaciosConjuro,
    gastarPuntosConjuro,
    recuperarPuntosConjuro,
    recuperarTodosPuntosConjuro,
    gastarEspacioPacto,
    recuperarEspaciosPacto,
    romperConcentracion,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    alternarActivoRasgo,
    obtenerBloqueoToggleRasgo: (r: RasgoPersonaje) => obtenerBloqueoToggleRasgo(r, furiaEstaActiva),
    resolverRecursosPadre: (r: RasgoPersonaje) => resolverRecursosPadre(personajeActivo, r),
    obtenerNivelEfectivoParaRasgo: (r: RasgoPersonaje) => obtenerNivelEfectivoParaRasgo(personajeActivo, r),
    manejarCambiarCaracteristicaArma,
    manejarTirarAtaque,
    manejarTirarDano,
    manejarTirarCritico,
    manejarUsarConsumible
  };
}
