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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Banner Informativo Superior */}
      <div className={estilos.bannerInformativoAtributos}>
        <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
          Puntuaciones base, <strong>Overrides Fijos</strong> y <strong>Personalización</strong> de atributos.
        </span>
        <span
          style={{
            fontSize: 11,
            backgroundColor: "#161f2e",
            color: "#cbd5e1",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            padding: "2px 8px",
            borderRadius: 4,
            fontWeight: 700,
            whiteSpace: "nowrap"
          }}
        >
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={estilos.abreviaturaAtributo}>
                      {abreviatura}
                    </span>
                    <div>
                      <strong style={{ fontSize: 13, color: "#f1f5f9", display: "block" }}>
                        {tituloMostrar}
                      </strong>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>
                        Base: <strong style={{ color: "#cbd5e1" }}>{valorBase}</strong>
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
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                      ({valorEfectivo})
                    </span>
                  </div>
                </div>

                {/* Badges de Salvación, Mod Extra y Override */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
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
                  <span style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.35, display: "block" }}>
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
