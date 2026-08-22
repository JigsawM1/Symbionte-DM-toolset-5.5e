import React, { useState } from "react";
import {
  GRUPOS_ARMAS,
  TODAS_ARMAS_SENCILLAS,
  TODAS_ARMAS_MARCIALES,
  ARMAS_DE_FUEGO,
  GRUPOS_ARMADURAS,
  ARMADURAS_LIGERAS,
  ARMADURAS_MEDIAS,
  ARMADURAS_PESADAS,
  ESCUDOS,
  IDIOMAS_ESTANDAR,
  IDIOMAS_INUSUALES,
  HERRAMIENTAS_ARTESANO,
  OTRAS_HERRAMIENTAS,
  INSTRUMENTOS_MUSICALES,
  JUEGOS_MESA,
  formatearResumenCompetenciasArmas,
  formatearResumenCompetenciasArmaduras
} from "@/constantes";
import { Swords, Shield, Languages, Wrench, X, Search, CheckSquare, Square } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

export type CategoriaCompetencia = "armas" | "armaduras" | "idiomas" | "herramientas";

export interface EstadoCompetenciasModal {
  competenciasArmasGrupos: ("sencillas" | "marciales" | "fuego")[];
  competenciasArmasLista: string[];
  competenciasArmadurasGrupos: ("ligeras" | "medias" | "pesadas" | "escudos")[];
  competenciasArmadurasLista: string[];
  idiomasLista: string[];
  herramientasLista: string[];
}

interface ModalSelectorCompetenciasProps {
  categoriaInicial?: CategoriaCompetencia;
  estadoInicial: EstadoCompetenciasModal;
  alGuardar: (nuevasCompetencias: {
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
  }) => void;
  alCerrar: () => void;
}

