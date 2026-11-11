import React, { useMemo } from "react";
import { Swords, Zap, Sparkles, Target, AlertTriangle } from "lucide-react";
import type { Caracteristica, TipoAccionConsumida, AtaquePersonajeCalculado } from "@/tipos";
import type { ResultadoEvaluacionCondiciones } from "@/servicios/procesadorCondiciones";
import { TooltipUniversal, SelectorDesplegable } from "@/componentes/comunes";
import { obtenerInfoMaestria, obtenerInfoPropiedadArma } from "@/servicios/resolutorPropiedades";
import estilos from "./VistaAtaquesJugador.module.css";

export type { TipoAccionConsumida, AtaquePersonajeCalculado };

interface TarjetaAtaquePersonajeProps {
  ataque: AtaquePersonajeCalculado;
  evaluacionCondiciones?: ResultadoEvaluacionCondiciones;
  permiteDanoAdicional?: boolean;
  alTirarAtaque: (ataque: AtaquePersonajeCalculado) => void;
  alTirarDano: (ataque: AtaquePersonajeCalculado, versatil?: boolean | "adicional") => void;
  alTirarCritico: (ataque: AtaquePersonajeCalculado, versatil?: boolean | "adicional") => void;
  alCambiarCaracteristica?: (ataqueId: string, nuevaCarac: Caracteristica) => void;
}

