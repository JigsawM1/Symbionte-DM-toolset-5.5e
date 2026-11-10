import { emitirTiradaDanoConRasgos, emitirTiradaConRasgos } from "@/servicios/rasgos/emisionTiradaRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { elegirOpcionLanzamiento } from "@/componentes/caracteristicas/rasgos/elegirVarianteConjuro";
import { disponibleEnTurnoPropio, identificarTurnoRasgo } from "@/servicios/rasgos/limitesTurnoRasgos";
import { rasgoMagicoHabilitado } from "@/servicios/rasgos/ampliacionesListaConjuros";
import { prepararDanoIntegrado, type DanoIntegrado, type SolicitudResolucionAsistida } from "@/servicios/rasgos/resolucionAsistidaRasgos";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  usarEstadoHomebrew,
  usarEstadoConfiguracion,
  usarAccionesConfiguracion
} from '@/almacen/selectores';
import { calcularEstadisticasPersonaje } from "@/servicios/personajes/calculadorEstadisticasPersonaje";
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
import { usarSeccionesColapsablesAtaque } from "./usarSeccionesColapsablesAtaque";
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
import { esCondicionFuria } from "@/servicios/procesadorCondiciones";
import { obtenerBloqueoActivacionRasgo } from "@/servicios/rasgos/bloqueoActivacionRasgo";
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
  const { personajeActivo } = usarEstadoPersonajes();
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const {
    gastarEspacioConjuro,
    recuperarEspacioConjuro,
    gastarPuntosConjuro,
    recuperarPuntosConjuro,
    gastarEspacioPacto,
    recuperarEspaciosPacto,
    modificarCantidadObjeto,
    aplicarCuracionPersonaje,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    alternarActivoRasgo,
    alternarOcultarRasgo,
    desocultarTodosLosRasgos,
    alternarOcultarConjuro,
    desocultarTodosLosConjuros,
    sincronizarRasgosPersonaje,
    romperConcentracion
  } = usarAccionesPersonajes();

  const { objetosHomebrew, baseDatosHechizos } = usarEstadoHomebrew();
  const { sistemaMagia, tipoTirada } = usarEstadoConfiguracion();

  // Filtro activo persistente
  const [filtro, setFiltro] = usarEstadoPersistido<FiltroAccion>("ts_acciones_filtro", "todas");

  // Control de secciones colapsables persistente
  const {
    seccionesAbiertas,
    alternarSeccion,
    colapsarTodasSecciones,
    expandirTodasSecciones,
  } = usarSeccionesColapsablesAtaque();

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
    return calcularEstadisticasPersonaje(personajeActivo, objetosHomebrew);
  }, [personajeActivo, objetosHomebrew]);

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
      (c) => esCondicionFuria(c)
    );
    return tieneRasgoFuriaActivo || tieneCondicionFuria;
  }, [personajeActivo]);

  // Manejadores de tiradas delegados a servicios puros
  const manejarTirarAtaque = useCallback(async (ataque: AtaquePersonajeCalculado) => {
    const emitir = () => ejecutarTiradaAtaqueFisico({
      ataque,
      tipoTiradaManual: tipoTirada,
      personajeActivo,
      statsCalculadas,
      baseDatosObjetos,
      modificarCantidadObjeto,
      agregarNotificacion
    });
    if (personajeActivo) await emitirTiradaConRasgos(personajeActivo, "ataque", emitir, (id, consumir) => {
      const estado = usarAlmacenDM.getState();
      if (consumir) estado.operarRecursoRasgoPersonaje(personajeActivo.id, { tipo: "finalizarPreparacion", idRasgo: id });
      else estado.alternarActivoRasgo(personajeActivo.id, id);
    }); else await emitir();
  }, [personajeActivo, statsCalculadas, baseDatosObjetos, modificarCantidadObjeto, agregarNotificacion, tipoTirada]);

  const emitirDanoConRasgos = useCallback(async (ataque: AtaquePersonajeCalculado, emitir: (extra?: DanoIntegrado[], tipoElegido?: string) => Promise<boolean>) => {
    if (!personajeActivo) return;
    await emitirTiradaDanoConRasgos(personajeActivo, ataque, async () => {
      const estado = usarAlmacenDM.getState();
      const pj = estado.personajes.find(p => p.id === personajeActivo.id);
      if (!pj) return false;
      if (ataque.tipo !== "Arma" || !ataque.tieneTiradaAtaque) return emitir();
      const bestia = ataque.subtipo === "Forma Salvaje";
      const tipoAlternativo = bestia && pj.rasgos.find(r => r.cambiarTipoDanoBestia && rasgoMagicoHabilitado(pj, r))?.cambiarTipoDanoBestia;
      let tipoElegido: string | undefined;
      if (tipoAlternativo) {
        const elegido = await elegirOpcionLanzamiento(pj.id, { nombre: ataque.nombre, etiqueta: "Tipo de daño al impactar",
          descripcion: "Tras confirmar el impacto, elige el tipo de daño del ataque.", opciones: [
          { id: "normal", texto: "Tipo normal", detalle: ataque.tipoDano },
          { id: "cambiar", texto: tipoAlternativo }
        ] });
        if (!elegido) return false;
        if (elegido === "cambiar") tipoElegido = tipoAlternativo;
      }
      const elegidas: { solicitud: SolicitudResolucionAsistida; turno: string | false | undefined }[] = [];
      for (const r of pj.rasgos) {
        const cfg = r.resolucionAsistida;
        const turno = identificarTurnoRasgo(r, pj, estado);
        if (!cfg?.integrarEnDanoDeArma || (cfg.soloAtaqueBestia && !bestia) || !disponibleEnTurnoPropio(r, turno, pj)) continue;
        const opciones = cfg.opciones.flatMap(o => {
          const solicitud = { idRasgo: r.id, idOpcion: o.id, confirmado: true, incluirDados: true, propio: false };
          const extra = prepararDanoIntegrado(pj, solicitud);
          return extra ? [{ id: o.id, texto: `${r.nombre} · ${o.etiqueta}`, detalle: extra.formula, solicitud }] : [];
        });
        if (!opciones.length) continue;
        const eleccion = await elegirOpcionLanzamiento(pj.id, { nombre: r.nombre, etiqueta: "Daño adicional al impactar",
          descripcion: "Confirma el impacto y elige si quieres añadir este daño.",
          opciones: [{ id: "normal", texto: "Omitir este daño adicional" }, ...opciones] });
        if (eleccion === undefined) return false;
        const opcion = opciones.find(o => o.id === eleccion);
        if (opcion) elegidas.push({ solicitud: opcion.solicitud, turno });
      }
      const vigente = usarAlmacenDM.getState();
      const actual = vigente.personajes.find(p => p.id === pj.id);
      if (!actual) return false;
      const extras: DanoIntegrado[] = [];
      for (const { solicitud, turno } of elegidas) {
        const r = actual.rasgos.find(r => r.id === solicitud.idRasgo);
        const extra = r && prepararDanoIntegrado(actual, solicitud);
        if (!r || !extra || turno !== identificarTurnoRasgo(r, actual, vigente) || !disponibleEnTurnoPropio(r, turno, actual)) return false;
        extras.push(extra);
      }
      if (!await emitir(extras, tipoElegido)) return false;
      for (const { solicitud, turno } of elegidas)
        vigente.operarRecursoRasgoPersonaje(pj.id, { tipo: "confirmarDanoIntegrado", solicitud, turnoPrevio: turno || undefined });
      return true;
    }, id => {
      const estado = usarAlmacenDM.getState();
      if (estado.personajes.find(p => p.id === personajeActivo.id)?.rasgos.find(r => r.id === id)?.activo)
        estado.alternarActivoRasgo(personajeActivo.id, id);
    }, tipoTirada);
  }, [personajeActivo, tipoTirada]);

  const manejarTirarDano = useCallback(async (ataque: AtaquePersonajeCalculado, modo: boolean | "adicional" = false) => {
    await emitirDanoConRasgos(ataque, (extra, tipoElegido) => ejecutarTiradaDanoFisico(ataque, personajeActivo, modo, extra, tipoElegido));
  }, [personajeActivo, emitirDanoConRasgos]);

  const manejarTirarCritico = useCallback(async (ataque: AtaquePersonajeCalculado, modo: boolean | "adicional" = false) => {
    await emitirDanoConRasgos(ataque, (extra, tipoElegido) => ejecutarTiradaCritico(ataque, personajeActivo, modo, extra, tipoElegido));
  }, [personajeActivo, emitirDanoConRasgos]);

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

  const rasgosAcciones = useMemo(() => listaRasgosCombate.filter((r) => r.categoriasCombate.includes("accion")), [listaRasgosCombate]);
  const rasgosAccionesAdicionales = useMemo(() => listaRasgosCombate.filter((r) => r.categoriasCombate.includes("accionAdicional")), [listaRasgosCombate]);
  const rasgosReacciones = useMemo(() => listaRasgosCombate.filter((r) => r.categoriasCombate.includes("reaccion")), [listaRasgosCombate]);
  const rasgosConsumibles = useMemo(() => listaRasgosCombate.filter((r) => r.categoriasCombate.includes("consumible")), [listaRasgosCombate]);
  const rasgosActivables = useMemo(() => listaRasgosCombate.filter((r) => r.categoriasCombate.includes("activable")), [listaRasgosCombate]);

  // Conteos numéricos consolidados por tipo de acción
  const contarPorTipoAccion = useCallback((tipo: "accion" | "accionAdicional" | "reaccion") => {
    return (
      listaAtaquesFisicos.filter((a) => a.tipoAccion === tipo).length +
      conjurosAcciones.filter((c) => c.tipoAccion === tipo).length +
      listaConsumibles.filter((c) => c.tipoAccion === tipo).length +
      hechizosObjetosMagicos.filter((h) => h.tipoAccion === tipo).length +
      listaRasgosCombate.filter((r) => r.categoriasCombate.includes(tipo)).length
    );
  }, [listaAtaquesFisicos, conjurosAcciones, listaConsumibles, hechizosObjetosMagicos, listaRasgosCombate]);

  const conteoAccion = useMemo(() => contarPorTipoAccion("accion"), [contarPorTipoAccion]);
  const conteoAccionAdicional = useMemo(() => contarPorTipoAccion("accionAdicional"), [contarPorTipoAccion]);
  const conteoReaccion = useMemo(() => contarPorTipoAccion("reaccion"), [contarPorTipoAccion]);

  const conteoConsumibles = listaConsumibles.length + rasgosConsumibles.length;

  const conteoActivables = rasgosActivables.length;

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
    personajeActivo,
    statsCalculadas,
    sistemaMagia,
    filtro,
    setFiltro,
    seccionesAbiertas,
    alternarSeccion,
    colapsarTodasSecciones,
    expandirTodasSecciones,
    hechizoDetalle,
    setHechizoDetalle,
    rasgoDetalle,
    setRasgoDetalle,
    bonoAtaqueMagico,
    cdSalvacionConjuros,
    estaBloqueadoPorArmadura,
    motivoBloqueoArmadura,
    ataquesFisicosFiltrados,
    conjurosFiltrados,
    conjurosPorNivel,
    consumiblesFiltrados,
    hechizosObjetosFiltrados,
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
    gastarEspacioConjuro,
    recuperarEspacioConjuro,
    gastarPuntosConjuro,
    recuperarPuntosConjuro,
    gastarEspacioPacto,
    recuperarEspaciosPacto,
    romperConcentracion,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    alternarActivoRasgo,
    alternarOcultarRasgo,
    desocultarTodosLosRasgos,
    alternarOcultarConjuro,
    desocultarTodosLosConjuros,
    obtenerBloqueoToggleRasgo: (r: RasgoPersonaje) => {
      const bloqueoFuria = obtenerBloqueoToggleRasgo(r, furiaEstaActiva);
      return bloqueoFuria.bloqueado ? bloqueoFuria : obtenerBloqueoActivacionRasgo(personajeActivo, r);
    },
    resolverRecursosPadre: (r: RasgoPersonaje) => resolverRecursosPadre(personajeActivo, r),
    obtenerNivelEfectivoParaRasgo: (r: RasgoPersonaje) => obtenerNivelEfectivoParaRasgo(personajeActivo, r),
    manejarCambiarCaracteristicaArma,
    manejarTirarAtaque,
    manejarTirarDano,
    manejarTirarCritico,
    manejarUsarConsumible
  };
}
