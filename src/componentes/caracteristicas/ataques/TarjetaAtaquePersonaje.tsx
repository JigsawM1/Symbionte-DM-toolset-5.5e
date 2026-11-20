import React from "react";
import {
  Swords,
  Sparkles,
  Target,
  AlertTriangle,
  Dices,
  Shield,
  Hourglass
} from "lucide-react";
import type { Caracteristica, AtaquePersonajeCalculado } from "@/tipos";
import type { ResultadoEvaluacionCondiciones } from "@/servicios/procesadorCondiciones";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import {
  obtenerInfoMaestria,
  obtenerInfoPropiedadArma,
  normalizarClave
} from "@/servicios/resolutorPropiedades";
import {
  construirSubtituloAtaque,
  obtenerEtiquetaPropiedadCompacta,
  obtenerEtiquetaMagica,
  calcularFormulaCriticoVisual,
  obtenerResumenMaestriaVisual,
  type IconoMaestria
} from "./utilesTarjetaAtaque";
import { BloqueDanoTarjeta } from "./BloqueDanoTarjeta";
import estilos from "./TarjetaAtaquePersonaje.module.css";

interface TarjetaAtaquePersonajeProps {
  ataque: AtaquePersonajeCalculado;
  evaluacionCondiciones?: ResultadoEvaluacionCondiciones;
  permiteDanoAdicional?: boolean;
  modoCritico?: boolean;
  dadosExtraCritico?: number;
  modAtributoAtaque?: number;
  alTirarAtaque: (ataque: AtaquePersonajeCalculado) => void;
  alTirarDano: (ataque: AtaquePersonajeCalculado, versatil?: boolean | "adicional") => void;
  alCambiarCaracteristica?: (ataqueId: string, nuevaCarac: Caracteristica) => void;
  alAjustarMunicion?: (ataque: AtaquePersonajeCalculado, delta: 1 | -1) => void;
}

const ETIQUETA_ATRIBUTO: Record<Caracteristica, string> = {
  fuerza: "FUE",
  destreza: "DES",
  constitucion: "CON",
  inteligencia: "INT",
  sabiduria: "SAB",
  carisma: "CAR"
};

const OPCIONES_MAGICAS: { valor: Caracteristica; etiqueta: string }[] = [
  { valor: "inteligencia", etiqueta: "INT" },
  { valor: "sabiduria", etiqueta: "SAB" },
  { valor: "carisma", etiqueta: "CAR" }
];

const OPCIONES_CAC = [{ valor: "fuerza" as const, etiqueta: "FUE" }, ...OPCIONES_MAGICAS];
const OPCIONES_DISTANCIA = [{ valor: "destreza" as const, etiqueta: "DES" }, ...OPCIONES_MAGICAS];
const OPCIONES_SUTIL = [
  { valor: "fuerza" as const, etiqueta: "FUE" },
  { valor: "destreza" as const, etiqueta: "DES" },
  ...OPCIONES_MAGICAS
];

const ICONOS_MAESTRIA: Record<IconoMaestria, React.ReactNode> = {
  shield: <Shield size={11} aria-hidden="true" />,
  hourglass: <Hourglass size={11} aria-hidden="true" />,
  swords: <Swords size={11} aria-hidden="true" />,
  sparkles: <Sparkles size={11} aria-hidden="true" />
};