export const TarjetaAtaquePersonaje: React.FC<TarjetaAtaquePersonajeProps> = React.memo(({
  ataque,
  evaluacionCondiciones,
  permiteDanoAdicional,
  alTirarAtaque,
  alTirarDano,
  alTirarCritico,
  alCambiarCaracteristica
}) => {
  const bonoImpactoTexto = ataque.bonoAtaque >= 0 ? `+${ataque.bonoAtaque}` : `${ataque.bonoAtaque}`;

  const motivosAtaque = [
    ...(evaluacionCondiciones?.motivosDesventaja || []),
    ...(evaluacionCondiciones?.motivosVentaja || []),
    ...(evaluacionCondiciones?.motivosModificadores || [])
  ].join(", ");

  const esSutil = ataque.esSutil || ataque.propiedades?.some((p) => {
    const norm = p.toLowerCase().trim();
    return norm.includes("sutil") || norm.includes("finesse");
  });

  const esDistancia = ataque.esDistancia || ataque.subtipo?.toLowerCase().includes("distancia") || ataque.propiedades?.some((p) => {
    const norm = p.toLowerCase().trim();
    return norm.includes("munición") || norm.includes("municion") || norm.includes("distancia");
  });

  const opcionesAtributo = useMemo<{ valor: Caracteristica; etiqueta: string }[]>(
    () => [
      ...(esSutil || !esDistancia ? [{ valor: "fuerza" as const, etiqueta: "FUE" }] : []),
      ...(esSutil || esDistancia ? [{ valor: "destreza" as const, etiqueta: "DES" }] : []),
      { valor: "inteligencia", etiqueta: "INT" },
      { valor: "sabiduria", etiqueta: "SAB" },
      { valor: "carisma", etiqueta: "CAR" }
    ],
    [esSutil, esDistancia]
  );

  const textoBadgeAccion =
    ataque.tipoAccion === "accionAdicional"
      ? "Bonus"
      : ataque.tipoAccion === "reaccion"
      ? "Reacción"
      : "Acción";

  const claseBadgeAccion =
    ataque.tipoAccion === "accionAdicional"
      ? estilos.badgeAccionAdicional
      : ataque.tipoAccion === "reaccion"
      ? estilos.badgeReaccion
      : "";

  return (
    <div
      className={`${estilos.tarjetaAtaqueCompacta} ${
        ataque.tipo === "Desarmado"
          ? estilos.tarjetaAtaqueDesarmado
          : ataque.tipoAccion === "accionAdicional"
          ? estilos.tarjetaAtaqueAdicional
          : ataque.tipoAccion === "reaccion"
          ? estilos.tarjetaAtaqueReaccion
          : ""
      }`}
    >
      {/* 1. Cabecera Táctica: Identidad, Badges y Selector de Atributo */}
      <div className={estilos.filaSuperiorTarjetaAtaque}>
        <div className={estilos.ladoIdentidadAtaque}>
          <div className={estilos.medallonIconoAtaque}>
            {ataque.tipo === "Arma" && <Swords size={14} color="var(--pj-texto-cian)" />}
            {ataque.tipo === "Desarmado" && <Zap size={14} color="var(--pj-texto-terciario)" />}
            {ataque.tipo === "Conjuro" && <Sparkles size={14} color="var(--pj-texto-magia)" />}
          </div>
          <div className={estilos.bloqueNombresAtaque}>
            <span className={estilos.nombreAtaque}>{ataque.nombre}</span>
            {ataque.subtipo && <span className={estilos.subtipoAtaqueTexto}>{ataque.subtipo}</span>}
          </div>
        </div>

        <div className={estilos.ladoBadgesAtaque}>
          <span className={`${estilos.badgeAccionTipo} ${claseBadgeAccion}`}>
            {textoBadgeAccion}
          </span>

          {ataque.esMagico && (
            <span className={estilos.badgeMagicoAtaque}>
              <Sparkles size={10} /> Mágico
            </span>
          )}

          {ataque.requiereMunicion && (
            <span
              className={ataque.puedeDisparar ? estilos.badgeMunicion : estilos.badgeMunicionVacia}
              title={
                ataque.puedeDisparar
                  ? `${ataque.municionEnContenedor || ataque.municionCantidad} ${ataque.municionNombre || "proyectiles"} listos en ${ataque.nombreContenedor || "Contenedor"}`
                  : (ataque.motivoBloqueo || `Sin ${ataque.municionNombre || "munición"} disponible`)
              }
            >
              {ataque.puedeDisparar ? <Target size={11} /> : <AlertTriangle size={11} />}
              <span>{ataque.puedeDisparar ? (ataque.municionEnContenedor || ataque.municionCantidad) : 0}</span>
            </span>
          )}

          {alCambiarCaracteristica && (ataque.tipo === "Arma" || (ataque.tipo === "Desarmado" && esSutil)) && (
            <div className={estilos.bloqueAtributoSelector}>
              <SelectorDesplegable<Caracteristica>
                valor={ataque.caracteristicaUsada}
                alCambiar={(nuevaCarac) => alCambiarCaracteristica(ataque.id, nuevaCarac)}
                tamano="mini"
                opciones={opcionesAtributo}
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Metadatos y Badges de Reglas D&D 5.5e (Alcance, Maestría, Propiedades) */}
      <div className={estilos.filaReglasYPropiedades}>
        {ataque.alcance && (
          <span className={estilos.chipAlcanceAtaque}>
            <Target size={11} /> {ataque.alcance}
          </span>
        )}

        {ataque.maestria && (
          <TooltipUniversal
            titulo={ataque.maestria}
            contenido={obtenerInfoMaestria(ataque.maestria).textoCompleto}
            posicion="arriba"
            alineacion="inicio"
          >
            <span className={estilos.badgeMaestria}>
              {ataque.maestria}
            </span>
          </TooltipUniversal>
        )}

        {ataque.propiedades.map((prop) => (
          <TooltipUniversal
            key={prop}
            titulo={prop}
            contenido={obtenerInfoPropiedadArma(prop).textoCompleto}
            posicion="arriba"
            alineacion="inicio"
          >
            <span className={estilos.badgePropiedad}>
              {prop}
            </span>
          </TooltipUniversal>
        ))}

        {ataque.tipo === "Arma" && ataque.esCompetenteConArma === false && (
          <span
            className={estilos.badgeNoCompetente}
            title="No eres competente con esta arma. No sumas tu bono de competencia al ataque."
          >
            <AlertTriangle size={10} /> No Competente
          </span>
        )}
        {evaluacionCondiciones?.tieneDesventaja && (
          <span
            className={`${estilos.badgeNoCompetente} ${estilos.badgeDesventajaAtaque}`}
            title={`Desventaja en ataque por: ${motivosAtaque}`}
          >
            <AlertTriangle size={10} /> Desventaja
          </span>
        )}
        {evaluacionCondiciones?.tieneVentaja && !evaluacionCondiciones?.tieneDesventaja && (
          <span
            className={estilos.badgeMagicoAtaque}
            title={`Ventaja en ataque por: ${motivosAtaque}`}
          >
            <Sparkles size={10} /> Ventaja
          </span>
        )}
      </div>

      {/* 3. Touchpad Táctico de Tiradas Móvil (Impacto Heroico + Daño + Crítico) */}
      <div className={estilos.touchpadTiradasAtaque}>
        {/* Botón Heroico de Ataque / Salvación */}
        {ataque.tieneTiradaAtaque ? (
          <button
            type="button"
            className={estilos.botonAtacarPrincipal}
            onClick={() => alTirarAtaque(ataque)}
            title={`Tirar Ataque con ${ataque.nombre} en TaleSpire (1d20${bonoImpactoTexto})`}
          >
            <Target size={13} />
            <span className={estilos.etiquetaBotonAtaque}>ATACAR</span>
            <span className={estilos.valorBonoAtaque}>{bonoImpactoTexto}</span>
          </button>
        ) : (
          <button
            type="button"
            className={estilos.botonAtacarPrincipal}
            onClick={() => alTirarDano(ataque, false)}
            title={`Tirar Daño con ${ataque.nombre} (${ataque.dadoDano})`}
          >
            <Swords size={13} />
            <span className={estilos.etiquetaBotonAtaque}>CD {ataque.cdSalvacion || 10}</span>
            <span className={estilos.valorBonoAtaque}>{ataque.tipoSalvacion || "SALV"}</span>
          </button>
        )}

        {/* Bandeja Táctica de Daño y Crítico */}
        <div className={estilos.bandejaDanoYCritico}>
          {/* Daño Normal / 1 Mano */}
          {ataque.tieneTiradaAtaque && (!ataque.esDanoFijo || permiteDanoAdicional) && (
            <button
              type="button"
              className={estilos.botonSecundarioDano}
              onClick={() => alTirarDano(ataque, false)}
              title={ataque.danoVersatil ? `Tirar Daño a 1 Mano (${ataque.dadoDano})` : `Tirar Daño normal (${ataque.dadoDano})`}
            >
              <Swords size={11} />
              <span className={estilos.etiquetaDanoBoton}>{ataque.danoVersatil ? "1M" : "DAÑO"}</span>
              <span className={estilos.formulaDanoBoton}>{ataque.dadoDano}</span>
            </button>
          )}

          {/* Daño Versátil a 2 Manos */}
          {!ataque.esDanoFijo && ataque.danoVersatil && (
            <button
              type="button"
              className={estilos.botonSecundarioDano}
              onClick={() => alTirarDano(ataque, true)}
              title={`Tirar Daño a 2 Manos (${ataque.danoVersatil})`}
            >
              <span className={estilos.etiquetaDanoBoton}>2M</span>
              <span className={estilos.formulaDanoBoton}>{ataque.danoVersatil}</span>
            </button>
          )}

          {/* Daño Adicional */}
          {!ataque.esDanoFijo && ataque.danoAccionAdicional && (
            <button
              type="button"
              className={estilos.botonSecundarioDano}
              onClick={() => alTirarDano(ataque, "adicional")}
              title={`Tirar Daño como Acción Adicional (${ataque.danoAccionAdicional})`}
            >
              <span className={estilos.etiquetaDanoBoton}>+1d4</span>
            </button>
          )}

          {/* Tirada de Crítico */}
          {(!ataque.esDanoFijo || permiteDanoAdicional) && ataque.tieneTiradaAtaque && (
            <button
              type="button"
              className={estilos.botonSecundarioCrit}
              onClick={() => alTirarCritico(ataque, false)}
              title={ataque.danoVersatil ? "Tirar Daño Crítico a 1 Mano" : "Tirar Daño Crítico (duplica dados)"}
            >
              <Sparkles size={11} />
              <span>{ataque.danoVersatil ? "CRIT 1M" : "CRIT"}</span>
            </button>
          )}

          {/* Tirada de Crítico Versátil 2M */}
          {!ataque.esDanoFijo && ataque.tieneTiradaAtaque && ataque.danoVersatil && (
            <button
              type="button"
              className={estilos.botonSecundarioCrit}
              onClick={() => alTirarCritico(ataque, true)}
              title="Tirar Daño Crítico a 2 Manos (duplica dados versátiles)"
            >
              <Sparkles size={11} />
              <span>CRIT 2M</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

TarjetaAtaquePersonaje.displayName = "TarjetaAtaquePersonaje";
