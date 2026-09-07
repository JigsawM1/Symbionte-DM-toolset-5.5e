import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes
} from "@/almacen/selectores/usarEstadoPersonajes";
import type { RasgoPersonaje, TipoAccionRasgo, OrigenRasgo } from "@/tipos";
import { TarjetaRasgo } from "./TarjetaRasgo";
import { ConstructorRasgoDote } from "./ConstructorRasgoDote";
import { ModalDetalleRasgo } from "./ModalDetalleRasgo";
import { renderizarTextoEnriquecidoDND } from "@/utiles/formatoTextoDND";
import { TablaProgresionRasgo } from "./TablaProgresionRasgo";
import { obtenerClasePorNombre, obtenerSubclasePorNombre } from "@/servicios/gestorClases";
import { usarEstadoPersistido } from "@/hooks";
import { calcularRelevanciaBusqueda } from "@/utiles/busquedaTolerante";
import {
  BookMarked,
  Search,
  X,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Layers,
  SlidersHorizontal,
  ChevronsUpDown,
  User,
  Swords,
  Award,
  CheckCircle2,
  Flame
} from "lucide-react";
import { SelectorInvocacionesAcordeon } from "./SelectorInvocacionesAcordeon";
import estilos from "./VistaRasgosJugador.module.css";

type FiltroTipoAccion = "todos" | TipoAccionRasgo;

interface SeccionesColapsadas {
  especie: boolean;
  dotes: boolean;
  personalizados: boolean;
  [claveClase: string]: boolean;
}

interface ItemProgresionClase extends RasgoPersonaje {
  alcanzado: boolean;
  nivel: number;
}

