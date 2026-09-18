import React from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import styles from "./TrackerRecursoMagico.module.css";

export interface GrupoRanurasMagicas {
  id: string;
  etiqueta: string;
  badge?: string;
  max: number;
  gastados: number;
  alGastar?: () => void;
  alRecuperar?: () => void;
  colorTema?: string;
  colorTemaFondo?: string;
}

export interface TrackerRecursoMagicoProps {
  titulo: string;
  iconoColor?: string;
  grupos: GrupoRanurasMagicas[];
  alRestablecerTodos?: () => void;
  etiquetaRestablecer?: string;
  mostrarBotonRestablecer?: boolean;
  soloLectura?: boolean;
  pieDePagina?: string;
  modoGrid?: boolean;
  colorBordeContenedor?: string;
}

export const TrackerRecursoMagico: React.FC<TrackerRecursoMagicoProps> = ({
  titulo,
  iconoColor = "#818cf8",
  grupos,
  alRestablecerTodos,
  etiquetaRestablecer = "Restablecer",
  mostrarBotonRestablecer = false,
  soloLectura = false,
  pieDePagina,
  modoGrid = true
}) => {
  const gruposValidos = grupos.filter((g) => g.max > 0);

  if (gruposValidos.length === 0) {
    return null;
  }

  const esPacto = gruposValidos.some(
    (g) => g.id.toLowerCase().includes("pacto") || (g.colorTema && g.colorTema.toLowerCase().includes("c084fc"))
  );

  const grupoUnico = gruposValidos.length === 1 ? gruposValidos[0] : null;
  const disponiblesGrupoUnico = grupoUnico ? Math.max(0, grupoUnico.max - grupoUnico.gastados) : 0;

  return (
    <div
      className={styles.contenedorTracker}
      data-pacto={esPacto ? "true" : "false"}
    >
      {/* Cabecera del Tracker */}
      <div className={styles.cabeceraTracker}>
        <div className={styles.tituloFilaTracker}>
          <Sparkles size={15} color={iconoColor} />
          <span className={styles.tituloTextoTracker}>
            {titulo}
          </span>
          {grupoUnico && grupoUnico.badge && (
            <span className={styles.badgeGrupoUnico}>
              {grupoUnico.badge}
            </span>
          )}
        </div>

        <div className={styles.ladoDerechoCabecera}>
          {grupoUnico && (
            <div className={styles.marcadorRanurasUnico}>
              <span
                className={
                  disponiblesGrupoUnico <= 0
                    ? styles.ranurasAgotadasTexto
                    : esPacto
                      ? styles.ranurasDisponiblesPactoTexto
                      : styles.ranurasDisponiblesTexto
                }
              >
                {disponiblesGrupoUnico}
              </span>
              <span className={styles.ranurasMaxTexto}> / {grupoUnico.max} ranuras</span>
            </div>
          )}

          {mostrarBotonRestablecer && alRestablecerTodos && (
            <button
              type="button"
              onClick={alRestablecerTodos}
              title={`Restablecer todo: ${titulo}`}
              className={styles.botonRestablecerRanuras}
            >
              <RotateCcw size={11} />
              <span>{etiquetaRestablecer}</span>
            </button>
          )}
        </div>
      </div>

      {/* Renderizado de Grupos de Ranuras */}
      <div className={modoGrid ? styles.contenedorGruposGrid : styles.contenedorGruposFlex}>
        {gruposValidos.map((grupo) => {
          const disponibles = Math.max(0, grupo.max - grupo.gastados);
          const grupoEsPacto =
            esPacto ||
            grupo.id.toLowerCase().includes("pacto") ||
            (grupo.colorTema ? grupo.colorTema.toLowerCase().includes("c084fc") : false);

          return (
            <div key={grupo.id} className={styles.tarjetaGrupoRanura}>
              {modoGrid && (
                <div className={styles.cabeceraGrupoRanura}>
                  <span className={styles.etiquetaGrupoRanura}>{grupo.etiqueta}</span>
                  <span
                    className={styles.conteoGrupoRanura}
                    data-disponible={disponibles > 0 ? "true" : "false"}
                    data-pacto={grupoEsPacto ? "true" : "false"}
                  >
                    {disponibles}/{grupo.max}
                  </span>
                </div>
              )}

              {/* Círculos interactivos de ranura */}
              <div className={styles.filaRanurasCirculares}>
                {Array.from({ length: grupo.max }).map((_, idx) => {
                  const estaDisponible = idx < disponibles;
                  return (
                    <button
                      key={`${grupo.id}-slot-${idx}`}
                      type="button"
                      title={
                        soloLectura
                          ? estaDisponible
                            ? `${grupo.etiqueta}: disponible`
                            : `${grupo.etiqueta}: gastado`
                          : estaDisponible
                            ? `${grupo.etiqueta}: clic para gastar`
                            : `${grupo.etiqueta}: clic para recuperar`
                      }
                      onClick={() => {
                        if (soloLectura) return;
                        if (estaDisponible) {
                          grupo.alGastar?.();
                        } else {
                          grupo.alRecuperar?.();
                        }
                      }}
                      className={styles.botonRanuraCircular}
                      data-disponible={estaDisponible ? "true" : "false"}
                      data-pacto={grupoEsPacto ? "true" : "false"}
                      data-readonly={soloLectura ? "true" : "false"}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {pieDePagina && (
        <span className={styles.pieDePaginaTexto}>
          {pieDePagina}
        </span>
      )}
    </div>
  );
};
