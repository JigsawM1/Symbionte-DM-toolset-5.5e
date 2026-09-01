import React from "react";
import { TIPOS_DAÑO_DND } from "@/constantes/homebrewConstantes";
import {
  MAESTRIAS_DND_55,
  PROPIEDADES_ARMAS_DND,
  EXPLICACIONES_PROPIEDADES,
  EXPLICACIONES_MAESTRIAS
} from "@/constantes/objetoConstantes";
import { SelectorDesplegable } from "@/componentes/comunes";
import { X } from "lucide-react";

const OPCIONES_TIPO_ATAQUE = [
  { valor: "Cuerpo a Cuerpo", etiqueta: "Cuerpo a Cuerpo" },
  { valor: "A Distancia", etiqueta: "A Distancia" }
];

const OPCIONES_MAESTRIAS = MAESTRIAS_DND_55.map((m) => ({ valor: m, etiqueta: m }));

const OPCIONES_TIPO_DANO_ARMA = TIPOS_DAÑO_DND.map((t) => ({
  valor: t,
  etiqueta: t.charAt(0).toUpperCase() + t.slice(1)
}));

interface Props {
  oTipoAtaque: "Cuerpo a Cuerpo" | "A Distancia";
  setOTipoAtaque: (tipo: "Cuerpo a Cuerpo" | "A Distancia") => void;
  oMaestria: string;
  setOMaestria: (maestria: string) => void;
  oDadoDano: string;
  setODadoDano: (dado: string) => void;
  oTipoDano: string;
  setOTipoDano: (tipo: string) => void;
  oAlcanceNormal: number | "";
  setOAlcanceNormal: (alcance: number | "") => void;
  oAlcanceLargo: number | "";
  setOAlcanceLargo: (alcance: number | "") => void;
  oPropiedadesArma: string[];
  setOPropiedadesArma: React.Dispatch<React.SetStateAction<string[]>>;
  oDanoVersatil: string;
  setODanoVersatil: (dano: string) => void;
  oMunicionRequerida: boolean;
  oAmmunitionIndex: string;
  setOAmmunitionIndex: (id: string) => void;
  setOAmmunitionName: (nombre: string) => void;
  estilos: Record<string, string>;
}

