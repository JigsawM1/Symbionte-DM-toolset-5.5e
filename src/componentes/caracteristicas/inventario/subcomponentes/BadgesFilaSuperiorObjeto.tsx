import React from "react";
import type { Arma, Armadura, Escudo, ObjetoInventario } from "@/tipos";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import { FlaskConical, Shield, Target } from "lucide-react";
import {
  obtenerInfoMaestria,
  obtenerInfoPropiedadArma,
  obtenerInfoPropiedadArmadura
} from "@/servicios/resolutorPropiedades";
import type {
  calcularAlmacenamientoMunicion,
  calcularContenidoContenedorMunicion
} from "@/servicios/gestorMunicion";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

interface BadgesFilaSuperiorObjetoProps {
  bonoMagico?: number;
  esVeneno: boolean;
  maestria?: string;
  armaObj: Arma | null;
  esEscudo: boolean;
  caEscudoEfectiva: number;
  armaduraObj: Armadura | null;
  escudoObj: Escudo | null;
  objeto: ObjetoInventario;
  infoAlmacenamientoMunicion: ReturnType<typeof calcularAlmacenamientoMunicion>;
  infoContenedorFisico: ReturnType<typeof calcularContenidoContenedorMunicion>;
}

export const BadgesFilaSuperiorObjeto: React.FC<BadgesFilaSuperiorObjetoProps> = ({
  bonoMagico,
  esVeneno,
  maestria,
  armaObj,
  esEscudo,
  caEscudoEfectiva,
  armaduraObj,
  escudoObj,
  objeto,
  infoAlmacenamientoMunicion,
  infoContenedorFisico
}) => {
  return (
    <>
      {bonoMagico !== undefined && bonoMagico > 0 && (
        <TooltipUniversal
          titulo="Bonificador Mágico"
          contenido={`Otorga +${bonoMagico} a las tiradas de ataque y daño (o a la CA).`}
          posicion="arriba"
        >
          <span className={`${estilos.badgeMeta} ${estilos.badgeBonoMagico}`}>
            +{bonoMagico}
          </span>
        </TooltipUniversal>
      )}
      {esVeneno && (
        <TooltipUniversal
          titulo="Veneno Aplicado"
          contenido="Objeto impregnado con sustancia venenosa que añade efectos especiales o daño por veneno."
          posicion="arriba"
        >
          <span className={`${estilos.badgeMeta} ${estilos.badgeVeneno}`}>
            <FlaskConical size={9} className={estilos.iconoBadgeInline} />
            Veneno
          </span>
        </TooltipUniversal>
      )}
      {maestria && (() => {
        const infoM = obtenerInfoMaestria(maestria);
        return (
          <TooltipUniversal
            titulo={infoM.titulo}
            contenido={infoM.descripcion}
            posicion="arriba"
          >
            <span className={`${estilos.badgeMeta} ${estilos.badgeMaestria}`}>
              {maestria}
            </span>
          </TooltipUniversal>
        );
      })()}
      {armaObj?.propiedades &&
        armaObj.propiedades.map((p) => {
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
      {esEscudo && (
        <TooltipUniversal
          titulo="Bonificador de Escudo"
          contenido={`Otorga +${caEscudoEfectiva} a la Clase de Armadura mientras esté equipado.`}
          posicion="arriba"
        >
          <span className={`${estilos.badgeMeta} ${estilos.badgeCaArmadura}`}>
            <Shield size={9} className={estilos.iconoBadgeInline} />
            +{caEscudoEfectiva} CA
          </span>
        </TooltipUniversal>
      )}
      {(armaduraObj?.desventajaSigilo || escudoObj?.desventajaSigilo || objeto.desventajaSigilo) && (() => {
        const infoSigilo = obtenerInfoPropiedadArmadura("desventajaSigilo");
        return (
          <TooltipUniversal
            titulo={infoSigilo.titulo}
            contenido={infoSigilo.descripcion}
            posicion="arriba"
          >
            <span className={`${estilos.badgeMeta} ${estilos.badgeDesventajaSigilo}`}>
              Sigilo (Desv.)
            </span>
          </TooltipUniversal>
        );
      })()}
      {(armaduraObj?.requisitoFuerza || objeto.requisitoFuerza) && (() => {
        const reqFue = armaduraObj?.requisitoFuerza || objeto.requisitoFuerza;
        const infoFue = obtenerInfoPropiedadArmadura("requisitoFuerza", reqFue);
        return (
          <TooltipUniversal
            titulo={infoFue.titulo}
            contenido={infoFue.descripcion}
            posicion="arriba"
          >
            <span className={`${estilos.badgeMeta} ${estilos.badgeRequisitoFuerza}`}>
              FUE {reqFue}
            </span>
          </TooltipUniversal>
        );
      })()}

      {/* Badges de Munición y Almacenamiento con Límite de Capacidad */}
      {infoAlmacenamientoMunicion && (
        infoAlmacenamientoMunicion.tieneContenedor ? (
          <>
            <span
              className={`${estilos.badgeMeta} ${estilos.badgeMunicionGuardada}`}
              title={`${infoAlmacenamientoMunicion.almacenadasEnContenedor} de ${infoAlmacenamientoMunicion.totalMunicion} proyectiles guardados en ${infoAlmacenamientoMunicion.nombreContenedor}`}
            >
              <Target size={9} className={estilos.iconoBadgeInline} />
              {infoAlmacenamientoMunicion.almacenadasEnContenedor}/{infoAlmacenamientoMunicion.capacidadTotal} en {infoAlmacenamientoMunicion.nombreContenedor}
            </span>
            {infoAlmacenamientoMunicion.sueltasEnMochila > 0 && (
              <span
                className={`${estilos.badgeMeta} ${estilos.badgeMunicionExceso}`}
                title={`${infoAlmacenamientoMunicion.sueltasEnMochila} proyectiles exceden la capacidad de tu ${infoAlmacenamientoMunicion.nombreContenedor} y van sueltos en la mochila`}
              >
                +{infoAlmacenamientoMunicion.sueltasEnMochila} en mochila
              </span>
            )}
          </>
        ) : (
          <span
            className={`${estilos.badgeMeta} ${estilos.badgeMunicionSuelta}`}
            title={`Transportas esta munición suelta en la mochila. Recomendado: ${infoAlmacenamientoMunicion.nombreContenedor}`}
          >
            Sueltas en mochila
          </span>
        )
      )}

      {/* Badge para el Contenedor Físico (ej. Carcaj, Caja de Virotes, Bolsa de Balas) */}
      {infoContenedorFisico && (
        <span
          className={`${estilos.badgeMeta} ${
            infoContenedorFisico.totalAlmacenado > 0
              ? estilos.badgeContenedorConContenido
              : estilos.badgeMunicionSuelta
          }`}
          title={
            infoContenedorFisico.totalAlmacenado > 0
              ? `Alberga ${infoContenedorFisico.totalAlmacenado} de su capacidad máxima de ${infoContenedorFisico.capacidadTotal} ${infoContenedorFisico.tipoProyectil}`
              : `Capacidad para ${infoContenedorFisico.capacidadTotal} ${infoContenedorFisico.tipoProyectil} (Actualmente vacío)`
          }
        >
          <Target size={9} className={estilos.iconoBadgeInline} />
          {infoContenedorFisico.totalAlmacenado}/{infoContenedorFisico.capacidadTotal} {infoContenedorFisico.tipoProyectil}
          {infoContenedorFisico.estaLleno && " (Lleno)"}
        </span>
      )}
    </>
  );
};
