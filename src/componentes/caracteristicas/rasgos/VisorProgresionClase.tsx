import React from "react";
import { Swords, CheckCircle2 } from "lucide-react";
import type { RasgoPersonaje, DefinicionClase, DefinicionSubclase } from "@/tipos";
import { renderizarTextoEnriquecidoDND } from "@/utiles/formatoTextoDND";
import { TablaProgresionRasgo } from "./TablaProgresionRasgo";
import estilos from "./VistaRasgosJugador.module.css";

export interface ItemProgresionClase extends RasgoPersonaje {
  alcanzado: boolean;
  nivel: number;
}

export interface BloqueProgresionClase {
  clase: {
    nombre: string;
    subclase?: string;
    nivel: number;
  };
  defClase: DefinicionClase;
  subDef?: DefinicionSubclase | null;
  items: ItemProgresionClase[];
}

interface VisorProgresionClaseProps {
  datosProgresionClases: BloqueProgresionClase[];
}

export const VisorProgresionClase: React.FC<VisorProgresionClaseProps> = ({
  datosProgresionClases
}) => {
  return (
    <div className={estilos.contenedorCompendioProgresion}>
      {datosProgresionClases.map((bloqueClase) => {
        let yaMostroBannerSubclase = false;

        return (
          <div
            key={bloqueClase.clase.nombre}
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
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

            {/* Lista Cronológica 1 - 20 */}
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
                          className={
                            esSubclase
                              ? estilos.tituloProgresionSubclase
                              : estilos.tituloProgresionClase
                          }
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

                    {/* Tabla de Progresión y Escalado por Nivel */}
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
  );
};
