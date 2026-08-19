import React from "react";
import { Rareza, SubcategoriaEquipo } from "@/almacen/usarAlmacenDM";
import { TipoMoneda } from "@/tipos";
import { COLORES_RAREZA_HSL } from "@/constantes/objetoConstantes";
import { SelectorDesplegable } from "@/componentes/comunes";
import { Scale, Coins, X } from "lucide-react";

const OPCIONES_TIPO_PRINCIPAL = [
  { valor: "Arma", etiqueta: "Arma" },
  { valor: "Armadura", etiqueta: "Armadura" },
  { valor: "Equipo de Aventuras", etiqueta: "Equipo de Aventuras" }
];

const OPCIONES_SUBCAT_ARMA = [
  { valor: "Sencilla", etiqueta: "Sencilla" },
  { valor: "Marcial", etiqueta: "Marcial" },
  { valor: "De Fuego", etiqueta: "De Fuego" }
];

const OPCIONES_SUBCAT_ARMADURA = [
  { valor: "Ligera", etiqueta: "Ligera" },
  { valor: "Mediana", etiqueta: "Mediana" },
  { valor: "Pesada", etiqueta: "Pesada" },
  { valor: "Escudo", etiqueta: "Escudo" }
];

const OPCIONES_SUBCAT_EQUIPO = [
  { valor: "Maravilloso", etiqueta: "Objeto Maravilloso" },
  { valor: "Consumible", etiqueta: "Consumible / Poción" },
  { valor: "Munición", etiqueta: "Munición" },
  { valor: "Herramienta", etiqueta: "Herramienta" },
  { valor: "Instrumento", etiqueta: "Instrumento" },
  { valor: "Paquete", etiqueta: "Paquete / Contenedor" }
];

const OPCIONES_RAREZA = (["Común", "Poco Común", "Raro", "Muy Raro", "Legendario", "Artefacto"] as Rareza[]).map((r) => ({
  valor: r,
  etiqueta: r,
  color: COLORES_RAREZA_HSL[r]
}));

const OPCIONES_MONEDA: { valor: TipoMoneda; etiqueta: string; color: string }[] = [
  { valor: "PC", etiqueta: "PC (Cobre)", color: "#b87333" },
  { valor: "PP", etiqueta: "PP (Plata)", color: "#aaa9ad" },
  { valor: "PE", etiqueta: "PE (Electro)", color: "#e5e4e2" },
  { valor: "PO", etiqueta: "PO (Oro)", color: "#ffd700" },
  { valor: "PPT", etiqueta: "PPT (Platino)", color: "#e5e4e2" }
];

interface Props {
  oNombre: string;
  setONombre: (valor: string) => void;
  oTipoPrincipal: "Arma" | "Armadura" | "Equipo de Aventuras";
  setOTipoPrincipal: (tipo: "Arma" | "Armadura" | "Equipo de Aventuras") => void;
  oSubcategoriaArma: "Sencilla" | "Marcial" | "De Fuego";
  setOSubcategoriaArma: (sub: "Sencilla" | "Marcial" | "De Fuego") => void;
  oSubcategoriaArmadura: "Ligera" | "Mediana" | "Pesada" | "Escudo";
  alCambiarSubcategoriaArmadura: (sub: "Ligera" | "Mediana" | "Pesada" | "Escudo") => void;
  oSubcategoriaEquipo: SubcategoriaEquipo;
  setOSubcategoriaEquipo: (sub: SubcategoriaEquipo) => void;
  oRareza: Rareza;
  alCambiarRareza: (rareza: Rareza) => void;
  oPesoLb: number;
  setOPesoLb: (peso: number) => void;
  oCostoCantidad: number;
  setOCostoCantidad: (costo: number) => void;
  oCostoUnidad: TipoMoneda;
  setOCostoUnidad: (unidad: TipoMoneda) => void;
  oEquipable: boolean;
  setOEquipable: (equipable: boolean) => void;
  oDescripcion: string;
  setODescripcion: (desc: string) => void;
  oPropiedades: string;
  setOPropiedades: (prop: string) => void;
  oArtesaniaTaller: string;
  setOArtesaniaTaller: (taller: string) => void;
  oArtesaniaComponentes: string[];
  oNuevoComponente: string;
  setONuevoComponente: (comp: string) => void;
  agregarComponenteArtesania: () => void;
  eliminarComponenteArtesaniaIdx: (idx: number) => void;
  estilos: Record<string, string>;
}

