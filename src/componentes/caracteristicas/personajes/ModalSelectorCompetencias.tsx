import React from "react";
import { Swords, Shield, Languages, Wrench, X, Search } from "lucide-react";
import {
  IDIOMAS_ESTANDAR,
  IDIOMAS_INUSUALES,
  HERRAMIENTAS_ARTESANO,
  OTRAS_HERRAMIENTAS,
  INSTRUMENTOS_MUSICALES,
  JUEGOS_MESA
} from "@/constantes";
import {
  usarSelectorCompetencias,
  CategoriaCompetencia,
  EstadoCompetenciasModal,
  ResultadoCompetenciasGuardadas
} from "./competencias/usarSelectorCompetencias";
import { PestanaArmasCompetencias } from "./competencias/PestanaArmasCompetencias";
import { PestanaArmadurasCompetencias } from "./competencias/PestanaArmadurasCompetencias";
import { PestanaListaSimpleCompetencias } from "./competencias/PestanaListaSimpleCompetencias";
import estilos from "./HojaPersonaje.module.css";

export type { CategoriaCompetencia, EstadoCompetenciasModal };

interface ModalSelectorCompetenciasProps {
  categoriaInicial?: CategoriaCompetencia;
  estadoInicial: EstadoCompetenciasModal;
  alGuardar: (nuevasCompetencias: ResultadoCompetenciasGuardadas) => void;
  alCerrar: () => void;
}

export const ModalSelectorCompetencias: React.FC<ModalSelectorCompetenciasProps> = ({
  categoriaInicial = "armas",
  estadoInicial,
  alGuardar,
  alCerrar
}) => {
  const {
    pestaña,
    setPestaña,
    filtroTexto,
    setFiltroTexto,
    armasGrupos,
    armasLista,
    armadurasGrupos,
    armadurasLista,
    idiomas,
    herramientas,
    alternarGrupoArmas,
    alternarArmaIndividual,
    alternarGrupoArmaduras,
    alternarArmaduraIndividual,
    alternarIdioma,
    alternarHerramienta,
    manejarGuardar
  } = usarSelectorCompetencias({
    categoriaInicial,
    estadoInicial,
    alGuardar,
    alCerrar
  });

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
            <h3 className={estilos.tituloModal}>Selector de Competencias</h3>
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
          {pestaña === "armas" && (
            <PestanaArmasCompetencias
              armasGrupos={armasGrupos}
              armasLista={armasLista}
              filtroTexto={filtroTexto}
              alternarGrupoArmas={alternarGrupoArmas}
              alternarArmaIndividual={alternarArmaIndividual}
            />
          )}

          {pestaña === "armaduras" && (
            <PestanaArmadurasCompetencias
              armadurasGrupos={armadurasGrupos}
              armadurasLista={armadurasLista}
              filtroTexto={filtroTexto}
              alternarGrupoArmaduras={alternarGrupoArmaduras}
              alternarArmaduraIndividual={alternarArmaduraIndividual}
            />
          )}

          {pestaña === "idiomas" && (
            <PestanaListaSimpleCompetencias
              titulo="Idiomas Estándar e Inusuales"
              itemsDisponibles={[...IDIOMAS_ESTANDAR, ...IDIOMAS_INUSUALES]}
              itemsSeleccionados={idiomas}
              filtroTexto={filtroTexto}
              alternarItem={alternarIdioma}
              anchoMinimoColumna={150}
            />
          )}

          {pestaña === "herramientas" && (
            <PestanaListaSimpleCompetencias
              titulo="Herramientas, Instrumentos y Juegos"
              itemsDisponibles={[
                ...HERRAMIENTAS_ARTESANO,
                ...OTRAS_HERRAMIENTAS,
                ...INSTRUMENTOS_MUSICALES,
                ...JUEGOS_MESA
              ]}
              itemsSeleccionados={herramientas}
              filtroTexto={filtroTexto}
              alternarItem={alternarHerramienta}
              anchoMinimoColumna={170}
            />
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
