import React from "react";
import type { ObjetoInventario, ObjetoJuego, Arma, Armadura } from "@/tipos";
import { Sparkles, Clock, Target } from "lucide-react";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import {
  obtenerInfoMaestria,
  obtenerInfoPropiedadArma,
  obtenerInfoPropiedadArmadura
} from "@/servicios/resolutorPropiedades";
import { SeccionAlmacenamientoMunicion } from "./SeccionAlmacenamientoMunicion";
import estilos from "../ModalDetalleObjetoInventario.module.css";

interface SeccionDetallesEquipoProps {
  objeto: ObjetoInventario;
  objetoBase: ObjetoJuego | null;
  esArma: boolean;
  esArmadura: boolean;
  armaObj: Arma | null;
  armaduraObj: Armadura | null;
  inventarioCompleto?: ObjetoInventario[];
  alActualizarObjeto?: (cambios: Partial<ObjetoInventario>) => void;
}

export const SeccionDetallesEquipo: React.FC<SeccionDetallesEquipoProps> = ({
  objeto,
  objetoBase,
  esArma,
  esArmadura,
  armaObj,
  armaduraObj,
  inventarioCompleto,
  alActualizarObjeto
}) => {
  return (
    <>
      {/* Estadísticas Detalladas de Arma */}
      {esArma && armaObj && (
        <div className={`${estilos.seccionDatosGenerales} ${estilos.seccionArma}`}>
          <div className={estilos.filaBadges}>
            {armaObj.tipoAtaque && (
              <span className={`${estilos.badgeMeta} ${estilos.badgeArmaAtaque}`}>
                {armaObj.tipoAtaque}
              </span>
            )}
            {armaObj.danoVersatil && (
              <TooltipUniversal
                titulo="Daño Versátil"
                contenido={`Inflige ${armaObj.danoVersatil} de daño cuando se empuña a dos manos para realizar un ataque cuerpo a cuerpo.`}
                posicion="arriba"
              >
                <span className={`${estilos.badgeMeta} ${estilos.badgeArmaVersatil}`} style={{ cursor: "help" }}>
                  Versátil ({armaObj.danoVersatil})
                </span>
              </TooltipUniversal>
            )}
            {armaObj.alcanceNormal && (
              <TooltipUniversal
                titulo="Alcance del Arma"
                contenido={`Alcance normal de ${armaObj.alcanceNormal} pies${armaObj.alcanceLargo ? ` y alcance largo hasta ${armaObj.alcanceLargo} pies.` : "."}`}
                posicion="arriba"
              >
                <span className={`${estilos.badgeMeta} ${estilos.badgeArmaAlcance}`} style={{ cursor: "help" }}>
                  Alcance {armaObj.alcanceNormal}/{armaObj.alcanceLargo || armaObj.alcanceNormal} pies
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
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaMaestria}`} style={{ cursor: "help" }}>
                    {armaObj.maestria}
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaObj.ammunition && (
              <TooltipUniversal
                titulo={`Munición: ${armaObj.ammunition.name}`}
                contenido="Esta arma requiere proyectiles compatibles listos en tu inventario para poder disparar en combate."
                posicion="arriba"
              >
                <span className={`${estilos.badgeMeta} ${estilos.badgeAmmunition}`} style={{ cursor: "help" }}>
                  <Target size={10} /> Munición: {armaObj.ammunition.name}
                </span>
              </TooltipUniversal>
            )}
            {objetoBase?.modificadorAtaqueDano && (
              <TooltipUniversal
                titulo="Bonificador Mágico"
                contenido={`Otorga un bono de +${objetoBase.modificadorAtaqueDano} a las tiradas de ataque y daño con esta arma.`}
                posicion="arriba"
              >
                <span className={`${estilos.badgeMeta} ${estilos.badgeMagicoBono}`} style={{ cursor: "help" }}>
                  <Sparkles size={10} /> Bono: +{objetoBase.modificadorAtaqueDano}
                </span>
              </TooltipUniversal>
            )}
          </div>

          {armaObj.maestria && (() => {
            const infoM = obtenerInfoMaestria(armaObj.maestria);
            return (
              <div className={estilos.explicacionMaestria}>
                <strong>{infoM.titulo}: </strong>
                {infoM.descripcion}
              </div>
            );
          })()}

          {armaObj.propiedades && armaObj.propiedades.length > 0 && (
            <div className={estilos.filaPropiedadesLista}>
              {armaObj.propiedades.map((p) => {
                const infoP = obtenerInfoPropiedadArma(p);
                return (
                  <TooltipUniversal
                    key={p}
                    titulo={infoP.titulo}
                    contenido={infoP.descripcion}
                    posicion="arriba"
                  >
                    <span className={estilos.badgePropiedad} style={{ cursor: "help" }}>
                      {p}
                    </span>
                  </TooltipUniversal>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Estadísticas Detalladas de Armadura */}
      {esArmadura && armaduraObj && (
        <div className={`${estilos.seccionDatosGenerales} ${estilos.seccionArmadura}`}>
          <div className={estilos.filaBadges}>
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
                <TooltipUniversal
                  titulo={infoDes.titulo}
                  contenido={infoDes.descripcion}
                  posicion="arriba"
                >
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaduraDes}`} style={{ cursor: "help" }}>
                    Bono Destreza: {bonoDestReal}
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaduraObj.requisitoFuerza && (() => {
              const infoFue = obtenerInfoPropiedadArmadura("requisitoFuerza", armaduraObj.requisitoFuerza);
              return (
                <TooltipUniversal
                  titulo={infoFue.titulo}
                  contenido={infoFue.descripcion}
                  posicion="arriba"
                >
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaduraFue}`} style={{ cursor: "help" }}>
                    Fuerza Requerida: {armaduraObj.requisitoFuerza}
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaduraObj.desventajaSigilo && (() => {
              const infoSigilo = obtenerInfoPropiedadArmadura("desventajaSigilo");
              return (
                <TooltipUniversal
                  titulo={infoSigilo.titulo}
                  contenido={infoSigilo.descripcion}
                  posicion="arriba"
                >
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaduraSigilo}`} style={{ cursor: "help" }}>
                    Desventaja en Sigilo
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaduraObj.tiempoEquipar && (
              <span className={`${estilos.badgeMeta} ${estilos.badgeTiempoEquipar}`}>
                <Clock size={10} /> Poner/Quitar: {armaduraObj.tiempoEquipar}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Almacenamiento y Especialización */}
      <SeccionAlmacenamientoMunicion
        objeto={objeto}
        objetoBase={objetoBase}
        inventarioCompleto={inventarioCompleto}
        alActualizarObjeto={alActualizarObjeto}
      />
    </>
  );
};