export const SeccionDatosGenerales: React.FC<Props> = ({
  oNombre,
  setONombre,
  oTipoPrincipal,
  setOTipoPrincipal,
  oSubcategoriaArma,
  setOSubcategoriaArma,
  oSubcategoriaArmadura,
  alCambiarSubcategoriaArmadura,
  oSubcategoriaEquipo,
  setOSubcategoriaEquipo,
  oRareza,
  alCambiarRareza,
  oPesoLb,
  setOPesoLb,
  oCostoCantidad,
  setOCostoCantidad,
  oCostoUnidad,
  setOCostoUnidad,
  oEquipable,
  setOEquipable,
  oDescripcion,
  setODescripcion,
  oPropiedades,
  setOPropiedades,
  oArtesaniaTaller,
  setOArtesaniaTaller,
  oArtesaniaComponentes,
  oNuevoComponente,
  setONuevoComponente,
  agregarComponenteArtesania,
  eliminarComponenteArtesaniaIdx,
  estilos,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Nombre del Objeto:</label>
          <input
            type="text"
            value={oNombre}
            onChange={(e) => setONombre(e.target.value)}
            placeholder="Ej. Espada Flamígera"
            className={estilos.inputForm}
            required
          />
        </div>
        
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Categoría Principal:</label>
          <SelectorDesplegable
            valor={oTipoPrincipal}
            alCambiar={(val) => setOTipoPrincipal(val as "Arma" | "Armadura" | "Equipo de Aventuras")}
            opciones={OPCIONES_TIPO_PRINCIPAL}
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Subcategoría:</label>
          {oTipoPrincipal === "Arma" && (
            <SelectorDesplegable
              valor={oSubcategoriaArma}
              alCambiar={(val) => setOSubcategoriaArma(val as "Sencilla" | "Marcial" | "De Fuego")}
              opciones={OPCIONES_SUBCAT_ARMA}
            />
          )}
          {oTipoPrincipal === "Armadura" && (
            <SelectorDesplegable
              valor={oSubcategoriaArmadura}
              alCambiar={(val) => alCambiarSubcategoriaArmadura(val as "Ligera" | "Mediana" | "Pesada" | "Escudo")}
              opciones={OPCIONES_SUBCAT_ARMADURA}
            />
          )}
          {oTipoPrincipal === "Equipo de Aventuras" && (
            <SelectorDesplegable
              valor={oSubcategoriaEquipo}
              alCambiar={(val) => setOSubcategoriaEquipo(val as SubcategoriaEquipo)}
              opciones={OPCIONES_SUBCAT_EQUIPO}
            />
          )}
        </div>

        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Rareza:</label>
          <SelectorDesplegable
            valor={oRareza}
            alCambiar={(val) => alCambiarRareza(val as Rareza)}
            opciones={OPCIONES_RAREZA}
          />
        </div>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>
            <Scale size={12} /> Peso (lb):
          </label>
          <input
            type="number"
            step="any"
            value={oPesoLb}
            onChange={(e) => setOPesoLb(parseFloat(e.target.value) || 0)}
            placeholder="0 lb"
            className={estilos.inputForm}
          />
        </div>

        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>
            <Coins size={12} /> Valor / Costo:
          </label>
          <div style={{ display: "flex", gap: "6px", width: "100%" }}>
            <input
              type="number"
              min="0"
              value={oCostoCantidad}
              onChange={(e) => setOCostoCantidad(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              className={estilos.inputForm}
              style={{ flex: 1 }}
            />
            <div style={{ width: "115px" }}>
              <SelectorDesplegable
                valor={oCostoUnidad}
                alCambiar={(val) => setOCostoUnidad(val as TipoMoneda)}
                opciones={OPCIONES_MONEDA}
                tamano="compacto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={estilos.campoForm} style={{ padding: "4px 0", marginTop: "4px" }}>
        <label className={estilos.labelCheckbox}>
          <input
            type="checkbox"
            checked={oTipoPrincipal === "Arma" || oTipoPrincipal === "Armadura" ? true : oEquipable}
            onChange={(e) => setOEquipable(e.target.checked)}
            disabled={oTipoPrincipal === "Arma" || oTipoPrincipal === "Armadura"}
            className={estilos.checkMini}
          />
          <span style={{ fontSize: "12px" }}>
             ¿Equipable en Ranura Activa?
            {(oTipoPrincipal === "Arma" || oTipoPrincipal === "Armadura") && " (Auto para Armas/Armaduras)"}
          </span>
        </label>
      </div>

      {/* DESCRIPCIÓN */}
      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Descripción Detallada:</label>
        <textarea
          value={oDescripcion}
          onChange={(e) => setODescripcion(e.target.value)}
          placeholder="Escribe el lore o los efectos mecánicos..."
          className={estilos.textareaBrutal}
          rows={6}
          required
        />
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Propiedades Rápidas / Etiquetas (Opcional):</label>
        <input
          type="text"
          value={oPropiedades}
          onChange={(e) => setOPropiedades(e.target.value)}
          placeholder="Ej. Espada Larga, Raro. Deja en blanco para autogenerar."
          className={estilos.inputForm}
        />
      </div>

      {/* MÓDULO DE CRAFTEO / ARTESANÍA */}
      <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(168, 85, 247, 0.25)", marginTop: "8px" }}>
        <div className={estilos.tituloBloqueDinamico}>
          <span>RECETA DE CRAFTEO / ARTESANÍA (OPCIONAL)</span>
        </div>
        
        <div className={estilos.campoForm} style={{ marginBottom: "10px" }}>
          <label className={estilos.labelForm}>Taller Requerido:</label>
          <input
            type="text"
            value={oArtesaniaTaller}
            onChange={(e) => setOArtesaniaTaller(e.target.value)}
            placeholder="Ej. Forja del Herrero, Mesa de Alquimia..."
            className={estilos.inputForm}
          />
        </div>

        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Componentes y Materiales Requeridos:</label>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <input
              type="text"
              value={oNuevoComponente}
              onChange={(e) => setONuevoComponente(e.target.value)}
              placeholder="Ej. 1x Lingote de Hierro, 2x Colmillo de Lobo..."
              className={estilos.inputForm}
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregarComponenteArtesania();
                }
              }}
            />
            <button
              type="button"
              onClick={agregarComponenteArtesania}
              className={estilos.botonAgregarDinamico}
              style={{ padding: "4px 12px", height: "auto" }}
            >
              + Añadir
            </button>
          </div>

          {oArtesaniaComponentes.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
              {oArtesaniaComponentes.map((comp, idx) => (
                <span
                  key={idx}
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
                  {comp}
                  <X
                    size={12}
                    style={{ cursor: "pointer", color: "var(--color-borde-cian)" }}
                    onClick={() => eliminarComponenteArtesaniaIdx(idx)}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
