import React, { useState, useMemo, useCallback } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje,
  usarEstadoHomebrew,
  usarEstadoConfiguracion,
  usarAccionesConfiguracion
} from "@/almacen/selectores";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
import {
  TarjetaAtaquePersonaje,
  AtaquePersonajeCalculado,
  TipoAccionConsumida
} from "./TarjetaAtaquePersonaje";
import { TarjetaConsumibleAccion } from "./TarjetaConsumibleAccion";
import type { ConsumibleAccionCalculado } from "./TarjetaConsumibleAccion.tipos";
import { TarjetaConjuroCompacta } from "@/componentes/caracteristicas/personajes/TarjetaConjuroCompacta";
import { TrackerEspaciosConjuro } from "@/componentes/caracteristicas/personajes/TrackerEspaciosConjuro";
import { TrackerEspaciosPacto } from "@/componentes/caracteristicas/personajes/TrackerEspaciosPacto";
import { TrackerPuntosConjuro } from "@/componentes/caracteristicas/personajes/TrackerPuntosConjuro";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { calcularBonoAtaqueConjuro } from "@/servicios/calculadorMagia";
import { detectarInfoConsumible, evaluarFormulaDados, esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import type { Arma, ObjetoJuego, HechizoBase, Caracteristica } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { Swords, Sparkles, UserCheck, FlaskConical } from "lucide-react";
import estilos from "./VistaAtaquesJugador.module.css";

type FiltroAccion = "todas" | "accion" | "accionAdicional" | "reaccion";

export const VistaAtaquesJugador: React.FC = () => {
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
    establecerConcentracion,
    modificarCantidadObjeto,
    aplicarCuracionPersonaje
  } = usarAccionesPersonajes();

  const { objetosHomebrew, baseDatosHechizos } = usarEstadoHomebrew();
  const { sistemaMagia } = usarEstadoConfiguracion();

  // Filtro activo
  const [filtro, setFiltro] = useState<FiltroAccion>("todas");

  // Estado para modal de detalle de conjuro si se pulsa "Ver"
  const [hechizoDetalle, setHechizoDetalle] = useState<HechizoBase | null>(null);

  // Overrides de característica por arma (ej. Pacto de la Hoja -> CAR, Shillelagh -> SAB, Artífice -> INT)
  const [caracteristicasArmas, setCaracteristicasArmas] = useState<Record<string, Caracteristica>>({});

  const manejarCambiarCaracteristicaArma = useCallback((idInstancia: string, nuevaCarac: Caracteristica) => {
    setCaracteristicasArmas((prev) => ({
      ...prev,
      [idInstancia]: nuevaCarac
    }));
  }, []);

  // Base de datos completa de Objetos sin duplicados (Oficial + Homebrew)
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
    const clase = (personajeActivo?.clase || "").toLowerCase();
    if (clase.includes("brujo") || clase.includes("bardo") || clase.includes("hechicero") || clase.includes("paladín") || clase.includes("paladin")) {
      return "carisma";
    }
    if (clase.includes("clérigo") || clase.includes("clerigo") || clase.includes("druida") || clase.includes("explorador")) {
      return "sabiduria";
    }
    return "inteligencia";
  }, [personajeActivo]);

  // Construir la lista dinámica de ataques físicos y desarmados
  const listaAtaquesFisicos = useMemo<AtaquePersonajeCalculado[]>(() => {
    if (!personajeActivo || !statsCalculadas) return [];

    const ataques: AtaquePersonajeCalculado[] = [];
    const inventario = personajeActivo.inventario || [];
    const normalizar = (s: string) => s.toLowerCase().trim();

    const bonoCompetencia = statsCalculadas.bonoCompetencia;
    const modificadores = statsCalculadas.modificadores;

    const clasePrincipal = personajeActivo.clase || "";
    const esMonje = clasePrincipal.toLowerCase().includes("monje");

    // 1. Armas Equipadas
    const armasEquipadas = inventario.filter(
      (obj) => obj.equipado && obj.tipoPrincipal === "Arma"
    );

    for (const armaInst of armasEquipadas) {
      const objetoCompendio = baseDatosObjetos.find(
        (o: ObjetoJuego) => o.id === armaInst.idObjeto || normalizar(o.nombre) === normalizar(armaInst.nombre)
      ) as Arma | undefined;

      const propiedades = objetoCompendio?.propiedades || [];
      const esSutil = propiedades.some((p) => normalizar(p).includes("sutil") || normalizar(p).includes("finesse"));
      const esDistancia = objetoCompendio?.tipoAtaque === "A Distancia" || propiedades.some((p) => normalizar(p).includes("distancia") || normalizar(p).includes("munición"));

      // Característica por defecto
      let caracDefecto: Caracteristica = "fuerza";
      if (esDistancia) {
        caracDefecto = "destreza";
      } else if (esSutil) {
        caracDefecto = (modificadores.destreza || 0) > (modificadores.fuerza || 0) ? "destreza" : "fuerza";
      } else if (esMonje) {
        caracDefecto = (modificadores.destreza || 0) > (modificadores.fuerza || 0) ? "destreza" : "fuerza";
      }

      // Si el usuario configuró override (ej. Pacto de la Hoja)
      const caracUsada = caracteristicasArmas[armaInst.idInstancia] || caracDefecto;
      const modAtributo = modificadores[caracUsada] || 0;

      // Bono mágico (ej. +1, +2)
      let bonoMagico = 0;
      if (armaInst.esMagico && armaInst.nombre.includes("+")) {
        const match = armaInst.nombre.match(/\+(\d+)/);
        if (match) bonoMagico = parseInt(match[1], 10);
      }

      const bonoAtaque = bonoCompetencia + modAtributo + bonoMagico;
      const dadoDanoBase = objetoCompendio?.dadoDano || "1d6";
      const tipoDano = objetoCompendio?.tipoDano || "Contundente";
      const modDanoTotal = modAtributo + bonoMagico;
      const signoMod = modDanoTotal >= 0 ? `+${modDanoTotal}` : `${modDanoTotal}`;
      const formulaDano = modDanoTotal !== 0 ? `${dadoDanoBase}${signoMod}` : dadoDanoBase;

      // Daño versátil si aplica
      let formulaVersatil: string | undefined;
      let dadoVersatilBase: string | undefined;
      if (objetoCompendio?.danoVersatil) {
        dadoVersatilBase = objetoCompendio.danoVersatil;
        formulaVersatil = modDanoTotal !== 0 ? `${dadoVersatilBase}${signoMod}` : dadoVersatilBase;
      }

      // Alcance
      let alcanceStr: string | undefined;
      if (objetoCompendio?.alcanceNormal) {
        alcanceStr = `${objetoCompendio.alcanceNormal}/${objetoCompendio.alcanceLargo || objetoCompendio.alcanceNormal} ft`;
      } else {
        alcanceStr = "5 ft";
      }

      ataques.push({
        id: armaInst.idInstancia,
        nombre: armaInst.nombre,
        tipo: "Arma",
        subtipo: objetoCompendio?.tipoAtaque || (esDistancia ? "A Distancia" : "Cuerpo a Cuerpo"),
        tipoAccion: "accion",
        caracteristicaUsada: caracUsada,
        bonoAtaque,
        dadoDano: formulaDano,
        dadoDanoBase,
        modificadorDano: modDanoTotal,
        esDanoFijo: false,
        danoVersatil: formulaVersatil,
        dadoVersatilBase,
        tipoDano,
        alcance: alcanceStr,
        propiedades,
        maestria: objetoCompendio?.maestria,
        esMagico: armaInst.esMagico,
        tieneTiradaAtaque: true
      });
    }

    // 2. Ataque Desarmado (Golpe sin Armas)
    const modFue = modificadores.fuerza || 0;
    const modDes = modificadores.destreza || 0;
    const caracDesarmado: Caracteristica = esMonje && modDes > modFue ? "destreza" : "fuerza";
    const modDesarmado = modificadores[caracDesarmado] || 0;
    const bonoAtaqueDesarmado = bonoCompetencia + modDesarmado;

    if (esMonje) {
      // Monje: dado de artes marciales (escala por nivel)
      const dadoMonje = "1d6";
      const formulaMonje = modDesarmado !== 0 ? `${dadoMonje}${modDesarmado >= 0 ? `+${modDesarmado}` : modDesarmado}` : dadoMonje;
      ataques.push({
        id: "ataque-desarmado",
        nombre: "Golpe sin Armas (Artes Marciales)",
        tipo: "Desarmado",
        subtipo: "Cuerpo a Cuerpo",
        tipoAccion: "accion",
        caracteristicaUsada: caracDesarmado,
        bonoAtaque: bonoAtaqueDesarmado,
        dadoDano: formulaMonje,
        dadoDanoBase: dadoMonje,
        modificadorDano: modDesarmado,
        esDanoFijo: false,
        tipoDano: "Contundente",
        alcance: "5 ft",
        propiedades: ["Artes Marciales"],
        tieneTiradaAtaque: true
      });
    } else {
      // Regla D&D 5.5e estándar: Daño Fijo 1 + FUE (Sin tirar dados de daño)
      const danoFijo = Math.max(1, 1 + modFue);
      ataques.push({
        id: "ataque-desarmado",
        nombre: "Golpe sin Armas",
        tipo: "Desarmado",
        subtipo: "Cuerpo a Cuerpo",
        tipoAccion: "accion",
        caracteristicaUsada: "fuerza",
        bonoAtaque: bonoAtaqueDesarmado,
        dadoDano: `${danoFijo}`,
        dadoDanoBase: "1",
        modificadorDano: modFue,
        esDanoFijo: true,
        tipoDano: "Contundente",
        alcance: "5 ft",
        propiedades: [],
        tieneTiradaAtaque: true
      });
    }

    return ataques;
  }, [personajeActivo, statsCalculadas, baseDatosObjetos, caracteristicasArmas]);

  // Conjuros preparados y conocidos categorizados por acción
  const conjurosAcciones = useMemo(() => {
    if (!personajeActivo) return [];

    const listaIds = [
      ...(personajeActivo.trucosConocidosIds || []),
      ...(personajeActivo.conjurosSiemprePreparadosIds || []),
      ...(personajeActivo.conjurosPreparadosIds || []),
      ...(personajeActivo.conjurosConocidosIds || [])
    ];

    const idsUnicos = Array.from(new Set(listaIds));
    const normalizar = (s: string) => s.toLowerCase().trim();

    const resultado: { hechizo: HechizoBase; tipoAccion: TipoAccionConsumida }[] = [];

    for (const id of idsUnicos) {
      const h = baseDatosConjuros.find(
        (c: HechizoBase) => c.id === id || normalizar(c.nombre) === normalizar(id)
      );
      if (h) {
        const tiempo = (h.tiempoLanzamiento || "").toLowerCase();
        let tipoAccion: TipoAccionConsumida = "accion";
        if (tiempo.includes("adicional") || tiempo.includes("bonus")) {
          tipoAccion = "accionAdicional";
        } else if (tiempo.includes("reacci")) {
          tipoAccion = "reaccion";
        }

        resultado.push({ hechizo: h, tipoAccion });
      }
    }

    resultado.sort((a, b) => a.hechizo.nivel - b.hechizo.nivel || a.hechizo.nombre.localeCompare(b.hechizo.nombre, "es"));
    return resultado;
  }, [personajeActivo, baseDatosConjuros]);

  // Lista dinámica de consumibles y pociones (D&D 5.5e Acción Rápida)
  const listaConsumibles = useMemo<ConsumibleAccionCalculado[]>(() => {
    if (!personajeActivo) return [];
    const inventario = personajeActivo.inventario || [];
    const resultado: ConsumibleAccionCalculado[] = [];

    for (const obj of inventario) {
      const esConsumible = esObjetoConsumible(obj.nombre, obj.notas);

      if (esConsumible && obj.cantidad > 0) {
        const info = detectarInfoConsumible(obj.nombre, obj.notas);
        resultado.push({
          idInstancia: obj.idInstancia,
          nombre: obj.nombre,
          cantidad: obj.cantidad,
          tipoAccion: info.esAccionAdicional ? "accionAdicional" : "accion",
          esPocion: info.esPocion,
          esCurativo: info.esCurativo,
          formulaCuracion: info.formulaCuracion,
          descripcionUso: info.descripcionUso,
          notas: obj.notas
        });
      }
    }

    return resultado;
  }, [personajeActivo]);

  // Manejadores de Tiradas para Armas y Ataques Físicos
  const manejarTirarAtaque = async (ataque: AtaquePersonajeCalculado) => {
    try {
      const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
      const bonoStr = ataque.bonoAtaque >= 0 ? `+${ataque.bonoAtaque}` : `${ataque.bonoAtaque}`;
      const formulaDados = `!Ataque ${sanitizarEtiqueta(ataque.nombre)}:1d20${bonoStr}`;
      const etiquetaLog = `${nombrePj} - Ataque con ${ataque.nombre}`;
      await lanzarDadosTaleSpire(formulaDados, etiquetaLog);
    } catch (err) {
      console.error("[VistaAtaquesJugador] Error al tirar ataque:", err);
    }
  };

  const manejarTirarDano = async (ataque: AtaquePersonajeCalculado, versatil: boolean = false) => {
    try {
      if (ataque.esDanoFijo) return; // No tirar dados si es daño fijo

      const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
      const formulaDadoUsar = versatil && ataque.danoVersatil ? ataque.danoVersatil : ataque.dadoDano;
      const formulaDados = `!Daño ${sanitizarEtiqueta(ataque.tipoDano)}:${formulaDadoUsar}`;
      const etiquetaLog = `${nombrePj} - Daño ${ataque.nombre}${versatil ? " (2 Manos)" : ""}`;
      await lanzarDadosTaleSpire(formulaDados, etiquetaLog);
    } catch (err) {
      console.error("[VistaAtaquesJugador] Error al tirar daño:", err);
    }
  };

  const manejarTirarCritico = async (ataque: AtaquePersonajeCalculado, versatil: boolean = false) => {
    try {
      if (ataque.esDanoFijo || !ataque.tieneTiradaAtaque) return;

      const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
      const dadoBase = versatil && ataque.dadoVersatilBase ? ataque.dadoVersatilBase : ataque.dadoDanoBase;

      // Duplicar el número de dados (ej. "1d8" -> "2d8", "2d6" -> "4d6")
      let formulaCritico = dadoBase;
      const matchDados = dadoBase.match(/^(\d+)d(\d+)/i);
      if (matchDados) {
        const numDados = parseInt(matchDados[1], 10) * 2;
        const tipoDado = matchDados[2];
        const resto = dadoBase.replace(/^(\d+)d(\d+)/i, "");
        formulaCritico = `${numDados}d${tipoDado}${resto}`;
      } else {
        formulaCritico = `2d6`;
      }

      if (ataque.modificadorDano !== 0) {
        const signo = ataque.modificadorDano >= 0 ? `+${ataque.modificadorDano}` : `${ataque.modificadorDano}`;
        formulaCritico = `${formulaCritico}${signo}`;
      }

      const formulaDados = `!Crítico ${sanitizarEtiqueta(ataque.tipoDano)}:${formulaCritico}`;
      const etiquetaLog = `${nombrePj} - ¡Golpe Crítico! con ${ataque.nombre}`;
      await lanzarDadosTaleSpire(formulaDados, etiquetaLog);
    } catch (err) {
      console.error("[VistaAtaquesJugador] Error al tirar crítico:", err);
    }
  };

  // Manejador de Acción Rápida "Usar" Consumible / Poción
  const manejarUsarConsumible = useCallback(async (cons: ConsumibleAccionCalculado) => {
    if (!personajeActivo) return;

    // 1. Reducir 1 unidad del inventario
    modificarCantidadObjeto(personajeActivo.id, cons.idInstancia, -1);

    // 2. Si es curativo, calcular tirada de sanación, tirar en TaleSpire y curar al personaje
    if (cons.esCurativo && cons.formulaCuracion) {
      const puntosCurados = evaluarFormulaDados(cons.formulaCuracion);
      aplicarCuracionPersonaje(personajeActivo.id, puntosCurados);

      const etiquetaTaleSpire = `!Curación ${sanitizarEtiqueta(cons.nombre)}:${cons.formulaCuracion}`;
      const log = `${personajeActivo.nombre} usa ${cons.nombre} y recupera ${puntosCurados} Puntos de Golpe`;
      try {
        await lanzarDadosTaleSpire(etiquetaTaleSpire, log);
      } catch (err) {
        console.error("[VistaAtaquesJugador] Error al tirar curación a TaleSpire:", err);
      }

      agregarNotificacion(
        `¡${cons.nombre} consumida! Has recuperado +${puntosCurados} PV.`,
        "exito"
      );
    } else {
      // Consumible no curativo
      const log = `${personajeActivo.nombre} usa ${cons.nombre}`;
      try {
        await lanzarDadosTaleSpire(`!Uso ${sanitizarEtiqueta(cons.nombre)}:1d1`, log);
      } catch (err) {
        console.error("[VistaAtaquesJugador] Error al enviar log a TaleSpire:", err);
      }
      agregarNotificacion(`Has usado 1× "${cons.nombre}".`, "info");
    }
  }, [personajeActivo, modificarCantidadObjeto, aplicarCuracionPersonaje, agregarNotificacion]);

  if (!personajeActivo || !statsCalculadas) {
    return (
      <div className={estilos.contenedorGeneral}>
        <div className={estilos.tarjetaVacia}>
          No hay personaje seleccionado. Selecciona o crea uno en la pestaña de Características.
        </div>
      </div>
    );
  }

  // Filtrado de ataques físicos, conjuros y consumibles
  const ataquesFisicosFiltrados = listaAtaquesFisicos.filter(
    (a) => filtro === "todas" || a.tipoAccion === filtro
  );

  const conjurosFiltrados = conjurosAcciones.filter(
    (item) => filtro === "todas" || item.tipoAccion === filtro
  );

  const consumiblesFiltrados = listaConsumibles.filter(
    (c) => filtro === "todas" || c.tipoAccion === filtro
  );

  // Conteos para los botones de filtro
  const conteoAccion =
    listaAtaquesFisicos.filter((a) => a.tipoAccion === "accion").length +
    conjurosAcciones.filter((c) => c.tipoAccion === "accion").length +
    listaConsumibles.filter((c) => c.tipoAccion === "accion").length;

  const conteoAccionAdicional =
    listaAtaquesFisicos.filter((a) => a.tipoAccion === "accionAdicional").length +
    conjurosAcciones.filter((c) => c.tipoAccion === "accionAdicional").length +
    listaConsumibles.filter((c) => c.tipoAccion === "accionAdicional").length;

  const conteoReaccion =
    listaAtaquesFisicos.filter((a) => a.tipoAccion === "reaccion").length +
    conjurosAcciones.filter((c) => c.tipoAccion === "reaccion").length +
    listaConsumibles.filter((c) => c.tipoAccion === "reaccion").length;

  const conteoTotal = listaAtaquesFisicos.length + conjurosAcciones.length + listaConsumibles.length;

  // Parámetros de magia
  const modMagico = statsCalculadas.modificadores[habilidadMagica] || 0;
  const bonoAtaqueMagico = calcularBonoAtaqueConjuro(
    statsCalculadas.bonoCompetencia,
    modMagico
  );

  const tieneEspaciosEstandar = Object.values(personajeActivo.espaciosConjuroMaximos || {}).some((v) => (v || 0) > 0);
  const tienePuntosEstandar = (personajeActivo.puntosConjuroMaximos || 0) > 0;
  const tieneMagiaEstandar = sistemaMagia === "puntos" ? tienePuntosEstandar : tieneEspaciosEstandar;
  const tienePacto = (personajeActivo.espaciosPactoMaximos || 0) > 0 || (personajeActivo.clase || "").toLowerCase().includes("brujo");

  return (
    <div className={estilos.contenedorGeneral}>
      {/* Cabecera Principal */}
      <div className={estilos.cabeceraPrincipal}>
        <div className={estilos.filaTitulo}>
          <div className={estilos.grupoTitulo}>
            <Swords size={18} color="#38bdf8" />
            <h2 className={estilos.tituloTexto}>Acciones de Combate</h2>
            <span className={estilos.contadorBadge}>{conteoTotal}</span>
          </div>

          {personajes.length > 1 && (
            <div className={estilos.selectorPersonaje}>
              <UserCheck size={14} color="#94a3b8" />
              <SelectorDesplegable<string>
                valor={personajeActivo.id}
                alCambiar={(id) => seleccionarPersonajeActivo(id)}
                tamano="compacto"
                opciones={personajes.map((pj) => ({
                  valor: pj.id,
                  etiqueta: `${pj.nombre} (${pj.clase || "PJ"})`
                }))}
              />
            </div>
          )}
        </div>

        {/* Barra de Filtros Tácticos de Acción */}
        <div className={estilos.barraFiltros}>
          <button
            type="button"
            className={`${estilos.botonFiltro} ${filtro === "todas" ? estilos.botonFiltroActivo : ""}`}
            onClick={() => setFiltro("todas")}
          >
            <span>Todas</span>
            <span className={estilos.badgeConteoFiltro}>({conteoTotal})</span>
          </button>

          <button
            type="button"
            className={`${estilos.botonFiltro} ${filtro === "accion" ? estilos.botonFiltroActivo : ""}`}
            onClick={() => setFiltro("accion")}
          >
            <span>Acción</span>
            <span className={estilos.badgeConteoFiltro}>({conteoAccion})</span>
          </button>

          <button
            type="button"
            className={`${estilos.botonFiltro} ${filtro === "accionAdicional" ? estilos.botonFiltroActivo : ""}`}
            onClick={() => setFiltro("accionAdicional")}
          >
            <span>Acción Adicional</span>
            <span className={estilos.badgeConteoFiltro}>({conteoAccionAdicional})</span>
          </button>

          <button
            type="button"
            className={`${estilos.botonFiltro} ${filtro === "reaccion" ? estilos.botonFiltroActivo : ""}`}
            onClick={() => setFiltro("reaccion")}
          >
            <span>Reacción</span>
            <span className={estilos.badgeConteoFiltro}>({conteoReaccion})</span>
          </button>
        </div>
      </div>

      {/* Trackers de Recursos Mágicos (Espacios de Conjuro, Pacto y Puntos) */}
      {(tieneMagiaEstandar || tienePacto) && (
        <div className={estilos.seccionGrupoAtaques}>
          <div className={estilos.cabeceraGrupoAtaques}>
            <div className={estilos.tituloGrupoAtaques}>
              <Sparkles size={14} color="#c084fc" />
              <span>Espacios y Recursos de Conjuro</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tieneMagiaEstandar && (
              sistemaMagia === "puntos" ? (
                <TrackerPuntosConjuro
                  puntosMaximos={personajeActivo.puntosConjuroMaximos || 0}
                  puntosGastados={personajeActivo.puntosConjuroGastados || 0}
                  nivelMaximo={personajeActivo.nivelConjuroMaximo || 0}
                  alGastarPuntos={(cant) => gastarPuntosConjuro(personajeActivo.id, cant)}
                  alRecuperarPuntos={(cant) => recuperarPuntosConjuro(personajeActivo.id, cant)}
                  alRecuperarTodosPuntos={() => recuperarTodosPuntosConjuro(personajeActivo.id)}
                />
              ) : (
                <TrackerEspaciosConjuro
                  espaciosMaximos={personajeActivo.espaciosConjuroMaximos || {}}
                  espaciosGastados={personajeActivo.espaciosConjuroGastados || {}}
                  alGastarEspacio={(niv) => gastarEspacioConjuro(personajeActivo.id, niv)}
                  alRecuperarEspacio={(niv) => recuperarEspacioConjuro(personajeActivo.id, niv)}
                  alRecuperarTodosEspacios={() => recuperarTodosEspaciosConjuro(personajeActivo.id)}
                />
              )
            )}

            {tienePacto && (
              <TrackerEspaciosPacto
                espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
                espaciosPactoGastados={personajeActivo.espaciosPactoGastados || 0}
                nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 1}
                alGastarEspacioPacto={() => gastarEspacioPacto(personajeActivo.id)}
                alRecuperarEspaciosPacto={() => recuperarTodosEspaciosConjuro(personajeActivo.id)}
              />
            )}
          </div>
        </div>
      )}

      {/* Sección 1: Ataques con Armas y Desarmado */}
      {ataquesFisicosFiltrados.length > 0 && (
        <div className={estilos.seccionGrupoAtaques}>
          <div className={estilos.cabeceraGrupoAtaques}>
            <div className={estilos.tituloGrupoAtaques}>
              <Swords size={14} color="#38bdf8" />
              <span>Armas y Ataques Físicos ({ataquesFisicosFiltrados.length})</span>
            </div>
          </div>

          <div className={estilos.listaAtaques}>
            {ataquesFisicosFiltrados.map((ataque) => (
              <TarjetaAtaquePersonaje
                key={ataque.id}
                ataque={ataque}
                alTirarAtaque={manejarTirarAtaque}
                alTirarDano={manejarTirarDano}
                alTirarCritico={manejarTirarCritico}
                alCambiarCaracteristica={manejarCambiarCaracteristicaArma}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sección 2: Conjuros y Trucos de Combate (DRY Completo) */}
      {conjurosFiltrados.length > 0 && (
        <div className={estilos.seccionGrupoAtaques}>
          <div className={estilos.cabeceraGrupoAtaques}>
            <div className={estilos.tituloGrupoAtaques}>
              <Sparkles size={14} color="#c084fc" />
              <span>Conjuros y Acciones Mágicas ({conjurosFiltrados.length})</span>
            </div>
          </div>

          <div className={estilos.listaAtaques}>
            {conjurosFiltrados.map(({ hechizo }) => (
              <TarjetaConjuroCompacta
                key={hechizo.id}
                hechizo={hechizo}
                nombrePersonaje={personajeActivo.nombre}
                nivelPersonaje={personajeActivo.nivel || 1}
                bonoAtaqueMagico={bonoAtaqueMagico}
                estaPreparado={true}
                mostrarTogglePreparado={false}
                esConcentracionActual={personajeActivo.concentracionActiva?.hechizoId === hechizo.id}
                alAbrirDetalleCompleto={(h) => setHechizoDetalle(h)}
                alQuitarDeLista={() => {}}
                alGastarEspacio={(niv) => gastarEspacioConjuro(personajeActivo.id, niv)}
                alGastarPuntos={(cant) => gastarPuntosConjuro(personajeActivo.id, cant)}
                alGastarEspacioPacto={() => gastarEspacioPacto(personajeActivo.id)}
                esLanzadorPacto={tienePacto}
                nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 0}
                espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
                espaciosPactoGastados={personajeActivo.espaciosPactoGastados || 0}
                espaciosConjuroMaximos={personajeActivo.espaciosConjuroMaximos || {}}
                nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
                alEstablecerConcentracion={(id, nombre) => establecerConcentracion(personajeActivo.id, id, nombre)}
                costePuntosPorNivel={COSTE_PUNTOS_POR_NIVEL}
                sistemaMagia={sistemaMagia}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sección 3: Consumibles y Pociones (D&D 5.5e Acción Rápida) */}
      {consumiblesFiltrados.length > 0 && (
        <div className={estilos.seccionGrupoAtaques}>
          <div className={estilos.cabeceraGrupoAtaques}>
            <div className={estilos.tituloGrupoAtaques}>
              <FlaskConical size={14} color="#10b981" />
              <span>Consumibles y Pociones ({consumiblesFiltrados.length})</span>
            </div>
          </div>

          <div className={estilos.listaAtaques}>
            {consumiblesFiltrados.map((cons) => (
              <TarjetaConsumibleAccion
                key={cons.idInstancia}
                consumible={cons}
                alUsar={manejarUsarConsumible}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío cuando no hay acciones con el filtro seleccionado */}
      {ataquesFisicosFiltrados.length === 0 && conjurosFiltrados.length === 0 && consumiblesFiltrados.length === 0 && (
        <div className={estilos.tarjetaVacia}>
          No se encontraron acciones de tipo <strong>"{filtro.toUpperCase()}"</strong> para este personaje.
        </div>
      )}

      {/* Modal de Detalle Completo de Hechizo */}
      {hechizoDetalle && (
        <FichaHechizo
          hechizo={hechizoDetalle}
          onClose={() => setHechizoDetalle(null)}
          nombrePersonaje={personajeActivo.nombre}
          nivelPersonaje={personajeActivo.nivel || 1}
          bonoAtaqueMagico={bonoAtaqueMagico}
        />
      )}
    </div>
  );
};

export default VistaAtaquesJugador;
