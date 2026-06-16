import React from "react";
import { Swords } from "lucide-react";
import { MonstruoBase, HechizoBase } from "../../tipos";
import { formatearVelocidad, formatearSentidos } from "../../almacen/sanitizacion";
import { procesarTextoFicha } from "./procesadorTexto";
import estilosClases from "./PanelFichaDnD.module.css";

interface PanelFichaDnDProps {
  criaturaNombre: string;
  plantilla: MonstruoBase;
  baseDatosHechizos: HechizoBase[];
  alHacerClicHechizo: (hechizo: HechizoBase) => void;
  lanzarAtaqueRapido: (
    criaturaNombre: string,
    ataqueNombre: string,
    bonoAtaqueStr: string,
    dadosDaño: string,
    tipoDaño: string
  ) => void;
  lanzarTiradaD20Interactiva: (criaturaNombre: string, etiqueta: string, bonificador: number) => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
}

const NOMBRES_HABILIDADES: Record<string, string> = {
  acrobacias: "Acrobacias",
  manejoAnimales: "Manejo de Animales",
  arcanos: "Arcanos",
  atletismo: "Atletismo",
  engaño: "Engaño",
  historia: "Historia",
  perspicacia: "Perspicacia",
  intimidacion: "Intimidación",
  investigacion: "Investigación",
  medicina: "Medicina",
  naturaleza: "Naturaleza",
  percepcion: "Percepción",
  interpretacion: "Interpretación",
  persuasion: "Persuasión",
  religion: "Religión",
  juegoManos: "Juego de Manos",
  sigilo: "Sigilo",
  supervivencia: "Supervivencia"
};

