import React, { useState } from "react";
import { normalizarTexto } from "@/almacen/usarAlmacenDM";
import { usarEstadoHomebrew, usarEstadoConfiguracion } from "@/almacen/selectores";
import type { ObjetoHomebrew, ObjetoJuego, Arma, Armadura, Escudo } from "@/tipos";
import { DICCIONARIO_CATEGORIAS_EQUIPO } from "@/constantes/categoriasEquipoConstantes";
import {
  X,
  MapPin,
  Sparkles,
  Coins,
  Scale,
  Copy,
  Skull,
  ChevronLeft
} from "lucide-react";
import estilos from "../ListaHomebrew.module.css";
import { TextoEnriquecidoDND } from "@/componentes/comunes";
import { SeccionMecanicasArmaObjeto } from "./SeccionMecanicasArmaObjeto";
import { SeccionMecanicasEspecialesObjeto } from "./SeccionMecanicasEspecialesObjeto";

interface PanelDetalleObjetoHomebrewProps {
  idObjeto: string | null;
  alCerrar: () => void;
  alUsarPlantilla: (o: ObjetoHomebrew) => void;
  alAbrirHechizo?: (idHechizo: string) => void;
}

export const PanelDetalleObjetoHomebrew: React.FC<PanelDetalleObjetoHomebrewProps> = ({
  idObjeto,
  alCerrar,
  alUsarPlantilla,
  alAbrirHechizo
}) => {
  const { objetosHomebrew, baseDatosHechizos } = usarEstadoHomebrew();
  const { esGM } = usarEstadoConfiguracion();

  const [idActual, setIdActual] = useState<string | null>(idObjeto);
  const [historialDetalle, setHistorialDetalle] = useState<string[]>([]);

  React.useEffect(() => {
    setIdActual(idObjeto);
    setHistorialDetalle([]);
  }, [idObjeto]);

  if (!idActual) return null;

  const oRaw = objetosHomebrew.find((o) => o.id === idActual);
  if (!oRaw) return null;
  const objeto = oRaw as ObjetoJuego;

  const navegarAObjeto = (idDestino: string) => {
    setHistorialDetalle((prev) => [...prev, idActual]);
    setIdActual(idDestino);
  };

  const navegarAtras = () => {
    if (historialDetalle.length > 0) {
      const nuevoHistorial = [...historialDetalle];
      const anteriorId = nuevoHistorial.pop();
      setHistorialDetalle(nuevoHistorial);
      if (anteriorId) {
        setIdActual(anteriorId);
      }
    }
  };

  return (
    <div className={estilos.panelDetalleOverlay}>
      <div className={estilos.cabeceraDetalle}>
        <div className={`${estilos.cabeceraDetalleIzquierda} u-flex u-items-center u-gap-md`}>
          {historialDetalle.length > 0 && (
            <button
              onClick={navegarAtras}
              className={estilos.botonNavegarAtras}
              type="button"
            >
              <ChevronLeft size={14} />
              <span>Atrás</span>
            </button>
          )}
          <div className="u-flex u-gap-xs">
            <span className={estilos.objetoNivelOverlay}>
              {DICCIONARIO_CATEGORIAS_EQUIPO[objeto.categoria]?.etiqueta || objeto.categoria}{" "}
              {objeto.subcategoria ? `| ${objeto.subcategoria}` : ""}
            </span>
            <span className={estilos.nombreHechizoOverlay}>{objeto.nombre}</span>
          </div>
        </div>
        <div className="u-flex u-items-center u-gap-sm">
          <button
            onClick={() => {
              alCerrar();
              alUsarPlantilla(oRaw);
            }}
            className={estilos.botonPlantillaDetalle}
            type="button"
            title="Usar como plantilla para crear un nuevo objeto"
          >
            <Copy size={13} />
            Usar como plantilla
          </button>
          <button
            onClick={alCerrar}
            className={estilos.botonCerrarDetalle}
            type="button"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <div className={estilos.cuerpoDetalle}>
        {/* Grid Metadatos */}
        <div className={estilos.gridMetadatos}>
          <div className={estilos.metaItem}>
            <Sparkles size={12} className={estilos.iconoDetalle} />
            <div>
              <div className={estilos.metaLabel}>RAREZA</div>
              <div
                className={`${estilos.metaValor} ${estilos.metaValorRareza}`}
                data-rareza={objeto.rareza || "Común"}
              >
                {objeto.rareza || "Común"}
              </div>
            </div>
          </div>
          {objeto.valorPO !== undefined && objeto.valorPO > 0 && (
            <div className={estilos.metaItem}>
              <Coins size={12} className={estilos.iconoDetalle} />
              <div>
                <div className={estilos.metaLabel}>VALOR / COSTE</div>
                <div className={estilos.metaValor}>
                  {objeto.valorPO} PO
                </div>
              </div>
            </div>
          )}
          {objeto.pesoLb !== undefined && (
            <div className={estilos.metaItem}>
              <Scale size={12} className={estilos.iconoDetalle} />
              <div>
                <div className={estilos.metaLabel}>PESO</div>
                <div className={estilos.metaValor}>{objeto.pesoLb} lb</div>
              </div>
            </div>
          )}
          {objeto.tipoVeneno && (
            <div className={estilos.metaItem}>
              <Skull size={12} className={`${estilos.iconoDetalle} ${estilos.textoPurpuraVeneno}`} />
              <div>
                <div className={estilos.metaLabel}>EXPOSICIÓN</div>
                <div className={`${estilos.metaValor} ${estilos.textoPurpuraVeneno}`}>
                  {objeto.tipoVeneno}
                </div>
              </div>
            </div>
          )}
          {objeto.categoria === "armas" && (objeto as Arma).alcanceNormal && (
            <div className={estilos.metaItem}>
              <MapPin size={12} className={estilos.iconoDetalle} />
              <div>
                <div className={estilos.metaLabel}>ALCANCE</div>
                <div className={estilos.metaValor}>
                  {(objeto as Arma).alcanceNormal}/{(objeto as Arma).alcanceLargo || (objeto as Arma).alcanceNormal} pies
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fila de propiedades visuales adicionales */}
        <div className={estilos.filaPropiedadesEspeciales}>
          {objeto.esMagico && (
            <span className={`${estilos.chipConcentracion} ${estilos.chipConcentracionMagico}`}>
              MÁGICO
            </span>
          )}
          {(objeto.esVeneno || objeto.tipoVeneno) && (
            <span className={`${estilos.chipConcentracion} ${estilos.chipConcentracionVeneno}`}>
              VENENO {objeto.tipoVeneno ? `(${objeto.tipoVeneno.toUpperCase()})` : ""}
            </span>
          )}
          {objeto.categoria === "armas" && (
            <span className={estilos.chipRitual}>Arma {(objeto as Arma).tipoAtaque}</span>
          )}
          {(objeto.categoria === "armaduras" || objeto.categoria === "escudos") && (
            <span className={estilos.chipRitual}>{(objeto as Armadura).bonoDestreza || "Escudo"}</span>
          )}
        </div>

        {/* MECÁNICAS DE COMBATE DE ARMA */}
        <SeccionMecanicasArmaObjeto
          objeto={objeto}
          esGM={esGM}
          objetosHomebrew={objetosHomebrew}
          navegarAObjeto={navegarAObjeto}
        />

        {/* MECÁNICAS DE ARMADURA O ESCUDO */}
        {(objeto.categoria === "armaduras" || objeto.categoria === "escudos") && (() => {
          const armadura = objeto as Armadura | Escudo;
          return (
            <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasArmadura}`}>
              <div className={`${estilos.tituloMecanicasObjeto} ${estilos.tituloMecanicasArmadura}`}>
                Protección y Sigilo
              </div>
              <div className={estilos.gridMecanicas}>
                <div className={estilos.itemMecanica}>
                  <span className={estilos.textoEtiquetaMecanica}>CA Base: </span>
                  <strong className={estilos.valorMecanicaDano}>
                    {objeto.categoria === "escudos" ? `+${armadura.caBase}` : armadura.caBase}
                  </strong>
                </div>
                {"requisitoFuerza" in armadura && armadura.requisitoFuerza && (
                  <div className={estilos.itemMecanica}>
                    <span className={estilos.textoEtiquetaMecanica}>FUE Requerida: </span>
                    <strong className={estilos.valorMecanicaCd}>FUE {armadura.requisitoFuerza}</strong>
                  </div>
                )}
                {"desventajaSigilo" in armadura && (
                  <div className={estilos.itemMecanica}>
                    <span className={estilos.textoEtiquetaMecanica}>Desv. Sigilo: </span>
                    <strong
                      className={`${armadura.desventajaSigilo ? estilos.valorMecanicaSuperior : estilos.valorMecanicaCd} ${estilos.valorDesventajaSigilo}`}
                      data-desventaja={armadura.desventajaSigilo ? "true" : "false"}
                    >
                      {armadura.desventajaSigilo ? "Sí" : "No"}
                    </strong>
                  </div>
                )}
                {"tiempoEquipar" in armadura && armadura.tiempoEquipar && (
                  <div className={estilos.itemMecanica}>
                    <span className={estilos.textoEtiquetaMecanica}>Tiempo Equipar: </span>
                    <strong className={estilos.valorMecanicaCd}>{armadura.tiempoEquipar}</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* MECÁNICAS ESPECIALES, VENENOS, RECARGAS Y CONJUROS */}
        <SeccionMecanicasEspecialesObjeto
          objeto={objeto}
          esGM={esGM}
          baseDatosHechizos={baseDatosHechizos}
          objetosHomebrew={objetosHomebrew}
          navegarAObjeto={navegarAObjeto}
          alAbrirHechizo={alAbrirHechizo}
        />

        {/* Propiedades del arma en badges */}
        {objeto.categoria === "armas" && (objeto as Arma).propiedades && (objeto as Arma).propiedades!.length > 0 && (
          <div className={estilos.seccionDescripcionFichaMargenGrande}>
            <div className={estilos.descripcionTituloFicha}>PROPIEDADES TÁCTICAS DEL ARMA</div>
            <div className={estilos.listaBadgesClases}>
              {(objeto as Arma).propiedades!.map((prop: string) => (
                <span key={prop} className={estilos.badgeClaseObjeto}>
                  {prop}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Receta de Artesanía */}
        {objeto.artesania && (objeto.artesania.tallerRequerido || (objeto.artesania.componentes && objeto.artesania.componentes.length > 0)) && (
          <div className={estilos.seccionDescripcionFichaMargenGrande}>
            <div className={estilos.descripcionTituloFicha}>RECETA DE ARTESANÍA Y CRAFTEO</div>
            <div className={`${estilos.cajaMecanicasCombateObjeto} ${estilos.cajaMecanicasArtesania}`}>
              {objeto.artesania.tallerRequerido && (
                <div className="u-mb-xs">
                  <span className={estilos.textoEtiquetaMecanica}>Taller de Trabajo: </span>
                  <strong className={estilos.textoTallerPrincipal}>{objeto.artesania.tallerRequerido}</strong>
                </div>
              )}
              {objeto.artesania.componentes && objeto.artesania.componentes.length > 0 && (
                <div>
                  <span className={`${estilos.textoEtiquetaMecanica} ${estilos.labelComponentesBlock}`}>Materiales y Componentes:</span>
                  <div className="u-flex u-flex-wrap u-gap-xs">
                    {objeto.artesania.componentes.map((comp: string, idx: number) => (
                      <span key={idx} className={estilos.chipComponenteArtesania}>
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contenido del Paquete */}
        {objeto.contents && objeto.contents.length > 0 && (
          <div className={estilos.seccionDescripcionFichaMargenGrande}>
            <div className={estilos.descripcionTituloFicha}>CONTENIDO DEL PAQUETE</div>
            <div className="u-flex u-flex-col u-gap-xs">
              {objeto.contents.map((c: { item: { index: string; name: string }; quantity: number }, idx: number) => {
                const idDestino = c.item.index;
                const destino = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.item.name));

                return (
                  <div key={idx} className={estilos.filaContenidoPaquete}>
                    <span className={estilos.textoItemPaquete}>
                      {c.quantity}x {c.item.name}
                    </span>
                    {destino ? (
                      <button
                        type="button"
                        onClick={() => navegarAObjeto(destino.id)}
                        className={estilos.botonVerObjetoContenido}
                      >
                        Ver Objeto
                      </button>
                    ) : (
                      <span className={estilos.textoNoDisponible}>
                        No disponible
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Objetos Elaborables (Craft) */}
        {objeto.craft && objeto.craft.length > 0 && (
          <div className={estilos.seccionDescripcionFichaMargenGrande}>
            <div className={estilos.descripcionTituloFicha}>OBJETOS QUE PUEDE ELABORAR</div>
            <div className="u-flex u-flex-wrap u-gap-xs">
              {objeto.craft.map((c: { index: string; name: string }, idx: number) => {
                const idDestino = c.index;
                const destino = objetosHomebrew.find(o => o.id === idDestino || normalizarTexto(o.nombre) === normalizarTexto(c.name));

                if (destino) {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => navegarAObjeto(destino.id)}
                      className={estilos.botonCraftDisponible}
                    >
                      {c.name}
                    </button>
                  );
                }

                return (
                  <span
                    key={idx}
                    className={estilos.chipCraftNoDisponible}
                  >
                    {c.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Descripción Completa */}
        <div className={estilos.seccionDescripcionFicha}>
          <div className={estilos.descripcionTituloFicha}>
            DESCRIPCIÓN DEL OBJETO MÁGICO
          </div>
          <div className={estilos.descripcionCuerpoFicha}>
            <TextoEnriquecidoDND
              texto={objeto.descripcion}
              permitirTiradas={esGM}
              etiquetaTirada={`DM - ${objeto.nombre}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