export const ModalSelectorCompetencias: React.FC<ModalSelectorCompetenciasProps> = ({
  categoriaInicial = "armas",
  estadoInicial,
  alGuardar,
  alCerrar
}) => {
  const [pestaña, setPestaña] = useState<CategoriaCompetencia>(categoriaInicial);
  const [filtroTexto, setFiltroTexto] = useState("");

  // Estado local para edición antes de guardar
  const [armasGrupos, setArmasGrupos] = useState<("sencillas" | "marciales" | "fuego")[]>(
    estadoInicial.competenciasArmasGrupos || []
  );
  const [armasLista, setArmasLista] = useState<string[]>(
    estadoInicial.competenciasArmasLista || []
  );
  const [armadurasGrupos, setArmadurasGrupos] = useState<("ligeras" | "medias" | "pesadas" | "escudos")[]>(
    estadoInicial.competenciasArmadurasGrupos || []
  );
  const [armadurasLista, setArmadurasLista] = useState<string[]>(
    estadoInicial.competenciasArmadurasLista || []
  );
  const [idiomas, setIdiomas] = useState<string[]>(estadoInicial.idiomasLista || []);
  const [herramientas, setHerramientas] = useState<string[]>(estadoInicial.herramientasLista || []);

  // -------------------------------------------------------------
  // LÓGICA DE ARMAS
  // -------------------------------------------------------------
  const alternarGrupoArmas = (grupoId: "sencillas" | "marciales" | "fuego") => {
    const yaSeleccionado = armasGrupos.includes(grupoId);
    const nuevosGrupos = yaSeleccionado
      ? armasGrupos.filter((g) => g !== grupoId)
      : [...armasGrupos, grupoId];

    let nuevaLista = [...armasLista];
    let armasDelGrupo: readonly string[] = [];
    if (grupoId === "sencillas") armasDelGrupo = TODAS_ARMAS_SENCILLAS;
    else if (grupoId === "marciales") armasDelGrupo = TODAS_ARMAS_MARCIALES;
    else if (grupoId === "fuego") armasDelGrupo = ARMAS_DE_FUEGO;

    if (yaSeleccionado) {
      nuevaLista = nuevaLista.filter((a) => !armasDelGrupo.includes(a as any));
    } else {
      for (const arma of armasDelGrupo) {
        if (!nuevaLista.includes(arma)) {
          nuevaLista.push(arma);
        }
      }
    }

    setArmasGrupos(nuevosGrupos);
    setArmasLista(nuevaLista);
  };

  const alternarArmaIndividual = (arma: string) => {
    let nuevaLista = [...armasLista];
    if (nuevaLista.includes(arma)) {
      nuevaLista = nuevaLista.filter((a) => a !== arma);
    } else {
      nuevaLista.push(arma);
    }

    const nuevosGrupos = [...armasGrupos];
    const todasSencillas = TODAS_ARMAS_SENCILLAS.every((a) => nuevaLista.includes(a));
    if (todasSencillas && !nuevosGrupos.includes("sencillas")) nuevosGrupos.push("sencillas");
    else if (!todasSencillas && nuevosGrupos.includes("sencillas")) {
      const idx = nuevosGrupos.indexOf("sencillas");
      if (idx !== -1) nuevosGrupos.splice(idx, 1);
    }

    const todasMarciales = TODAS_ARMAS_MARCIALES.every((a) => nuevaLista.includes(a));
    if (todasMarciales && !nuevosGrupos.includes("marciales")) nuevosGrupos.push("marciales");
    else if (!todasMarciales && nuevosGrupos.includes("marciales")) {
      const idx = nuevosGrupos.indexOf("marciales");
      if (idx !== -1) nuevosGrupos.splice(idx, 1);
    }

    const todasFuego = ARMAS_DE_FUEGO.every((a) => nuevaLista.includes(a));
    if (todasFuego && !nuevosGrupos.includes("fuego")) nuevosGrupos.push("fuego");
    else if (!todasFuego && nuevosGrupos.includes("fuego")) {
      const idx = nuevosGrupos.indexOf("fuego");
      if (idx !== -1) nuevosGrupos.splice(idx, 1);
    }

    setArmasGrupos(nuevosGrupos);
    setArmasLista(nuevaLista);
  };

  // -------------------------------------------------------------
  // LÓGICA DE ARMADURAS
  // -------------------------------------------------------------
  const alternarGrupoArmaduras = (grupoId: "ligeras" | "medias" | "pesadas" | "escudos") => {
    const yaSeleccionado = armadurasGrupos.includes(grupoId);
    const nuevosGrupos = yaSeleccionado
      ? armadurasGrupos.filter((g) => g !== grupoId)
      : [...armadurasGrupos, grupoId];

    let nuevaLista = [...armadurasLista];
    let armadurasDelGrupo: readonly string[] = [];
    if (grupoId === "ligeras") armadurasDelGrupo = ARMADURAS_LIGERAS;
    else if (grupoId === "medias") armadurasDelGrupo = ARMADURAS_MEDIAS;
    else if (grupoId === "pesadas") armadurasDelGrupo = ARMADURAS_PESADAS;
    else if (grupoId === "escudos") armadurasDelGrupo = ESCUDOS;

    if (yaSeleccionado) {
      nuevaLista = nuevaLista.filter((a) => !armadurasDelGrupo.includes(a as any));
    } else {
      for (const arm of armadurasDelGrupo) {
        if (!nuevaLista.includes(arm)) {
          nuevaLista.push(arm);
        }
      }
    }

    setArmadurasGrupos(nuevosGrupos);
    setArmadurasLista(nuevaLista);
  };

  const alternarArmaduraIndividual = (armadura: string) => {
    let nuevaLista = [...armadurasLista];
    if (nuevaLista.includes(armadura)) {
      nuevaLista = nuevaLista.filter((a) => a !== armadura);
    } else {
      nuevaLista.push(armadura);
    }

    const nuevosGrupos = [...armadurasGrupos];
    const todasLigeras = ARMADURAS_LIGERAS.every((a) => nuevaLista.includes(a as any));
    if (todasLigeras && !nuevosGrupos.includes("ligeras")) nuevosGrupos.push("ligeras");
    else if (!todasLigeras && nuevosGrupos.includes("ligeras")) {
      const idx = nuevosGrupos.indexOf("ligeras");
      if (idx !== -1) nuevosGrupos.splice(idx, 1);
    }

    const todasMedias = ARMADURAS_MEDIAS.every((a) => nuevaLista.includes(a as any));
    if (todasMedias && !nuevosGrupos.includes("medias")) nuevosGrupos.push("medias");
    else if (!todasMedias && nuevosGrupos.includes("medias")) {
      const idx = nuevosGrupos.indexOf("medias");
      if (idx !== -1) nuevosGrupos.splice(idx, 1);
    }

    const todasPesadas = ARMADURAS_PESADAS.every((a) => nuevaLista.includes(a as any));
    if (todasPesadas && !nuevosGrupos.includes("pesadas")) nuevosGrupos.push("pesadas");
    else if (!todasPesadas && nuevosGrupos.includes("pesadas")) {
      const idx = nuevosGrupos.indexOf("pesadas");
      if (idx !== -1) nuevosGrupos.splice(idx, 1);
    }

    const todosEscudos = ESCUDOS.every((a) => nuevaLista.includes(a as any));
    if (todosEscudos && !nuevosGrupos.includes("escudos")) nuevosGrupos.push("escudos");
    else if (!todosEscudos && nuevosGrupos.includes("escudos")) {
      const idx = nuevosGrupos.indexOf("escudos");
      if (idx !== -1) nuevosGrupos.splice(idx, 1);
    }

    setArmadurasGrupos(nuevosGrupos);
    setArmadurasLista(nuevaLista);
  };

  // -------------------------------------------------------------
  // LÓGICA DE IDIOMAS Y HERRAMIENTAS
  // -------------------------------------------------------------
  const alternarIdioma = (idioma: string) => {
    setIdiomas((prev) =>
      prev.includes(idioma) ? prev.filter((i) => i !== idioma) : [...prev, idioma]
    );
  };

  const alternarHerramienta = (herramienta: string) => {
    setHerramientas((prev) =>
      prev.includes(herramienta) ? prev.filter((h) => h !== herramienta) : [...prev, herramienta]
    );
  };

  // -------------------------------------------------------------
  // GUARDAR
  // -------------------------------------------------------------
  const manejarGuardar = () => {
    const resumenArmas = formatearResumenCompetenciasArmas(armasGrupos, armasLista);
    const resumenArmaduras = formatearResumenCompetenciasArmaduras(
      armadurasGrupos,
      armadurasLista
    );
    const resumenIdiomas = idiomas.join(", ");
    const resumenHerramientas = herramientas.join(", ");

    alGuardar({
      competenciasArmasGrupos: armasGrupos,
      competenciasArmasLista: armasLista,
      competenciasArmas: resumenArmas,
      competenciasArmadurasGrupos: armadurasGrupos,
      competenciasArmadurasLista: armadurasLista,
      competenciasArmaduras: resumenArmaduras,
      idiomasLista: idiomas,
      idiomas: resumenIdiomas,
      herramientasLista: herramientas,
      herramientas: resumenHerramientas
    });
    alCerrar();
  };

  const filtro = filtroTexto.trim().toLowerCase();

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div
        className={estilos.contenedorModal}
        style={{ maxWidth: 620, width: "95%", height: "82vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className={estilos.cabeceraModal}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}></span>
            <h3 className={estilos.tituloModal}>Selector de Competencias D&D 5.5e</h3>
          </div>
          <button
            type="button"
            className={estilos.botonCerrar}
            onClick={alCerrar}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pestañas de Categoría */}
        <div className={estilos.barraPestañasModal}>
          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestaña === "armas" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestaña("armas")}
          >
            <Swords size={13} style={{ marginRight: 4 }} />
            Armas ({armasLista.length})
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestaña === "armaduras" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestaña("armaduras")}
          >
            <Shield size={13} style={{ marginRight: 4 }} />
            Armaduras ({armadurasLista.length})
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestaña === "idiomas" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestaña("idiomas")}
          >
            <Languages size={13} style={{ marginRight: 4 }} />
            Idiomas ({idiomas.length})
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestaña === "herramientas" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestaña("herramientas")}
          >
            <Wrench size={13} style={{ marginRight: 4 }} />
            Herramientas ({herramientas.length})
          </button>
        </div>

        {/* Buscador / Filtro Rápido */}
        <div style={{ padding: "8px 14px", backgroundColor: "#0e131d", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={14} color="#64748b" style={{ position: "absolute", left: 10 }} />
            <input
              type="text"
              className={estilos.inputFormulario}
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar en esta categoría..."
              style={{ width: "100%", paddingLeft: 30, fontSize: 11 }}
            />
            {filtroTexto && (
              <button
                type="button"
                onClick={() => setFiltroTexto("")}
                style={{
                  position: "absolute",
                  right: 8,
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer"
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Contenido según la Pestaña Activa */}
        <div className={estilos.contenidoPestañaModal} style={{ gap: 14 }}>
          {/* 1. ARMAS */}
          {pestaña === "armas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Checkboxes maestros */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>Grupos Maestros de Armas</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {GRUPOS_ARMAS.map((g) => {
                    const check = armasGrupos.includes(g.id as ("sencillas" | "marciales" | "fuego"));
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => alternarGrupoArmas(g.id as ("sencillas" | "marciales" | "fuego"))}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          color: check ? "#f1f5f9" : "#94a3b8",
                          border: check ? "1px solid rgba(148, 163, 184, 0.3)" : "1px solid rgba(148, 163, 184, 0.12)",
                          backgroundColor: check ? "#18202e" : "#111622"
                        }}
                      >
                        {check ? <CheckSquare size={14} color="#93c5fd" /> : <Square size={14} color="#64748b" />}
                        <span>{g.etiqueta}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Armas Individuales */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
                  Armas Individuales ({armasLista.length} seleccionadas)
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 6,
                    padding: 8,
                    backgroundColor: "#0d121c",
                    borderRadius: 6,
                    border: "1px solid rgba(148, 163, 184, 0.12)"
                  }}
                >
                  {[...TODAS_ARMAS_SENCILLAS, ...TODAS_ARMAS_MARCIALES, ...ARMAS_DE_FUEGO]
                    .filter((a) => (filtro ? a.toLowerCase().includes(filtro) : true))
                    .map((arma) => {
                      const check = armasLista.includes(arma);
                      return (
                        <label
                          key={arma}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 6px",
                            borderRadius: 4,
                            backgroundColor: check ? "rgba(148, 163, 184, 0.08)" : "transparent",
                            color: check ? "#f1f5f9" : "#94a3b8",
                            cursor: "pointer",
                            fontSize: 11,
                            userSelect: "none"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={check}
                            onChange={() => alternarArmaIndividual(arma)}
                          />
                          <span>{arma}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* 2. ARMADURAS */}
          {pestaña === "armaduras" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Checkboxes maestros */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>Categorías Maestras de Armadura</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {GRUPOS_ARMADURAS.map((g) => {
                    const check = armadurasGrupos.includes(g.id as ("ligeras" | "medias" | "pesadas" | "escudos"));
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => alternarGrupoArmaduras(g.id as ("ligeras" | "medias" | "pesadas" | "escudos"))}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                          color: check ? "#f1f5f9" : "#94a3b8",
                          border: check ? "1px solid rgba(148, 163, 184, 0.3)" : "1px solid rgba(148, 163, 184, 0.12)",
                          backgroundColor: check ? "#18202e" : "#111622"
                        }}
                      >
                        {check ? <CheckSquare size={14} color="#93c5fd" /> : <Square size={14} color="#64748b" />}
                        <span>{g.etiqueta}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Armaduras Individuales */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
                  Armaduras y Escudos ({armadurasLista.length} seleccionadas)
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                    gap: 6,
                    padding: 8,
                    backgroundColor: "#0d121c",
                    borderRadius: 6,
                    border: "1px solid rgba(148, 163, 184, 0.12)"
                  }}
                >
                  {[...ARMADURAS_LIGERAS, ...ARMADURAS_MEDIAS, ...ARMADURAS_PESADAS, ...ESCUDOS]
                    .filter((a) => (filtro ? a.toLowerCase().includes(filtro) : true))
                    .map((armadura) => {
                      const check = armadurasLista.includes(armadura);
                      return (
                        <label
                          key={armadura}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 6px",
                            borderRadius: 4,
                            backgroundColor: check ? "rgba(148, 163, 184, 0.08)" : "transparent",
                            color: check ? "#f1f5f9" : "#94a3b8",
                            cursor: "pointer",
                            fontSize: 11,
                            userSelect: "none"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={check}
                            onChange={() => alternarArmaduraIndividual(armadura)}
                          />
                          <span>{armadura}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* 3. IDIOMAS */}
          {pestaña === "idiomas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
                  Idiomas Estándar e Inusuales ({idiomas.length} seleccionados)
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 6,
                    padding: 8,
                    backgroundColor: "#0d121c",
                    borderRadius: 6,
                    border: "1px solid rgba(148, 163, 184, 0.12)"
                  }}
                >
                  {[...IDIOMAS_ESTANDAR, ...IDIOMAS_INUSUALES]
                    .filter((i) => (filtro ? i.toLowerCase().includes(filtro) : true))
                    .map((idioma) => {
                      const check = idiomas.includes(idioma);
                      return (
                        <label
                          key={idioma}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 6px",
                            borderRadius: 4,
                            backgroundColor: check ? "rgba(148, 163, 184, 0.08)" : "transparent",
                            color: check ? "#f1f5f9" : "#94a3b8",
                            cursor: "pointer",
                            fontSize: 11,
                            userSelect: "none"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={check}
                            onChange={() => alternarIdioma(idioma)}
                          />
                          <span>{idioma}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* 4. HERRAMIENTAS */}
          {pestaña === "herramientas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className={estilos.labelFormulario} style={{ color: "#94a3b8" }}>
                  Herramientas, Instrumentos y Juegos ({herramientas.length} seleccionadas)
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                    gap: 6,
                    padding: 8,
                    backgroundColor: "#0d121c",
                    borderRadius: 6,
                    border: "1px solid rgba(148, 163, 184, 0.12)"
                  }}
                >
                  {[
                    ...HERRAMIENTAS_ARTESANO,
                    ...OTRAS_HERRAMIENTAS,
                    ...INSTRUMENTOS_MUSICALES,
                    ...JUEGOS_MESA
                  ]
                    .filter((h) => (filtro ? h.toLowerCase().includes(filtro) : true))
                    .map((herramienta) => {
                      const check = herramientas.includes(herramienta);
                      return (
                        <label
                          key={herramienta}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 6px",
                            borderRadius: 4,
                            backgroundColor: check ? "rgba(148, 163, 184, 0.08)" : "transparent",
                            color: check ? "#f1f5f9" : "#94a3b8",
                            cursor: "pointer",
                            fontSize: 11,
                            userSelect: "none"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={check}
                            onChange={() => alternarHerramienta(herramienta)}
                          />
                          <span>{herramienta}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Pie del Modal */}
        <div className={estilos.pieModal}>
          <button type="button" className={estilos.neoButton} onClick={alCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className={estilos.neoButton}
            onClick={manejarGuardar}
            style={{
              backgroundColor: "#1e293b",
              borderColor: "rgba(96, 165, 250, 0.4)",
              color: "#93c5fd",
              fontWeight: 700
            }}
          >
            Aplicar Cambios
          </button>

        </div>
      </div>
    </div>
  );
};

export default ModalSelectorCompetencias;