function normalizar(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export const VistaRasgosJugador: React.FC = () => {
  const { personajeActivo } = usarEstadoPersonajes();
  const {
    agregarRasgoPersonaje,
    actualizarRasgoPersonaje,
    eliminarRasgoPersonaje,
    gastarUsoRasgoPersonaje,
    recuperarUsoRasgoPersonaje,
    sincronizarRasgosPersonaje,
    alternarActivoRasgo,
    actualizarSeleccionRasgo
  } = usarAccionesPersonajes();

  // Modo de vista: Mis Rasgos vs Progresión 1-20 vs Constructor Homebrew
  const [modoVista, setModoVista] = useState<"mis_rasgos" | "progresion_clase" | "creador_homebrew">("mis_rasgos");

  // Búsqueda y filtros reactivos compactos
  const [consultaBusqueda, setConsultaBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroAccion, setFiltroAccion] = useState<FiltroTipoAccion>("todos");

  // Estado del modal de detalle de rasgo
  const [rasgoSeleccionadoDetalle, setRasgoSeleccionadoDetalle] = useState<RasgoPersonaje | null>(null);

  // Rasgo seleccionado para detalle sincronizado reactivamente con el personaje
  const rasgoDetalleEfectivo = useMemo(() => {
    if (!rasgoSeleccionadoDetalle || !personajeActivo) return null;
    return (
      (personajeActivo.rasgos || []).find((r) => r.id === rasgoSeleccionadoDetalle.id) ||
      rasgoSeleccionadoDetalle
    );
  }, [rasgoSeleccionadoDetalle, personajeActivo]);

  // Estado del creador / editor de rasgo
  const [rasgoParaEditar, setRasgoParaEditar] = useState<RasgoPersonaje | null>(null);
  const [origenPredeterminadoModal, setOrigenPredeterminadoModal] = useState<OrigenRasgo>("personalizado");

  // Estado persistido de secciones colapsables por personaje
  const clavePersistencia = personajeActivo ? `ts_rasgos_secciones_v2_${personajeActivo.id}` : "ts_rasgos_secciones_defecto";
  const [seccionesColapsadas, setSeccionesColapsadas] = usarEstadoPersistido<SeccionesColapsadas>(
    clavePersistencia,
    {
      especie: false,
      dotes: false,
      personalizados: false
    }
  );

  // Clave de firma de progresión para detectar cambios de nivel, clase, subclase o especie
  const firmaProgresion = personajeActivo
    ? `${personajeActivo.id}_${personajeActivo.clase}_${personajeActivo.subclase}_${personajeActivo.nivel}_${(personajeActivo.clases || [])
        .map((c) => `${c.nombre}:${c.subclase}:${c.nivel}`)
        .join(",")}_${personajeActivo.especie}_${personajeActivo.subespecie}`
    : "";

  const firmaPreviaRef = useRef<string>(firmaProgresion);

  // Auto-sincronización reactiva si no tiene rasgos o si cambió su clase/subclase/nivel/especie
  useEffect(() => {
    if (!personajeActivo) return;

    const noTieneRasgos = !personajeActivo.rasgos || personajeActivo.rasgos.length === 0;
    const cambioProgresion = firmaPreviaRef.current !== "" && firmaPreviaRef.current !== firmaProgresion;
    firmaPreviaRef.current = firmaProgresion;

    if (noTieneRasgos || cambioProgresion) {
      sincronizarRasgosPersonaje(personajeActivo.id);
    }
  }, [personajeActivo?.id, firmaProgresion, sincronizarRasgosPersonaje]);

  // Alternar colapso de sección individual
  const alternarColapso = (clave: string) => {
    setSeccionesColapsadas((prev) => ({
      ...prev,
      [clave]: !prev[clave]
    }));
  };

  const expandirTodas = () => {
    setSeccionesColapsadas({
      especie: false,
      dotes: false,
      personalizados: false
    });
  };

  const colapsarTodas = () => {
    const colapsadas: SeccionesColapsadas = {
      especie: true,
      dotes: true,
      personalizados: true
    };
    if (personajeActivo?.clases) {
      personajeActivo.clases.forEach((c, idx) => {
        colapsadas[`clase_${idx}_${normalizar(c.nombre)}`] = true;
        colapsadas[`subclase_${idx}_${normalizar(c.nombre)}_${normalizar(c.subclase || "sin_subclase")}`] = true;
        colapsadas[`invocaciones_${idx}_${normalizar(c.nombre)}`] = true;
      });
    } else {
      colapsadas["clase_0_principal"] = true;
      colapsadas["subclase_0_principal"] = true;
      colapsadas["invocaciones_0_principal"] = true;
    }
    setSeccionesColapsadas(colapsadas);
  };

  const estanTodasExpandidas = Object.values(seccionesColapsadas).every((v) => !v);

  const alternarTodas = () => {
    if (estanTodasExpandidas) {
      colapsarTodas();
    } else {
      expandirTodas();
    }
  };

  // Clases del personaje estructuradas
  const clasesPersonaje = useMemo(() => {
    if (!personajeActivo) return [];
    if (personajeActivo.clases && personajeActivo.clases.length > 0) {
      return personajeActivo.clases;
    }
    return [
      {
        nombre: personajeActivo.clase || "Guerrero",
        subclase: personajeActivo.subclase || "",
        nivel: personajeActivo.nivel || 1
      }
    ];
  }, [personajeActivo]);

  const furiaEstaActiva = useMemo(() => {
    if (!personajeActivo) return false;
    const tieneRasgoFuriaActivo = (personajeActivo.rasgos || []).some(
      (r) => (r.nombre.toLowerCase().trim() === "furia" || r.id.toLowerCase().trim() === "rasgo_cls_barbaro_furia") && r.activo
    );
    const tieneCondicionFuria = (personajeActivo.condicionesActivas || []).some(
      (c) => c.toLowerCase().includes("furia (rage)") || (c.toLowerCase().includes("furia") && !c.toLowerCase().includes("furia de los dioses"))
    );
    return tieneRasgoFuriaActivo || tieneCondicionFuria;
  }, [personajeActivo]);

  const obtenerBloqueoToggleRasgo = (r: RasgoPersonaje): { bloqueado: boolean; motivo?: string } => {
    const nom = r.nombre.toLowerCase().trim();
    const id = r.id.toLowerCase().trim();
    const requiereFuria = nom.includes("furia divina") || id.includes("furia_divina") || nom.includes("golpe brutal") || id.includes("golpe_brutal");
    if (requiereFuria && !furiaEstaActiva && !r.activo) {
      return { bloqueado: true, motivo: "Requiere que la Furia esté activa para poder activarse" };
    }
    return { bloqueado: false };
  };

  // Progresión 1-20 completa para el visor estilo PHB 2024
  const datosProgresionClases = useMemo(() => {
    if (!personajeActivo) return [];

    return clasesPersonaje.map((claseItem) => {
      const defClase = obtenerClasePorNombre(claseItem.nombre);
      if (!defClase) return null;

      const subDef = claseItem.subclase ? obtenerSubclasePorNombre(claseItem.nombre, claseItem.subclase) : null;
      const nivelPj = claseItem.nivel || 1;

      // Rasgos de clase base del 1 al 20 (omitiendo placeholders si hay subclase definida)
      const rasgosClase1a20: ItemProgresionClase[] = defClase.rasgos
        .filter((r) => {
          if (subDef && r.nombre.toLowerCase().includes("rasgo de subclase")) {
            return false;
          }
          return true;
        })
        .map((r) => ({
        id: `prog_cls_${r.nivel}_${normalizar(r.nombre)}`,
        nombre: r.nombre,
        descripcion: r.descripcion,
        origen: "clase",
        fuente: `${defClase.nombre} (Nivel ${r.nivel})`,
        tipoAccion: r.tipoAccion,
        nivelRequerido: r.nivel,
        nivel: r.nivel,
        tieneUsosLimitados: !!r.tieneUsosLimitados,
        usosMaximos: r.tieneUsosLimitados && r.obtenerUsosMaximos ? r.obtenerUsosMaximos(nivelPj) : undefined,
        usosRestantes: r.tieneUsosLimitados && r.obtenerUsosMaximos ? r.obtenerUsosMaximos(nivelPj) : undefined,
        recuperacion: r.recuperacion || "ninguno",
        formulaDados: r.formulaDados,
        personalizado: false,
        activo: r.esActivable ? false : true,
        notas: "",
        alcanzado: nivelPj >= r.nivel,
        tablaProgresion: r.tablaProgresion,
        esActivable: !!r.esActivable,
        ligadoA: r.ligadoA,
        categoriaMecanica: r.categoriaMecanica,
        efectos: r.efectos ? JSON.parse(JSON.stringify(r.efectos)) : [],
        selectores: r.selectores ? JSON.parse(JSON.stringify(r.selectores)) : []
      }));

      // Rasgos de subclase del 3 al 20 si existe
      const rasgosSub1a20: ItemProgresionClase[] = (subDef ? subDef.rasgos : []).map((r) => ({
        id: `prog_sub_${r.nivel}_${normalizar(r.nombre)}`,
        nombre: r.nombre,
        descripcion: r.descripcion,
        origen: "subclase",
        fuente: `${subDef?.nombre || "Subclase"} (Nivel ${r.nivel})`,
        tipoAccion: r.tipoAccion,
        nivelRequerido: r.nivel,
        nivel: r.nivel,
        tieneUsosLimitados: !!r.tieneUsosLimitados,
        usosMaximos: r.tieneUsosLimitados && r.obtenerUsosMaximos ? r.obtenerUsosMaximos(nivelPj) : undefined,
        usosRestantes: r.tieneUsosLimitados && r.obtenerUsosMaximos ? r.obtenerUsosMaximos(nivelPj) : undefined,
        recuperacion: r.recuperacion || "ninguno",
        formulaDados: r.formulaDados,
        personalizado: false,
        activo: r.esActivable ? false : true,
        notas: "",
        alcanzado: nivelPj >= r.nivel,
        tablaProgresion: r.tablaProgresion,
        esActivable: !!r.esActivable,
        ligadoA: r.ligadoA,
        categoriaMecanica: r.categoriaMecanica,
        efectos: r.efectos ? JSON.parse(JSON.stringify(r.efectos)) : [],
        selectores: r.selectores ? JSON.parse(JSON.stringify(r.selectores)) : []
      }));

      // Unir y ordenar cronológicamente
      const todosProgresion: ItemProgresionClase[] = [...rasgosClase1a20, ...rasgosSub1a20].sort((a, b) => a.nivel - b.nivel);

      return {
        clase: claseItem,
        defClase,
        subDef,
        items: todosProgresion
      };
    }).filter(Boolean) as Array<{
      clase: typeof clasesPersonaje[0];
      defClase: NonNullable<ReturnType<typeof obtenerClasePorNombre>>;
      subDef: ReturnType<typeof obtenerSubclasePorNombre>;
      items: ItemProgresionClase[];
    }>;
  }, [personajeActivo, clasesPersonaje]);

  // Filtrado de rasgos según búsqueda y filtro de tipo de acción
  const rasgosFiltrados = useMemo(() => {
    if (!personajeActivo || !Array.isArray(personajeActivo.rasgos)) return [];

    let lista = [...personajeActivo.rasgos].filter((r) => {
      const nom = r.nombre ? r.nombre.toLowerCase().trim() : "";
      return nom !== "rasgo de subclase" && !nom.includes("rasgo de subclase");
    });

    if (filtroAccion !== "todos") {
      lista = lista.filter((r) => r.tipoAccion === filtroAccion);
    }

    if (consultaBusqueda.trim() !== "") {
      const q = consultaBusqueda.trim();
      lista = lista
        .map((rasgo) => {
          const relNombre = calcularRelevanciaBusqueda(rasgo.nombre, q);
          const relDesc = calcularRelevanciaBusqueda(rasgo.descripcion || "", q) * 0.5;
          const relFuente = calcularRelevanciaBusqueda(rasgo.fuente || "", q) * 0.7;
          const maxRel = Math.max(relNombre, relDesc, relFuente);
          return { rasgo, relevancia: maxRel };
        })
        .filter((item) => item.relevancia > 0)
        .sort((a, b) => b.relevancia - a.relevancia)
        .map((item) => item.rasgo);
    }

    return lista;
  }, [personajeActivo, filtroAccion, consultaBusqueda]);

  // Agrupación Jerárquica
  const datosJerarquicos = useMemo(() => {
    const especie: RasgoPersonaje[] = [];
    const dotes: RasgoPersonaje[] = [];
    const personalizados: RasgoPersonaje[] = [];

    const mapClases = clasesPersonaje.map((c, idx) => ({
      clase: c,
      claveColapsoClase: `clase_${idx}_${normalizar(c.nombre)}`,
      claveColapsoSubclase: `subclase_${idx}_${normalizar(c.nombre)}_${normalizar(c.subclase || "sin_subclase")}`,
      claveColapsoInvocaciones: `invocaciones_${idx}_${normalizar(c.nombre)}`,
      rasgosBase: [] as RasgoPersonaje[],
      rasgosSubclase: [] as RasgoPersonaje[],
      rasgoInvocaciones: undefined as RasgoPersonaje | undefined,
      total: 0
    }));

    const otrosClase: RasgoPersonaje[] = [];

    for (const rasgo of rasgosFiltrados) {
      if (rasgo.origen === "especie") {
        especie.push(rasgo);
      } else if (rasgo.origen === "dote") {
        dotes.push(rasgo);
      } else if (rasgo.origen === "personalizado") {
        personalizados.push(rasgo);
      } else {
        const normFuente = normalizar(rasgo.fuente || "");

        let asignado = false;

        for (const mc of mapClases) {
          const normNombreClase = normalizar(mc.clase.nombre);
          const normSubClasePj = normalizar(mc.clase.subclase || "");

          if (
            normFuente.includes(normNombreClase) ||
            rasgo.id.includes(`_${normNombreClase}_`)
          ) {
            const nomRasgoNorm = normalizar(rasgo.nombre);
            if (
              nomRasgoNorm.includes("invocaciones sobrenaturales") &&
              Array.isArray(rasgo.selectores) &&
              rasgo.selectores.length > 0
            ) {
              mc.rasgoInvocaciones = rasgo;
            } else if (
              rasgo.origen === "subclase" ||
              (normSubClasePj && normFuente.includes(normSubClasePj))
            ) {
              mc.rasgosSubclase.push(rasgo);
            } else {
              mc.rasgosBase.push(rasgo);
            }
            mc.total++;
            asignado = true;
            break;
          }
        }

        if (!asignado) {
          otrosClase.push(rasgo);
        }
      }
    }

    return {
      especie,
      dotes,
      personalizados,
      clases: mapClases,
      otrosClase
    };
  }, [rasgosFiltrados, clasesPersonaje]);

  if (!personajeActivo) {
    return (
      <div className={estilos.contenedorGeneral}>
        <div className={estilos.estadoVacio}>
          <User size={32} />
          <p>No hay ningún personaje activo seleccionado.</p>
        </div>
      </div>
    );
  }

  const nombrePj = personajeActivo.nombre?.trim() || "Personaje";
  const totalRasgosPj = personajeActivo.rasgos?.length || 0;
  const hayFiltrosActivos = consultaBusqueda.trim() !== "" || filtroAccion !== "todos";

  const abrirModalCreacion = (origen: OrigenRasgo = "personalizado") => {
    setRasgoParaEditar(null);
    setOrigenPredeterminadoModal(origen);
    setModoVista("creador_homebrew");
  };

  const abrirModalEdicion = (rasgo: RasgoPersonaje) => {
    setRasgoParaEditar(rasgo);
    setOrigenPredeterminadoModal(rasgo.origen);
    setModoVista("creador_homebrew");
  };

  const manejarGuardarRasgoModal = (rasgoGuardado: RasgoPersonaje) => {
    if (rasgoParaEditar) {
      actualizarRasgoPersonaje(personajeActivo.id, rasgoGuardado.id, rasgoGuardado);
    } else {
      agregarRasgoPersonaje(personajeActivo.id, rasgoGuardado);
    }
    setRasgoParaEditar(null);
    setModoVista("mis_rasgos");
  };

  const resolverRecursosPadre = (rasgo: RasgoPersonaje) => {
    if (!personajeActivo || (!rasgo.gastarDePadre && !rasgo.heredarDadosPadre)) {
      return { usosPadre: undefined, formulaDadosEfectiva: undefined };
    }

    let padre: RasgoPersonaje | undefined;
    if (rasgo.ligadoA) {
      padre = (personajeActivo.rasgos || []).find((r) => r.id === rasgo.ligadoA);
    }
    if (!padre) {
      padre = (personajeActivo.rasgos || []).find((r) =>
        normalizar(r.nombre).includes("inspiracion bardica")
      );
    }

    if (!padre) {
      return { usosPadre: undefined, formulaDadosEfectiva: undefined };
    }

    const usosPadre = rasgo.gastarDePadre
      ? {
          restantes: padre.usosRestantes ?? (padre.usosMaximos || 1),
          maximos: padre.usosMaximos || 1,
          nombre: padre.nombre
        }
      : undefined;

    const formulaDadosEfectiva = rasgo.heredarDadosPadre
      ? (padre.formulaDados || rasgo.formulaDados)
      : undefined;

    return { usosPadre, formulaDadosEfectiva };
  };

  if (modoVista === "creador_homebrew") {
    return (
      <div className={estilos.contenedorGeneral}>
        <ConstructorRasgoDote
          personaje={personajeActivo}
          rasgoInicial={rasgoParaEditar}
          origenPredeterminado={origenPredeterminadoModal}
          alGuardar={manejarGuardarRasgoModal}
          alVolver={() => {
            setRasgoParaEditar(null);
            setModoVista("mis_rasgos");
          }}
        />
      </div>
    );
  }

  return (
    <div className={estilos.contenedorGeneral}>
      {/* 1. Barra Superior Compacta de Herramientas */}
      <div className={estilos.cabeceraCompacta}>
        <div className={estilos.filaCabecera}>
          <div className={estilos.grupoTitulo}>
            <BookMarked size={15} color="#38bdf8" />
            <h1 className={estilos.tituloTexto}>Rasgos y Dotes</h1>
            <span className={estilos.contadorBadge}>
              {rasgosFiltrados.length} / {totalRasgosPj}
            </span>
          </div>

          {/* Botones de Acción Rápida */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              className={`${estilos.botonHerramienta} ${estilos.botonHerramientaPrimario}`}
              onClick={() => abrirModalCreacion("personalizado")}
              title="Añadir rasgo o dote personalizado"
            >
              <Plus size={12} />
              <span>Añadir</span>
            </button>

            <button
              type="button"
              className={estilos.botonHerramienta}
              onClick={() => sincronizarRasgosPersonaje(personajeActivo.id)}
              title="Sincronizar rasgos estándar de Clase y Raza"
            >
              <RefreshCw size={11} />
            </button>

            <button
              type="button"
              className={estilos.botonHerramienta}
              onClick={alternarTodas}
              title={estanTodasExpandidas ? "Colapsar todas las secciones" : "Expandir todas las secciones"}
            >
              <ChevronsUpDown size={11} />
            </button>
          </div>
        </div>

        {/* Selector de Modo de Vista: Mis Rasgos vs Progresión 1-20 (PHB 2024) */}
        <div className={estilos.pestanasVistaModo}>
          <button
            type="button"
            className={`${estilos.botonPestanaModo} ${modoVista === "mis_rasgos" ? estilos.botonPestanaModoActivo : ""}`}
            onClick={() => setModoVista("mis_rasgos")}
          >
            <BookMarked size={12} />
            <span>Mis Rasgos Activos ({rasgosFiltrados.length})</span>
          </button>
          <button
            type="button"
            className={`${estilos.botonPestanaModo} ${modoVista === "progresion_clase" ? estilos.botonPestanaModoActivo : ""}`}
            onClick={() => setModoVista("progresion_clase")}
          >
            <Swords size={12} />
            <span>Progresión</span>
          </button>
        </div>

        {/* Fila de Buscador Compacto y Botón de Filtros (en modo Mis Rasgos) */}
        {modoVista === "mis_rasgos" && (
          <div className={estilos.filaHerramientas}>
            <div className={estilos.cajaBuscadorCompacta}>
              <Search size={13} color="#64748b" />
              <input
                type="text"
                className={estilos.inputBuscador}
                placeholder="Buscar rasgo o regla..."
                value={consultaBusqueda}
                onChange={(e) => setConsultaBusqueda(e.target.value)}
              />
              {consultaBusqueda && (
                <button
                  type="button"
                  className={estilos.botonLimpiarBusqueda}
                  onClick={() => setConsultaBusqueda("")}
                  title="Limpiar búsqueda"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className={`${estilos.botonHerramienta} ${mostrarFiltros || filtroAccion !== "todos" ? estilos.botonHerramientaActivo : ""}`}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              title="Filtrar por tipo de acción"
            >
              <SlidersHorizontal size={11} />
              <span>Filtros{filtroAccion !== "todos" ? " (1)" : ""}</span>
            </button>
          </div>
        )}

        {/* Cajón Desplegable Compacto de Filtros */}
        {modoVista === "mis_rasgos" && mostrarFiltros && (
          <div className={estilos.cajonFiltrosDesplegable}>
            <span className={estilos.labelFiltroMini}>Acción:</span>
            <button
              type="button"
              className={`${estilos.chipFiltroMini} ${filtroAccion === "todos" ? estilos.chipFiltroMiniActivo : ""}`}
              onClick={() => setFiltroAccion("todos")}
            >
              Todos
            </button>
            <button
              type="button"
              className={`${estilos.chipFiltroMini} ${filtroAccion === "pasivo" ? estilos.chipFiltroMiniActivo : ""}`}
              onClick={() => setFiltroAccion("pasivo")}
            >
              <Shield size={10} />
              <span>Pasivo</span>
            </button>
            <button
              type="button"
              className={`${estilos.chipFiltroMini} ${filtroAccion === "accion" ? estilos.chipFiltroMiniActivo : ""}`}
              onClick={() => setFiltroAccion("accion")}
            >
              <Zap size={10} />
              <span>Acción</span>
            </button>
            <button
              type="button"
              className={`${estilos.chipFiltroMini} ${filtroAccion === "accion_adicional" ? estilos.chipFiltroMiniActivo : ""}`}
              onClick={() => setFiltroAccion("accion_adicional")}
            >
              <Clock size={10} />
              <span>Adicional</span>
            </button>
            <button
              type="button"
              className={`${estilos.chipFiltroMini} ${filtroAccion === "reaccion" ? estilos.chipFiltroMiniActivo : ""}`}
              onClick={() => setFiltroAccion("reaccion")}
            >
              <Sparkles size={10} />
              <span>Reacción</span>
            </button>
            <button
              type="button"
              className={`${estilos.chipFiltroMini} ${filtroAccion === "especial" ? estilos.chipFiltroMiniActivo : ""}`}
              onClick={() => setFiltroAccion("especial")}
            >
              <Layers size={10} />
              <span>Especial</span>
            </button>

            {hayFiltrosActivos && (
              <button
                type="button"
                className={estilos.chipFiltroMini}
                style={{ marginLeft: "auto", color: "#f87171" }}
                onClick={() => {
                  setConsultaBusqueda("");
                  setFiltroAccion("todos");
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* =======================================================
          MODO A: MIS RASGOS ACTIVOS (TARJETAS COMPACTAS)
         ======================================================= */}
      {modoVista === "mis_rasgos" && (
        <>
          {rasgosFiltrados.length === 0 ? (
            <div className={estilos.estadoVacio}>
              <Search size={24} />
              <p>No se encontraron rasgos con los filtros aplicados.</p>
              <button
                type="button"
                className={estilos.botonHerramienta}
                onClick={() => {
                  setConsultaBusqueda("");
                  setFiltroAccion("todos");
                }}
              >
                Restablecer búsqueda
              </button>
            </div>
          ) : (
            <>
              {/* BLOQUE 1: ESPECIE / RAZA */}
              {datosJerarquicos.especie.length > 0 && (
                <div className={estilos.seccionPrincipal}>
                  <div
                    className={estilos.cabeceraSeccionPrincipal}
                    onClick={() => alternarColapso("especie")}
                  >
                    <div className={estilos.ladoIzquierdoCabecera}>
                      {seccionesColapsadas.especie ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                      <User size={13} color="#10b981" />
                      <span className={estilos.tituloSeccion}>
                        Raza: {personajeActivo.especie || "Humano"}{personajeActivo.subespecie ? ` (${personajeActivo.subespecie})` : ""}
                      </span>
                      <span className={estilos.badgeConteoSeccion}>
                        {datosJerarquicos.especie.length}
                      </span>
                    </div>
                  </div>

                  {!seccionesColapsadas.especie && (
                    <div className={estilos.cuerpoSeccionPrincipal}>
                      {datosJerarquicos.especie.map((rasgo, idx) => {
                        const bloqueo = obtenerBloqueoToggleRasgo(rasgo);
                        return (
                          <TarjetaRasgo
                            key={`${rasgo.id}_${rasgo.nivelRequerido || 0}_${idx}`}
                            rasgo={rasgo}
                            nombrePersonaje={nombrePj}
                            idPersonaje={personajeActivo.id}
                            alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgo.id)}
                            deshabilitadoToggle={bloqueo.bloqueado}
                            motivoDeshabilitado={bloqueo.motivo}
                            alEditar={() => abrirModalEdicion(rasgo)}
                            alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alVerDetalle={() => setRasgoSeleccionadoDetalle(rasgo)}
                            {...resolverRecursosPadre(rasgo)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* BLOQUE 2: CLASE(S), SUBCLASE(S) E INVOCACIONES SEPARADAS */}
              {datosJerarquicos.clases.map((mc) => {
                const claseColapsada = !!seccionesColapsadas[mc.claveColapsoClase];
                const subclaseColapsada = !!seccionesColapsadas[mc.claveColapsoSubclase];
                const invocacionesColapsada = !!seccionesColapsadas[mc.claveColapsoInvocaciones];

                const selectorInvocaciones = mc.rasgoInvocaciones?.selectores?.[0];
                const aprendidasInvocaciones = selectorInvocaciones?.valorActual || [];
                const maxInvocaciones = selectorInvocaciones?.maxSelecciones || 1;

                return (
                  <React.Fragment key={`grupo_clase_${mc.clase.nombre}`}>
                    {/* Tarjeta 1: Rasgos de Clase Base */}
                    {mc.rasgosBase.length > 0 && (
                      <div className={estilos.seccionPrincipal}>
                        <div
                          className={estilos.cabeceraSeccionPrincipal}
                          onClick={() => alternarColapso(mc.claveColapsoClase)}
                        >
                          <div className={estilos.ladoIzquierdoCabecera}>
                            {claseColapsada ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                            <Swords size={13} color="#d4af37" />
                            <span className={estilos.tituloSeccion}>
                              Clase: {mc.clase.nombre} (Nivel {mc.clase.nivel})
                            </span>
                            <span className={estilos.badgeConteoSeccion}>
                              {mc.rasgosBase.length}
                            </span>
                          </div>
                        </div>

                        {!claseColapsada && (
                          <div className={estilos.cuerpoSeccionPrincipal}>
                            {mc.rasgosBase.map((rasgo, idx) => {
                              const bloqueo = obtenerBloqueoToggleRasgo(rasgo);
                              return (
                                <TarjetaRasgo
                                  key={`${rasgo.id}_${rasgo.nivelRequerido || 0}_${idx}`}
                                  rasgo={rasgo}
                                  nombrePersonaje={nombrePj}
                                  idPersonaje={personajeActivo.id}
                                  alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                                  alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                                  alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgo.id)}
                                  deshabilitadoToggle={bloqueo.bloqueado}
                                  motivoDeshabilitado={bloqueo.motivo}
                                  alEditar={() => abrirModalEdicion(rasgo)}
                                  alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                                  alVerDetalle={() => setRasgoSeleccionadoDetalle(rasgo)}
                                  {...resolverRecursosPadre(rasgo)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tarjeta 2: Rasgos de Subclase (Separada e Independiente) */}
                    {mc.rasgosSubclase.length > 0 && (
                      <div
                        className={estilos.seccionPrincipal}
                        style={{ borderLeft: "3px solid #38bdf8" }}
                      >
                        <div
                          className={estilos.cabeceraSeccionPrincipal}
                          onClick={() => alternarColapso(mc.claveColapsoSubclase)}
                        >
                          <div className={estilos.ladoIzquierdoCabecera}>
                            {subclaseColapsada ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                            <Sparkles size={13} color="#38bdf8" />
                            <span className={estilos.tituloSeccion} style={{ color: "#38bdf8" }}>
                              Subclase: {mc.clase.subclase || "Especialización"} ({mc.clase.nombre})
                            </span>
                            <span className={estilos.badgeConteoSeccion}>
                              {mc.rasgosSubclase.length}
                            </span>
                          </div>
                        </div>

                        {!subclaseColapsada && (
                          <div className={estilos.cuerpoSeccionPrincipal}>
                            {mc.rasgosSubclase.map((rasgo, idx) => {
                              const bloqueo = obtenerBloqueoToggleRasgo(rasgo);
                              return (
                                <TarjetaRasgo
                                  key={`${rasgo.id}_${rasgo.nivelRequerido || 0}_${idx}`}
                                  rasgo={rasgo}
                                  nombrePersonaje={nombrePj}
                                  idPersonaje={personajeActivo.id}
                                  alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                                  alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                                  alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgo.id)}
                                  deshabilitadoToggle={bloqueo.bloqueado}
                                  motivoDeshabilitado={bloqueo.motivo}
                                  alEditar={() => abrirModalEdicion(rasgo)}
                                  alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                                  alVerDetalle={() => setRasgoSeleccionadoDetalle(rasgo)}
                                  {...resolverRecursosPadre(rasgo)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tarjeta 3: Invocaciones Sobrenaturales (Caja Exterior Independiente como las Subclases) */}
                    {mc.rasgoInvocaciones && selectorInvocaciones && (
                      <div
                        className={estilos.seccionPrincipal}
                        style={{ borderLeft: "3px solid #a855f7" }}
                      >
                        <div
                          className={estilos.cabeceraSeccionPrincipal}
                          onClick={() => alternarColapso(mc.claveColapsoInvocaciones)}
                        >
                          <div className={estilos.ladoIzquierdoCabecera}>
                            {invocacionesColapsada ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                            <Flame size={13} color="#a855f7" />
                            <span className={estilos.tituloSeccion} style={{ color: "#c084fc" }}>
                              Invocaciones Sobrenaturales ({mc.clase.nombre})
                            </span>
                            <span
                              className={estilos.badgeConteoSeccion}
                              style={{ background: "rgba(168, 85, 247, 0.2)", color: "#e9d5ff", borderColor: "#a855f7" }}
                            >
                              {aprendidasInvocaciones.length} / {maxInvocaciones}
                            </span>
                          </div>
                        </div>

                        {!invocacionesColapsada && (
                          <div className={estilos.cuerpoSeccionPrincipal} style={{ padding: "8px 12px 14px 12px" }}>
                            <SelectorInvocacionesAcordeon
                              selector={selectorInvocaciones}
                              nivelPersonaje={mc.clase.nivel}
                              alActualizarSeleccion={(idSelector, valores) => {
                                if (mc.rasgoInvocaciones) {
                                  actualizarSeleccionRasgo(
                                    personajeActivo.id,
                                    mc.rasgoInvocaciones.id,
                                    idSelector,
                                    valores
                                  );
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* BLOQUE 3: DOTES */}
              {datosJerarquicos.dotes.length > 0 && (
                <div className={estilos.seccionPrincipal}>
                  <div
                    className={estilos.cabeceraSeccionPrincipal}
                    onClick={() => alternarColapso("dotes")}
                  >
                    <div className={estilos.ladoIzquierdoCabecera}>
                      {seccionesColapsadas.dotes ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                      <Award size={13} color="#a78bfa" />
                      <span className={estilos.tituloSeccion}>
                        Dotes
                      </span>
                      <span className={estilos.badgeConteoSeccion}>
                        {datosJerarquicos.dotes.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={estilos.botonHerramienta}
                      style={{ padding: "2px 6px", fontSize: 10.5 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirModalCreacion("dote");
                      }}
                      title="Añadir nueva dote"
                    >
                      <Plus size={11} />
                      <span>Dote</span>
                    </button>
                  </div>

                  {!seccionesColapsadas.dotes && (
                    <div className={estilos.cuerpoSeccionPrincipal}>
                      {datosJerarquicos.dotes.map((rasgo, idx) => {
                        const bloqueo = obtenerBloqueoToggleRasgo(rasgo);
                        return (
                          <TarjetaRasgo
                            key={`${rasgo.id}_${rasgo.nivelRequerido || 0}_${idx}`}
                            rasgo={rasgo}
                            nombrePersonaje={nombrePj}
                            idPersonaje={personajeActivo.id}
                            alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgo.id)}
                            deshabilitadoToggle={bloqueo.bloqueado}
                            motivoDeshabilitado={bloqueo.motivo}
                            alEditar={() => abrirModalEdicion(rasgo)}
                            alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alVerDetalle={() => setRasgoSeleccionadoDetalle(rasgo)}
                            {...resolverRecursosPadre(rasgo)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* BLOQUE 4: PERSONALIZADOS Y HOMEBREW */}
              <div className={estilos.seccionPrincipal}>
                <div
                  className={estilos.cabeceraSeccionPrincipal}
                  onClick={() => alternarColapso("personalizados")}
                >
                  <div className={estilos.ladoIzquierdoCabecera}>
                    {seccionesColapsadas.personalizados ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    <Layers size={13} color="#38bdf8" />
                    <span className={estilos.tituloSeccion}>
                      Rasgos Personalizados y Homebrew
                    </span>
                    <span className={estilos.badgeConteoSeccion}>
                      {datosJerarquicos.personalizados.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`${estilos.botonHerramienta} ${estilos.botonHerramientaPrimario}`}
                    style={{ padding: "2px 6px", fontSize: 10.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirModalCreacion("personalizado");
                    }}
                    title="Crear rasgo o dote Homebrew"
                  >
                    <Plus size={11} />
                    <span>Crear Homebrew</span>
                  </button>
                </div>

                {!seccionesColapsadas.personalizados && (
                  <div className={estilos.cuerpoSeccionPrincipal}>
                    {datosJerarquicos.personalizados.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "12px 6px", color: "#64748b", fontSize: 11.5 }}>
                        No has añadido rasgos personalizados o homebrew. Pulsa en "+ Crear Homebrew" para agregar uno.
                      </div>
                    ) : (
                      datosJerarquicos.personalizados.map((rasgo, idx) => {
                        const bloqueo = obtenerBloqueoToggleRasgo(rasgo);
                        return (
                          <TarjetaRasgo
                            key={`${rasgo.id}_${rasgo.nivelRequerido || 0}_${idx}`}
                            rasgo={rasgo}
                            nombrePersonaje={nombrePj}
                            idPersonaje={personajeActivo.id}
                            alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgo.id)}
                            deshabilitadoToggle={bloqueo.bloqueado}
                            motivoDeshabilitado={bloqueo.motivo}
                            alEditar={() => abrirModalEdicion(rasgo)}
                            alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alVerDetalle={() => setRasgoSeleccionadoDetalle(rasgo)}
                            {...resolverRecursosPadre(rasgo)}
                          />
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* =======================================================
          MODO B: VISOR DE PROGRESIÓN DE CLASE 1-20 (PHB 2024)
         ======================================================= */}
      {modoVista === "progresion_clase" && (
        <div className={estilos.contenedorCompendioProgresion}>
          {datosProgresionClases.map((bloqueClase) => {
            let yaMostroBannerSubclase = false;

            return (
              <div key={bloqueClase.clase.nombre} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {/* Cabecera de la Clase */}
                <div className={estilos.cabeceraCompendioClase}>
                  <h2 className={estilos.tituloCompendioClase}>
                    <Swords size={16} color="#d4af37" />
                    <span>{bloqueClase.defClase.nombre}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "none" }}>
                      (Dado: {bloqueClase.defClase.dadoGolpe} · Nivel Actual: {bloqueClase.clase.nivel})
                    </span>
                  </h2>

                  {bloqueClase.subDef && (
                    <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>
                      {bloqueClase.subDef.nombre}
                    </span>
                  )}
                </div>

                {/* Lista Cronológica 1 - 20 con estilo PHB 2024 */}
                {bloqueClase.items.map((item, idx) => {
                  const esSubclase = item.origen === "subclase";
                  const mostrarBannerAhora = esSubclase && !yaMostroBannerSubclase && bloqueClase.subDef;
                  if (mostrarBannerAhora) {
                    yaMostroBannerSubclase = true;
                  }

                  return (
                    <React.Fragment key={item.id || idx}>
                      {/* Banner de Subclase estilo PHB 2024 */}
                      {mostrarBannerAhora && bloqueClase.subDef && (
                        <div className={estilos.bannerSubclaseCompendio}>
                          <h3 className={estilos.tituloBannerSubclase}>
                            {bloqueClase.subDef.nombre}
                          </h3>
                          {bloqueClase.subDef.lema && (
                            <p className={estilos.lemaBannerSubclase}>
                              {bloqueClase.subDef.lema}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Fila del Rasgo */}
                      <div
                        className={`${estilos.itemProgresion} ${!item.alcanzado ? estilos.itemNivelFuturo : ""}`}
                      >
                        <div className={estilos.filaTituloProgresion}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              className={esSubclase ? estilos.tituloProgresionSubclase : estilos.tituloProgresionClase}
                            >
                              NIVEL {item.nivel}: {item.nombre.toUpperCase()}
                            </span>

                            {item.alcanzado ? (
                              <span className={estilos.badgeNivelAlcanzado} title="Desbloqueado">
                                <CheckCircle2 size={8} style={{ marginRight: 2, display: "inline" }} />
                                Activo
                              </span>
                            ) : (
                              <span className={estilos.badgeNivelPendiente} title="Nivel futuro">
                                Nvl {item.nivel}
                              </span>
                            )}
                          </div>

                          <span className={estilos.badgeFuenteProgresion}>
                            PHB'24 p.{50 + item.nivel}
                          </span>
                        </div>

                        {/* Texto descriptivo enriquecido */}
                        <div className={estilos.textoDescripcionProgresion}>
                          {renderizarTextoEnriquecidoDND(item.descripcion)}
                        </div>

                        {/* Tabla de Progresión y Escalado por Nivel (si existe) */}
                        {item.tablaProgresion && (
                          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                            <TablaProgresionRasgo
                              tabla={item.tablaProgresion}
                              nivelPersonaje={bloqueClase.clase.nivel}
                            />
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle Completo de Rasgo */}
      {rasgoDetalleEfectivo && (
        <ModalDetalleRasgo
          rasgo={rasgoDetalleEfectivo}
          nombrePersonaje={nombrePj}
          idPersonaje={personajeActivo.id}
          nivelPersonaje={personajeActivo.nivel}
          alCerrar={() => setRasgoSeleccionadoDetalle(null)}
          alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id)}
          alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgoDetalleEfectivo.id)}
          alAlternarActivo={() => alternarActivoRasgo(personajeActivo.id, rasgoDetalleEfectivo.id)}
          deshabilitadoToggle={obtenerBloqueoToggleRasgo(rasgoDetalleEfectivo).bloqueado}
          motivoDeshabilitado={obtenerBloqueoToggleRasgo(rasgoDetalleEfectivo).motivo}
          alActualizarSeleccion={(idSelector, valores) =>
            actualizarSeleccionRasgo(personajeActivo.id, rasgoDetalleEfectivo.id, idSelector, valores)
          }
          alEditar={() => {
            const r = rasgoDetalleEfectivo;
            setRasgoSeleccionadoDetalle(null);
            abrirModalEdicion(r);
          }}
          alEliminar={() => {
            const r = rasgoDetalleEfectivo;
            setRasgoSeleccionadoDetalle(null);
            eliminarRasgoPersonaje(personajeActivo.id, r.id);
          }}
          {...resolverRecursosPadre(rasgoDetalleEfectivo)}
        />
      )}
    </div>
  );
};

export default VistaRasgosJugador;
