import React, { useState, useEffect } from "react";
import type {
  PersonajeJugador,
  Caracteristica,
  Habilidad
} from "@/tipos";
import {
  HABILIDADES_LISTA,
  CARACTERISTICAS_CLAVES,
  CLASES_DND,
  ALINEAMIENTOS_DND,
  DESCRIPCIONES_CARACTERISTICAS,
  obtenerDadoGolpePorClase,
  obtenerExperienciaMinimaPorNivel,
  obtenerNivelPorExperiencia,
  obtenerBonoCompetenciaPorNivel
} from "@/constantes";
import { calcularModificadorCaracteristica } from "@/servicios/procesadorDescansos";
import ts from "@/utiles/TaleSpireAdapter";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { SelectorSugerencias } from "@/componentes/comunes/SelectorSugerencias";
import { ModalDetalleHabilidad } from "./ModalDetalleHabilidad";
import { ModalDetalleCaracteristica } from "./ModalDetalleCaracteristica";
import {
  ModalSelectorCompetencias,
  CategoriaCompetencia
} from "./ModalSelectorCompetencias";
import {
  Save,
  Shield,
  User,
  Award,
  Eye,
  Sparkles,
  Swords,
  Languages,
  Wrench,
  Sliders,
  Settings
} from "lucide-react";

import estilos from "./HojaPersonaje.module.css";

interface PanelConfiguracionPersonajeProps {
  personaje: PersonajeJugador;
  alGuardar: (cambios: Partial<PersonajeJugador>) => void;
  alVolverAFicha: () => void;
}

type PestanaConfiguracion = "identidad" | "atributos" | "competencias" | "sentidos";

