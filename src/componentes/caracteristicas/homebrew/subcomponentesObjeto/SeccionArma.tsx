import React from "react";
import { TIPOS_DAÑO_DND } from "@/constantes/homebrewConstantes";
import {
  MAESTRIAS_DND_55,
  PROPIEDADES_ARMAS_DND,
  EXPLICACIONES_PROPIEDADES,
  EXPLICACIONES_MAESTRIAS
} from "@/constantes/equipoConstantes";
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
    <div className={`${estilos.bloqueDinamicoForm} ${estilos.bloqueDinamicoArma}`}>
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
          <div className={`${estilos.tooltipContenedor} ${estilos.anchoCompleto}`}>
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
        <div className={`${estilos.filaDobleForm} ${estilos.filaDobleArmaTranslúcida}`}>
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
      <div className={estilos.seccionPropiedadesArma}>
        <div className={`${estilos.labelForm} u-mb-xs`}>Propiedades del Arma:</div>
        <div className={estilos.gridClasesDnd}>
          {PROPIEDADES_ARMAS_DND.map((prop) => {
            const estaChecked = oPropiedadesArma.includes(prop);
            return (
              <div key={prop} className={estilos.tooltipContenedor}>
                <label 
                  className={`${estilos.labelCheckbox} ${estilos.chipPropiedadArma} ${estaChecked ? estilos.chipPropiedadArmaActivo : ""}`}
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
                    className={`${estilos.checkMini} ${estilos.checkOculto}`}
                  />
                  <span className={estaChecked ? estilos.textoChipActivo : estilos.textoChipInactivo}>
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
        <div className={estilos.separadorPropiedadesCustom}>
          <div className={`${estilos.labelForm} u-mb-xs`}>Propiedades Personalizadas:</div>
          <div className={estilos.filaPropiedadCustom}>
            <input
              type="text"
              id="input-propiedad-custom"
              placeholder="Ej. Recarga 6, Fuego Rápido..."
              className={`${estilos.inputForm} ${estilos.inputPropiedadCustom}`}
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
              className={`${estilos.botonAgregarDinamico} ${estilos.botonAgregarChipCompacto}`}
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
            <div className={estilos.contenedorChipsCustom}>
              {oPropiedadesArma.filter(p => !PROPIEDADES_ARMAS_DND.includes(p)).map((prop) => (
                <span 
                  key={prop} 
                  className={estilos.chipPurpuraRemovible}
                >
                  {prop}
                  <X 
                    size={12} 
                    className={estilos.iconoRemoverChip}
                    onClick={() => setOPropiedadesArma((prev) => prev.filter((p) => p !== prop))} 
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daño Versátil y Munición Requerida */}
      <div className={estilos.separadorArmaForm}>
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
          <div className={`${estilos.campoForm} ${estilos.cajaMunicionVinculadaArma}`}>
            <label className={`${estilos.labelForm} u-mb-xs`}>Seleccionar Munición Vinculada:</label>
            <div className={estilos.gridMunicionesVinculadas}>
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
                    className={`${estilos.botonAlternadorProp} ${estaSeleccionado ? estilos.botonAlternadorPropActivo : ""}`}
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
