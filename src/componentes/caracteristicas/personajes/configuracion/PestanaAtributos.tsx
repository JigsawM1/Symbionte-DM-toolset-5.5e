import React from "react";
import { Settings } from "lucide-react";
import type { PersonajeJugador, Caracteristica } from "@/tipos";
import {
  CARACTERISTICAS_CLAVES,
  DESCRIPCIONES_CARACTERISTICAS,
  obtenerBonoCompetenciaPorNivel
} from "@/constantes";
import { calcularModificadorCaracteristica } from "@/servicios/procesadorDescansos";
import estilos from "./ConfiguracionPersonaje.module.css";

export interface PestanaAtributosProps {
  form: PersonajeJugador;
  alAbrirDetalleCaracteristica: (carac: Caracteristica) => void;
}

/**
 * Pestaña de Atributos:
 * Grid de las 6 características, puntuaciones base, modificadores, overrides fijos, salvaciones y botón para abrir desglose.
 */
export const PestanaAtributos: React.FC<PestanaAtributosProps> = ({
  form,
  alAbrirDetalleCaracteristica
}) => {
  const pb = obtenerBonoCompetenciaPorNivel(form.nivel || 1);

  return (
    <div className={estilos.contenedorPestanaAtributos}>
      {/* Banner Informativo Superior */}
      <div className={estilos.bannerInformativoAtributos}>
        <span className={estilos.textoBannerAtributos}>
          Puntuaciones base, <strong>Overrides Fijos</strong> y <strong>Personalización</strong> de atributos.
        </span>
        <span className={estilos.badgePBAtributos}>
          PB: +{pb}
        </span>
      </div>

      {/* Grid 2 Columnas de Tarjetas de Atributos */}
      <div className={estilos.gridAtributos}>
        {CARACTERISTICAS_CLAVES.map(({ clave }) => {
          const carac = clave as Caracteristica;
          const custom = form.personalizacionesCaracteristicas?.[carac];
          const valorBase = form.caracteristicas?.[carac] ?? 10;
          const override = custom?.valorFijo ?? form.overridesFijos?.[carac] ?? null;
          const esCompetente = !!form.competenciasSalvacion?.[carac];

          const valorEfectivo = override !== null && override !== undefined ? override : valorBase;
          const modBase = calcularModificadorCaracteristica(valorEfectivo);
          const modExtra = custom?.modificadorExtra || 0;
          const modTotal = modBase + modExtra;
          const bonoSalvExtra = custom?.bonoSalvacionExtra || 0;
          const bonoSalvTotal = (esCompetente ? modTotal + pb : modTotal) + bonoSalvExtra;
          const descripcionSalvacion =
            custom?.descripcionPersonalizada || DESCRIPCIONES_CARACTERISTICAS[carac] || "";

          const nombreCompleto =
            carac === "fuerza"
              ? "Fuerza"
              : carac === "destreza"
              ? "Destreza"
              : carac === "constitucion"
              ? "Constitución"
              : carac === "inteligencia"
              ? "Inteligencia"
              : carac === "sabiduria"
              ? "Sabiduría"
              : "Carisma";

          const abreviatura =
            carac === "fuerza"
              ? "FUE"
              : carac === "destreza"
              ? "DES"
              : carac === "constitucion"
              ? "CON"
              : carac === "inteligencia"
              ? "INT"
              : carac === "sabiduria"
              ? "SAB"
              : "CAR";

          const tituloMostrar = custom?.nombrePersonalizado || nombreCompleto;

          return (
            <div
              key={carac}
              className={`${estilos.tarjetaAtributo} ${
                override !== null ? estilos.tarjetaAtributoOverride : ""
              }`}
            >
              <div>
                {/* Cabecera de la Tarjeta */}
                <div className={estilos.cabeceraTarjetaAtributo}>
                  <div className={estilos.infoAtributoContenedor}>
                    <span className={estilos.abreviaturaAtributo}>
                      {abreviatura}
                    </span>
                    <div>
                      <strong className={estilos.tituloAtributo}>
                        {tituloMostrar}
                      </strong>
                      <span className={estilos.subtextoBaseAtributo}>
                        Base: <strong className={estilos.valorBaseResaltado}>{valorBase}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Modificador con Puntuación Final */}
                  <div className={estilos.cajaModificadorScore}>
                    <span
                      className={
                        modTotal >= 0
                          ? estilos.textoModificadorPositivo
                          : estilos.textoModificadorNegativo
                      }
                    >
                      {modTotal >= 0 ? `+${modTotal}` : modTotal}
                    </span>
                    <span className={estilos.valorEfectivoScore}>
                      ({valorEfectivo})
                    </span>
                  </div>
                </div>

                {/* Badges de Salvación, Mod Extra y Override */}
                <div className={estilos.contenedorBadgesAtributo}>
                  {override !== null && (
                    <span className={estilos.badgeOverrideFijo}>
                      Fijo: {override}
                    </span>
                  )}

                  {modExtra !== 0 && (
                    <span className={estilos.badgeModExtra}>
                      Mod: {modExtra >= 0 ? `+${modExtra}` : modExtra}
                    </span>
                  )}

                  <span
                    className={
                      esCompetente
                        ? estilos.badgeSalvacionCompetente
                        : estilos.badgeSalvacionIncompetente
                    }
                  >
                    Salv: {bonoSalvTotal >= 0 ? `+${bonoSalvTotal}` : bonoSalvTotal} {esCompetente ? "(+PB)" : ""}
                  </span>
                </div>

                {/* Caja de Uso de Salvación */}
                <div className={estilos.cajaUsoSalvacion}>
                  <span className={estilos.textoUsoSalvacion}>
                    {descripcionSalvacion}
                  </span>
                </div>
              </div>

              {/* Botón de Configuración */}
              <button
                type="button"
                onClick={() => alAbrirDetalleCaracteristica(carac)}
                className={estilos.botonConfigurarAtributo}
              >
                <Settings size={12} color="#94a3b8" />
                Configurar / Desglose
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
