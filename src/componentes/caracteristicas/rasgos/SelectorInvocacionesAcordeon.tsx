import React, { useState, useMemo } from "react";
import type { SelectorRasgo } from "@/tipos/rasgos";
import type { HechizoBase } from "@/tipos";
import {
  Lock,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Search,
  Zap,
  Flame,
  Award,
  Heart
} from "lucide-react";
import dotesJson from "@/datos/dotes.json";
import { TextoEnriquecidoDND, SelectorDesplegable, type OpcionDesplegable } from "@/componentes/comunes";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { obtenerMaxInvocacionesBrujo, obtenerNivelEspacioPacto } from "@/constantes/invocacionesSobrenaturales";
import { logger } from "@/utiles/logger";
import { aplicarResultadoHpTemporalEnEstado } from "@/utiles/lanzadorDados";
import estilos from "./SelectorInvocacionesAcordeon.module.css";

interface SelectorInvocacionesAcordeonProps {
  selector: SelectorRasgo;
  nivelPersonaje?: number;
  alActualizarSeleccion?: (idSelector: string, valores: string[]) => void;
}

/**
 * Normaliza comparaciones entre IDs registrados en la ficha y el ID base de la invocación.
 * Soporta sufijos como 'devorador_de_vida:psiquico' o 'descarga_ahuyentadora__123:descarga_sobrenatural'.
 */
function coincideInvocacionId(idRegistrado: string, idBase: string): boolean {
  if (idRegistrado === idBase) return true;
  if (idRegistrado.startsWith(`${idBase}:`)) return true;
  if (idRegistrado.startsWith(`${idBase}__`)) return true;
  return false;
}