export const SeccionArma: React.FC<Props> = ({
  oTipoAtaque,
  setOTipoAtaque,
  oMaestria,
  setOMaestria,
  oDadoDano,
  setODadoDano,
  oTipoDano,
  setOTipoDano,
  oAlcanceNormal,
  setOAlcanceNormal,
  oAlcanceLargo,
  setOAlcanceLargo,
  oPropiedadesArma,
  setOPropiedadesArma,
  oDanoVersatil,
  setODanoVersatil,
  oMunicionRequerida,
  oAmmunitionIndex,
  setOAmmunitionIndex,
  setOAmmunitionName,
  estilos,
}) => {
  return (
    <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(0, 245, 212, 0.25)" }}>
      <div className={estilos.tituloBloqueDinamico}>
        <span>PROPIEDADES DEL ARMA</span>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Tipo de Ataque:</label>
          <SelectorDesplegable
            valor={oTipoAtaque}
            alCambiar={(val) => setOTipoAtaque(val as "Cuerpo a Cuerpo" | "A Distancia")}
            opciones={OPCIONES_TIPO_ATAQUE}
          />
        </div>

        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Maestría de Arma:</label>
          <div className={estilos.tooltipContenedor} style={{ width: "100%" }}>
            <SelectorDesplegable
              valor={oMaestria}
              alCambiar={(val) => setOMaestria(val)}
              opciones={OPCIONES_MAESTRIAS}
              placeholder="Seleccionar maestría..."
            />
            {oMaestria && EXPLICACIONES_MAESTRIAS[oMaestria] && (
              <div className={`${estilos.tooltipFlotante} ${estilos.tooltipMaestria}`}>
                <span className={estilos.tooltipTitulo}>{oMaestria}</span>
                <span className={estilos.tooltipTexto}>{EXPLICACIONES_MAESTRIAS[oMaestria]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Dados de Daño:</label>
          <input
            type="text"
            value={oDadoDano}
            onChange={(e) => setODadoDano(e.target.value)}
            placeholder="Ej. 1d8, 2d6, 1d10"
            className={estilos.inputForm}
          />
        </div>

        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Tipo de Daño:</label>
          <SelectorDesplegable
            valor={oTipoDano}
            alCambiar={(val) => setOTipoDano(val)}
            opciones={OPCIONES_TIPO_DANO_ARMA}
          />
        </div>
      </div>

      {/* RANGOS DE ALCANCE */}
      {(oTipoAtaque === "A Distancia" || oPropiedadesArma.includes("Arrojadiza (Thrown)")) && (
        <div className={estilos.filaDobleForm} style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "5px", border: "1px dashed rgba(255,255,255,0.06)" }}>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Alcance Normal (pies):</label>
            <input
              type="number"
              value={oAlcanceNormal}
              onChange={(e) => setOAlcanceNormal(e.target.value === "" ? "" : parseInt(e.target.value))}
              placeholder="Ej. 20"
              className={estilos.inputForm}
            />
          </div>
          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Alcance Máximo (pies):</label>
            <input
              type="number"
              value={oAlcanceLargo}
              onChange={(e) => setOAlcanceLargo(e.target.value === "" ? "" : parseInt(e.target.value))}
              placeholder="Ej. 60"
              className={estilos.inputForm}
            />
          </div>
        </div>
      )}

      {/* PROPIEDADES DE ARMA CON TOOLTIPS */}
      <div style={{ marginTop: "6px" }}>
        <div className={estilos.labelForm} style={{ marginBottom: "8px" }}>Propiedades del Arma:</div>
        <div className={estilos.gridClasesDnd}>
          {PROPIEDADES_ARMAS_DND.map((prop) => {
            const estaChecked = oPropiedadesArma.includes(prop);
            return (
              <div key={prop} className={estilos.tooltipContenedor}>
                <label 
                  className={estilos.labelCheckbox}
                  style={{
                    backgroundColor: estaChecked ? "rgba(0, 245, 212, 0.08)" : "transparent",
                    border: estaChecked ? "1px solid var(--color-borde-cian)" : "1px solid var(--color-borde-brutal)",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    position: "relative"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={estaChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setOPropiedadesArma((prev) => [...prev, prop]);
                      } else {
                        setOPropiedadesArma((prev) => prev.filter((p) => p !== prop));
                      }
                    }}
                    className={estilos.checkMini}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: "11px", color: estaChecked ? "var(--color-texto-principal)" : "var(--color-texto-secundario)" }}>
                    {prop.split("(")[0].trim()}
                  </span>
                </label>
                {EXPLICACIONES_PROPIEDADES[prop] && (
                  <div className={estilos.tooltipFlotante}>
                    <span className={estilos.tooltipTitulo}>{prop}</span>
                    <span className={estilos.tooltipTexto}>{EXPLICACIONES_PROPIEDADES[prop]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Propiedades Personalizadas */}
        <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255, 255, 255, 0.05)", paddingTop: "12px" }}>
          <div className={estilos.labelForm} style={{ marginBottom: "6px" }}>Propiedades Personalizadas:</div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <input
              type="text"
              id="input-propiedad-custom"
              placeholder="Ej. Recarga 6, Fuego Rápido..."
              className={estilos.inputForm}
              style={{ flex: 1, fontSize: "12px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && !oPropiedadesArma.includes(val)) {
                    setOPropiedadesArma((prev) => [...prev, val]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
            <button
              type="button"
              className={estilos.botonAgregarDinamico}
              style={{ padding: "4px 10px", fontSize: "11px", height: "auto" }}
              onClick={() => {
                const input = document.getElementById("input-propiedad-custom") as HTMLInputElement;
                const val = input?.value.trim();
                if (val && !oPropiedadesArma.includes(val)) {
                  setOPropiedadesArma((prev) => [...prev, val]);
                  input.value = "";
                }
              }}
            >
              + Añadir
            </button>
          </div>

          {oPropiedadesArma.filter(p => !PROPIEDADES_ARMAS_DND.includes(p)).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {oPropiedadesArma.filter(p => !PROPIEDADES_ARMAS_DND.includes(p)).map((prop) => (
                <span 
                  key={prop} 
                  style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "6px", 
                    background: "rgba(168, 85, 247, 0.15)", 
                    border: "1px solid hsl(270, 70%, 60%)", 
                    color: "hsl(270, 100%, 85%)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "500"
                  }}
                >
                  {prop}
                  <X 
                    size={12} 
                    style={{ cursor: "pointer", color: "var(--color-borde-cian)" }} 
                    onClick={() => setOPropiedadesArma((prev) => prev.filter((p) => p !== prop))} 
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daño Versátil y Munición Requerida */}
      <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(0, 245, 212, 0.1)", paddingTop: "12px" }}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Daño Versátil (A dos manos):</label>
          <input
            type="text"
            value={oDanoVersatil}
            onChange={(e) => setODanoVersatil(e.target.value)}
            placeholder="Ej. 1d10, 1d12... (Opcional)"
            className={estilos.inputForm}
          />
        </div>
        
        {oMunicionRequerida && (
          <div className={estilos.campoForm} style={{ marginTop: "10px", backgroundColor: "rgba(0, 245, 212, 0.03)", padding: "10px", borderRadius: "5px", border: "1px dashed rgba(0, 245, 212, 0.15)" }}>
            <label className={estilos.labelForm} style={{ marginBottom: "8px" }}>Seleccionar Munición Vinculada:</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {[
                { id: "arrows", label: "Flechas" },
                { id: "bolts", label: "Virotes" },
                { id: "bullets-sling", label: "Balas de Honda" },
                { id: "bullets-firearm", label: "Balas de Arma de Fuego" },
                { id: "needles", label: "Agujas de Cerbatana" }
              ].map((item) => {
                const estaSeleccionado = oAmmunitionIndex === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (estaSeleccionado) {
                        setOAmmunitionIndex("");
                        setOAmmunitionName("");
                      } else {
                        setOAmmunitionIndex(item.id);
                        setOAmmunitionName(item.label);
                      }
                    }}
                    className={estilos.botonAlternadorProp}
                    style={{
                      padding: "6px 8px",
                      fontSize: "11px",
                      textAlign: "center",
                      border: estaSeleccionado ? "1.5px solid var(--color-borde-cian)" : "1px solid var(--color-borde-brutal)",
                      background: estaSeleccionado ? "rgba(0, 245, 212, 0.12)" : "transparent",
                      color: estaSeleccionado ? "var(--color-texto-principal)" : "var(--color-texto-secundario)",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