export const TarjetaAtaquePersonaje: React.FC<TarjetaAtaquePersonajeProps> = React.memo(({
  ataque,
  evaluacionCondiciones,
  permiteDanoAdicional = false,
  modoCritico = false,
  dadosExtraCritico = 0,
  modAtributoAtaque = 0,
  alTirarAtaque,
  alTirarDano,
  alCambiarCaracteristica,
  alAjustarMunicion
}) => {
  const bonoImpactoTexto = ataque.bonoAtaque >= 0 ? `+${ataque.bonoAtaque}` : `${ataque.bonoAtaque}`;
  const formulaImpacto = `1d20 ${ataque.bonoAtaque >= 0 ? "+" : "-"} ${Math.abs(ataque.bonoAtaque)}`;
  const motivosAtaque = [
    ...(evaluacionCondiciones?.motivosDesventaja || []),
    ...(evaluacionCondiciones?.motivosVentaja || []),
    ...(evaluacionCondiciones?.motivosModificadores || [])
  ].join(", ");

  const esSutil =
    ataque.esSutil ||
    ataque.propiedades?.some((p) => {
      const norm = normalizarClave(p);
      return norm.includes("sutil") || norm.includes("finesse");
    });

  const esDistancia =
    ataque.esDistancia ||
    normalizarClave(ataque.subtipo || "").includes("distancia") ||
    ataque.propiedades?.some((p) => {
      const norm = normalizarClave(p);
      return norm.includes("municion") || norm.includes("distancia");
    });

  const opcionesAtributo = esSutil ? OPCIONES_SUTIL : esDistancia ? OPCIONES_DISTANCIA : OPCIONES_CAC;
  const subtitulo = construirSubtituloAtaque(ataque.subtipo, ataque.alcance);
  const etiquetaMagica = obtenerEtiquetaMagica(ataque.nombre, ataque.esMagico);
  const resumenMaestria = ataque.maestria
    ? obtenerResumenMaestriaVisual(ataque.maestria, modAtributoAtaque)
    : null;

  const esNoCompetente = ataque.tipo === "Arma" && ataque.esCompetenteConArma === false;
  const esDanoFijoPasivo = ataque.esDanoFijo && !permiteDanoAdicional;
  const tieneVersatil = !ataque.esDanoFijo && Boolean(ataque.danoVersatil);
  const tieneDanoAdic = !ataque.esDanoFijo && !tieneVersatil && Boolean(ataque.danoAccionAdicional);
  const tieneDobleDano = tieneVersatil || tieneDanoAdic;
  const criticoAplicable = modoCritico && !esDanoFijoPasivo;

  const formulaPrincipalVisible = criticoAplicable
    ? calcularFormulaCriticoVisual(ataque.dadoDanoBase || ataque.dadoDano, ataque.modificadorDano, dadosExtraCritico)
    : ataque.dadoDano;

  const formulaSecundariaVisible = tieneVersatil
    ? criticoAplicable
      ? calcularFormulaCriticoVisual(ataque.dadoVersatilBase || ataque.danoVersatil || "", ataque.modificadorDano, dadosExtraCritico)
      : ataque.danoVersatil || ""
    : tieneDanoAdic
    ? criticoAplicable
      ? calcularFormulaCriticoVisual(ataque.dadoAccionAdicionalBase || ataque.danoAccionAdicional || "", ataque.modificadorDano, dadosExtraCritico)
      : ataque.danoAccionAdicional || ""
    : "";

  const permiteCambiarAtributo = Boolean(
    alCambiarCaracteristica && (ataque.tipo === "Arma" || (ataque.tipo === "Desarmado" && esSutil))
  );

  const claseEstadoTarjeta =
    ataque.tipo === "Desarmado"
      ? estilos.tarjetaDesarmado
      : esNoCompetente
      ? estilos.tarjetaAlerta
      : ataque.tipoAccion === "accionAdicional"
      ? estilos.tarjetaAdicional
      : ataque.tipoAccion === "reaccion"
      ? estilos.tarjetaReaccion
      : "";

  const cantidadMunicionActual = ataque.municionEnContenedor ?? ataque.municionCantidad ?? 0;
  const capacidadMunicion = ataque.municionCapacidadContenedor || 0;
  const puedeAjustarMunicion = Boolean(alAjustarMunicion && ataque.municionItemId);

  return (
    <article
      className={`${estilos.tarjeta} ${claseEstadoTarjeta}`}
      data-critico={criticoAplicable ? "true" : undefined}
    >
      {/* Fila 1: Nombre, chips clave, subtítulo y controles de cabecera (Atributo + Maestría) */}
      <div className={estilos.cabeceraTarjeta}>
        <div className={estilos.infoArma}>
          <div className={estilos.lineaTitulo}>
            <span className={estilos.nombreArma}>{ataque.nombre}</span>

            {ataque.tipoAccion === "accionAdicional" && (
              <span className={`${estilos.chipBase} ${estilos.chipAccionAdicional}`}>Acción Adicional</span>
            )}
            {ataque.tipoAccion === "reaccion" && (
              <span className={`${estilos.chipBase} ${estilos.chipReaccion}`}>Reacción</span>
            )}
            {etiquetaMagica && (
              <span className={`${estilos.chipBase} ${estilos.chipMagico}`}>{etiquetaMagica}</span>
            )}
            {esNoCompetente && (
              <span
                className={`${estilos.chipBase} ${estilos.chipAlerta}`}
                title="No eres competente con esta arma. No sumas tu bono de competencia al ataque."
              >
                <AlertTriangle size={10} aria-hidden="true" />
                <span>No Competente</span>
              </span>
            )}
            {evaluacionCondiciones?.tieneDesventaja && (
              <span
                className={`${estilos.chipBase} ${estilos.chipAlerta}`}
                title={`Desventaja en ataque por: ${motivosAtaque}`}
              >
                <AlertTriangle size={10} aria-hidden="true" />
                <span>Desventaja</span>
              </span>
            )}
            {evaluacionCondiciones?.tieneVentaja && !evaluacionCondiciones?.tieneDesventaja && (
              <span
                className={`${estilos.chipBase} ${estilos.chipVentaja}`}
                title={`Ventaja en ataque por: ${motivosAtaque}`}
              >
                <Sparkles size={10} aria-hidden="true" />
                <span>Ventaja</span>
              </span>
            )}
            {ataque.propiedades.map((prop) => {
              const etiquetaCorta = obtenerEtiquetaPropiedadCompacta(prop, ataque.alcance);
              return (
                <TooltipUniversal
                  key={prop}
                  titulo={prop}
                  contenido={obtenerInfoPropiedadArma(prop).textoCompleto}
                  posicion="arriba"
                  alineacion="inicio"
                >
                  <span
                    className={`${estilos.chipBase} ${estilos.chipPropiedad} ${
                      normalizarClave(etiquetaCorta).includes("pesada") ? estilos.chipPesada : ""
                    }`}
                  >
                    {etiquetaCorta}
                  </span>
                </TooltipUniversal>
              );
            })}
          </div>
          {subtitulo && <span className={estilos.subtituloArma}>{subtitulo}</span>}
        </div>

        {/* Controles desacoplados en cabecera: Selector de atributo + Maestría D&D 5.5e */}
        <div className={estilos.cabeceraDerecha}>
          {permiteCambiarAtributo && alCambiarCaracteristica ? (
            <div
              className={estilos.selectorAtributoWrapper}
              title={
                esSutil
                  ? "Arma Sutil: elige Fuerza, Destreza o aptitud mágica"
                  : esDistancia
                  ? "Arma a Distancia: Destreza o aptitud mágica"
                  : "Arma Cuerpo a Cuerpo: Fuerza o aptitud mágica"
              }
            >
              <SelectorDesplegable<Caracteristica>
                valor={ataque.caracteristicaUsada}
                alCambiar={(nuevaCarac) => alCambiarCaracteristica(ataque.id, nuevaCarac)}
                tamano="mini"
                opciones={opcionesAtributo}
              />
            </div>
          ) : (
            <span
              className={estilos.badgeAtributoFijo}
              title={`Atributo de ataque: ${ETIQUETA_ATRIBUTO[ataque.caracteristicaUsada]}`}
            >
              {ETIQUETA_ATRIBUTO[ataque.caracteristicaUsada]}
            </span>
          )}

          {ataque.maestria && resumenMaestria && (
            <TooltipUniversal
              titulo={ataque.maestria}
              contenido={obtenerInfoMaestria(ataque.maestria).textoCompleto}
              posicion="arriba"
              alineacion="fin"
            >
              <span className={estilos.pillMaestria}>
                {ICONOS_MAESTRIA[resumenMaestria.icono]}
                <span>{resumenMaestria.etiqueta}</span>
              </span>
            </TooltipUniversal>
          )}
        </div>
      </div>

      {/* Fila 2: Bloques de tirada directa (IMPACTO | DAÑO) */}
      <div className={estilos.gridTirada} data-doble-dano={tieneDobleDano ? "true" : undefined}>
        {ataque.tieneTiradaAtaque ? (
          <button
            type="button"
            className={estilos.bloqueImpacto}
            onClick={() => alTirarAtaque(ataque)}
            aria-label={`Tirar impacto con ${ataque.nombre} (${formulaImpacto})`}
            title={`Tirar Ataque con ${ataque.nombre} en TaleSpire (1d20${bonoImpactoTexto}${
              evaluacionCondiciones?.modoEfectivo === "ventaja"
                ? " con Ventaja"
                : evaluacionCondiciones?.modoEfectivo === "desventaja"
                ? " con Desventaja"
                : ""
            })`}
          >
            <span className={estilos.columnaMetaBloque}>
              <span className={estilos.etiquetaBloque}>Impacto</span>
              <span className={estilos.formulaSecundariaImpacto}>{formulaImpacto}</span>
            </span>
            <span className={estilos.grupoValorImpacto}>
              <span className={estilos.valorImpactoXL}>{bonoImpactoTexto}</span>
              <Dices size={15} aria-hidden="true" />
            </span>
          </button>
        ) : (
          <div className={estilos.bloqueImpactoPasivo}>
            <span className={estilos.columnaMetaBloque}>
              <span className={estilos.etiquetaBloque}>Salvación</span>
              <span className={estilos.formulaSecundariaImpacto}>
                {ataque.tipoSalvacion || "Fija"}
              </span>
            </span>
            <span className={estilos.valorImpactoXL}>CD {ataque.cdSalvacion || 10}</span>
          </div>
        )}

        <BloqueDanoTarjeta
          ataque={ataque}
          esDanoFijoPasivo={esDanoFijoPasivo}
          tieneVersatil={tieneVersatil}
          tieneDobleDano={tieneDobleDano}
          criticoAplicable={criticoAplicable}
          formulaPrincipal={formulaPrincipalVisible}
          formulaSecundaria={formulaSecundariaVisible}
          notaFallo={resumenMaestria?.notaFallo}
          alTirarDano={alTirarDano}
        />
      </div>

      {/* Fila 3 opcional: Barra de Munición con ajuste rápido (-1 / +1) */}
      {ataque.requiereMunicion && (
        <div
          className={estilos.barraMunicion}
          data-agotada={!ataque.puedeDisparar ? "true" : undefined}
          title={
            ataque.puedeDisparar
              ? `${cantidadMunicionActual} ${ataque.municionNombre || "proyectiles"} listos en ${ataque.nombreContenedor || "Contenedor"}${
                  ataque.municionSueltEnMochila ? ` (+${ataque.municionSueltEnMochila} en mochila)` : ""
                }${
                  ataque.municionEnCompartimentosExternos
                    ? ` (+${ataque.municionEnCompartimentosExternos} en carreta)`
                    : ""
                }`
              : ataque.motivoBloqueo || `Sin ${ataque.municionNombre || "munición"} disponible`
          }
        >
          <span className={estilos.infoMunicion}>
            {ataque.puedeDisparar ? (
              <Target size={12} aria-hidden="true" />
            ) : (
              <AlertTriangle size={12} aria-hidden="true" />
            )}
            <span>
              {ataque.nombreContenedor
                ? `${ataque.nombreContenedor} (${ataque.municionNombre || "Munición"}):`
                : `${ataque.municionNombre || "Munición"}:`}
            </span>
            <span className={estilos.contadorMunicion}>{cantidadMunicionActual}</span>
            {capacidadMunicion > 0 && (
              <span className={estilos.capacidadMunicion}>/ {capacidadMunicion}</span>
            )}
          </span>

          {alAjustarMunicion && (
            <div className={estilos.controlesMunicion}>
              <button
                type="button"
                className={estilos.botonMunicion}
                disabled={!puedeAjustarMunicion || cantidadMunicionActual <= 0}
                onClick={() => alAjustarMunicion(ataque, -1)}
                aria-label={`Restar 1 ${ataque.municionNombre || "munición"} de ${ataque.nombre}`}
                title="Descontar 1 proyectil del inventario"
              >
                -1
              </button>
              <button
                type="button"
                className={estilos.botonMunicion}
                disabled={!puedeAjustarMunicion}
                onClick={() => alAjustarMunicion(ataque, 1)}
                aria-label={`Sumar 1 ${ataque.municionNombre || "munición"} de ${ataque.nombre}`}
                title={
                  puedeAjustarMunicion
                    ? "Recuperar 1 proyectil al inventario"
                    : "Añade proyectiles desde la pestaña Inventario"
                }
              >
                +1
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
});

TarjetaAtaquePersonaje.displayName = "TarjetaAtaquePersonaje";
