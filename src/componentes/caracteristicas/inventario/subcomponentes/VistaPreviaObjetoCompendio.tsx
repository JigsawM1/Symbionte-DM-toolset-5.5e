import React from "react";
import type { ObjetoJuego, Arma, Armadura, Escudo } from "@/tipos";
import { DICCIONARIO_CATEGORIAS_EQUIPO } from "@/constantes/categoriasEquipoConstantes";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import {
  obtenerInfoMaestria,
  obtenerInfoPropiedadArma,
  obtenerInfoPropiedadArmadura
} from "@/servicios/resolutorPropiedades";
import { Package, Shield, Sparkles } from "lucide-react";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

interface VistaPreviaObjetoCompendioProps {
  objetoSeleccionado: ObjetoJuego | null;
  cantidadCompendio: number;
}

export const VistaPreviaObjetoCompendio: React.FC<VistaPreviaObjetoCompendioProps> = ({
  objetoSeleccionado,
  cantidadCompendio
}) => {
  if (!objetoSeleccionado) {
    return (
      <div className={estilos.avisoSeleccionarObjeto}>
        Selecciona un objeto del buscador para ver sus detalles.
      </div>
    );
  }

  return (
    <div className={estilos.cajaPreviewObjeto}>
      <div className={estilos.cabeceraPreviewObjeto}>
        <span className={estilos.nombrePreviewObjeto}>
          {objetoSeleccionado.nombre}
        </span>
        <span className={`${estilos.badgeMeta} ${estilos.rarezaComun}`}>
          {DICCIONARIO_CATEGORIAS_EQUIPO[objetoSeleccionado.categoria]?.etiqueta || objetoSeleccionado.categoria}
        </span>
      </div>

      <div className={estilos.filaMetadatosPreview}>
        <span>
          Peso: <strong className={estilos.textoBlancoResaltado}>{objetoSeleccionado.pesoLb || 0} lb</strong>
          {objetoSeleccionado.quantity && objetoSeleccionado.quantity > 1 && (
            <span className={estilos.textoPesoUnitario}>
              ({objetoSeleccionado.pesoUnitario || Math.round(((objetoSeleccionado.pesoLb || 0) / objetoSeleccionado.quantity) * 1000) / 1000} lb c/u)
            </span>
          )}
        </span>
        <span>Valor: <strong className={estilos.textoValorPO}>{objetoSeleccionado.valorPO || 0} PO</strong></span>
        {objetoSeleccionado.quantity && objetoSeleccionado.quantity > 1 && (
          <span className={estilos.avisoLoteCantidad}>
            Viene en lote de {objetoSeleccionado.quantity} uds (Se añadirán: {objetoSeleccionado.quantity * (cantidadCompendio || 1)})
          </span>
        )}
        {objetoSeleccionado.sintonizacionRequerida && (
          <span className={estilos.avisoSintonizacionReq}>
            <Sparkles size={11} />
            Requiere Sintonización
          </span>
        )}
      </div>

      {/* Badges de Estadísticas y Propiedades de Arma / Armadura / Escudo */}
      {objetoSeleccionado.categoria === "armas" && (() => {
        const armaObj = objetoSeleccionado as Arma;
        return (
          <div className={estilos.filaBadgesPreview}>
            {armaObj.tipoAtaque && (
              <span className={`${estilos.badgeMeta} ${estilos.badgeArmaAtaque}`}>
                {armaObj.tipoAtaque}
              </span>
            )}
            {armaObj.dadoDano && (
              <span className={`${estilos.badgeMeta} ${estilos.badgeDanoArma}`}>
                {armaObj.dadoDano} {armaObj.tipoDano}
              </span>
            )}
            {armaObj.danoVersatil && (
              <TooltipUniversal
                titulo="Daño Versátil"
                contenido={`Inflige ${armaObj.danoVersatil} de daño al empuñarse con dos manos.`}
                posicion="arriba"
              >
                <span className={`${estilos.badgeMeta} ${estilos.badgeVersatil}`}>
                  Versátil ({armaObj.danoVersatil})
                </span>
              </TooltipUniversal>
            )}
            {armaObj.maestria && (() => {
              const infoM = obtenerInfoMaestria(armaObj.maestria);
              return (
                <TooltipUniversal
                  titulo={infoM.titulo}
                  contenido={infoM.descripcion}
                  posicion="arriba"
                >
                  <span className={`${estilos.badgeMeta} ${estilos.badgeMaestria}`}>
                    Maestría: {armaObj.maestria}
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaObj.propiedades?.map((p) => {
              const infoP = obtenerInfoPropiedadArma(p);
              return (
                <TooltipUniversal
                  key={p}
                  titulo={infoP.titulo}
                  contenido={infoP.descripcion}
                  posicion="arriba"
                >
                  <span className={`${estilos.badgeMeta} ${estilos.badgePropiedadArma}`}>
                    {p}
                  </span>
                </TooltipUniversal>
              );
            })}
          </div>
        );
      })()}

      {objetoSeleccionado.categoria === "armaduras" && (() => {
        const armaduraObj = objetoSeleccionado as Armadura;
        return (
          <div className={estilos.filaBadgesPreview}>
            <span className={`${estilos.badgeMeta} ${estilos.badgeCaArmadura}`}>
              CA {armaduraObj.caBase}
            </span>
            {(() => {
              const bonoDestReal =
                armaduraObj.bonoDestreza ||
                (armaduraObj.subcategoria === "Pesada"
                  ? "Sin Bono"
                  : armaduraObj.subcategoria === "Mediana"
                  ? "Máximo 2"
                  : "Completo");
              const infoDes = obtenerInfoPropiedadArmadura("bonoDestreza", bonoDestReal);
              return (
                <TooltipUniversal titulo={infoDes.titulo} contenido={infoDes.descripcion} posicion="arriba">
                  <span className={`${estilos.badgeMeta} ${estilos.badgeBonoDes}`}>
                    Bono Des: {bonoDestReal}
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaduraObj.requisitoFuerza && (() => {
              const infoFue = obtenerInfoPropiedadArmadura("requisitoFuerza", armaduraObj.requisitoFuerza);
              return (
                <TooltipUniversal titulo={infoFue.titulo} contenido={infoFue.descripcion} posicion="arriba">
                  <span className={`${estilos.badgeMeta} ${estilos.badgeRequisitoFuerza}`}>
                    FUE {armaduraObj.requisitoFuerza}
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaduraObj.desventajaSigilo && (() => {
              const infoSigilo = obtenerInfoPropiedadArmadura("desventajaSigilo");
              return (
                <TooltipUniversal titulo={infoSigilo.titulo} contenido={infoSigilo.descripcion} posicion="arriba">
                  <span className={`${estilos.badgeMeta} ${estilos.badgeDesventajaSigilo}`}>
                    Sigilo (Desv.)
                  </span>
                </TooltipUniversal>
              );
            })()}
          </div>
        );
      })()}

      {objetoSeleccionado.categoria === "escudos" && (
        <div className={estilos.filaBadgesPreview}>
          <span className={`${estilos.badgeMeta} ${estilos.badgeCaArmadura}`}>
            <Shield size={10} className={estilos.iconoBadgeInline} />
            CA +{(objetoSeleccionado as Escudo).caBase || 2}
          </span>
        </div>
      )}

      {objetoSeleccionado.descripcion && (
        <div className={estilos.descripcionPreview}>
          {objetoSeleccionado.descripcion}
        </div>
      )}

      {/* Desglose de contenido del paquete */}
      {objetoSeleccionado.contents && objetoSeleccionado.contents.length > 0 && (
        <div className={estilos.cajaPaqueteContenido}>
          <span className={estilos.tituloPaqueteContenido}>
            <Package size={12} /> Paquete con {objetoSeleccionado.contents.length} objetos (Podrás abrirlo o desempaquetarlo desde tu inventario):
          </span>
          <div className={estilos.listaItemsPaquete}>
            {objetoSeleccionado.contents.map((item, idx) => (
              <div key={idx} className={estilos.filaItemPaquete}>
                <span>• {item.item.name}</span>
                <strong className={estilos.multiplicadorItemPaquete}>×{item.quantity * (cantidadCompendio || 1)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