export const PanelConfiguracionPersonaje: React.FC<PanelConfiguracionPersonajeProps> = ({
  personaje,
  alGuardar,
  alVolverAFicha
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<PestanaConfiguracion>("identidad");

  // Estado del formulario
  const [form, setForm] = useState<PersonajeJugador>(() => {
    // Inicialización con saneamiento de listas estructuradas si venían vacías
    const armasGrupos = personaje.competenciasArmasGrupos || [];
    const armasLista = personaje.competenciasArmasLista || [];
    const armadurasGrupos = personaje.competenciasArmadurasGrupos || [];
    const armadurasLista = personaje.competenciasArmadurasLista || [];
    const idiomasLista =
      personaje.idiomasLista && personaje.idiomasLista.length > 0
        ? personaje.idiomasLista
        : personaje.idiomas ? personaje.idiomas.split(",").map((s) => s.trim()).filter(Boolean) : ["Común"];
    const herramientasLista =
      personaje.herramientasLista && personaje.herramientasLista.length > 0
        ? personaje.herramientasLista
        : personaje.herramientas ? personaje.herramientas.split(",").map((s) => s.trim()).filter(Boolean) : [];

    return {
      ...personaje,
      hpMaximoBase: personaje.hpMaximoBase || personaje.hpMaximo || 10,
      competenciasArmasGrupos: armasGrupos,
      competenciasArmasLista: armasLista,
      competenciasArmadurasGrupos: armadurasGrupos,
      competenciasArmadurasLista: armadurasLista,
      idiomasLista,
      herramientasLista,
      personalizacionesHabilidades: personaje.personalizacionesHabilidades || {}
    };
  });

  const [habilidadEnDetalle, setHabilidadEnDetalle] = useState<{
    clave: Habilidad;
    nombre: string;
  } | null>(null);

  const [caracteristicaEnDetalle, setCaracteristicaEnDetalle] = useState<Caracteristica | null>(null);

  const [modalCompetencias, setModalCompetencias] = useState<CategoriaCompetencia | null>(null);


  // Auto-detección inicial silenciosa del nombre del jugador si el campo está en blanco
  useEffect(() => {
    if (!form.jugador || form.jugador.trim() === "") {
      ts.players
        .obtenerNombreJugadorLocal()
        .then((nombreDetectado: string | null) => {
          if (nombreDetectado && nombreDetectado.trim() !== "") {
            setForm((prev) => ({ ...prev, jugador: nombreDetectado.trim() }));
          }
        })
        .catch((err: unknown) => {
          console.error("[PanelConfiguracion] Error en auto-detección inicial de jugador:", err);
        });
    }
  }, []);

  const actualizarCampo = <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Acción manual para refrescar el nombre del jugador desde TaleSpire
  const manejarDetectarJugadorTaleSpire = async () => {
    try {
      const nombreTS = await ts.players.obtenerNombreJugadorLocal();
      if (nombreTS && nombreTS.trim() !== "") {
        setForm((prev) => ({ ...prev, jugador: nombreTS.trim() }));
      }
    } catch (e: unknown) {
      console.error("[PanelConfiguracion] Error al detectar jugador:", e);
    }
  };


  const manejarCambioClase = (nuevaClase: string) => {
    const dadoSugerido = obtenerDadoGolpePorClase(nuevaClase.trim());
    setForm((prev) => ({
      ...prev,
      clase: nuevaClase,
      tipoDadoGolpe: dadoSugerido
    }));
  };

  // Sincronización inteligente Nivel -> XP
  const manejarCambioNivel = (nuevoNivelStr: string) => {
    const niv = Math.max(1, Math.min(20, parseInt(nuevoNivelStr, 10) || 1));
    const xpMinima = obtenerExperienciaMinimaPorNivel(niv);

    setForm((prev) => ({
      ...prev,
      nivel: niv,
      dadosGolpeTotal: niv,
      dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, niv),
      experiencia: Math.max(prev.experiencia, xpMinima)
    }));
  };

  // Sincronización inteligente XP -> Nivel
  const manejarCambioExperiencia = (nuevaXpStr: string) => {
    const xpVal = Math.max(0, parseInt(nuevaXpStr, 10) || 0);
    const nivelSugerido = obtenerNivelPorExperiencia(xpVal);

    setForm((prev) => ({
      ...prev,
      experiencia: xpVal,
      nivel: nivelSugerido,
      dadosGolpeTotal: nivelSugerido,
      dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, nivelSugerido)
    }));
  };

  const manejarGuardarCaracteristica = (
    carac: Caracteristica,
    cambios: {
      valorBase: number;
      overrideFijo: number | null;
      competenteSalvacion: boolean;
    }
  ) => {
    setForm((prev) => ({
      ...prev,
      caracteristicas: {
        ...prev.caracteristicas,
        [carac]: cambios.valorBase
      },
      overridesFijos: {
        ...prev.overridesFijos,
        [carac]: cambios.overrideFijo
      },
      competenciasSalvacion: {
        ...prev.competenciasSalvacion,
        [carac]: cambios.competenteSalvacion
      }
    }));
    setCaracteristicaEnDetalle(null);
  };



  const manejarGuardarCompetencias = (nuevasCompetencias: {
    competenciasArmasGrupos: ("sencillas" | "marciales" | "fuego")[];
    competenciasArmasLista: string[];
    competenciasArmas: string;
    competenciasArmadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
    competenciasArmadurasLista: string[];
    competenciasArmaduras: string;
    idiomasLista: string[];
    idiomas: string;
    herramientasLista: string[];
    herramientas: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      ...nuevasCompetencias
    }));
  };

  // -------------------------------------------------------------
  // GUARDAR FORMULARIO
  // -------------------------------------------------------------
  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    alGuardar(form);
    alVolverAFicha();
  };


  return (
    <div className={estilos.contenedorPrincipal} style={{ gap: 14 }}>
      {/* Selector de Sub-pestañas Internas */}
      <div className={estilos.barraPestañasModal} style={{ margin: 0 }}>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "identidad" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("identidad")}
        >
          <User size={14} style={{ marginRight: 6 }} />
          Identidad y Nivel
        </button>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "atributos" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("atributos")}
        >
          <Award size={14} style={{ marginRight: 6 }} />
          Atributos y Overrides
        </button>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "competencias" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("competencias")}
        >
          <Shield size={14} style={{ marginRight: 6 }} />
          Competencias y Habilidades
        </button>

        <button
          type="button"
          className={`${estilos.botonPestañaModal} ${
            pestanaActiva === "sentidos" ? estilos.botonPestañaModalActiva : ""
          }`}
          onClick={() => setPestanaActiva("sentidos")}
        >
          <Eye size={14} style={{ marginRight: 6 }} />
          Sentidos y Salud Base
        </button>
      </div>

      {/* Formulario Principal de Configuración */}
      <form
        onSubmit={manejarGuardar}
        className={`${estilos.neoRaised}`}
        style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}
      >
        {/* PESTAÑA 1: IDENTIDAD */}
        {pestanaActiva === "identidad" && (
          <>
            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Nombre del Personaje</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.nombre}
                  onChange={(e) => actualizarCampo("nombre", e.target.value)}
                  required
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Nombre del Jugador</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.jugador}
                    onChange={(e) => actualizarCampo("jugador", e.target.value)}
                    placeholder="Ej. Nombre del Jugador"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={estilos.neoButton}
                    onClick={manejarDetectarJugadorTaleSpire}
                    title="Auto-detectar tu nombre desde TaleSpire"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      padding: "0 10px",
                      color: "#38bdf8",
                      borderColor: "rgba(56, 189, 248, 0.4)"
                    }}
                  >
                    <Sparkles size={13} />
                    Detectar
                  </button>
                </div>
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Clase (Sugerencia o Personalizada)</label>
                <SelectorSugerencias
                  valor={form.clase}
                  alCambiar={manejarCambioClase}
                  opciones={CLASES_DND}
                  placeholder="Escribe o selecciona una clase..."
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Subclase</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.subclase}
                  onChange={(e) => actualizarCampo("subclase", e.target.value)}
                  placeholder="Ej. Campeón, Evocación..."
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Nivel (1 - 20)</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.nivel}
                  onChange={(e) => manejarCambioNivel(e.target.value)}
                  min="1"
                  max="20"
                  required
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>
                  Puntos de Experiencia (PX)
                  <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6 }}>
                    (Mínimo Niv. {form.nivel}: {obtenerExperienciaMinimaPorNivel(form.nivel).toLocaleString()} PX)
                  </span>
                </label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.experiencia}
                  onChange={(e) => manejarCambioExperiencia(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Especie / Raza</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.especie}
                  onChange={(e) => actualizarCampo("especie", e.target.value)}
                  placeholder="Ej. Humano, Elfo, Enano..."
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Trasfondo</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.trasfondo}
                  onChange={(e) => actualizarCampo("trasfondo", e.target.value)}
                  placeholder="Ej. Soldado, Erudito..."
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Alineamiento</label>
                <SelectorDesplegable
                  valor={form.alineacion}
                  alCambiar={(val) => actualizarCampo("alineacion", val)}
                  opciones={ALINEAMIENTOS_DND}
                  tamano="normal"
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Miniatura 3D en Tablero</label>
                <div
                  style={{
                    height: 38,
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 10px",
                    borderRadius: 4,
                    backgroundColor: form.idMiniaturaTS
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: form.idMiniaturaTS
                      ? "1px solid #10b981"
                      : "1px solid var(--color-borde-brutal)",
                    color: form.idMiniaturaTS ? "#10b981" : "var(--color-texto-apagado)"
                  }}
                  title="Auto-detectada automáticamente si la miniatura en el tablero tiene el mismo nombre que tu personaje"
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: form.idMiniaturaTS ? "#10b981" : "#64748b"
                    }}
                  />
                  {form.idMiniaturaTS ? "Auto-detectada en Tablero" : "Sin Miniatura en Tablero"}
                </div>
              </div>
            </div>

            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>URL de Imagen de Avatar (Ilustración / Token)</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt="Vista previa"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                      border: "1px solid #818cf8"
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : null}
                <input
                  type="url"
                  className={estilos.inputFormulario}
                  value={form.avatarUrl || ""}
                  onChange={(e) => actualizarCampo("avatarUrl", e.target.value)}
                  placeholder="https://ejemplo.com/retrato-mi-personaje.png"
                  style={{ flexGrow: 1 }}
                />
              </div>
            </div>
          </>
        )}

        {/* PESTAÑA 2: ATRIBUTOS Y OVERRIDES */}
        {pestanaActiva === "atributos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Banner Informativo Superior */}
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                border: "1px solid rgba(148, 163, 184, 0.14)",
                backgroundColor: "#0e131d"
              }}
            >
              <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                Puntuaciones base y <strong>Overrides Fijos</strong> para objetos mágicos (D&D 5.5e).
              </span>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: "#161f2e",
                  color: "#cbd5e1",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 700,
                  whiteSpace: "nowrap"
                }}
              >
                PB: +{obtenerBonoCompetenciaPorNivel(form.nivel || 1)}
              </span>
            </div>

            {/* Grid 2 Columnas de Tarjetas de Atributos */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 10
              }}
            >
              {CARACTERISTICAS_CLAVES.map(({ clave }) => {
                const carac = clave as Caracteristica;
                const valorBase = form.caracteristicas?.[carac] ?? 10;
                const override = form.overridesFijos?.[carac] ?? null;
                const esCompetente = !!form.competenciasSalvacion?.[carac];
                const pb = obtenerBonoCompetenciaPorNivel(form.nivel || 1);

                const valorEfectivo = override !== null && override !== undefined ? override : valorBase;
                const mod = calcularModificadorCaracteristica(valorEfectivo);
                const bonoSalvacion = esCompetente ? mod + pb : mod;
                const descripcionSalvacion = DESCRIPCIONES_CARACTERISTICAS[carac] || "";

                const nombreCompleto =
                  carac === "fuerza"
                    ? "Fuerza"
                    : carac === "destreza"
                    ? "Destreza"
                    : carac === "constitucion"
                    ? "Constitución"
                    : carac === "inteligencia"
                    ? "Inteligencia"
                    : carac === "sabiduria"
                    ? "Sabiduría"
                    : "Carisma";

                const abreviatura =
                  carac === "fuerza"
                    ? "FUE"
                    : carac === "destreza"
                    ? "DES"
                    : carac === "constitucion"
                    ? "CON"
                    : carac === "inteligencia"
                    ? "INT"
                    : carac === "sabiduria"
                    ? "SAB"
                    : "CAR";

                return (
                  <div
                    key={carac}
                    className={estilos.neoRaised}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 8,
                      backgroundColor: "#111622",
                      border: override !== null ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid rgba(148, 163, 184, 0.12)"
                    }}
                  >
                    <div>
                      {/* Cabecera de la Tarjeta: Badge + Nombre + Modificador */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 4,
                              backgroundColor: "#18202e",
                              border: "1px solid rgba(148, 163, 184, 0.2)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#cbd5e1",
                              fontWeight: 800,
                              fontSize: 11
                            }}
                          >
                            {abreviatura}
                          </span>
                          <div>
                            <strong style={{ fontSize: 13, color: "#f1f5f9", display: "block" }}>
                              {nombreCompleto}
                            </strong>
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>
                              Base: <strong style={{ color: "#cbd5e1" }}>{valorBase}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Modificador con Puntuación Final */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            backgroundColor: "#0d121c",
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: "1px solid rgba(148, 163, 184, 0.14)"
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: mod >= 0 ? "#60a5fa" : "#fca5a5"
                            }}
                          >
                            {mod >= 0 ? `+${mod}` : mod}
                          </span>
                          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                            ({valorEfectivo})
                          </span>
                        </div>
                      </div>

                      {/* Badges de Salvación y Override */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                        {override !== null && (
                          <span
                            style={{
                              fontSize: 10,
                              backgroundColor: "#201335",
                              color: "#d8b4fe",
                              border: "1px solid rgba(168, 85, 247, 0.3)",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 700
                            }}
                          >
                            Fijo: {override}
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: 10,
                            backgroundColor: esCompetente ? "#132135" : "#0d121c",
                            color: esCompetente ? "#93c5fd" : "#94a3b8",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 600,
                            border: esCompetente ? "1px solid rgba(96, 165, 250, 0.3)" : "1px solid rgba(148, 163, 184, 0.1)"
                          }}
                        >
                           Salv: {bonoSalvacion >= 0 ? `+${bonoSalvacion}` : bonoSalvacion} {esCompetente ? "(+PB)" : ""}
                        </span>
                      </div>

                      {/* Caja de Uso de Salvación */}
                      <div
                        style={{
                          backgroundColor: "#0a0e16",
                          borderLeft: "3px solid #334155",
                          padding: "6px 8px",
                          borderRadius: 4,
                          marginBottom: 4
                        }}
                      >
                        <span style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.35, display: "block" }}>
                          {descripcionSalvacion}
                        </span>
                      </div>
                    </div>

                    {/* Botón de Configuración Táctico y Sobrio */}
                    <button
                      type="button"
                      onClick={() => setCaracteristicaEnDetalle(carac)}
                      style={{
                        width: "100%",
                        padding: "5px 10px",
                        borderRadius: 4,
                        backgroundColor: "#18202f",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        color: "#cbd5e1",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxSizing: "border-box"
                      }}
                    >
                      <Settings size={12} color="#94a3b8" />
                      Configurar / Desglose
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}




        {/* PESTAÑA 3: COMPETENCIAS Y HABILIDADES */}
        {pestanaActiva === "competencias" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Grid 2x2 de Tarjetas Resumen de Competencias */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 10
              }}
            >
              {/* Tarjeta Armas */}
              <div
                className={estilos.neoRaised}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  backgroundColor: "#111622",
                  border: "1px solid rgba(148, 163, 184, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Swords size={14} color="#94a3b8" />
                      <strong style={{ fontSize: 12, color: "#f1f5f9" }}>Competencias con Armas</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#18202e",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700
                      }}
                    >
                      {form.competenciasArmasLista?.length || 0} armas
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                    {form.competenciasArmas || "Sin competencias seleccionadas"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCompetencias("armas")}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Settings size={12} color="#94a3b8" />
                  Gestionar Armas
                </button>
              </div>

              {/* Tarjeta Armaduras */}
              <div
                className={estilos.neoRaised}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  backgroundColor: "#111622",
                  border: "1px solid rgba(148, 163, 184, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Shield size={14} color="#94a3b8" />
                      <strong style={{ fontSize: 12, color: "#f1f5f9" }}>Competencias con Armaduras</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#18202e",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700
                      }}
                    >
                      {form.competenciasArmadurasLista?.length || 0} armaduras
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                    {form.competenciasArmaduras || "Sin competencias seleccionadas"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCompetencias("armaduras")}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Settings size={12} color="#94a3b8" />
                  Gestionar Armaduras
                </button>
              </div>

              {/* Tarjeta Idiomas */}
              <div
                className={estilos.neoRaised}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  backgroundColor: "#111622",
                  border: "1px solid rgba(148, 163, 184, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Languages size={14} color="#94a3b8" />
                      <strong style={{ fontSize: 12, color: "#f1f5f9" }}>Idiomas Conocidos</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#18202e",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700
                      }}
                    >
                      {form.idiomasLista?.length || 0} idiomas
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                    {form.idiomas || "Común"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCompetencias("idiomas")}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Settings size={12} color="#94a3b8" />
                  Gestionar Idiomas
                </button>
              </div>

              {/* Tarjeta Herramientas */}
              <div
                className={estilos.neoRaised}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8,
                  backgroundColor: "#111622",
                  border: "1px solid rgba(148, 163, 184, 0.12)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Wrench size={14} color="#94a3b8" />
                      <strong style={{ fontSize: 12, color: "#f1f5f9" }}>Herramientas e Instrumentos</strong>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        backgroundColor: "#18202e",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700
                      }}
                    >
                      {form.herramientasLista?.length || 0} herramientas
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>
                    {form.herramientas || "Ninguna"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCompetencias("herramientas")}
                  style={{
                    width: "100%",
                    padding: "5px 10px",
                    borderRadius: 4,
                    backgroundColor: "#18202f",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Settings size={12} color="#94a3b8" />
                  Gestionar Herramientas
                </button>
              </div>
            </div>

            {/* SECCIÓN HABILIDADES (18) */}
            <div className={estilos.campoFormulario} style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sliders size={14} color="#94a3b8" />
                  <label className={estilos.labelFormulario} style={{ margin: 0, fontSize: 11, color: "#f1f5f9" }}>
                    Habilidades e Inspector de Desglose (18)
                  </label>
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  Clic en <Settings size={10} style={{ display: "inline-block" }} /> para ver desglose matemático o personalizar
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: 8
                }}
              >
                {HABILIDADES_LISTA.map(({ clave, nombre }) => {
                  const hab = clave as Habilidad;
                  const custom = form.personalizacionesHabilidades?.[hab];
                  const grado = form.gradosHabilidades?.[hab] || "ninguna";
                  const titulo = custom?.nombrePersonalizado || nombre;

                  const colorGrado =
                    grado === "pericia"
                      ? "#d8b4fe"
                      : grado === "competente"
                      ? "#93c5fd"
                      : grado === "medio"
                      ? "#86efac"
                      : "#64748b";

                  const etiquetaGrado =
                    grado === "pericia"
                      ? "Pericia (2x PB)"
                      : grado === "competente"
                      ? "Competente (1x PB)"
                      : grado === "medio"
                      ? "Medio bono"
                      : "Sin competencia";

                  return (
                    <div
                      key={hab}
                      className={estilos.neoRaised}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 11,
                        backgroundColor: "#111622",
                        border: "1px solid rgba(148, 163, 184, 0.12)"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{titulo}</span>
                        <span style={{ fontSize: 9, color: colorGrado, fontWeight: 600 }}>
                          {etiquetaGrado}
                          {custom?.modificadorExtra ? ` (+${custom.modificadorExtra})` : ""}
                          {custom?.valorFijo !== null && custom?.valorFijo !== undefined ? ` [Fijo: ${custom.valorFijo}]` : ""}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setHabilidadEnDetalle({ clave: hab, nombre })}
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          backgroundColor: "#18202f",
                          border: "1px solid rgba(148, 163, 184, 0.18)",
                          color: "#cbd5e1",
                          borderRadius: 4,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <Settings size={10} color="#94a3b8" />
                        Editar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}


        {/* PESTAÑA 4: SENTIDOS Y SALUD BASE */}
        {pestanaActiva === "sentidos" && (
          <>
            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>HP Máximo Base (Verdadero)</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.hpMaximoBase || 10}
                  onChange={(e) => {
                    const maxBaseVal = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setForm((prev) => ({
                      ...prev,
                      hpMaximoBase: maxBaseVal,
                      hpMaximo: maxBaseVal,
                      hpActual: Math.min(prev.hpActual, maxBaseVal)
                    }));
                  }}
                  min="1"
                  required
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Tipo de Dado de Golpe (Sugerencia)</label>
                <SelectorSugerencias
                  valor={form.tipoDadoGolpe}
                  alCambiar={(val) =>
                    actualizarCampo("tipoDadoGolpe", val as "d6" | "d8" | "d10" | "d12")
                  }
                  opciones={["d6", "d8", "d10", "d12", "d4", "d20"]}
                  placeholder="d6, d8, d10, d12..."
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Clase de Armadura (CA Base)</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.ca}
                  onChange={(e) => actualizarCampo("ca", parseInt(e.target.value, 10) || 10)}
                  min="1"
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Notas de CA</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={form.caNotas}
                  onChange={(e) => actualizarCampo("caNotas", e.target.value)}
                  placeholder="Ej. Cota de malla + Escudo"
                />
              </div>
            </div>

            <div className={estilos.filaFormulario}>
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Bonificador Extra de Iniciativa</label>
                <input
                  type="number"
                  className={estilos.inputFormulario}
                  value={form.iniciativaBono}
                  onChange={(e) =>
                    actualizarCampo("iniciativaBono", parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Velocidad Base</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={
                    typeof form.velocidad === "string"
                      ? form.velocidad
                      : `${form.velocidad.caminar} pies`
                  }
                  onChange={(e) => actualizarCampo("velocidad", e.target.value)}
                  placeholder="Ej. 30 pies, volar 60 pies"
                />
              </div>
            </div>

            <div className={estilos.campoFormulario}>
              <label className={estilos.labelFormulario}>Sentidos Especiales</label>
              <input
                type="text"
                className={estilos.inputFormulario}
                value={typeof form.sentidos === "string" ? form.sentidos : ""}
                onChange={(e) => actualizarCampo("sentidos", e.target.value)}
                placeholder="Ej. Visión en la oscuridad 60 pies"
              />
            </div>
          </>
        )}

        {/* Botones al pie del formulario */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            paddingTop: 14,
            marginTop: 8
          }}
        >
          <button type="button" className={estilos.neoButton} onClick={alVolverAFicha}>
            Cancelar y Volver
          </button>
          <button
            type="submit"
            className={estilos.neoButton}
            style={{
              backgroundColor: "#2563eb",
              borderColor: "#60a5fa",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Save size={14} />
            Guardar Cambios
          </button>
        </div>
      </form>

      {/* Modal Inspector / Personalización de Habilidad */}
      {habilidadEnDetalle && (
        <ModalDetalleHabilidad
          habilidadClave={habilidadEnDetalle.clave}
          nombreHabilidad={habilidadEnDetalle.nombre}
          personaje={form}
          alCerrar={() => setHabilidadEnDetalle(null)}
          alGuardarPersonalizacion={(hab, grado, personalizacion) => {
            setForm((prev) => ({
              ...prev,
              gradosHabilidades: {
                ...prev.gradosHabilidades,
                [hab]: grado
              },
              personalizacionesHabilidades: {
                ...prev.personalizacionesHabilidades,
                [hab]: {
                  ...(prev.personalizacionesHabilidades?.[hab] || {
                    modificadorExtra: 0,
                    valorFijo: null,
                    notas: ""
                  }),
                  ...personalizacion
                }
              }
            }));
            setHabilidadEnDetalle(null);
          }}
        />
      )}

      {/* Modal Selector de Competencias (Armas, Armaduras, Idiomas, Herramientas) */}
      {modalCompetencias && (
        <ModalSelectorCompetencias
          categoriaInicial={modalCompetencias}
          estadoInicial={{
            competenciasArmasGrupos: (form.competenciasArmasGrupos || []) as ("sencillas" | "marciales" | "fuego")[],
            competenciasArmasLista: form.competenciasArmasLista || [],
            competenciasArmadurasGrupos: (form.competenciasArmadurasGrupos || []) as ("ligeras" | "medias" | "pesadas" | "escudos")[],
            competenciasArmadurasLista: form.competenciasArmadurasLista || [],
            idiomasLista: form.idiomasLista || [],
            herramientasLista: form.herramientasLista || []
          }}
          alGuardar={manejarGuardarCompetencias}
          alCerrar={() => setModalCompetencias(null)}
        />
      )}

      {/* Modal Inspector / Personalización de Característica */}
      {caracteristicaEnDetalle && (
        <ModalDetalleCaracteristica
          caracteristicaClave={caracteristicaEnDetalle}
          personaje={form}
          alCerrar={() => setCaracteristicaEnDetalle(null)}
          alGuardar={manejarGuardarCaracteristica}
        />
      )}
    </div>
  );
};

export default PanelConfiguracionPersonaje;


