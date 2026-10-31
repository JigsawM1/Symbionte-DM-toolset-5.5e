import React, { useState, useMemo, useRef, useEffect } from "react";
import { Zap, Dices, Search, Flame, X } from "lucide-react";
import { usarEstadoPersonajes, usarAccionesConfiguracion } from "@/almacen/selectores";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import {
  obtenerEntradasMagiaSalvaje,
  buscarEntradaPorTirada,
  formatearSobrecargaParaChat,
  resolverSubtiradasDeFila,
  solicitarPercentiles,
  obtenerUltimoResultadoMagiaSalvaje,
  obtenerEnviosPendientesMagiaSalvaje,
  type EntradaMagiaSalvaje
} from "@/servicios/magiaSalvaje/servicioMagiaSalvaje";
import { obtenerAccionesTabla, resolverTablaRasgo } from "@/servicios/rasgos/tablasAleatoriasRasgos";
import { ts } from "@/utiles/TaleSpireAdapter";
import { generarId } from "@/utiles/generarId";
import { logger } from "@/utiles/logger";
import type { ResultadoTabla } from "@/tipos";
import { TarjetaUltimaSobrecarga } from "./TarjetaUltimaSobrecarga";
import { FilaSobrecargaMagiaSalvaje } from "./FilaSobrecargaMagiaSalvaje";
import { PanelCaosControlado, type OpcionCaosControlado } from "./PanelCaosControlado";
import estilos from "./MagiaSalvaje.module.css";