export const PanelFichaDnD: React.FC<PanelFichaDnDProps> = ({
  criaturaNombre,
  plantilla,
  baseDatosHechizos,
  alHacerClicHechizo,
  lanzarAtaqueRapido,
  lanzarTiradaD20Interactiva,
  obtenerPercepcionPasiva
}) => {
  const renderizarDefensa = (etiqueta: string, valor: string[] | string | undefined) => {
    if (!valor) return null;
    const items = Array.isArray(valor) ? valor : [valor];
    const filtrados = items.map(x => String(x).trim()).filter(Boolean);
    if (filtrados.length === 0) return null;
    return (
      <div className={estilosClases.lineaMetaFicha}>
        <strong style={{ color: "var(--color-exito)" }}>{etiqueta.toUpperCase()}:</strong> {filtrados.join(", ")}
      </div>
    );
  };

  const calcularModificador = (valor: number): string => {
    const mod = Math.floor((valor - 10) / 2);
    return `${mod >= 0 ? "+" : ""}${mod}`;
  };

  return (
    <div className={estilosClases.cajaFichaEstadisticasDnd}>
      <div className={estilosClases.seccionesFichaLayout}>
        {/* Cabecera del Monstruo */}
        <div className={estilosClases.tituloCabeceraDetalle}>
          <span className={estilosClases.nombreMonstruoFicha}>{plantilla.nombre.toUpperCase()}</span>
          <span className={estilosClases.tipoMonstruoFicha}>
            {plantilla.tipo} | CR: <strong style={{ color: "var(--color-advertencia)" }}>{plantilla.desafio}</strong> | PP: <strong style={{ color: "var(--color-borde-cian)" }}>{obtenerPercepcionPasiva(plantilla)}</strong>
          </span>
        </div>
        
        {/* Rejilla de Características */}
        <div className={`${estilosClases.subtituloFichaSection} ${estilosClases.subtituloPruebas}`} style={{ marginTop: "4px" }}>
          PRUEBAS DE CARACTERÍSTICA
        </div>
        <div className={estilosClases.cajaAtributosGrid}>
          {Object.entries(plantilla.caracteristicas).map(([clave, valor]) => {
            const modStr = calcularModificador(valor);
            const etiqueta = clave.substring(0, 3).toUpperCase();
            return (
              <div
                key={clave}
                onClick={() => lanzarTiradaD20Interactiva(criaturaNombre, `Prueba de ${etiqueta}`, parseInt(modStr, 10))}
                className={estilosClases.cajaAtributoPurple}
                title={`Tirar tirada 3D de prueba de habilidad de ${clave.toUpperCase()}`}
              >
                <span className={estilosClases.atributoEtiquetaName}>{etiqueta}</span>
                <span className={estilosClases.atributoValorNum}>{valor}</span>
                <span className={estilosClases.atributoModSign}>{modStr}</span>
              </div>
            );
          })}
        </div>

        {/* Rejilla de Tiradas de Salvación */}
        <div className={`${estilosClases.subtituloFichaSection} ${estilosClases.subtituloSalvaciones}`} style={{ marginTop: "4px" }}>
          TIRADAS DE SALVACIÓN
        </div>
        <div className={estilosClases.cajaAtributosGrid}>
          {Object.entries(plantilla.caracteristicas).map(([clave, valor]) => {
            const modBasico = Math.floor((valor - 10) / 2);
            
            // Verificar si hay salvación explícita
            const tieneSalvacionEspecial = !!(plantilla.salvaciones && 
              plantilla.salvaciones[clave as keyof typeof plantilla.salvaciones] !== undefined);
            
            const modSalvacion = tieneSalvacionEspecial
              ? (plantilla.salvaciones![clave as keyof typeof plantilla.salvaciones] ?? modBasico)
              : modBasico;
            
            const modSalvacionStr = `${modSalvacion >= 0 ? "+" : ""}${modSalvacion}`;
            const etiqueta = clave.substring(0, 3).toUpperCase();
            
            return (
              <div
                key={`salv-${clave}`}
                onClick={() => lanzarTiradaD20Interactiva(criaturaNombre, `Salvación de ${etiqueta}`, modSalvacion)}
                className={`${estilosClases.cajaAtributoPurple} ${
                  tieneSalvacionEspecial ? estilosClases.cajaAtributoSalvacionEntrenada : ""
                }`}
                title={`Tirar tirada 3D de salvación de ${clave.toUpperCase()}${tieneSalvacionEspecial ? " (Entrenada)" : ""}`}
              >
                <span
                  className={`${estilosClases.atributoEtiquetaName} ${
                    tieneSalvacionEspecial ? estilosClases.atributoEtiquetaSalvacionEntrenada : ""
                  }`}
                >
                  {etiqueta}
                </span>
                <span className={estilosClases.atributoValorNum}>{tieneSalvacionEspecial ? "★" : " "}</span>
                <span
                  className={`${estilosClases.atributoModSign} ${
                    tieneSalvacionEspecial ? estilosClases.atributoModSalvacionEntrenada : ""
                  }`}
                >
                  {modSalvacionStr}
                </span>
              </div>
            );
          })}
        </div>

        {/* Habilidades */}
        {(() => {
          const habilidadesFiltradas = Object.entries(plantilla.habilidades || {})
            .filter(([_, valor]) => valor !== undefined) as [string, number][];
          if (habilidadesFiltradas.length === 0) return null;
          return (
            <>
              <div className={estilosClases.subtituloFichaSection} style={{ marginTop: "4px" }}>
                HABILIDADES
              </div>
              <div className={estilosClases.cajaHabilidadesGrid}>
                {habilidadesFiltradas.map(([clave, valor]) => {
                  const nombreLegible = NOMBRES_HABILIDADES[clave] || clave;
                  const bonifStr = `${valor >= 0 ? "+" : ""}${valor}`;
                  return (
                    <div
                      key={clave}
                      onClick={() => lanzarTiradaD20Interactiva(criaturaNombre, `Prueba de ${nombreLegible}`, valor)}
                      className={estilosClases.chipHabilidadInteractiva}
                      title={`Tirar tirada 3D de habilidad de ${nombreLegible}`}
                    >
                      <span className={estilosClases.habilidadNombre}>{nombreLegible}</span>
                      <span className={estilosClases.habilidadBono}>{bonifStr}</span>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* Datos Básicos y Defensas */}
        <div className={estilosClases.cajaMetadatosFichaExtra}>
          <div className={estilosClases.lineaMetaFicha}>
            <strong style={{ color: "var(--color-texto-secundario)" }}>ARMADURA (CA):</strong> <strong style={{ color: "var(--color-borde-cian)" }}>{plantilla.ca}</strong> {plantilla.caNotas ? `(${plantilla.caNotas})` : ""}
          </div>
          <div className={estilosClases.lineaMetaFicha}>
            <strong style={{ color: "var(--color-texto-secundario)" }}>VELOCIDAD:</strong> {formatearVelocidad(plantilla.velocidad)}
          </div>
          {plantilla.sentidos && (
            <div className={estilosClases.lineaMetaFicha}>
              <strong style={{ color: "var(--color-texto-secundario)" }}>SENTIDOS:</strong> {formatearSentidos(plantilla.sentidos)}
            </div>
          )}
          {plantilla.idiomas && (
            <div className={estilosClases.lineaMetaFicha}>
              <strong style={{ color: "var(--color-texto-secundario)" }}>IDIOMAS:</strong> {plantilla.idiomas}
            </div>
          )}
          {renderizarDefensa("Vulnerabilidades", plantilla.vulnerabilidades)}
          {renderizarDefensa("Resistencias", plantilla.resistencias)}
          {renderizarDefensa("Inmunidades al daño", plantilla.inmunidadesDaño)}
          {renderizarDefensa("Inmunidades a estados", plantilla.inmunidadesCondicion)}
        </div>

        {/* Rasgos Pasivos */}
        {plantilla.rasgos && plantilla.rasgos.length > 0 && (
          <div className={estilosClases.cajaListaRasgosFicha}>
            <div className={estilosClases.subtituloFichaSection}>RASGOS PASIVOS</div>
            {plantilla.rasgos.map((rasgo, i) => (
              <div key={i} className={estilosClases.itemRasgoFichaTexto}>
                <strong style={{ color: "#ffcc00" }}>{rasgo.nombre}:</strong> {procesarTextoFicha(rasgo.descripcion, `${criaturaNombre} - ${rasgo.nombre}`, baseDatosHechizos, alHacerClicHechizo)}
              </div>
            ))}
          </div>
        )}

        {/* Acciones */}
        {plantilla.acciones && plantilla.acciones.length > 0 && (
          <div className={estilosClases.cajaListaAccionesFicha}>
            <div className={estilosClases.subtituloFichaSection}>ACCIONES</div>
            {plantilla.acciones.map((acc, i) => {
              const esAtaque = acc.bonificadorAtaque !== undefined && acc.daño !== undefined;
              return (
                <div key={i} className={estilosClases.tarjetaAccionPurple}>
                  <div className={estilosClases.cabeceraAccionTarjeta}>
                    <span className={estilosClases.nombreAccionTarjeta}>{acc.nombre.toUpperCase()}</span>
                    {esAtaque && (
                      <button
                        onClick={() => lanzarAtaqueRapido(criaturaNombre, acc.nombre, `${(acc.bonificadorAtaque ?? 0) >= 0 ? "+" : ""}${acc.bonificadorAtaque ?? 0}`, acc.daño || "1d6", "físico")}
                        className={estilosClases.botonAccionAtaqueLanzar}
                      >
                        <Swords size={10} />
                        <span>TIRAR 3D</span>
                      </button>
                    )}
                  </div>
                  <div className={estilosClases.descAccionTarjeta}>
                    {procesarTextoFicha(acc.descripcion, `${criaturaNombre} - ${acc.nombre}`, baseDatosHechizos, alHacerClicHechizo)}
                    {esAtaque && (
                      <span className={estilosClases.detallesAtaqueMetaInline}>
                        [ +{acc.bonificadorAtaque} Al Impacto | Daño: {acc.daño} ]
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reacciones */}
        {plantilla.reacciones && plantilla.reacciones.length > 0 && (
          <div className={estilosClases.cajaListaAccionesFicha}>
            <div className={`${estilosClases.subtituloFichaSection} ${estilosClases.subtituloReacciones}`}>REACCIONES</div>
            {plantilla.reacciones.map((reac, i) => (
              <div key={i} className={estilosClases.tarjetaAccionPurple}>
                <div className={estilosClases.cabeceraAccionTarjeta}>
                  <span className={`${estilosClases.nombreAccionTarjeta} ${estilosClases.nombreAccionReacion}`}>{reac.nombre.toUpperCase()}</span>
                </div>
                <div className={estilosClases.descAccionTarjeta}>
                  {procesarTextoFicha(reac.descripcion, `${criaturaNombre} - ${reac.nombre}`, baseDatosHechizos, alHacerClicHechizo)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Acciones Legendarias */}
        {plantilla.accionesLegendarias && plantilla.accionesLegendarias.length > 0 && (
          <div className={estilosClases.cajaListaAccionesFicha}>
            <div className={`${estilosClases.subtituloFichaSection} ${estilosClases.subtituloLegendarias}`}>ACCIONES LEGENDARIAS</div>
            {plantilla.accionesLegendarias.map((leg, i) => (
              <div key={i} className={estilosClases.tarjetaAccionPurple}>
                <div className={estilosClases.cabeceraAccionTarjeta}>
                  <span className={`${estilosClases.nombreAccionTarjeta} ${estilosClases.nombreAccionLegendaria}`}>{leg.nombre.toUpperCase()}</span>
                </div>
                <div className={estilosClases.descAccionTarjeta}>
                  {procesarTextoFicha(leg.descripcion, `${criaturaNombre} - ${leg.nombre}`, baseDatosHechizos, alHacerClicHechizo)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
