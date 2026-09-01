import React from "react";
import { Swords, Zap, Sparkles, Target, AlertTriangle } from "lucide-react";
import type { Caracteristica } from "@/tipos";
import type { ResultadoEvaluacionCondiciones } from "@/servicios/procesadorCondiciones";
import { TooltipUniversal, SelectorDesplegable } from "@/componentes/comunes";
import estilos from "./VistaAtaquesJugador.module.css";

export type TipoAccionConsumida = "accion" | "accionAdicional" | "reaccion" | "especial";

export interface AtaquePersonajeCalculado {
  id: string;
  nombre: string;
  tipo: "Arma" | "Desarmado" | "Conjuro" | "Habilidad";
  subtipo?: string;
  tipoAccion: TipoAccionConsumida;
  caracteristicaUsada: Caracteristica;
  bonoAtaque: number;
  dadoDano: string;
  dadoDanoBase: string; // ej. "1d8" o "1"
  modificadorDano: number;
  esDanoFijo: boolean; // Si true, no tira dados de daño
  danoVersatil?: string;
  dadoVersatilBase?: string;
  tipoDano: string;
  alcance?: string;
  propiedades: string[];
  maestria?: string;
  esMagico?: boolean;
  notas?: string;
  tieneTiradaAtaque: boolean;
  cdSalvacion?: number;
  tipoSalvacion?: string;
  requiereMunicion?: boolean;
  municionNombre?: string;
  municionCantidad?: number;
  nombreContenedor?: string;
  tieneContenedor?: boolean;
  municionEnContenedor?: number;
  municionSueltEnMochila?: number;
  municionEnCompartimentosExternos?: number;
  puedeDisparar?: boolean;
  motivoBloqueo?: string;
  esCompetenteConArma?: boolean;
}

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
      className={`${estilos.tarjetaAtaque} ${
        ataque.tipo === "Desarmado"
          ? estilos.tarjetaAtaqueDesarmado
          : ataque.tipoAccion === "accionAdicional"
          ? estilos.tarjetaAtaqueAdicional
          : ataque.tipoAccion === "reaccion"
          ? estilos.tarjetaAtaqueReaccion
          : ""
      }`}
    >
      {/* Fila Superior: Nombre + Badges + Alcance */}
      <div className={estilos.filaSuperiorAtaque}>
        <div className={estilos.grupoTitulo}>
          {ataque.tipo === "Arma" && <Swords size={14} color="#38bdf8" />}
          {ataque.tipo === "Desarmado" && <Zap size={14} color="#94a3b8" />}
          {ataque.tipo === "Conjuro" && <Sparkles size={14} color="#c084fc" />}
          <span className={estilos.nombreAtaque}>{ataque.nombre}</span>
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

        <div className={estilos.grupoTitulo}>
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
                  <span>{ataque.municionEnContenedor || ataque.municionCantidad} {ataque.municionNombre || ""}</span>
                  {ataque.municionSueltEnMochila !== undefined && ataque.municionSueltEnMochila > 0 && (
                    <span className={estilos.subtextoMochilaExcedente}>
                      +{ataque.municionSueltEnMochila}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertTriangle size={10} />
                  <span>
                    {!ataque.tieneContenedor
                      ? `Sin ${ataque.nombreContenedor ? ataque.nombreContenedor.split(" ")[0] : "Contenedor"}`
                      : `0 ${ataque.municionNombre || "Munición"}`}
                  </span>
                </>
              )}
            </span>
          )}
          {ataque.alcance && (
            <span className={estilos.textoAlcance}>
              <Target size={11} /> {ataque.alcance}
            </span>
          )}
          <span className={`${estilos.badgeAccionTipo} ${claseBadgeAccion}`}>
            {textoBadgeAccion}
          </span>
          {ataque.subtipo && (
            <span className={estilos.badgeAtaqueTipo}>{ataque.subtipo}</span>
          )}
        </div>
      </div>

      {/* Fila de Métricas Tácticas y Botones de Lanzamiento */}
      <div className={estilos.filaMetricasAtaque}>
        {/* Bono de Impacto o CD */}
        <div className={estilos.bloqueBonoImpacto}>
          <span className={estilos.etiquetaMicro}>
            {ataque.tieneTiradaAtaque ? "Impacto" : "Salvación"}
          </span>
          <span className={estilos.valorBonoImpacto}>
            {ataque.tieneTiradaAtaque
              ? bonoImpactoTexto
              : `CD ${ataque.cdSalvacion || 10} ${ataque.tipoSalvacion || ""}`}
          </span>
        </div>

        {/* Selector de Característica (Pacto de la Hoja / Atributo Mágico) */}
        {alCambiarCaracteristica && ataque.tipo === "Arma" && (
          <div className={estilos.bloqueAtributoSelector} title="Característica usada para el ataque (Pacto de la Hoja, Shillelagh, etc.)">
            <span className={estilos.etiquetaMicro}>Atributo</span>
            <SelectorDesplegable<Caracteristica>
              valor={ataque.caracteristicaUsada}
              alCambiar={(nuevaCarac) => alCambiarCaracteristica(ataque.id, nuevaCarac)}
              tamano="mini"
              opciones={[
                { valor: "fuerza", etiqueta: "FUE" },
                { valor: "destreza", etiqueta: "DES" },
                { valor: "inteligencia", etiqueta: "INT" },
                { valor: "sabiduria", etiqueta: "SAB" },
                { valor: "carisma", etiqueta: "CAR" }
              ]}
            />
          </div>
        )}

        {/* Daño Principal */}
        <div className={estilos.bloqueDano}>
          <span className={estilos.etiquetaMicro}>Daño</span>
          <div className={estilos.grupoTitulo}>
            <span className={estilos.valorDano}>
              {ataque.esDanoFijo ? `${ataque.dadoDano} (Fijo)` : ataque.dadoDano}
            </span>
            {ataque.danoVersatil && (
              <span className={estilos.textoDanoVersatilBadge}>
                ({ataque.danoVersatil} 2M)
              </span>
            )}
            <span className={estilos.tipoDanoTexto}>{ataque.tipoDano}</span>
          </div>
        </div>

        {/* Botones de Tirada */}
        <div className={estilos.filaAccionesTirada}>
          {ataque.tieneTiradaAtaque && (
            <button
              type="button"
              className={estilos.botonTirarAtaque}
              onClick={() => alTirarAtaque(ataque)}
              title={`Tirar Ataque con ${ataque.nombre} en TaleSpire (1d20${bonoImpactoTexto})`}
            >
              <Target size={11} />
              <span>Atacar</span>
            </button>
          )}

          {!ataque.esDanoFijo && (
            <button
              type="button"
              className={estilos.botonTirarDano}
              onClick={() => alTirarDano(ataque, false)}
              title={ataque.danoVersatil ? `Tirar Daño a 1 Mano (${ataque.dadoDano})` : `Tirar Daño normal (${ataque.dadoDano})`}
            >
              <Swords size={11} />
              <span>{ataque.danoVersatil ? "1M" : "Daño"}</span>
            </button>
          )}

          {!ataque.esDanoFijo && ataque.danoVersatil && (
            <button
              type="button"
              className={`${estilos.botonTirarDano} ${estilos.botonTirarDano2M}`}
              onClick={() => alTirarDano(ataque, true)}
              title={`Tirar Daño a 2 Manos (${ataque.danoVersatil})`}
            >
              <span>2M</span>
            </button>
          )}

          {!ataque.esDanoFijo && ataque.tieneTiradaAtaque && (
            <button
              type="button"
              className={estilos.botonTirarCritico}
              onClick={() => alTirarCritico(ataque, false)}
              title={ataque.danoVersatil ? "Tirar Daño Crítico a 1 Mano" : "Tirar Daño Crítico (duplica dados de impacto)"}
            >
              {ataque.danoVersatil ? "Crit 1M" : "Crítico"}
            </button>
          )}

          {!ataque.esDanoFijo && ataque.tieneTiradaAtaque && ataque.danoVersatil && (
            <button
              type="button"
              className={`${estilos.botonTirarCritico} ${estilos.botonTirarCritico2M}`}
              onClick={() => alTirarCritico(ataque, true)}
              title="Tirar Daño Crítico a 2 Manos (duplica dados versátiles)"
            >
              Crit 2M
            </button>
          )}
        </div>
      </div>

      {/* Propiedades del Arma y Maestría D&D 5.5e con Tooltips en Hover para TaleSpire CEF */}
      {(ataque.propiedades.length > 0 || ataque.maestria) && (
        <div className={estilos.filaPropiedadesAtaque}>
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
  );
};