export const VistaMagiaSalvaje: React.FC = () => {
  const { personajeActivo } = usarEstadoPersonajes();
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const contextoTabla = usarAlmacenDM(s => s.tablaRasgoAbierta);

  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [tirandoD100, setTirandoD100] = useState(false);
  const [enviandoChat, setEnviandoChat] = useState(false);
  const [mostrarSelectorManual, setMostrarSelectorManual] = useState(false);
  const [numeroManual, setNumeroManual] = useState<string>("");
  const [filaConsulta, setFilaConsulta] = useState<string | null>(null);
  const [idAccionSeleccionada, seleccionarAccion] = useState<string | null>(null);
  const [eleccionCaos, setEleccionCaos] = useState<(OpcionCaosControlado & { idRasgo: string }) | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const tiradaEnCursoRef = useRef(false);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const botonNumeroRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [personajeActivo?.id, contextoTabla?.idRasgo]);

  const familia = useMemo(() => {
    if (!personajeActivo || contextoTabla?.idPersonaje !== personajeActivo.id) return;
    const tabla = resolverTablaRasgo(personajeActivo, contextoTabla.idRasgo);
    if (tabla?.configuracion.presentacion !== "magia_salvaje") return;
    return { tabla, acciones: obtenerAccionesTabla(personajeActivo, tabla.rasgoTabla.id),
      entradas: obtenerEntradasMagiaSalvaje(tabla.filasCompletas) };
  }, [contextoTabla, personajeActivo]);
  const tablaAccion = idAccionSeleccionada ? familia?.acciones.find(a => a.rasgoAccion.id === idAccionSeleccionada) : familia?.tabla;
  const rasgoAccion = tablaAccion?.rasgoAccion;
  const cfgAccion = tablaAccion?.configuracion;
  const modoSeleccionDomada = cfgAccion?.modo === "elegir";
  const rasgoResultado = personajeActivo && familia ? obtenerUltimoResultadoMagiaSalvaje(personajeActivo, familia.tabla.rasgoTabla.id) : undefined;
  const resultadoPersistido = rasgoResultado?.resultadoTabla ?? null;
  const entradaResultado = resultadoPersistido?.idFila ? familia?.entradas.find(e => e.id === resultadoPersistido.idFila)
    : resultadoPersistido?.tiradaD100 ? buscarEntradaPorTirada(resultadoPersistido.tiradaD100, familia?.entradas ?? []) : undefined;
  const enviosAnteriores = personajeActivo && familia ? obtenerEnviosPendientesMagiaSalvaje(personajeActivo, familia.tabla.rasgoTabla.id) : [];
  const motivoBloqueo = !tablaAccion ? "La referencia o configuración de la tabla no es válida."
    : eleccionCaos ? "Elige uno de los dos resultados de Caos controlado para continuar."
      : tablaAccion.motivoBloqueo;

  useEffect(() => {
    setEleccionCaos(null);
    seleccionarAccion(null);
  }, [personajeActivo?.id, contextoTabla?.idRasgo]);

  useEffect(() => {
    if (resultadoPersistido?.id) resultadoRef.current?.scrollIntoView({ block: "start" });
  }, [resultadoPersistido?.id]);

  useEffect(() => {
    if (!filaConsulta) return;
    const fila = document.getElementById(filaConsulta);
    fila?.focus({ preventScroll: true });
    fila?.scrollIntoView({ behavior: "instant", block: "center" });
    setFilaConsulta(null);
  }, [filaConsulta]);

  const ejecutarTirada = async (tarea: (signal: AbortSignal) => Promise<void>) => {
    if (tiradaEnCursoRef.current) return;
    tiradaEnCursoRef.current = true;
    setTirandoD100(true);
    abortControllerRef.current = new AbortController();
    try {
      await tarea(abortControllerRef.current.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      logger.error("[VistaMagiaSalvaje] Error en la tirada:", err);
      agregarNotificacion("No se pudo completar la tirada de dados.", "error");
    } finally {
      tiradaEnCursoRef.current = false;
      setTirandoD100(false);
    }
  };

  const enviarResultadoAlChat = async (idPersonaje: string, idRasgo: string, resultado: Pick<ResultadoTabla, "id" | "texto">) => {
    setEnviandoChat(true);
    try {
      if (!await ts.chat.send(resultado.texto)) throw new Error("El chat no confirmó el envío.");
      usarAlmacenDM.getState().operarRecursoRasgoPersonaje(idPersonaje, {
        tipo: "enviarTabla", idRasgo, idResultado: resultado.id, textoResultado: resultado.texto
      });
      agregarNotificacion("Sobrecarga enviada al chat de TaleSpire.", "exito");
    } catch (err) {
      logger.error("[VistaMagiaSalvaje] Error al enviar al chat:", err);
      agregarNotificacion("Sobrecarga guardada. Falló el envío al chat; puedes reintentarlo.", "advertencia");
    } finally {
      setEnviandoChat(false);
    }
  };

  const ejecutarResolucionYGuardado = async (
    tiradaExacta: number | undefined, entrada: EntradaMagiaSalvaje, origen: "talespire" | "local",
    signal: AbortSignal, idRasgo = rasgoAccion?.id
  ) => {
    if (!personajeActivo || !idRasgo) return false;
    const fichaVigente = usarAlmacenDM.getState().personajes.find(p => p.id === personajeActivo.id);
    const accionVigente = fichaVigente && resolverTablaRasgo(fichaVigente, idRasgo);
    if (!accionVigente?.disponible || !accionVigente.configuracion.filas.some(f => f.id === entrada.id)) {
      agregarNotificacion("La acción o la fila ya no está disponible.", "advertencia");
      return false;
    }
    const subtiradas = await resolverSubtiradasDeFila(entrada, signal);
    if (signal?.aborted) return false;
    const textoChat = formatearSobrecargaParaChat(
      personajeActivo.nombre,
      tiradaExacta,
      entrada,
      subtiradas
    );
    const idResultado = generarId("surge");

    const guardado = usarAlmacenDM.getState().operarRecursoRasgoPersonaje(personajeActivo.id, {
      tipo: "guardarTabla",
      idRasgo,
      texto: textoChat,
      detalle: {
        id: idResultado,
        fecha: Date.now(),
        idFila: entrada.id,
        tiradaD100: tiradaExacta,
        estadoEnvio: ts.estaDisponible ? "pendiente" : "local",
        origen,
        subtiradas
      }
    });

    if (!guardado) {
      agregarNotificacion("El recurso cambió. No se aplicó la oleada.", "advertencia");
      return false;
    }

    if (ts.estaDisponible) {
      await enviarResultadoAlChat(personajeActivo.id, idRasgo, { id: idResultado, texto: textoChat });
    } else {
      agregarNotificacion("Oleada guardada localmente.", "info");
    }
    return true;
  };

  const manejarTirarD100 = async () => {
    if (eleccionCaos || !personajeActivo || !rasgoAccion || !tablaAccion?.disponible || !familia || modoSeleccionDomada) return;
    await ejecutarTirada(async signal => {
      const res = await solicitarPercentiles(cfgAccion?.tiradas === 2 ? 2 : 1, signal);
      if (signal.aborted) return;
      if (res.tiradas.length === 2) {
        const [tiradaA, tiradaB] = res.tiradas;
        setEleccionCaos({ tiradaA, tiradaB, entradaA: buscarEntradaPorTirada(tiradaA, familia.entradas)!,
          entradaB: buscarEntradaPorTirada(tiradaB, familia.entradas)!, origen: res.origen, idRasgo: rasgoAccion.id });
        agregarNotificacion("Caos Controlado: Selecciona cuál de las dos tiradas manifestar.", "info");
      } else {
        const tirada = res.tiradas[0];
        await ejecutarResolucionYGuardado(tirada, buscarEntradaPorTirada(tirada, familia.entradas)!, res.origen, signal);
      }
    });
  };

  const manejarElegirCaosControlado = async (tirada: number, entrada: EntradaMagiaSalvaje) => {
    if (!eleccionCaos) return;
    await ejecutarTirada(async signal => {
      setEleccionCaos(null);
      await ejecutarResolucionYGuardado(tirada, entrada, eleccionCaos.origen, signal, eleccionCaos.idRasgo);
    });
  };

  const manejarElegirOleadaDomada = async (entrada: EntradaMagiaSalvaje) => {
    if (!personajeActivo || !tablaAccion?.disponible || !modoSeleccionDomada || eleccionCaos) return;
    await ejecutarTirada(async signal => {
      const guardado = await ejecutarResolucionYGuardado(undefined, entrada,
        ts.estaDisponible ? "talespire" : "local", signal);
      if (guardado) seleccionarAccion(familia!.tabla.rasgoTabla.id);
    });
  };

  const manejarReintentarEnvio = async (resultado: ResultadoTabla | null = resultadoPersistido, idRasgo = rasgoResultado?.id) => {
    if (!resultado || !idRasgo || enviandoChat || !personajeActivo) return;
    if (!ts.estaDisponible) {
      agregarNotificacion("TaleSpire no está conectado.", "advertencia");
      return;
    }
    await enviarResultadoAlChat(personajeActivo.id, idRasgo, resultado);
  };

  const confirmarEnvioExistente = (resultado: ResultadoTabla | null = resultadoPersistido, idRasgo = rasgoResultado?.id) => {
    if (!personajeActivo || !resultado || !idRasgo) return;
    usarAlmacenDM.getState().operarRecursoRasgoPersonaje(personajeActivo.id, {
      tipo: "enviarTabla", idRasgo, idResultado: resultado.id, textoResultado: resultado.texto
    });
  };

  const entradasFiltradas = useMemo(() => {
    const q = terminoBusqueda.trim().toLowerCase();
    const entradas = familia?.entradas ?? [];
    if (!q) return entradas;
    return entradas.filter((e) => {
      const rangoStr = `${e.desde}-${e.hasta}`;
      return (
        rangoStr.indexOf(q) !== -1 ||
        e.titulo.toLowerCase().indexOf(q) !== -1 ||
        e.texto.toLowerCase().indexOf(q) !== -1 ||
        e.badge.toLowerCase().indexOf(q) !== -1 ||
        (e.duracion && e.duracion.toLowerCase().indexOf(q) !== -1)
      );
    });
  }, [terminoBusqueda, familia]);

  const manejarBuscarNumeroManual = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(numeroManual);
    if (Number.isInteger(num) && num >= 1 && num <= 100) {
      const entrada = buscarEntradaPorTirada(num, familia?.entradas ?? []);
      if (entrada) {
        setTerminoBusqueda("");
        setFilaConsulta(`sobrecarga-${entrada.desde}`);
        setMostrarSelectorManual(false);
        setNumeroManual("");
      }
    }
  };

  return (
    <div className={`${estilos.contenedorPrincipal} u-scroll-cef`} role="region" aria-label="Magia Salvaje">
      <div className={estilos.contenido}>
      <header className={estilos.cabecera}>
        <div className={estilos.titulos}>
          <h2 className={estilos.tituloPrincipal}>
            <Zap size={18} className={estilos.iconoRayo} />
            Magia Salvaje
          </h2>
          <p className={estilos.subtitulo}>
            {familia?.tabla.rasgoTabla.nombre ?? "Tabla no disponible"} • Bandeja 3D (1-100)
          </p>
        </div>
      </header>

      {/* Botones Principales de Acción */}
      <div className={estilos.barraAccionesPrincipales}>
        {motivoBloqueo && <p className={estilos.descripcionFila} role="status">{motivoBloqueo}</p>}
        {cfgAccion?.modo !== "elegir" && (
        <button
          type="button"
          onClick={() => void manejarTirarD100()}
          disabled={tirandoD100 || Boolean(eleccionCaos) || !tablaAccion?.disponible}
          title={motivoBloqueo}
          className={estilos.botonTirarD100}
        >
          <Dices size={18} />
          <span>
            {tirandoD100
              ? "Esperando tirada en TaleSpire..."
              : cfgAccion?.tiradas === 2 ? "Tirar con Caos Controlado (dos percentiles)"
                  : "Tirar percentil (1d100 + 1d10)"}
          </span>
        </button>
        )}

        <div className={estilos.accionesEspeciales}>
        {familia?.acciones.filter(a => a.rasgoAccion.id !== a.rasgoTabla.id).map(accion => (
          <button
            key={accion.rasgoAccion.id}
            type="button"
            disabled={(accion.rasgoAccion.id !== rasgoAccion?.id && !accion.disponible) || tirandoD100 || Boolean(eleccionCaos)}
            onClick={() => seleccionarAccion(accion.rasgoAccion.id === rasgoAccion?.id ? accion.rasgoTabla.id : accion.rasgoAccion.id)}
            className={`${estilos.botonOleadaDomada} ${accion.rasgoAccion.id === rasgoAccion?.id ? estilos.domadaActiva : ""}`}
            aria-pressed={accion.rasgoAccion.id === rasgoAccion?.id}
            title={accion.motivoBloqueo ?? accion.rasgoAccion.descripcion}
          >
            <Flame size={15} />
            <span>
              {accion.rasgoAccion.id === rasgoAccion?.id ? "Cancelar selección" : accion.rasgoAccion.nombre}
              {accion.rasgoAccion.tieneUsosLimitados && ` [${accion.rasgoAccion.usosRestantes ?? accion.rasgoAccion.usosMaximos ?? 0}/${accion.rasgoAccion.usosMaximos ?? 0} usos]`}
            </span>
          </button>
        ))}
        </div>
        {modoSeleccionDomada && <p className={estilos.avisoSeleccion} role="status">Elige un efecto de la tabla. El uso se gastará al confirmar la elección.</p>}
      </div>

      {eleccionCaos && <PanelCaosControlado eleccion={eleccionCaos}
        alElegir={(tirada, entrada) => void manejarElegirCaosControlado(tirada, entrada)} />}

      {/* Tarjeta de Última Sobrecarga Persistida */}
      {!eleccionCaos && (
      <div ref={resultadoRef}><TarjetaUltimaSobrecarga
        resultado={resultadoPersistido}
        entrada={entradaResultado}
        alReintentarEnvio={() => void manejarReintentarEnvio()}
        alConfirmarEnvio={() => confirmarEnvioExistente()}
        enviandoChat={enviandoChat}
      /></div>
      )}

      {enviosAnteriores.length > 0 && <details className={`${estilos.tarjetaUltimaSobrecarga} ${estilos.pendientes}`}>
        <summary>Envíos anteriores pendientes ({enviosAnteriores.length})</summary>
        <p>Puedes seguir tirando. Estos resultados se conservan para enviarlos al chat.</p>
        {enviosAnteriores.map(({ idRasgo, resultado }, i) => <div className={estilos.envioPendiente} key={resultado.id ?? `${idRasgo}-${i}`}>
          <p className={estilos.textoHistorico}>{resultado.texto}</p>
          <div className={estilos.pieUltima}>
          <button type="button" className={estilos.botonEnviarChat} disabled={enviandoChat}
            onClick={() => void manejarReintentarEnvio(resultado, idRasgo)}>Reintentar envío</button>
          <button type="button" className={estilos.botonEnviarChat} disabled={enviandoChat}
            onClick={() => confirmarEnvioExistente(resultado, idRasgo)}>Ya está en el chat</button>
          </div>
        </div>)}
      </details>}

      {/* Barra de Filtro y Búsqueda */}
      <section className={estilos.seccionTabla} aria-label="Tabla de efectos">
      <div className={estilos.cabeceraTabla}>
        <h3 className={estilos.tituloTabla}>Tabla de efectos</h3>
        <span className={estilos.contador} role="status">{entradasFiltradas.length} de {familia?.entradas.length ?? 0} efectos</span>
      </div>
      <div className={estilos.barraBusquedaFiltros}>
        <div className={estilos.contenedorInput}>
          <Search size={14} className={estilos.iconoBusqueda} />
          <input
            type="text"
            aria-label="Buscar efectos de magia salvaje"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            placeholder="Buscar efecto o conjuro…"
            className={estilos.inputBusqueda}
          />
          {terminoBusqueda && (
            <button
              type="button"
              className={estilos.botonLimpiarBusqueda}
              onClick={() => setTerminoBusqueda("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          type="button"
          ref={botonNumeroRef}
          aria-expanded={mostrarSelectorManual}
          aria-controls="magia-salvaje-selector-numero"
          onClick={() => setMostrarSelectorManual(!mostrarSelectorManual)}
          className={estilos.botonFiltroRapido}
          title="Consultar número exacto de dado (1-100)"
        >
          <Dices size={14} />
          <span>Ir a número</span>
        </button>
      </div>

      {mostrarSelectorManual && (
        <form id="magia-salvaje-selector-numero" onSubmit={manejarBuscarNumeroManual} className={estilos.selectorManual}
          onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setMostrarSelectorManual(false); setNumeroManual(""); botonNumeroRef.current?.focus(); } }}>
          <label htmlFor="magia-salvaje-numero">Número (1–100)</label>
          <input
            type="number"
            id="magia-salvaje-numero"
            required
            step={1}
            min={1}
            max={100}
            value={numeroManual}
            onChange={(e) => setNumeroManual(e.target.value)}
            className={estilos.inputNumeroManual}
            placeholder="25"
            autoFocus
          />
          <button type="submit" className={estilos.botonEnviarChat}>
            Ir
          </button>
        </form>
      )}

      {/* Lista Canónica de Sobrecargas */}
      <div className={estilos.listaSobrecargas}>
        {entradasFiltradas.length === 0 && <p className={estilos.sinCoincidencias}>No hay efectos que coincidan con la búsqueda.</p>}
        {entradasFiltradas.map((entrada) => {
          const esActiva = resultadoPersistido?.idFila
            ? resultadoPersistido.idFila === entrada.id
            : resultadoPersistido?.tiradaD100 !== undefined
              ? resultadoPersistido.tiradaD100 >= entrada.desde && resultadoPersistido.tiradaD100 <= entrada.hasta
              : false;

          return (
            <FilaSobrecargaMagiaSalvaje
              key={entrada.id}
              entrada={entrada}
              esActiva={esActiva}
              subtiradasResultado={esActiva ? resultadoPersistido?.subtiradas : undefined}
              modoSeleccionDomada={modoSeleccionDomada}
              elegible={Boolean(tablaAccion?.disponible && !tirandoD100 && cfgAccion?.filas.some(f => f.id === entrada.id))}
              alElegirDomada={() => void manejarElegirOleadaDomada(entrada)}
            />
          );
        })}
      </div>
      </section>
      </div>
    </div>
  );
};
