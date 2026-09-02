import React, { useState, useMemo, useEffect } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes
} from "@/almacen/selectores/usarEstadoPersonajes";
import type { RasgoPersonaje, TipoAccionRasgo, OrigenRasgo } from "@/tipos";
import { TarjetaRasgo } from "./TarjetaRasgo";
import { ModalCrearEditarRasgo } from "./ModalCrearEditarRasgo";
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
  Award
} from "lucide-react";
import estilos from "./VistaRasgosJugador.module.css";

type FiltroTipoAccion = "todos" | TipoAccionRasgo;

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
    sincronizarRasgosPersonaje
  } = usarAccionesPersonajes();

  // Búsqueda y filtros reactivos compactos
  const [consultaBusqueda, setConsultaBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroAccion, setFiltroAccion] = useState<FiltroTipoAccion>("todos");

  // Estado del modal de creación/edición
  const [modalAbierto, setModalAbierto] = useState(false);
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

  // Auto-sincronización inicial si el personaje no tiene rasgos cargados
  useEffect(() => {
    if (personajeActivo && (!personajeActivo.rasgos || personajeActivo.rasgos.length === 0)) {
      sincronizarRasgosPersonaje(personajeActivo.id);
    }
  }, [personajeActivo?.id, personajeActivo?.rasgos?.length, sincronizarRasgosPersonaje]);

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
      });
    } else {
      colapsadas["clase_0_principal"] = true;
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

  // Filtrado de rasgos según búsqueda y filtro de tipo de acción
  const rasgosFiltrados = useMemo(() => {
    if (!personajeActivo || !Array.isArray(personajeActivo.rasgos)) return [];

    let lista = [...personajeActivo.rasgos];

    // Filtro por tipo de acción
    if (filtroAccion !== "todos") {
      lista = lista.filter((r) => r.tipoAccion === filtroAccion);
    }

    // Filtro por búsqueda con relevancia ponderada
    const busquedaLimpia = consultaBusqueda.trim();
    if (busquedaLimpia) {
      lista = lista
        .map((r) => {
          const relev = calcularRelevanciaBusqueda(r.nombre, busquedaLimpia, [
            r.descripcion || "",
            r.fuente || "",
            r.notas || ""
          ]);
          return { rasgo: r, relevancia: relev };
        })
        .filter((item) => item.relevancia > 0)
        .sort((a, b) => b.relevancia - a.relevancia || a.rasgo.nombre.localeCompare(b.rasgo.nombre))
        .map((item) => item.rasgo);
    }

    return lista;
  }, [personajeActivo?.rasgos, filtroAccion, consultaBusqueda]);

  // Estructura Jerárquica:
  // 1. Especie / Raza
  // 2. Clases (Para cada clase: Base + Subclase)
  // 3. Dotes
  // 4. Personalizados / Homebrew
  const datosJerarquicos = useMemo(() => {
    const rasgosEspecie = rasgosFiltrados.filter(
      (r) => !r.personalizado && r.origen === "especie"
    );

    const rasgosDotes = rasgosFiltrados.filter((r) => r.origen === "dote");

    const rasgosPersonalizados = rasgosFiltrados.filter(
      (r) => r.personalizado || r.origen === "personalizado" || r.origen === "trasfondo"
    );

    // Agrupar rasgos de clase por cada clase del personaje
    const mapaClases = clasesPersonaje.map((c, idx) => {
      const normNombreClase = normalizar(c.nombre);
      const normSubclase = c.subclase ? normalizar(c.subclase) : "";

      // Rasgos base de la clase
      const rasgosBase = rasgosFiltrados.filter((r) => {
        if (r.personalizado || r.origen !== "clase") return false;
        const normFuente = normalizar(r.fuente);
        const normId = normalizar(r.id);
        return normFuente.includes(normNombreClase) || normId.includes(normNombreClase);
      }).sort((a, b) => (a.nivelRequerido || 0) - (b.nivelRequerido || 0) || a.nombre.localeCompare(b.nombre));

      // Rasgos de la subclase
      const rasgosSubclase = rasgosFiltrados.filter((r) => {
        if (r.personalizado || r.origen !== "subclase") return false;
        const normFuente = normalizar(r.fuente);
        const normId = normalizar(r.id);
        return (
          normFuente.includes(normNombreClase) ||
          normId.includes(normNombreClase) ||
          (normSubclase && (normFuente.includes(normSubclase) || normId.includes(normSubclase)))
        );
      }).sort((a, b) => (a.nivelRequerido || 0) - (b.nivelRequerido || 0) || a.nombre.localeCompare(b.nombre));

      const totalClase = rasgosBase.length + rasgosSubclase.length;
      const claveColapso = `clase_${idx}_${normNombreClase}`;

      return {
        clase: c,
        indice: idx,
        claveColapso,
        rasgosBase,
        rasgosSubclase,
        total: totalClase
      };
    });

    // Rasgos de clase no asignados a ninguna clase conocida (fallback de seguridad)
    const idsAsignados = new Set<string>();
    mapaClases.forEach((mc) => {
      mc.rasgosBase.forEach((r) => idsAsignados.add(r.id));
      mc.rasgosSubclase.forEach((r) => idsAsignados.add(r.id));
    });

    const otrosRasgosClase = rasgosFiltrados.filter(
      (r) => !r.personalizado && (r.origen === "clase" || r.origen === "subclase") && !idsAsignados.has(r.id)
    );

    return {
      especie: rasgosEspecie,
      clases: mapaClases,
      otrosClase: otrosRasgosClase,
      dotes: rasgosDotes,
      personalizados: rasgosPersonalizados
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
    setModalAbierto(true);
  };

  const abrirModalEdicion = (rasgo: RasgoPersonaje) => {
    setRasgoParaEditar(rasgo);
    setOrigenPredeterminadoModal(rasgo.origen);
    setModalAbierto(true);
  };

  const manejarGuardarRasgoModal = (rasgoGuardado: RasgoPersonaje) => {
    if (rasgoParaEditar) {
      actualizarRasgoPersonaje(personajeActivo.id, rasgoGuardado.id, rasgoGuardado);
    } else {
      agregarRasgoPersonaje(personajeActivo.id, rasgoGuardado);
    }
    setModalAbierto(false);
    setRasgoParaEditar(null);
  };

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

        {/* Fila de Buscador Compacto y Botón de Filtros */}
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

        {/* Cajón Desplegable Compacto de Filtros */}
        {mostrarFiltros && (
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

      {/* 2. Árbol Jerárquico de Rasgos */}
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
          {/* =======================================================
              BLOQUE 1: ESPECIE / RAZA
             ======================================================= */}
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
                  {datosJerarquicos.especie.map((rasgo) => (
                    <TarjetaRasgo
                      key={rasgo.id}
                      rasgo={rasgo}
                      nombrePersonaje={nombrePj}
                      alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                      alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                      alEditar={() => abrirModalEdicion(rasgo)}
                      alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              BLOQUE 2: CLASE(S) Y SUBCLASE(S) (JERÁRQUICO)
             ======================================================= */}
          {datosJerarquicos.clases.map((mc) => {
            const estaColapsada = !!seccionesColapsadas[mc.claveColapso];

            return (
              <div key={mc.claveColapso} className={estilos.seccionPrincipal}>
                <div
                  className={estilos.cabeceraSeccionPrincipal}
                  onClick={() => alternarColapso(mc.claveColapso)}
                >
                  <div className={estilos.ladoIzquierdoCabecera}>
                    {estaColapsada ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                    <Swords size={13} color="#f59e0b" />
                    <span className={estilos.tituloSeccion}>
                      Clase: {mc.clase.nombre} (Nivel {mc.clase.nivel})
                    </span>
                    {mc.clase.subclase && (
                      <span className={estilos.subtituloSubclaseTexto}>
                        {mc.clase.subclase}
                      </span>
                    )}
                    <span className={estilos.badgeConteoSeccion}>
                      {mc.total}
                    </span>
                  </div>
                </div>

                {!estaColapsada && (
                  <div className={estilos.cuerpoSeccionPrincipal}>
                    {/* A. Rasgos de la Clase Base */}
                    {mc.rasgosBase.length > 0 && (
                      <div className={estilos.bloqueClaseJerarquico}>
                        <div className={estilos.cabeceraClaseItem}>
                          <span className={estilos.tituloClaseTexto}>
                            Rasgos de {mc.clase.nombre}
                          </span>
                          <span className={estilos.badgeConteoSeccion}>
                            {mc.rasgosBase.length}
                          </span>
                        </div>

                        {mc.rasgosBase.map((rasgo) => (
                          <TarjetaRasgo
                            key={rasgo.id}
                            rasgo={rasgo}
                            nombrePersonaje={nombrePj}
                            alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alEditar={() => abrirModalEdicion(rasgo)}
                            alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                          />
                        ))}
                      </div>
                    )}

                    {/* B. Rasgos de la Subclase Anidada */}
                    {mc.rasgosSubclase.length > 0 && (
                      <div className={estilos.bloqueSubclaseAnidado}>
                        <div className={estilos.cabeceraSubclaseAnidada}>
                          <Sparkles size={12} color="#fbbf24" />
                          <span>Subclase: {mc.clase.subclase || "Especialización"}</span>
                          <span className={estilos.badgeConteoSeccion} style={{ marginLeft: "auto" }}>
                            {mc.rasgosSubclase.length}
                          </span>
                        </div>

                        {mc.rasgosSubclase.map((rasgo) => (
                          <TarjetaRasgo
                            key={rasgo.id}
                            rasgo={rasgo}
                            nombrePersonaje={nombrePj}
                            alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                            alEditar={() => abrirModalEdicion(rasgo)}
                            alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                          />
                        ))}
                      </div>
                    )}

                    {mc.total === 0 && (
                      <div style={{ textAlign: "center", padding: "8px", color: "#64748b", fontSize: 11.5 }}>
                        No hay rasgos disponibles para esta clase con los filtros actuales.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Otros rasgos de clase huérfanos si existieran */}
          {datosJerarquicos.otrosClase.length > 0 && (
            <div className={estilos.seccionPrincipal}>
              <div
                className={estilos.cabeceraSeccionPrincipal}
                onClick={() => alternarColapso("otros_clase")}
              >
                <div className={estilos.ladoIzquierdoCabecera}>
                  {seccionesColapsadas.otros_clase ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                  <Swords size={13} color="#f59e0b" />
                  <span className={estilos.tituloSeccion}>
                    Otros Rasgos de Clase
                  </span>
                  <span className={estilos.badgeConteoSeccion}>
                    {datosJerarquicos.otrosClase.length}
                  </span>
                </div>
              </div>

              {!seccionesColapsadas.otros_clase && (
                <div className={estilos.cuerpoSeccionPrincipal}>
                  {datosJerarquicos.otrosClase.map((rasgo) => (
                    <TarjetaRasgo
                      key={rasgo.id}
                      rasgo={rasgo}
                      nombrePersonaje={nombrePj}
                      alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                      alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                      alEditar={() => abrirModalEdicion(rasgo)}
                      alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              BLOQUE 3: DOTES
             ======================================================= */}
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
                  {datosJerarquicos.dotes.map((rasgo) => (
                    <TarjetaRasgo
                      key={rasgo.id}
                      rasgo={rasgo}
                      nombrePersonaje={nombrePj}
                      alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                      alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                      alEditar={() => abrirModalEdicion(rasgo)}
                      alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              BLOQUE 4: PERSONALIZADOS Y HOMEBREW
             ======================================================= */}
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
                  datosJerarquicos.personalizados.map((rasgo) => (
                    <TarjetaRasgo
                      key={rasgo.id}
                      rasgo={rasgo}
                      nombrePersonaje={nombrePj}
                      alGastarUso={() => gastarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                      alRecuperarUso={() => recuperarUsoRasgoPersonaje(personajeActivo.id, rasgo.id)}
                      alEditar={() => abrirModalEdicion(rasgo)}
                      alEliminar={() => eliminarRasgoPersonaje(personajeActivo.id, rasgo.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Creación / Edición */}
      {modalAbierto && (
        <ModalCrearEditarRasgo
          rasgoInicial={rasgoParaEditar}
          origenPredeterminado={origenPredeterminadoModal}
          alGuardar={manejarGuardarRasgoModal}
          alCerrar={() => {
            setModalAbierto(false);
            setRasgoParaEditar(null);
          }}
        />
      )}
    </div>
  );
};

export default VistaRasgosJugador;
