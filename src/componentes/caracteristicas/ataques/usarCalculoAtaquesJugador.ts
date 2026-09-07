import { useState, useMemo, useCallback } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje,
  usarEstadoHomebrew,
  usarEstadoConfiguracion,
  usarAccionesConfiguracion
} from "@/almacen/selectores";
import { esLanzadorCarisma, esClasePacto } from "@/constantes";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
export type {
  AtaquePersonajeCalculado,
  TipoAccionConsumida
} from "./TarjetaAtaquePersonaje";
export type { ConsumibleAccionCalculado } from "./TarjetaConsumibleAccion.tipos";
import type { AtaquePersonajeCalculado } from "./TarjetaAtaquePersonaje";
import type { ConsumibleAccionCalculado } from "./TarjetaConsumibleAccion.tipos";
import { calcularBonoAtaqueConjuro } from "@/servicios/calculadorMagia";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import type { ObjetoJuego, HechizoBase, Caracteristica } from "@/tipos";
import { usarEstadoPersistido, usarLanzadorConjuros } from "@/hooks";
import { generarListaAtaquesFisicos } from "@/servicios/calculadorAtaquesArmas";
import {
  resolverConjurosAcciones,
  resolverConsumiblesCombate,
  resolverHechizosObjetosMagicos,
  verificarHechizoDeSubclase,
  HechizoObjetoMagicoAccion,
  ConjuroAccionElemento
} from "@/servicios/calculadorAccionesCombate";
import {
  ejecutarTiradaAtaqueFisico,
  ejecutarTiradaDanoFisico,
  ejecutarTiradaCritico,
  ejecutarUsoConsumible
} from "@/servicios/ejecutorTiradasCombate";

export type FiltroAccion = "todas" | "accion" | "accionAdicional" | "reaccion";
export type { HechizoObjetoMagicoAccion, ConjuroAccionElemento };

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
    aplicarCuracionPersonaje
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
      consumibles: true
    }
  );

  const alternarSeccion = useCallback((seccion: string) => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  }, [setSeccionesAbiertas]);

  // Modal de detalle de conjuro
  const [hechizoDetalle, setHechizoDetalle] = useState<HechizoBase | null>(null);

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
    const claseNorm = clase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (claseNorm.includes("clerigo") || claseNorm.includes("druida") || claseNorm.includes("explorador") || claseNorm.includes("cleric") || claseNorm.includes("ranger")) {
      return "sabiduria";
    }
    return "inteligencia";
  }, [personajeActivo]);

  const modMagico = statsCalculadas ? statsCalculadas.modificadores[habilidadMagica] || 0 : 0;
  const bonoAtaqueMagico = statsCalculadas
    ? calcularBonoAtaqueConjuro(statsCalculadas.bonoCompetencia, modMagico)
    : 0;

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
    return listaAtaquesFisicos.filter((a) => a.tipoAccion === filtro);
  }, [listaAtaquesFisicos, filtro]);

  const conjurosFiltrados = useMemo(() => {
    if (filtro === "todas") return conjurosAcciones;
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
    if (filtro === "todas") return listaConsumibles;
    return listaConsumibles.filter((c) => c.tipoAccion === filtro);
  }, [listaConsumibles, filtro]);

  const hechizosObjetosFiltrados = useMemo(() => {
    if (filtro === "todas") return hechizosObjetosMagicos;
    return hechizosObjetosMagicos.filter((h) => h.tipoAccion === filtro);
  }, [hechizosObjetosMagicos, filtro]);

  // Conteos numéricos por tipo de acción
  const conteoAccion = useMemo(() => {
    return (
      listaAtaquesFisicos.filter((a) => a.tipoAccion === "accion").length +
      conjurosAcciones.filter((c) => c.tipoAccion === "accion").length +
      listaConsumibles.filter((c) => c.tipoAccion === "accion").length +
      hechizosObjetosMagicos.filter((h) => h.tipoAccion === "accion").length
    );
  }, [listaAtaquesFisicos, conjurosAcciones, listaConsumibles, hechizosObjetosMagicos]);

  const conteoAccionAdicional = useMemo(() => {
    return (
      listaAtaquesFisicos.filter((a) => a.tipoAccion === "accionAdicional").length +
      conjurosAcciones.filter((c) => c.tipoAccion === "accionAdicional").length +
      listaConsumibles.filter((c) => c.tipoAccion === "accionAdicional").length +
      hechizosObjetosMagicos.filter((h) => h.tipoAccion === "accionAdicional").length
    );
  }, [listaAtaquesFisicos, conjurosAcciones, listaConsumibles, hechizosObjetosMagicos]);

  const conteoReaccion = useMemo(() => {
    return (
      listaAtaquesFisicos.filter((a) => a.tipoAccion === "reaccion").length +
      conjurosAcciones.filter((c) => c.tipoAccion === "reaccion").length +
      listaConsumibles.filter((c) => c.tipoAccion === "reaccion").length +
      hechizosObjetosMagicos.filter((h) => h.tipoAccion === "reaccion").length
    );
  }, [listaAtaquesFisicos, conjurosAcciones, listaConsumibles, hechizosObjetosMagicos]);

  const conteoTotal =
    listaAtaquesFisicos.length +
    conjurosAcciones.length +
    listaConsumibles.length +
    hechizosObjetosMagicos.length;

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
    habilidadMagica,
    bonoAtaqueMagico,
    estaBloqueadoPorArmadura,
    motivoBloqueoArmadura,
    ataquesFisicosFiltrados,
    conjurosFiltrados,
    conjurosPorNivel,
    consumiblesFiltrados,
    hechizosObjetosFiltrados,
    conteoTotal,
    conteoAccion,
    conteoAccionAdicional,
    conteoReaccion,
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
    manejarCambiarCaracteristicaArma,
    manejarTirarAtaque,
    manejarTirarDano,
    manejarTirarCritico,
    manejarUsarConsumible
  };
}
