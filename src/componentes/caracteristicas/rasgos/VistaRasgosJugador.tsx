import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes
} from "@/almacen/selectores/usarEstadoPersonajes";
import type { RasgoPersonaje, OrigenRasgo } from "@/tipos";
import { TarjetaRasgo } from "./TarjetaRasgo";
import { ConstructorRasgoDote } from "./ConstructorRasgoDote";
import { ModalDetalleRasgo } from "./ModalDetalleRasgo";
import { SelectorInvocacionesAcordeon } from "./SelectorInvocacionesAcordeon";
import { obtenerClasePorNombre, obtenerSubclasePorNombre } from "@/servicios/gestorClases";
import { usarEstadoPersistido } from "@/hooks";
import { calcularRelevanciaBusqueda } from "@/utiles/busquedaTolerante";
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  User,
  Swords,
  Award,
  Flame,
  Layers,
  Search,
  Plus
} from "lucide-react";
import {
  CabeceraRasgosJugador,
  type FiltroTipoAccion
} from "./CabeceraRasgosJugador";
import { FiltrosAccionRasgos } from "./FiltrosAccionRasgos";
import {
  VisorProgresionClase,
  type ItemProgresionClase,
  type BloqueProgresionClase
} from "./VisorProgresionClase";
import estilos from "./VistaRasgosJugador.module.css";

interface SeccionesColapsadas {
  especie: boolean;
  dotes: boolean;
  personalizados: boolean;
  [claveClase: string]: boolean;
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

  const datosProgresionClases = useMemo<BloqueProgresionClase[]>(() => {
    if (!personajeActivo) return [];

    const lista: BloqueProgresionClase[] = [];

    for (const claseItem of clasesPersonaje) {
      const defClase = obtenerClasePorNombre(claseItem.nombre);
      if (!defClase) continue;

      const subDef = claseItem.subclase ? obtenerSubclasePorNombre(claseItem.nombre, claseItem.subclase) : null;
      const nivelPj = claseItem.nivel || 1;

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

      const todosProgresion: ItemProgresionClase[] = [...rasgosClase1a20, ...rasgosSub1a20].sort(
        (a, b) => a.nivel - b.nivel
      );

      lista.push({
        clase: claseItem,
        defClase,
        subDef,
        items: todosProgresion
      });
    }

    return lista;
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

          if (normFuente.includes(normNombreClase) || rasgo.id.includes(`_${normNombreClase}_`)) {
            const nomRasgoNorm = normalizar(rasgo.nombre);
            if (
              nomRasgoNorm.includes("invocaciones sobrenaturales") &&
              Array.isArray(rasgo.selectores) &&
              rasgo.selectores.length > 0
            ) {
              mc.rasgoInvocaciones = rasgo;
            } else if (rasgo.origen === "subclase" || (normSubClasePj && normFuente.includes(normSubClasePj))) {
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

  const renderizarTarjetaRasgo = (rasgo: RasgoPersonaje, idx: number) => {
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
      {/* 1. Cabecera Compacta */}
      <CabeceraRasgosJugador
        totalRasgosFiltrados={rasgosFiltrados.length}
        totalRasgosPj={totalRasgosPj}
        alAbrirCreacion={() => abrirModalCreacion("personalizado")}
        alSincronizar={() => sincronizarRasgosPersonaje(personajeActivo.id)}
        alAlternarTodas={alternarTodas}
        estanTodasExpandidas={estanTodasExpandidas}
        modoVista={modoVista}
        alCambiarModoVista={setModoVista}
        consultaBusqueda={consultaBusqueda}
        alCambiarBusqueda={setConsultaBusqueda}
        mostrarFiltros={mostrarFiltros}
        alAlternarMostrarFiltros={() => setMostrarFiltros(!mostrarFiltros)}
        filtroAccion={filtroAccion}
      />

      {/* 2. Filtros Desplegables */}
      {modoVista === "mis_rasgos" && mostrarFiltros && (
        <FiltrosAccionRasgos
          filtroAccion={filtroAccion}
          alCambiarFiltroAccion={setFiltroAccion}
          hayFiltrosActivos={hayFiltrosActivos}
          alLimpiarFiltros={() => {
            setConsultaBusqueda("");
            setFiltroAccion("todos");
          }}
        />
      )}

      {/* 3. MODO A: MIS RASGOS ACTIVOS */}
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
                        Raza: {personajeActivo.especie || "Humano"}
                        {personajeActivo.subespecie ? ` (${personajeActivo.subespecie})` : ""}
                      </span>
                      <span className={estilos.badgeConteoSeccion}>
                        {datosJerarquicos.especie.length}
                      </span>
                    </div>
                  </div>

                  {!seccionesColapsadas.especie && (
                    <div className={estilos.cuerpoSeccionPrincipal}>
                      {datosJerarquicos.especie.map(renderizarTarjetaRasgo)}
                    </div>
                  )}
                </div>
              )}

              {/* BLOQUE 2: CLASES, SUBCLASES E INVOCACIONES */}
              {datosJerarquicos.clases.map((mc) => {
                const claseColapsada = !!seccionesColapsadas[mc.claveColapsoClase];
                const subclaseColapsada = !!seccionesColapsadas[mc.claveColapsoSubclase];
                const invocacionesColapsada = !!seccionesColapsadas[mc.claveColapsoInvocaciones];

                const selectorInvocaciones = mc.rasgoInvocaciones?.selectores?.[0];
                const aprendidasInvocaciones = selectorInvocaciones?.valorActual || [];
                const maxInvocaciones = selectorInvocaciones?.maxSelecciones || 1;

                return (
                  <React.Fragment key={`grupo_clase_${mc.clase.nombre}`}>
                    {/* Rasgos de Clase Base */}
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
                            {mc.rasgosBase.map(renderizarTarjetaRasgo)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rasgos de Subclase */}
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
                            {mc.rasgosSubclase.map(renderizarTarjetaRasgo)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Invocaciones Sobrenaturales */}
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
                      <span className={estilos.tituloSeccion}>Dotes</span>
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
                      {datosJerarquicos.dotes.map(renderizarTarjetaRasgo)}
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
                      datosJerarquicos.personalizados.map(renderizarTarjetaRasgo)
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* 4. MODO B: VISOR DE PROGRESIÓN DE CLASE 1-20 (PHB 2024) */}
      {modoVista === "progresion_clase" && (
        <VisorProgresionClase datosProgresionClases={datosProgresionClases} />
      )}

      {/* 5. Modal de Detalle Completo de Rasgo */}
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
