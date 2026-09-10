import React from "react";
import { Swords, Zap, Sparkles, Target, AlertTriangle } from "lucide-react";
import type { Caracteristica, TipoAccionConsumida, AtaquePersonajeCalculado } from "@/tipos";
import type { ResultadoEvaluacionCondiciones } from "@/servicios/procesadorCondiciones";
import { TooltipUniversal, SelectorDesplegable } from "@/componentes/comunes";
import estilos from "./VistaAtaquesJugador.module.css";

export type { TipoAccionConsumida, AtaquePersonajeCalculado };

import {
  obtenerInfoMaestria,
  obtenerInfoPropiedadArma
} from "@/servicios/resolutorPropiedades";

function obtenerTooltipMaestria(maestriaTexto: string): string {
  return obtenerInfoMaestria(maestriaTexto).textoCompleto;
}

function obtenerTooltipPropiedad(propiedadTexto: string): string {
  return obtenerInfoPropiedadArma(propiedadTexto).textoCompleto;
}

interface TarjetaAtaquePersonajeProps {
  ataque: AtaquePersonajeCalculado;
  evaluacionCondiciones?: ResultadoEvaluacionCondiciones;
  alTirarAtaque: (ataque: AtaquePersonajeCalculado) => void;
  alTirarDano: (ataque: AtaquePersonajeCalculado, versatil?: boolean) => void;
  alTirarCritico: (ataque: AtaquePersonajeCalculado, versatil?: boolean) => void;
  alCambiarCaracteristica?: (ataqueId: string, nuevaCarac: Caracteristica) => void;
}