export const SelectorInvocacionesAcordeon: React.FC<SelectorInvocacionesAcordeonProps> = ({
  selector,
  nivelPersonaje,
  alActualizarSeleccion
}) => {
  const seleccionados = useMemo(() => selector.valorActual || [], [selector.valorActual]);

  const max = useMemo(() => {
    if (selector.escaladoMaxSelecciones && nivelPersonaje) {
      const entrada = [...selector.escaladoMaxSelecciones]
        .sort((a, b) => b.nivelMinimo - a.nivelMinimo)
        .find((e) => nivelPersonaje >= e.nivelMinimo);
      if (entrada) return entrada.valor;
    }
    if (nivelPersonaje && (selector.id.toLowerCase().includes("invocacion") || selector.etiqueta.toLowerCase().includes("invocaci"))) {
      return obtenerMaxInvocacionesBrujo(nivelPersonaje);
    }
    return selector.maxSelecciones || 1;
  }, [selector.escaladoMaxSelecciones, selector.maxSelecciones, selector.id, selector.etiqueta, nivelPersonaje]);

  // Obtener personaje activo y compendio de hechizos para consultar trucos de ataque aprendidos
  const personajeActivo = usarAlmacenDM(
    React.useCallback((s) => s.personajes.find((p) => p.id === s.idPersonajeActivo) || s.personajes[0] || null, [])
  );
  const { baseDatosHechizos: hechizosCompendio } = usarEstadoHomebrew();

  // Trucos con tirada de ataque conocidos por el personaje (para Descarga Ahuyentadora)
  const trucosAtaqueOpciones: OpcionDesplegable<string>[] = useMemo(() => {
    const idsConocidos = new Set([
      ...(personajeActivo?.trucosConocidosIds || []),
      ...(personajeActivo?.conjurosConocidosIds || [])
    ]);

    const todosTrucosAtaque = (hechizosCompendio || []).filter((h: HechizoBase) => {
      const esTruco = h.nivel === 0;
      const esAtaque = h.requiereAtaque === true || h.ataqueCd === "ATAQUE" || (h.descripcion || "").toLowerCase().includes("ataque de conjuro");
      return esTruco && esAtaque;
    });

    const aprendidos = todosTrucosAtaque.filter((h: HechizoBase) =>
      idsConocidos.has(h.id) ||
      idsConocidos.has(h.nombre) ||
      Array.from(idsConocidos).some((cid) => coincideHechizoId(cid, h.id) || coincideHechizoId(cid, h.nombre))
    );

    const candidatos = aprendidos.length > 0 ? aprendidos : todosTrucosAtaque;
    return candidatos.map((h: HechizoBase) => ({
      valor: h.id,
      etiqueta: `${h.nombre} (${h.tipoDaño || "Fuerza"} • ${h.alcance || "120 ft"})`
    }));
  }, [hechizosCompendio, personajeActivo]);

  // Trucos que causan daño (para Descarga Agónica)
  const trucosDanoOpciones: OpcionDesplegable<string>[] = useMemo(() => {
    const idsConocidos = new Set([
      ...(personajeActivo?.trucosConocidosIds || []),
      ...(personajeActivo?.conjurosConocidosIds || [])
    ]);

    const todosTrucosDano = (hechizosCompendio || []).filter((h: HechizoBase) => {
      const esTruco = h.nivel === 0;
      const tieneDano = Boolean((h.tipoDaño && h.tipoDaño !== "N/A") || h.dadosDaño || (h.descripcion || "").toLowerCase().includes("daño"));
      return esTruco && tieneDano;
    });

    const aprendidos = todosTrucosDano.filter((h: HechizoBase) =>
      idsConocidos.has(h.id) ||
      idsConocidos.has(h.nombre) ||
      Array.from(idsConocidos).some((cid) => coincideHechizoId(cid, h.id) || coincideHechizoId(cid, h.nombre))
    );

    const candidatos = aprendidos.length > 0 ? aprendidos : todosTrucosDano;
    return candidatos.map((h: HechizoBase) => ({
      valor: h.id,
      etiqueta: `${h.nombre} (${h.tipoDaño || "Fuerza"})`
    }));
  }, [hechizosCompendio, personajeActivo]);

  // Trucos con daño y alcance de al menos 10 pies (para Lanza Sobrenatural)
  const trucosAlcanceOpciones: OpcionDesplegable<string>[] = useMemo(() => {
    const idsConocidos = new Set([
      ...(personajeActivo?.trucosConocidosIds || []),
      ...(personajeActivo?.conjurosConocidosIds || [])
    ]);

    const todosTrucosAlcance = (hechizosCompendio || []).filter((h: HechizoBase) => {
      if (h.nivel !== 0) return false;
      const tieneDano = Boolean((h.tipoDaño && h.tipoDaño !== "N/A") || h.dadosDaño || (h.descripcion || "").toLowerCase().includes("daño"));
      if (!tieneDano) return false;
      const m = (h.alcance || "").match(/^(\d+)/);
      const dist = m ? parseInt(m[1], 10) : 0;
      return dist >= 10;
    });

    const aprendidos = todosTrucosAlcance.filter((h: HechizoBase) =>
      idsConocidos.has(h.id) ||
      idsConocidos.has(h.nombre) ||
      Array.from(idsConocidos).some((cid) => coincideHechizoId(cid, h.id) || coincideHechizoId(cid, h.nombre))
    );

    const candidatos = aprendidos.length > 0 ? aprendidos : todosTrucosAlcance;
    return candidatos.map((h: HechizoBase) => ({
      valor: h.id,
      etiqueta: `${h.nombre} (Alcance: ${h.alcance || "120 ft"})`
    }));
  }, [hechizosCompendio, personajeActivo]);

  // Dotes canónicas de origen (para Lecciones de los Primeros)
  const dotesOrigenOpciones: OpcionDesplegable<string>[] = useMemo(() => {
    const origenes = (dotesJson as Array<{ id: string; nombre: string; categoria: string; descripcion?: string }>).filter(
      (d) => (d.categoria || "").toLowerCase() === "origen"
    );
    return origenes.map((d) => ({
      valor: d.id,
      etiqueta: `${d.nombre} (Origen)`
    }));
  }, []);

  // Estado local para elementos expandidos
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<"todas" | "disponibles" | "aprendidas">("aprendidas");

  const alternarExpandido = (id: string) => {
    setExpandidos((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const manejarAlternarInvocacion = (id: string, estaActiva: boolean, bloqueada: boolean) => {
    if (!alActualizarSeleccion || (bloqueada && !estaActiva)) return;

    if (estaActiva) {
      // Quitar invocación y en cascada aquellas que dependan de esta
      const dependientes = selector.opciones
        .filter((op) => op.requisitoInvocacion === id)
        .map((op) => op.id);
      const nuevas = seleccionados.filter(
        (opId) =>
          !coincideInvocacionId(opId, id) &&
          !dependientes.some((depId) => coincideInvocacionId(opId, depId))
      );
      alActualizarSeleccion(selector.id, nuevas);
    } else {
      // Agregar invocación con su valor inicial si requiere subconfiguración
      let entradaParaAgregar = id;
      if (id === "devorador_de_vida") {
        entradaParaAgregar = "devorador_de_vida:necrotico";
      } else if (id === "pacto_del_filo") {
        entradaParaAgregar = "pacto_del_filo:propio";
      } else if (id === "descarga_ahuyentadora") {
        const primerTruco = trucosAtaqueOpciones[0]?.valor || "descarga_sobrenatural";
        entradaParaAgregar = `descarga_ahuyentadora:${primerTruco}`;
      } else if (id === "descarga_agonica") {
        const primerTruco = trucosDanoOpciones[0]?.valor || "descarga_sobrenatural";
        entradaParaAgregar = `descarga_agonica:${primerTruco}`;
      } else if (id === "lanza_sobrenatural") {
        const primerTruco = trucosAlcanceOpciones[0]?.valor || "descarga_sobrenatural";
        entradaParaAgregar = `lanza_sobrenatural:${primerTruco}`;
      } else if (id === "lecciones_de_los_primeros") {
        const primerDote = dotesOrigenOpciones[0]?.valor || "alert";
        entradaParaAgregar = `lecciones_de_los_primeros:${primerDote}`;
      }

      if (seleccionados.length < max) {
        alActualizarSeleccion(selector.id, [...seleccionados, entradaParaAgregar]);
      } else {
        // Si supera el máximo en selección múltiple, reemplaza la primera
        const nuevas = max === 1 ? [entradaParaAgregar] : [...seleccionados.slice(1), entradaParaAgregar];
        alActualizarSeleccion(selector.id, nuevas);
      }
    }
  };

  // --- Manejador para Pacto del Filo (Selector de tipo de daño del arma) ---
  const tipoDanoPactoFiloActual = useMemo(() => {
    const entrada = seleccionados.find((id) => coincideInvocacionId(id, "pacto_del_filo"));
    if (entrada && entrada.includes(":")) {
      return entrada.split(":")[1];
    }
    return "propio";
  }, [seleccionados]);

  const manejarCambiarTipoDanoPactoFilo = (tipo: "propio" | "necrotico" | "psiquico" | "radiante") => {
    if (!alActualizarSeleccion) return;
    const nuevas = seleccionados.map((item) => {
      if (coincideInvocacionId(item, "pacto_del_filo")) {
        return `pacto_del_filo:${tipo}`;
      }
      return item;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  // --- Manejador para Vigor Infernal (Puntos de Golpe Temporales a Voluntad) ---
  const agregarNotificacion = usarAlmacenDM((s) => s.agregarNotificacion);

  const nivelEspacioPactoCalculado = useMemo(() => {
    if (personajeActivo?.nivelEspacioPacto && personajeActivo.nivelEspacioPacto > 0) {
      return personajeActivo.nivelEspacioPacto;
    }
    const nivelBrujo =
      personajeActivo?.clases?.find((c) => (c.nombre || "").toLowerCase().includes("brujo"))?.nivel ||
      nivelPersonaje ||
      1;
    return obtenerNivelEspacioPacto(nivelBrujo);
  }, [personajeActivo, nivelPersonaje]);

  const pgTemporalesVigorInfernal = useMemo(() => {
    return 12 + 5 * (nivelEspacioPactoCalculado - 1);
  }, [nivelEspacioPactoCalculado]);

  const manejarAplicarVigorInfernal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!personajeActivo?.id) return;
    try {
      aplicarResultadoHpTemporalEnEstado(personajeActivo.id, pgTemporalesVigorInfernal);
      agregarNotificacion(
        `Has usado Vigor infernal y obtenido ${pgTemporalesVigorInfernal} PG temporales.`,
        "exito"
      );
    } catch (error) {
      logger.error("[SelectorInvocacionesAcordeon] Error al aplicar Vigor infernal:", error);
    }
  };

  // --- Manejadores para Descarga Ahuyentadora (Truco con ataque + repetible) ---
  const instanciasAhuyentadora = useMemo(() => {
    return seleccionados.filter((id) => coincideInvocacionId(id, "descarga_ahuyentadora"));
  }, [seleccionados]);

  const manejarCambiarTrucoAhuyentadora = (indiceInstancia: number, nuevoTrucoId: string) => {
    if (!alActualizarSeleccion) return;
    let contador = 0;
    const nuevas = seleccionados.map((item) => {
      if (coincideInvocacionId(item, "descarga_ahuyentadora")) {
        if (contador === indiceInstancia) {
          contador++;
          const prefijo = item.includes(":") ? item.split(":")[0] : item;
          return `${prefijo}:${nuevoTrucoId}`;
        }
        contador++;
      }
      return item;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  const manejarAgregarOtraAhuyentadora = () => {
    if (!alActualizarSeleccion || seleccionados.length >= max) return;
    const primerTruco = trucosAtaqueOpciones[0]?.valor || "descarga_sobrenatural";
    const nuevaClave = `descarga_ahuyentadora__${Date.now()}:${primerTruco}`;
    alActualizarSeleccion(selector.id, [...seleccionados, nuevaClave]);
  };

  const manejarQuitarInstanciaAhuyentadora = (indiceInstancia: number) => {
    if (!alActualizarSeleccion) return;
    let contador = 0;
    const nuevas = seleccionados.filter((item) => {
      if (coincideInvocacionId(item, "descarga_ahuyentadora")) {
        if (contador === indiceInstancia) {
          contador++;
          return false;
        }
        contador++;
      }
      return true;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  // --- Manejador para Devorador de Vida (Selector de tipo de daño) ---
  const tipoDanoDevoradorActual = useMemo(() => {
    const entrada = seleccionados.find((id) => coincideInvocacionId(id, "devorador_de_vida"));
    if (entrada && entrada.includes(":")) {
      return entrada.split(":")[1];
    }
    return "necrotico";
  }, [seleccionados]);

  const manejarCambiarTipoDanoDevorador = (tipo: "necrotico" | "psiquico" | "radiante") => {
    if (!alActualizarSeleccion) return;
    const nuevas = seleccionados.map((item) => {
      if (coincideInvocacionId(item, "devorador_de_vida")) {
        return `devorador_de_vida:${tipo}`;
      }
      return item;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  // --- Manejadores para Descarga Agónica (Truco con daño + Carisma + repetible) ---
  const instanciasAgonica = useMemo(() => {
    return seleccionados.filter((id) => coincideInvocacionId(id, "descarga_agonica"));
  }, [seleccionados]);

  const manejarCambiarTrucoAgonica = (indiceInstancia: number, nuevoTrucoId: string) => {
    if (!alActualizarSeleccion) return;
    let contador = 0;
    const nuevas = seleccionados.map((item) => {
      if (coincideInvocacionId(item, "descarga_agonica")) {
        if (contador === indiceInstancia) {
          contador++;
          const prefijo = item.includes(":") ? item.split(":")[0] : item;
          return `${prefijo}:${nuevoTrucoId}`;
        }
        contador++;
      }
      return item;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  const manejarAgregarOtraAgonica = () => {
    if (!alActualizarSeleccion || seleccionados.length >= max) return;
    const primerTruco = trucosDanoOpciones[0]?.valor || "descarga_sobrenatural";
    const nuevaClave = `descarga_agonica__${Date.now()}:${primerTruco}`;
    alActualizarSeleccion(selector.id, [...seleccionados, nuevaClave]);
  };

  const manejarQuitarInstanciaAgonica = (indiceInstancia: number) => {
    if (!alActualizarSeleccion) return;
    let contador = 0;
    const nuevas = seleccionados.filter((item) => {
      if (coincideInvocacionId(item, "descarga_agonica")) {
        if (contador === indiceInstancia) {
          contador++;
          return false;
        }
        contador++;
      }
      return true;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  // --- Manejadores para Lanza Sobrenatural (Truco con alcance + repetible) ---
  const instanciasLanza = useMemo(() => {
    return seleccionados.filter((id) => coincideInvocacionId(id, "lanza_sobrenatural"));
  }, [seleccionados]);

  const manejarCambiarTrucoLanza = (indiceInstancia: number, nuevoTrucoId: string) => {
    if (!alActualizarSeleccion) return;
    let contador = 0;
    const nuevas = seleccionados.map((item) => {
      if (coincideInvocacionId(item, "lanza_sobrenatural")) {
        if (contador === indiceInstancia) {
          contador++;
          const prefijo = item.includes(":") ? item.split(":")[0] : item;
          return `${prefijo}:${nuevoTrucoId}`;
        }
        contador++;
      }
      return item;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  const manejarAgregarOtraLanza = () => {
    if (!alActualizarSeleccion || seleccionados.length >= max) return;
    const primerTruco = trucosAlcanceOpciones[0]?.valor || "descarga_sobrenatural";
    const nuevaClave = `lanza_sobrenatural__${Date.now()}:${primerTruco}`;
    alActualizarSeleccion(selector.id, [...seleccionados, nuevaClave]);
  };

  const manejarQuitarInstanciaLanza = (indiceInstancia: number) => {
    if (!alActualizarSeleccion) return;
    let contador = 0;
    const nuevas = seleccionados.filter((item) => {
      if (coincideInvocacionId(item, "lanza_sobrenatural")) {
        if (contador === indiceInstancia) {
          contador++;
          return false;
        }
        contador++;
      }
      return true;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  // --- Manejadores para Lecciones de los Primeros (Dote de origen + repetible) ---
  const instanciasLecciones = useMemo(() => {
    return seleccionados.filter((id) => coincideInvocacionId(id, "lecciones_de_los_primeros"));
  }, [seleccionados]);

  const manejarCambiarDoteLecciones = (indiceInstancia: number, nuevaDoteId: string) => {
    if (!alActualizarSeleccion) return;
    let contador = 0;
    const nuevas = seleccionados.map((item) => {
      if (coincideInvocacionId(item, "lecciones_de_los_primeros")) {
        if (contador === indiceInstancia) {
          contador++;
          const prefijo = item.includes(":") ? item.split(":")[0] : item;
          return `${prefijo}:${nuevaDoteId}`;
        }
        contador++;
      }
      return item;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  const manejarAgregarOtraLecciones = () => {
    if (!alActualizarSeleccion || seleccionados.length >= max) return;
    const primerDote = dotesOrigenOpciones[0]?.valor || "alert";
    const nuevaClave = `lecciones_de_los_primeros__${Date.now()}:${primerDote}`;
    alActualizarSeleccion(selector.id, [...seleccionados, nuevaClave]);
  };

  const manejarQuitarInstanciaLecciones = (indiceInstancia: number) => {
    if (!alActualizarSeleccion) return;
    let contador = 0;
    const nuevas = seleccionados.filter((item) => {
      if (coincideInvocacionId(item, "lecciones_de_los_primeros")) {
        if (contador === indiceInstancia) {
          contador++;
          return false;
        }
        contador++;
      }
      return true;
    });
    alActualizarSeleccion(selector.id, nuevas);
  };

  // Filtrado y ordenación
  const opcionesProcesadas = useMemo(() => {
    return selector.opciones.filter((op) => {
      const coincideBusqueda =
        busqueda.trim() === "" ||
        op.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (op.descripcion || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (op.requisito || "").toLowerCase().includes(busqueda.toLowerCase());

      if (!coincideBusqueda) return false;

      const estaActiva = seleccionados.some((id) => coincideInvocacionId(id, op.id));
      const cumpleNivel =
        op.nivelMinimo === undefined ||
        nivelPersonaje === undefined ||
        nivelPersonaje >= op.nivelMinimo;
      const cumpleInvocacionPrevia = !op.requisitoInvocacion || seleccionados.some((id) => coincideInvocacionId(id, op.requisitoInvocacion || ""));
      const bloqueada = !estaActiva && (!cumpleNivel || !cumpleInvocacionPrevia);

      if (filtroEstado === "aprendidas") return estaActiva;
      if (filtroEstado === "disponibles") return !bloqueada && !estaActiva;
      return true;
    });
  }, [selector.opciones, busqueda, filtroEstado, seleccionados, nivelPersonaje]);

  return (
    <div className={estilos.contenedorAcordeonInvocaciones}>
      {/* Barra de herramientas con buscador y filtros */}
      <div className={estilos.barraHerramientasInvocaciones}>
        <div className={estilos.contenedorBuscador}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            className={estilos.inputBuscadorInvocaciones}
            placeholder="Buscar invocación o requisito..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className={estilos.filtrosEstadoInvocaciones}>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "todas" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("todas")}
          >
            Todas ({selector.opciones.length})
          </button>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "disponibles" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("disponibles")}
          >
            Disponibles
          </button>
          <button
            type="button"
            className={`${estilos.botonFiltroEstado} ${filtroEstado === "aprendidas" ? estilos.botonFiltroEstadoActivo : ""}`}
            onClick={() => setFiltroEstado("aprendidas")}
          >
            Aprendidas ({seleccionados.length}/{max})
          </button>
        </div>
      </div>

      {/* Lista de cajas colapsables */}
      <div className={estilos.listaCajasInvocaciones}>
        {opcionesProcesadas.length === 0 ? (
          <div className={estilos.mensajeVacio}>
            No se encontraron invocaciones con los criterios de búsqueda actuales.
          </div>
        ) : (
          opcionesProcesadas.map((op) => {
            const estaActiva = seleccionados.some((id) => coincideInvocacionId(id, op.id));
            const estaExpandida = !!expandidos[op.id];

            const cumpleNivel =
              op.nivelMinimo === undefined ||
              nivelPersonaje === undefined ||
              nivelPersonaje >= op.nivelMinimo;
            const cumpleInvocacionPrevia =
              !op.requisitoInvocacion ||
              seleccionados.some((id) => coincideInvocacionId(id, op.requisitoInvocacion || ""));
            const bloqueada = !estaActiva && (!cumpleNivel || !cumpleInvocacionPrevia);

            let textoMotivoBloqueo = "";
            if (!cumpleNivel) {
              textoMotivoBloqueo = `Requiere Brujo de nivel ${op.nivelMinimo}${nivelPersonaje !== undefined ? ` (actual: nivel ${nivelPersonaje})` : ""}`;
            } else if (!cumpleInvocacionPrevia) {
              const reqNombre = selector.opciones.find((o) => o.id === op.requisitoInvocacion)?.nombre || op.requisitoInvocacion;
              textoMotivoBloqueo = `Requiere haber aprendido la invocación previa: "${reqNombre}"`;
            }

            return (
              <div
                key={op.id}
                className={`${estilos.tarjetaInvocacionCaja} ${estaActiva ? estilos.tarjetaInvocacionCajaActiva : ""} ${bloqueada ? estilos.tarjetaInvocacionCajaBloqueada : ""}`}
              >
                {/* Cabecera Colapsable */}
                <div
                  className={estilos.cabeceraInvocacionCaja}
                  onClick={() => alternarExpandido(op.id)}
                >
                  <div className={estilos.infoIzquierdaCabecera}>
                    <span className={estilos.iconoChevron}>
                      {estaExpandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>

                    <span className={estilos.tituloInvocacion}>{op.nombre}</span>

                    <div className={estilos.badgesCabecera}>
                      {op.nivelMinimo && op.nivelMinimo > 1 && (
                        <span className={estilos.badgeNivel}>Nivel {op.nivelMinimo}+</span>
                      )}

                      {estaActiva ? (
                        <span className={estilos.badgeAprendida}>
                          <Check size={11} /> Aprendida
                        </span>
                      ) : bloqueada ? (
                        <span className={estilos.badgeBloqueada}>
                          <Lock size={11} /> Bloqueada
                        </span>
                      ) : null}

                      {op.repetible && (
                        <span className={estilos.badgeRepetible}>Repetible</span>
                      )}
                    </div>
                  </div>

                  {/* Acciones Rápidas en la Cabecera */}
                  <div
                    className={estilos.accionesDerechaCabecera}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {estaActiva ? (
                      <button
                        type="button"
                        className={estilos.botonAccionQuitar}
                        onClick={() => manejarAlternarInvocacion(op.id, true, false)}
                        title="Quitar esta invocación"
                      >
                        <Trash2 size={12} />
                        <span>Quitar</span>
                      </button>
                    ) : bloqueada ? (
                      <button
                        type="button"
                        className={estilos.botonAccionBloqueado}
                        disabled
                        title={textoMotivoBloqueo}
                      >
                        <Lock size={12} />
                        <span>Bloqueada</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={estilos.botonAccionAgregar}
                        onClick={() => manejarAlternarInvocacion(op.id, false, false)}
                        title={
                          seleccionados.length >= max
                            ? `Cupo de invocaciones completo (${max}/${max}). Al seleccionarla sustituirás una de las anteriores.`
                            : "Aprender esta invocación"
                        }
                      >
                        <Plus size={12} />
                        <span>{seleccionados.length >= max ? "Sustituir" : "Agregar"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cuerpo Expandido */}
                {estaExpandida && (
                  <div className={estilos.cuerpoInvocacionCaja}>
                    {/* Indicador de Requisitos */}
                    {op.requisito && (
                      <div className={bloqueada ? estilos.alertaRequisito : estilos.alertaRequisitoCumplido}>
                        {bloqueada ? (
                          <>
                            <AlertCircle size={15} className={estilos.iconoAlertaRequisito} />
                            <div>
                              <strong>Requisitos pendientes:</strong> {textoMotivoBloqueo}
                            </div>
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={15} className={estilos.iconoAlertaRequisito} />
                            <div>
                              <strong>Requisitos cumplidos:</strong> {op.requisito}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Descripción Completa Enriquecida */}
                    <div className={estilos.textoDescripcionInvocacion}>
                      <TextoEnriquecidoDND texto={op.descripcion || op.nombre} />
                    </div>

                    {/* Efectos Mecánicos Estructurados */}
                    {Array.isArray(op.efectos) && op.efectos.length > 0 && (
                      <div className={estilos.seccionEfectosInvocacion}>
                        <span className={estilos.tituloEfectosInvocacion}>
                          <Sparkles size={12} className={estilos.iconoTituloEfectos} />
                          Efectos y Mecánicas Activas:
                        </span>
                        {op.efectos.map((ef, efIdx) => (
                          <span key={efIdx} className={estilos.itemEfectoInvocacion}>
                            • {ef.descripcion || `${ef.tipo}: ${ef.objetivo} (${ef.valor})`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sección interactiva: Descarga Ahuyentadora */}
                    {op.id === "descarga_ahuyentadora" && estaActiva && (
                      <div className={estilos.zonaConfiguracionMecanica}>
                        <div className={estilos.tituloConfiguracionMecanica}>
                          <Zap size={14} color="#a78bfa" />
                          <span>Trucos Vinculados (Empuje de 10 pies por impacto):</span>
                        </div>
                        <p className={estilos.pistaMecanica}>
                          Elige los trucos aprendidos que requieran tirada de ataque. Cada truco vinculado consume 1 ranura de invocación sobrenatural aprendida ({seleccionados.length}/{max}).
                        </p>

                        {instanciasAhuyentadora.map((instancia, idx) => {
                          const trucoActualId = instancia.includes(":")
                            ? instancia.split(":")[1]
                            : (trucosAtaqueOpciones[0]?.valor || "descarga_sobrenatural");

                          return (
                            <div key={idx} className={estilos.filaSelectorTrucoAhuyentadora}>
                              <div className={estilos.contenedorDesplegableMecanica}>
                                <SelectorDesplegable
                                  valor={trucoActualId}
                                  opciones={trucosAtaqueOpciones}
                                  alCambiar={(nuevoVal) => manejarCambiarTrucoAhuyentadora(idx, nuevoVal)}
                                  placeholder="Seleccionar truco con ataque..."
                                  tamano="compacto"
                                />
                              </div>
                              {instanciasAhuyentadora.length > 1 && (
                                <button
                                  type="button"
                                  className={estilos.botonQuitarInstancia}
                                  onClick={() => manejarQuitarInstanciaAhuyentadora(idx)}
                                  title="Eliminar este truco vinculado y liberar 1 ranura de invocación"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          className={estilos.botonAgregarInstancia}
                          onClick={manejarAgregarOtraAhuyentadora}
                          disabled={seleccionados.length >= max}
                          title={
                            seleccionados.length >= max
                              ? `Límite máximo de invocaciones alcanzado (${max}/${max})`
                              : "Vincular otro truco (consume 1 uso adicional de invocación)"
                          }
                        >
                          <Plus size={13} />
                          <span>Vincular otro truco (+1 invocación)</span>
                        </button>
                      </div>
                    )}

                    {/* Sección interactiva: Descarga Agónica */}
                    {op.id === "descarga_agonica" && estaActiva && (
                      <div className={estilos.zonaConfiguracionMecanica}>
                        <div className={estilos.tituloConfiguracionMecanica}>
                          <Sparkles size={14} color="#a78bfa" />
                          <span>Trucos Vinculados (+Modificador de Carisma al daño):</span>
                        </div>
                        <p className={estilos.pistaMecanica}>
                          Elige los trucos aprendidos que causen daño. Sumas tu modificador de Carisma a sus tiradas de daño (y a cada rayo). Cada truco vinculado consume 1 ranura de invocación ({seleccionados.length}/{max}).
                        </p>

                        {instanciasAgonica.map((instancia, idx) => {
                          const trucoActualId = instancia.includes(":")
                            ? instancia.split(":")[1]
                            : (trucosDanoOpciones[0]?.valor || "descarga_sobrenatural");

                          return (
                            <div key={idx} className={estilos.filaSelectorTrucoAhuyentadora}>
                              <div className={estilos.contenedorDesplegableMecanica}>
                                <SelectorDesplegable
                                  valor={trucoActualId}
                                  opciones={trucosDanoOpciones}
                                  alCambiar={(nuevoVal) => manejarCambiarTrucoAgonica(idx, nuevoVal)}
                                  placeholder="Seleccionar truco con daño..."
                                  tamano="compacto"
                                />
                              </div>
                              {instanciasAgonica.length > 1 && (
                                <button
                                  type="button"
                                  className={estilos.botonQuitarInstancia}
                                  onClick={() => manejarQuitarInstanciaAgonica(idx)}
                                  title="Eliminar este truco vinculado y liberar 1 ranura de invocación"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          className={estilos.botonAgregarInstancia}
                          onClick={manejarAgregarOtraAgonica}
                          disabled={seleccionados.length >= max}
                          title={
                            seleccionados.length >= max
                              ? `Límite máximo de invocaciones alcanzado (${max}/${max})`
                              : "Vincular otro truco (consume 1 uso adicional de invocación)"
                          }
                        >
                          <Plus size={13} />
                          <span>Vincular otro truco (+1 invocación)</span>
                        </button>
                      </div>
                    )}

                    {/* Sección interactiva: Lanza Sobrenatural */}
                    {op.id === "lanza_sobrenatural" && estaActiva && (
                      <div className={estilos.zonaConfiguracionMecanica}>
                        <div className={estilos.tituloConfiguracionMecanica}>
                          <Zap size={14} color="#a78bfa" />
                          <span>Trucos Vinculados (+10 pies x nivel de Brujo al alcance):</span>
                        </div>
                        <p className={estilos.pistaMecanica}>
                          Elige los trucos aprendidos que causen daño con alcance de al menos 10 pies. Su alcance aumenta en 10 pies por nivel de Brujo (+{(nivelPersonaje || 1) * 10} pies). Cada truco consume 1 ranura ({seleccionados.length}/{max}).
                        </p>

                        {instanciasLanza.map((instancia, idx) => {
                          const trucoActualId = instancia.includes(":")
                            ? instancia.split(":")[1]
                            : (trucosAlcanceOpciones[0]?.valor || "descarga_sobrenatural");

                          return (
                            <div key={idx} className={estilos.filaSelectorTrucoAhuyentadora}>
                              <div className={estilos.contenedorDesplegableMecanica}>
                                <SelectorDesplegable
                                  valor={trucoActualId}
                                  opciones={trucosAlcanceOpciones}
                                  alCambiar={(nuevoVal) => manejarCambiarTrucoLanza(idx, nuevoVal)}
                                  placeholder="Seleccionar truco con alcance..."
                                  tamano="compacto"
                                />
                              </div>
                              {instanciasLanza.length > 1 && (
                                <button
                                  type="button"
                                  className={estilos.botonQuitarInstancia}
                                  onClick={() => manejarQuitarInstanciaLanza(idx)}
                                  title="Eliminar este truco vinculado y liberar 1 ranura de invocación"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          className={estilos.botonAgregarInstancia}
                          onClick={manejarAgregarOtraLanza}
                          disabled={seleccionados.length >= max}
                          title={
                            seleccionados.length >= max
                              ? `Límite máximo de invocaciones alcanzado (${max}/${max})`
                              : "Vincular otro truco (consume 1 uso adicional de invocación)"
                          }
                        >
                          <Plus size={13} />
                          <span>Vincular otro truco (+1 invocación)</span>
                        </button>
                      </div>
                    )}

                    {/* Sección interactiva: Lecciones de los Primeros */}
                    {op.id === "lecciones_de_los_primeros" && estaActiva && (
                      <div className={estilos.zonaConfiguracionMecanica}>
                        <div className={estilos.tituloConfiguracionMecanica}>
                          <Award size={14} color="#f59e0b" />
                          <span>Dotes de Origen Aprendidas (Multiverso Ancestral):</span>
                        </div>
                        <p className={estilos.pistaMecanica}>
                          Elige una dote canónica de origen (PHB 2024). Cada dote aprendida consume 1 ranura de invocación ({seleccionados.length}/{max}).
                        </p>

                        {instanciasLecciones.map((instancia, idx) => {
                          const doteActualId = instancia.includes(":")
                            ? instancia.split(":")[1]
                            : (dotesOrigenOpciones[0]?.valor || "alert");

                          return (
                            <div key={idx} className={estilos.filaSelectorTrucoAhuyentadora}>
                              <div className={estilos.contenedorDesplegableMecanica}>
                                <SelectorDesplegable
                                  valor={doteActualId}
                                  opciones={dotesOrigenOpciones}
                                  alCambiar={(nuevoVal) => manejarCambiarDoteLecciones(idx, nuevoVal)}
                                  placeholder="Seleccionar dote de origen..."
                                  tamano="compacto"
                                />
                              </div>
                              {instanciasLecciones.length > 1 && (
                                <button
                                  type="button"
                                  className={estilos.botonQuitarInstancia}
                                  onClick={() => manejarQuitarInstanciaLecciones(idx)}
                                  title="Eliminar esta dote y liberar 1 ranura de invocación"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          className={estilos.botonAgregarInstancia}
                          onClick={manejarAgregarOtraLecciones}
                          disabled={seleccionados.length >= max}
                          title={
                            seleccionados.length >= max
                              ? `Límite máximo de invocaciones alcanzado (${max}/${max})`
                              : "Vincular otra dote (consume 1 uso adicional de invocación)"
                          }
                        >
                          <Plus size={13} />
                          <span>Vincular otra dote (+1 invocación)</span>
                        </button>
                      </div>
                    )}

                    {/* Sección interactiva: Pacto del Filo */}
                    {op.id === "pacto_del_filo" && estaActiva && (
                      <div className={estilos.zonaConfiguracionMecanica}>
                        <div className={estilos.tituloConfiguracionMecanica}>
                          <Sparkles size={14} color="#a78bfa" />
                          <span>Tipo de daño del arma de pacto (Ataca y daña con Carisma):</span>
                        </div>
                        <div className={estilos.grupoPillsTipoDano}>
                          {(["propio", "necrotico", "psiquico", "radiante"] as const).map((tipo) => {
                            const estaSeleccionado = tipoDanoPactoFiloActual === tipo;
                            const nombresMap: Record<string, string> = {
                              propio: "Propio del arma",
                              necrotico: "Necrótico",
                              psiquico: "Psíquico",
                              radiante: "Radiante"
                            };
                            return (
                              <button
                                key={tipo}
                                type="button"
                                className={`${estilos.pillTipoDano} ${estaSeleccionado ? estilos.pillTipoDanoActiva : ""}`}
                                onClick={() => manejarCambiarTipoDanoPactoFilo(tipo)}
                              >
                                {estaSeleccionado && <Check size={11} className={estilos.iconoPillCheck} />}
                                {nombresMap[tipo]}
                              </button>
                            );
                          })}
                        </div>
                        <span className={estilos.notaMecanica}>
                          {tipoDanoPactoFiloActual === "propio"
                            ? "Arma vinculada: Utiliza Carisma para ataque y daño, conservando el tipo de daño original del arma."
                            : `Arma vinculada: Utiliza Carisma para ataque y daño, cambiando todo el daño base a daño ${tipoDanoPactoFiloActual}.`}
                        </span>
                      </div>
                    )}

                    {/* Sección interactiva: Vigor Infernal */}
                    {op.id === "vigor_infernal" && estaActiva && (
                      <div className={estilos.zonaConfiguracionMecanica}>
                        <div className={estilos.tituloConfiguracionMecanica}>
                          <Heart size={14} color="#f43f5e" />
                          <span>Puntos de Golpe Temporales a Voluntad (Espacio de Pacto Nv {nivelEspacioPactoCalculado}):</span>
                        </div>
                        <p className={estilos.pistaMecanica}>
                          Fórmula: 12 + 5 × ({nivelEspacioPactoCalculado} - 1) = <strong>{pgTemporalesVigorInfernal} PG temporales</strong>. Puedes lanzarlo sobre ti mismo a voluntad.
                        </p>
                        <button
                          type="button"
                          className={estilos.botonVigorInfernal}
                          onClick={manejarAplicarVigorInfernal}
                          title={`Obtener ${pgTemporalesVigorInfernal} puntos de golpe temporales`}
                        >
                          <Heart size={13} className={estilos.iconoHeartVigor} />
                          <span>Obtener {pgTemporalesVigorInfernal} PG Temporales (Vigor infernal)</span>
                        </button>
                      </div>
                    )}

                    {/* Sección interactiva: Devorador de Vida */}
                    {op.id === "devorador_de_vida" && estaActiva && (
                      <div className={estilos.zonaConfiguracionMecanica}>
                        <div className={estilos.tituloConfiguracionMecanica}>
                          <Flame size={14} color="#a78bfa" />
                          <span>Tipo de daño extra (+1d6 con Arma de Pacto):</span>
                        </div>
                        <div className={estilos.grupoPillsTipoDano}>
                          {(["necrotico", "psiquico", "radiante"] as const).map((tipo) => {
                            const estaSeleccionado = tipoDanoDevoradorActual === tipo;
                            const nombresMap: Record<string, string> = {
                              necrotico: "Necrótico",
                              psiquico: "Psíquico",
                              radiante: "Radiante"
                            };
                            return (
                              <button
                                key={tipo}
                                type="button"
                                className={`${estilos.pillTipoDano} ${estaSeleccionado ? estilos.pillTipoDanoActiva : ""}`}
                                onClick={() => manejarCambiarTipoDanoDevorador(tipo)}
                              >
                                {estaSeleccionado && <Check size={11} className={estilos.iconoPillCheck} />}
                                {nombresMap[tipo]}
                              </button>
                            );
                          })}
                        </div>
                        <span className={estilos.notaMecanica}>
                          Daño extra activo: +1d6 daño {tipoDanoDevoradorActual} al impactar con tu arma cuerpo a cuerpo.
                        </span>
                      </div>
                    )}

                    {/* Caja informativa de Castigo Arcano */}
                    {op.id === "castigo_arcano" && (
                      <div className={estilos.cajaMecanicaConsumible}>
                        <Zap size={14} color="#f59e0b" className={estilos.iconoConsumible} />
                        <span>
                          <strong>Acción especial de combate:</strong> Gasta 1 espacio de Magia del pacto y lanza dados de fuerza ({op.escaladoFormulaDados?.find(e => (nivelPersonaje || 1) >= e.nivelMinimo)?.valor || op.formulaDados || "4d8"}). Disponible directamente en el Combat Tracker y en la pestaña de Acciones.
                        </span>
                      </div>
                    )}

                    {/* Caja informativa de Don de los Protectores */}
                    {op.id === "don_de_los_protectores" && (
                      <div className={estilos.cajaMecanicaConsumible}>
                        <ShieldCheck size={14} color="#10b981" className={estilos.iconoConsumible} />
                        <span>
                          <strong>Acción de combate (Reacción - Consumible):</strong> 1 uso por descanso largo. Si una criatura con su nombre en el Libro de las Sombras se reduce a 0 HP, en su lugar pasa a tener 1 HP. Disponible directamente en el Combat Tracker y en la pestaña de Acciones.
                        </span>
                      </div>
                    )}

                    {/* Pie de Acción Expandida */}
                    <div className={estilos.pieAccionExpandida}>
                      {estaActiva ? (
                        <button
                          type="button"
                          className={estilos.botonAccionQuitar}
                          onClick={() => manejarAlternarInvocacion(op.id, true, false)}
                        >
                          <Trash2 size={13} />
                          <span>Quitar de Invocaciones Aprendidas</span>
                        </button>
                      ) : bloqueada ? (
                        <button
                          type="button"
                          className={estilos.botonAccionBloqueado}
                          disabled
                        >
                          <Lock size={13} />
                          <span>{textoMotivoBloqueo}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={estilos.botonAccionAgregar}
                          onClick={() => manejarAlternarInvocacion(op.id, false, false)}
                        >
                          <Plus size={13} />
                          <span>
                            {seleccionados.length >= max
                              ? `Sustituir Invocación (${max}/${max})`
                              : `Aprender Invocación (${seleccionados.length + 1}/${max})`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
