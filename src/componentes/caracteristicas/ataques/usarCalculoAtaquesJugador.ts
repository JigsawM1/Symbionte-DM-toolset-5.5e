import { obtenerMaximosEspaciosEfectivos } from "@/servicios/rasgos/conversionRecursosRasgos";
import { emitirTiradaDanoConRasgos, emitirTiradaConRasgos } from "@/servicios/rasgos/emisionTiradaRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import type { DanoIntegrado } from "@/servicios/rasgos/resolucionAsistidaRasgos";
import { consultarRasgosAntesDeAtaque, ejecutarConsultaDanoAtaque } from "./consultarRasgosEnAtaque";
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
import type {
  AtaquePersonajeCalculado,
  ConsumibleAccionCalculado,
  ObjetoJuego,
  HechizoBase,
  Caracteristica,
  RasgoPersonaje
} from "@/tipos";
export type { AtaquePersonajeCalculado, ConsumibleAccionCalculado };
import { calcularBonoAtaqueConjuro, calcularCDConjuros } from "@/servicios/calculadorMagia";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import { usarEstadoPersistido, usarLanzadorConjuros } from "@/hooks";
import { generarListaAtaquesFisicos } from "@/servicios/calculadorAtaquesArmas";
import { sincronizarRasgosAutomaticos } from "@/servicios/compendioRasgos";
import { calcularConteosFeedCombate, dividirRasgosParaFlujoPlano } from "./clasificadorSwitchesCombate";
import {
  resolverConjurosAcciones,
  resolverConsumiblesCombate,
  resolverHechizosObjetosMagicos,
  resolverRasgosAcciones,
  HechizoObjetoMagicoAccion,
  ConjuroAccionElemento,
  RasgoAccionCombate
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
import { esMunicionCompatibleConArma } from "@/servicios/gestorMunicion";

export type FiltroAccion =
  | "todas"
  | "accion"
  | "accionAdicional"
  | "reaccion"
  | "consumibles";
export type { HechizoObjetoMagicoAccion, ConjuroAccionElemento, RasgoAccionCombate };

const LISTA_HECHIZOS_VACIA: HechizoBase[] = [];
const RASGOS_VACIOS: RasgoPersonaje[] = [];

const FILTROS_ACCION_VALIDOS: ReadonlySet<string> = new Set<FiltroAccion>([
  "todas",
  "accion",
  "accionAdicional",
  "reaccion",
  "consumibles"
]);

export function usarCalculoAtaquesJugador() {
  const { personajeActivo } = usarEstadoPersonajes();
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const {
    modificarCantidadObjeto,
    aplicarCuracionPersonaje,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    alternarActivoRasgo,
    alternarOcultarRasgo,
    desocultarTodosLosRasgos,
    alternarConjuroEnAcciones,
    sincronizarRasgosPersonaje,
    romperConcentracion
  } = usarAccionesPersonajes();

  const { objetosHomebrew, baseDatosHechizos } = usarEstadoHomebrew();
  const { sistemaMagia, tipoTirada } = usarEstadoConfiguracion();

  // Filtro activo persistente (normaliza claves heredadas como "activables")
  const [filtroGuardado, setFiltroGuardado] = usarEstadoPersistido<string>("ts_acciones_filtro", "todas");
  const filtro: FiltroAccion = FILTROS_ACCION_VALIDOS.has(filtroGuardado)
    ? (filtroGuardado as FiltroAccion)
    : "todas";
  const setFiltro: (nuevoFiltro: FiltroAccion) => void = setFiltroGuardado;

  // Único acordeón de la vista: cajón de Rasgos Ocultos (cerrado por defecto)
  const [ocultosAbiertos, setOcultosAbiertos] = usarEstadoPersistido<boolean>(
    "ts_acciones_ocultos_abiertos",
    false
  );
  const alternarOcultos = useCallback(() => {
    setOcultosAbiertos((prev) => !prev);
  }, [setOcultosAbiertos]);

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

  const baseDatosConjuros = baseDatosHechizos || LISTA_HECHIZOS_VACIA;

  const statsCalculadas = useMemo(() => {
    if (!personajeActivo) return null;
    return calcularEstadisticasPersonaje(personajeActivo, objetosHomebrew);
  }, [personajeActivo, objetosHomebrew]);

  // Habilidad mágica del personaje
  const clasePersonaje = personajeActivo?.clase || "";
  const habilidadMagica: Caracteristica =
    personajeActivo?.clasesLanzadoras && personajeActivo.clasesLanzadoras.length > 0
      ? (personajeActivo.clasesLanzadoras[0].habilidadConjuro as Caracteristica)
      : esLanzadorCarisma(clasePersonaje)
      ? "carisma"
      : esLanzadorSabiduria(clasePersonaje)
      ? "sabiduria"
      : "inteligencia";

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

  // 2. Conjuros por acción (solo los activados explícitamente hacia Acciones)
  const conjurosEnAccionesSet = useMemo(
    () => new Set(personajeActivo?.conjurosEnAcciones || []),
    [personajeActivo?.conjurosEnAcciones]
  );

  const conjurosAcciones = useMemo(() => {
    if (conjurosEnAccionesSet.size === 0) return [];
    return resolverConjurosAcciones(personajeActivo, baseDatosConjuros).filter(({ hechizo }) =>
      conjurosEnAccionesSet.has(hechizo.id)
    );
  }, [personajeActivo, baseDatosConjuros, conjurosEnAccionesSet]);

  // 3. Consumibles de combate
  const listaConsumibles = useMemo<ConsumibleAccionCalculado[]>(() => {
    return resolverConsumiblesCombate(personajeActivo);
  }, [personajeActivo]);

  // 4. Hechizos de objetos mágicos
  const hechizosObjetosMagicos = useMemo(() => {
    return resolverHechizosObjetosMagicos(personajeActivo, objetosHomebrew);
  }, [personajeActivo, objetosHomebrew]);

  // 5. Rasgos tácticos de combate (calculados una sola vez a partir de los rasgos canónicos)
  const idPj = personajeActivo?.id;
  const rasgosPj = personajeActivo?.rasgos;
  const condicionesPj = personajeActivo?.condicionesActivas;

  const rasgosCanonicos = useMemo(
    () => (personajeActivo ? sincronizarRasgosAutomaticos(personajeActivo) : RASGOS_VACIOS),
    [personajeActivo]
  );

  const listaRasgosCombate = useMemo<RasgoAccionCombate[]>(() => {
    if (!personajeActivo) return [];
    return resolverRasgosAcciones({ ...personajeActivo, rasgos: rasgosCanonicos });
  }, [personajeActivo, rasgosCanonicos]);

  // Auto-sincronizar rasgos en el almacén si faltan rasgos canónicos en el personaje activo
  useEffect(() => {
    if (!idPj) return;
    const idsActuales = new Set((rasgosPj || RASGOS_VACIOS).map((r) => r.id));
    if (rasgosCanonicos.some((r) => !idsActuales.has(r.id))) {
      sincronizarRasgosPersonaje(idPj);
    }
  }, [idPj, rasgosPj, rasgosCanonicos, sincronizarRasgosPersonaje]);

  const furiaEstaActiva = useMemo(() => {
    const tieneRasgoFuriaActivo = (rasgosPj || RASGOS_VACIOS).some(
      (r) => (r.id === "rasgo_cls_barbaro_furia" || r.id === "furia") && r.activo
    );
    const tieneCondicionFuria = (condicionesPj || []).some((c) => esCondicionFuria(c));
    return tieneRasgoFuriaActivo || tieneCondicionFuria;
  }, [rasgosPj, condicionesPj]);

  // Manejadores de tiradas delegados a servicios puros
  const manejarTirarAtaque = useCallback(async (ataque: AtaquePersonajeCalculado) => {
    const pjVigente = personajeActivo && ataque.tieneTiradaAtaque
      ? await consultarRasgosAntesDeAtaque(
          personajeActivo.id,
          ataque,
          tipoTirada,
          Boolean(statsCalculadas?.penalizacionArmadura?.sinCompetencia)
        )
      : personajeActivo;
    if (personajeActivo && !pjVigente) return;
    const emitir = () => ejecutarTiradaAtaqueFisico({
      ataque,
      tipoTiradaManual: tipoTirada,
      personajeActivo: pjVigente ?? null,
      statsCalculadas,
      baseDatosObjetos,
      modificarCantidadObjeto,
      agregarNotificacion
    });
    if (pjVigente) await emitirTiradaConRasgos(pjVigente, "ataque", emitir, (id, consumir) => {
      const estado = usarAlmacenDM.getState();
      if (consumir) estado.operarRecursoRasgoPersonaje(pjVigente.id, { tipo: "finalizarPreparacion", idRasgo: id });
      else estado.alternarActivoRasgo(pjVigente.id, id);
    }); else await emitir();
  }, [personajeActivo, statsCalculadas, baseDatosObjetos, modificarCantidadObjeto, agregarNotificacion, tipoTirada]);

  const emitirDanoConRasgos = useCallback(async (ataque: AtaquePersonajeCalculado, emitir: (extra?: DanoIntegrado[], tipoElegido?: string, efectosEtiqueta?: string[]) => Promise<boolean>) => {
    if (!personajeActivo) return;
    await emitirTiradaDanoConRasgos(personajeActivo, ataque, () => ejecutarConsultaDanoAtaque(personajeActivo.id, ataque, emitir), id => {
      const estado = usarAlmacenDM.getState();
      if (estado.personajes.find(p => p.id === personajeActivo.id)?.rasgos.find(r => r.id === id)?.activo)
        estado.alternarActivoRasgo(personajeActivo.id, id);
    }, tipoTirada);
  }, [personajeActivo, tipoTirada]);

  const manejarTirarDano = useCallback(async (ataque: AtaquePersonajeCalculado, modo: boolean | "adicional" = false) => {
    await emitirDanoConRasgos(ataque, (extra, tipoElegido, efectosEtiqueta) => ejecutarTiradaDanoFisico(ataque, personajeActivo, modo, extra, tipoElegido, efectosEtiqueta));
  }, [personajeActivo, emitirDanoConRasgos]);

  const manejarTirarCritico = useCallback(async (ataque: AtaquePersonajeCalculado, modo: boolean | "adicional" = false) => {
    await emitirDanoConRasgos(ataque, (extra, tipoElegido, efectosEtiqueta) => ejecutarTiradaCritico(ataque, personajeActivo, modo, extra, tipoElegido, efectosEtiqueta));
  }, [personajeActivo, emitirDanoConRasgos]);

  const manejarAjustarMunicionArma = useCallback((ataque: AtaquePersonajeCalculado, delta: 1 | -1) => {
    if (!personajeActivo || !ataque.requiereMunicion) return;
    const inv = personajeActivo.inventario || [];
    const municion =
      (ataque.municionItemId
        ? inv.find((it) => it.idInstancia === ataque.municionItemId && (it.contenedor || "mochila") === "mochila")
        : undefined) ||
      inv.find(
        (it) =>
          (it.contenedor || "mochila") === "mochila" &&
          esMunicionCompatibleConArma(ataque.nombre, it, ataque.propiedades, baseDatosObjetos)
      );

    if (!municion) return;
    if (delta < 0 && municion.cantidad <= 0) return;

    modificarCantidadObjeto(personajeActivo.id, municion.idInstancia, delta);
  }, [personajeActivo, baseDatosObjetos, modificarCantidadObjeto]);

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

  // Clasificación entre switches de combate (Opción C) y feed plano inferior (Opción A)
  const { rasgosSwitches, rasgosFeed } = useMemo(
    () => dividirRasgosParaFlujoPlano(listaRasgosCombate),
    [listaRasgosCombate]
  );

  // Listas filtradas según filtro activo
  const ataquesFisicosFiltrados = useMemo(() => {
    if (filtro === "todas") return listaAtaquesFisicos;
    if (filtro === "consumibles") return [];
    return listaAtaquesFisicos.filter((a) => a.tipoAccion === filtro);
  }, [listaAtaquesFisicos, filtro]);

  const conjurosFiltrados = useMemo(() => {
    if (filtro === "todas") return conjurosAcciones;
    if (filtro === "consumibles") return [];
    return conjurosAcciones.filter((c) => c.tipoAccion === filtro);
  }, [conjurosAcciones, filtro]);

  const consumiblesFiltrados = useMemo(() => {
    if (filtro === "todas" || filtro === "consumibles") return listaConsumibles;
    return listaConsumibles.filter((c) => c.tipoAccion === filtro);
  }, [listaConsumibles, filtro]);

  const hechizosObjetosFiltrados = useMemo(() => {
    if (filtro === "todas") return hechizosObjetosMagicos;
    if (filtro === "consumibles") return [];
    return hechizosObjetosMagicos.filter((h) => h.tipoAccion === filtro);
  }, [hechizosObjetosMagicos, filtro]);

  const rasgosFiltrados = useMemo(() => {
    if (filtro === "todas") return rasgosFeed;
    const categoria = filtro === "consumibles" ? "consumible" : filtro;
    return rasgosFeed.filter((r) => r.categoriasCombate.includes(categoria));
  }, [rasgosFeed, filtro]);

  const { conteoTotal, conteoAccion, conteoAccionAdicional, conteoReaccion, conteoConsumibles } =
    useMemo(
      () =>
        calcularConteosFeedCombate(
          listaAtaquesFisicos,
          conjurosAcciones,
          listaConsumibles,
          hechizosObjetosMagicos,
          rasgosFeed
        ),
      [listaAtaquesFisicos, conjurosAcciones, listaConsumibles, hechizosObjetosMagicos, rasgosFeed]
    );

  const espaciosConjuroMaximos = useMemo(
    () => (personajeActivo ? obtenerMaximosEspaciosEfectivos(personajeActivo) : {}),
    [personajeActivo]
  );
  const tienePacto = (personajeActivo?.espaciosPactoMaximos || 0) > 0 || esClasePacto(personajeActivo?.clase);

  const obtenerBloqueoToggleRasgoCb = useCallback(
    (r: RasgoPersonaje) => {
      const bloqueoFuria = obtenerBloqueoToggleRasgo(r, furiaEstaActiva);
      return bloqueoFuria.bloqueado ? bloqueoFuria : obtenerBloqueoActivacionRasgo(personajeActivo, r);
    },
    [personajeActivo, furiaEstaActiva]
  );

  const resolverRecursosPadreCb = useCallback((r: RasgoPersonaje) => resolverRecursosPadre(personajeActivo, r), [personajeActivo]);
  const obtenerNivelEfectivoParaRasgoCb = useCallback((r: RasgoPersonaje) => obtenerNivelEfectivoParaRasgo(personajeActivo, r), [personajeActivo]);

  return {
    personajeActivo,
    statsCalculadas,
    sistemaMagia,
    filtro,
    setFiltro,
    ocultosAbiertos,
    alternarOcultos,
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
    consumiblesFiltrados,
    hechizosObjetosFiltrados,
    rasgosSwitches,
    rasgosFiltrados,
    conteoTotal,
    conteoAccion,
    conteoAccionAdicional,
    conteoReaccion,
    conteoConsumibles,
    espaciosConjuroMaximos,
    tienePacto,
    esHechizoDeSubclase,
    lanzar,
    romperConcentracion,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    alternarActivoRasgo,
    alternarOcultarRasgo,
    desocultarTodosLosRasgos,
    alternarConjuroEnAcciones,
    obtenerBloqueoToggleRasgo: obtenerBloqueoToggleRasgoCb,
    resolverRecursosPadre: resolverRecursosPadreCb,
    obtenerNivelEfectivoParaRasgo: obtenerNivelEfectivoParaRasgoCb,
    manejarCambiarCaracteristicaArma,
    manejarTirarAtaque,
    manejarTirarDano,
    manejarTirarCritico,
    manejarAjustarMunicionArma,
    manejarUsarConsumible
  };
}
