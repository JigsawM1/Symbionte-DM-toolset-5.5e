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
import estilosCompetencias from "./competencias/SelectorCompetencias.module.css";

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
        className={`${estilos.contenedorModal} ${estilosCompetencias.cuerpoModalCompetencias}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className={estilos.cabeceraModal}>
          <div className={estilosCompetencias.cabeceraModalTitulo}>
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
            <Swords size={13} className={estilosCompetencias.iconoPestana} />
            Armas ({armasLista.length})
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestaña === "armaduras" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestaña("armaduras")}
          >
            <Shield size={13} className={estilosCompetencias.iconoPestana} />
            Armaduras ({armadurasLista.length})
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestaña === "idiomas" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestaña("idiomas")}
          >
            <Languages size={13} className={estilosCompetencias.iconoPestana} />
            Idiomas ({idiomas.length})
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestaña === "herramientas" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestaña("herramientas")}
          >
            <Wrench size={13} className={estilosCompetencias.iconoPestana} />
            Herramientas ({herramientas.length})
          </button>
        </div>

        {/* Buscador / Filtro Rápido */}
        <div className={estilosCompetencias.barraBuscadorCompetencias}>
          <div className={estilosCompetencias.contenedorInputBuscador}>
            <Search size={14} color="#64748b" className={estilosCompetencias.iconoBuscadorLupa} />
            <input
              type="text"
              className={`${estilos.inputFormulario} ${estilosCompetencias.inputBuscadorCompetencias}`}
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar en esta categoría..."
            />
            {filtroTexto && (
              <button
                type="button"
                onClick={() => setFiltroTexto("")}
                className={estilosCompetencias.botonLimpiarBuscador}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Contenido según la Pestaña Activa */}
        <div className={`${estilos.contenidoPestañaModal} ${estilosCompetencias.cuerpoContenidoModal}`}>
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
            className={`${estilos.neoButton} ${estilosCompetencias.botonGuardarModal}`}
            onClick={manejarGuardar}
          >
            Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSelectorCompetencias;