export const TarjetaAtaquePersonaje: React.FC<TarjetaAtaquePersonajeProps> = ({
  ataque,
  evaluacionCondiciones,
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

  // Selector inteligente de características (D&D 5.5e):
  // - Solo muestra Destreza si el arma es sutil o a distancia.
  // - En armas cuerpo a cuerpo no sutiles, muestra Fuerza y las aptitudes mágicas (INT, SAB, CAR).
  const opcionesAtributo: { valor: Caracteristica; etiqueta: string }[] = React.useMemo(() => {
    if (esSutil) {
      return [
        { valor: "fuerza", etiqueta: "FUE" },
        { valor: "destreza", etiqueta: "DES" },
        { valor: "inteligencia", etiqueta: "INT" },
        { valor: "sabiduria", etiqueta: "SAB" },
        { valor: "carisma", etiqueta: "CAR" }
      ];
    }
    if (esDistancia) {
      return [
        { valor: "destreza", etiqueta: "DES" },
        { valor: "inteligencia", etiqueta: "INT" },
        { valor: "sabiduria", etiqueta: "SAB" },
        { valor: "carisma", etiqueta: "CAR" }
      ];
    }
    return [
      { valor: "fuerza", etiqueta: "FUE" },
      { valor: "inteligencia", etiqueta: "INT" },
      { valor: "sabiduria", etiqueta: "SAB" },
      { valor: "carisma", etiqueta: "CAR" }
    ];
  }, [esSutil, esDistancia]);

  const textoBadgeAccion =
    ataque.tipoAccion === "accionAdicional"
      ? "Acción Adicional"
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
      {/* Lado Izquierdo: Título, Metadatos y Propiedades */}
      <div className={estilos.ladoIzquierdoAtaque}>
        {/* Fila 1: Icono + Nombre + Badges de Tipo y Estado */}
        <div className={estilos.filaTituloAtaque}>
          {ataque.tipo === "Arma" && <Swords size={13} color="#38bdf8" />}
          {ataque.tipo === "Desarmado" && <Zap size={13} color="#94a3b8" />}
          {ataque.tipo === "Conjuro" && <Sparkles size={13} color="#c084fc" />}

          <span className={estilos.nombreAtaque}>{ataque.nombre}</span>

          <span className={`${estilos.badgeAccionTipo} ${claseBadgeAccion}`}>
            {textoBadgeAccion}
          </span>

          {ataque.subtipo && (
            <span className={estilos.badgeAtaqueTipo}>{ataque.subtipo}</span>
          )}

          {ataque.esMagico && (
            <span className={estilos.badgeMagicoAtaque}>
              <Sparkles size={10} /> Mágico
            </span>
          )}
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
              className={estilos.badgeNoCompetente}
              title={`Desventaja en ataque por: ${motivosAtaque}`}
              style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.5)", color: "#f59e0b" }}
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

        {/* Fila 2: Metadatos (Alcance • Impacto • Daño) */}
        <div className={estilos.filaMetadatosAtaque}>
          {ataque.alcance && (
            <span className={estilos.textoAlcance}>
              <Target size={11} /> {ataque.alcance}
            </span>
          )}

          <span>
            {ataque.tieneTiradaAtaque ? "Impacto: " : "Salvación: "}
            <strong className={estilos.impactoMetadatoTexto}>
              {ataque.tieneTiradaAtaque
                ? bonoImpactoTexto
                : `CD ${ataque.cdSalvacion || 10} ${ataque.tipoSalvacion || ""}`}
            </strong>
          </span>

          <span>•</span>

          <span>
            Daño:{" "}
            <strong className={estilos.danoMetadatoTexto}>
              {ataque.esDanoFijo ? `${ataque.dadoDano} (Fijo)` : ataque.dadoDano}
              {ataque.danoVersatil ? ` (${ataque.danoVersatil} 2M)` : ""}
            </strong>{" "}
            <span className={estilos.tipoDanoTexto}>{ataque.tipoDano}</span>
          </span>
        </div>

        {/* Fila 3: Propiedades y Maestría (Tooltips CEF) */}
        {(ataque.propiedades.length > 0 || ataque.maestria) && (
          <div className={estilos.filaPropiedadesAtaqueCompacta}>
            {ataque.maestria && (
              <TooltipUniversal
                titulo={`${ataque.maestria}`}
                contenido={obtenerTooltipMaestria(ataque.maestria)}
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
                contenido={obtenerTooltipPropiedad(prop)}
                posicion="arriba"
                alineacion="inicio"
              >
                <span className={estilos.badgePropiedad}>
                  {prop}
                </span>
              </TooltipUniversal>
            ))}
          </div>
        )}
      </div>

      {/* Lado Derecho: Controles Contextuales + Columna de Acciones */}
      <div className={estilos.ladoDerechoAtaque}>
        {/* Indicador de Munición */}
        {ataque.requiereMunicion && (
          <span
            className={ataque.puedeDisparar ? estilos.badgeMunicion : estilos.badgeMunicionVacia}
            title={
              ataque.puedeDisparar
                ? `${ataque.municionEnContenedor || ataque.municionCantidad} ${ataque.municionNombre || "proyectiles"} listos en ${ataque.nombreContenedor || "Contenedor"}${ataque.municionSueltEnMochila ? ` (+${ataque.municionSueltEnMochila} en mochila)` : ""}${ataque.municionEnCompartimentosExternos ? ` (+${ataque.municionEnCompartimentosExternos} en carreta)` : ""}`
                : (ataque.motivoBloqueo || `Sin ${ataque.municionNombre || "munición"} disponible`)
            }
          >
            {ataque.puedeDisparar ? (
              <>
                <Target size={10} />
                <span>{ataque.municionEnContenedor || ataque.municionCantidad}</span>
              </>
            ) : (
              <>
                <AlertTriangle size={10} />
                <span>0</span>
              </>
            )}
          </span>
        )}
        
        {/* Selector de Atributo (Sutil / Pacto / Aptitud Mágica) */}
        {alCambiarCaracteristica && (ataque.tipo === "Arma" || (ataque.tipo === "Desarmado" && esSutil)) && (
          <div
            className={estilos.bloqueAtributoSelector}
            title={
              esSutil
                ? "Arma Sutil: Elige entre Fuerza o Destreza (por defecto la mayor) o aptitud mágica"
                : esDistancia
                ? "Arma a Distancia: Destreza o aptitud mágica"
                : "Arma Cuerpo a Cuerpo: Fuerza o aptitud mágica (Pacto de la Hoja, etc.)"
            }
          >
            <span className={estilos.etiquetaMicro}>Atributo</span>
            <SelectorDesplegable<Caracteristica>
              valor={ataque.caracteristicaUsada}
              alCambiar={(nuevaCarac) => alCambiarCaracteristica(ataque.id, nuevaCarac)}
              tamano="mini"
              opciones={opcionesAtributo}
            />
          </div>
        )}

        {/* Columna de Acciones (Similar a TarjetaConjuroCompacta) */}
        <div className={estilos.columnaAccionesAtaque}>
          {/* Botón Primario: Atacar (o Daño si no tiene tirada de ataque) */}
          {ataque.tieneTiradaAtaque ? (
            <button
              type="button"
              className={estilos.botonAtacarPrincipal}
              onClick={() => alTirarAtaque(ataque)}
              title={`Tirar Ataque con ${ataque.nombre} en TaleSpire (1d20${bonoImpactoTexto}${
                evaluacionCondiciones?.modoEfectivo === "ventaja"
                  ? " con Ventaja"
                  : evaluacionCondiciones?.modoEfectivo === "desventaja"
                  ? " con Desventaja"
                  : ""
              })`}
            >
              <Target size={11} />
              <span>Atacar</span>
            </button>
          ) : (
            <button
              type="button"
              className={estilos.botonAtacarPrincipal}
              onClick={() => alTirarDano(ataque, false)}
              title={`Tirar Daño con ${ataque.nombre} (${ataque.dadoDano})`}
            >
              <Swords size={11} />
              <span>Daño</span>
            </button>
          )}

          {/* Fila de Acciones Secundarias (Daño, 2M, Crit, Crit 2M) */}
          <div className={estilos.filaAccionesSecundariasAtaque}>
            {ataque.tieneTiradaAtaque && !ataque.esDanoFijo && (
              <button
                type="button"
                className={estilos.botonSecundarioDano}
                onClick={() => alTirarDano(ataque, false)}
                title={ataque.danoVersatil ? `Tirar Daño a 1 Mano (${ataque.dadoDano})` : `Tirar Daño normal (${ataque.dadoDano})`}
              >
                <Swords size={10} />
                <span>{ataque.danoVersatil ? "1M" : "Daño"}</span>
              </button>
            )}

            {!ataque.esDanoFijo && ataque.danoVersatil && (
              <button
                type="button"
                className={estilos.botonSecundarioDano}
                onClick={() => alTirarDano(ataque, true)}
                title={`Tirar Daño a 2 Manos (${ataque.danoVersatil})`}
              >
                <span>2M</span>
              </button>
            )}

            {!ataque.esDanoFijo && ataque.tieneTiradaAtaque && (
              <button
                type="button"
                className={estilos.botonSecundarioCrit}
                onClick={() => alTirarCritico(ataque, false)}
                title={ataque.danoVersatil ? "Tirar Daño Crítico a 1 Mano" : "Tirar Daño Crítico (duplica dados)"}
              >
                <span>{ataque.danoVersatil ? "Crit 1M" : "Crit"}</span>
              </button>
            )}

            {!ataque.esDanoFijo && ataque.tieneTiradaAtaque && ataque.danoVersatil && (
              <button
                type="button"
                className={estilos.botonSecundarioCrit}
                onClick={() => alTirarCritico(ataque, true)}
                title="Tirar Daño Crítico a 2 Manos (duplica dados versátiles)"
              >
                <span>Crit 2M</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
