import { useState, useMemo, useEffect, useRef } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes
} from "@/almacen/selectores/usarEstadoPersonajes";
import type { RasgoPersonaje, OrigenRasgo } from "@/tipos";
import { usarEstadoPersistido } from "@/hooks";
import { calcularRelevanciaBusqueda } from "@/utiles/busquedaTolerante";
import type { FiltroTipoAccion } from "./CabeceraRasgosJugador";
import type {
  SeccionesColapsadas,
  GrupoClaseJerarquico,
  DatosJerarquicosRasgos
} from "./tiposRasgosJugador";
import {
  normalizar,
  calcularProgresionClases,
  obtenerBloqueoToggleRasgo,
  resolverRecursosPadre,
  agruparRasgosJerarquicos
} from "./utilidadesProgresionRasgos";

export type { SeccionesColapsadas, GrupoClaseJerarquico, DatosJerarquicosRasgos };

export function usarVistaRasgos() {
  const { personajeActivo } = usarEstadoPersonajes();
  const accionesPersonajes = usarAccionesPersonajes();
  const {
    agregarRasgoPersonaje,
    actualizarRasgoPersonaje,
    sincronizarRasgosPersonaje
  } = accionesPersonajes;

  // Modo de vista: Mis Rasgos vs Progresión 1-20 vs Constructor Homebrew
  const [modoVista, setModoVista] = useState<"mis_rasgos" | "progresion_clase" | "creador_homebrew">("mis_rasgos");

  // Búsqueda y filtros reactivos compactos
  const [consultaBusqueda, setConsultaBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroAccion, setFiltroAccion] = useState<FiltroTipoAccion>("todos");

  // Estado del modal de detalle de rasgo
  const [rasgoSeleccionadoDetalle, setRasgoSeleccionadoDetalle] = useState<RasgoPersonaje | null>(null);

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
      subespecie: false,
      dotes: false,
      personalizados: false
    }
  );

  const firmaProgresion = personajeActivo
    ? `${personajeActivo.id}_${personajeActivo.clase}_${personajeActivo.subclase}_${personajeActivo.nivel}_${(personajeActivo.clases || [])
        .map((c) => `${c.nombre}:${c.subclase}:${c.nivel}`)
        .join(",")}_${personajeActivo.especie}_${personajeActivo.subespecie}`
    : "";

  const firmaPreviaRef = useRef<string>(firmaProgresion);

  useEffect(() => {
    if (!personajeActivo) return;

    const noTieneRasgos = !personajeActivo.rasgos || personajeActivo.rasgos.length === 0;
    const cambioProgresion = firmaPreviaRef.current !== "" && firmaPreviaRef.current !== firmaProgresion;
    firmaPreviaRef.current = firmaProgresion;

    if (noTieneRasgos || cambioProgresion) {
      sincronizarRasgosPersonaje(personajeActivo.id);
    }
  }, [personajeActivo?.id, firmaProgresion, sincronizarRasgosPersonaje]);

  const alternarColapso = (clave: string) => {
    setSeccionesColapsadas((prev) => ({
      ...prev,
      [clave]: !prev[clave]
    }));
  };

  const expandirTodas = () => {
    setSeccionesColapsadas({
      especie: false,
      subespecie: false,
      dotes: false,
      personalizados: false
    });
  };

  const colapsarTodas = () => {
    const colapsadas: SeccionesColapsadas = {
      especie: true,
      subespecie: true,
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

  const datosProgresionClases = useMemo(() => {
    if (!personajeActivo) return [];
    return calcularProgresionClases(personajeActivo, clasesPersonaje);
  }, [personajeActivo, clasesPersonaje]);

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

  const datosJerarquicos = useMemo<DatosJerarquicosRasgos>(() => {
    return agruparRasgosJerarquicos(rasgosFiltrados, clasesPersonaje);
  }, [rasgosFiltrados, clasesPersonaje]);

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
    if (!personajeActivo) return;
    if (rasgoParaEditar) {
      actualizarRasgoPersonaje(personajeActivo.id, rasgoGuardado.id, rasgoGuardado);
    } else {
      agregarRasgoPersonaje(personajeActivo.id, rasgoGuardado);
    }
    setRasgoParaEditar(null);
    setModoVista("mis_rasgos");
  };

  return {
    personajeActivo,
    modoVista, setModoVista,
    consultaBusqueda, setConsultaBusqueda,
    mostrarFiltros, setMostrarFiltros,
    filtroAccion, setFiltroAccion,
    setRasgoSeleccionadoDetalle,
    rasgoDetalleEfectivo,
    rasgoParaEditar, setRasgoParaEditar,
    origenPredeterminadoModal,
    seccionesColapsadas,
    alternarColapso,
    alternarTodas,
    estanTodasExpandidas,
    furiaEstaActiva,
    datosProgresionClases,
    rasgosFiltrados,
    datosJerarquicos,
    abrirModalCreacion,
    abrirModalEdicion,
    manejarGuardarRasgoModal,
    ...accionesPersonajes,
    obtenerBloqueoToggleRasgo: (r: RasgoPersonaje) => obtenerBloqueoToggleRasgo(r, furiaEstaActiva),
    resolverRecursosPadre: (r: RasgoPersonaje) => resolverRecursosPadre(personajeActivo, r)
  };
}
