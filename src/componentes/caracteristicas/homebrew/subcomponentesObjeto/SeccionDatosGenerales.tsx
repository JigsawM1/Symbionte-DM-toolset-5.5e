import React from "react";
import { Rareza } from "@/almacen/usarAlmacenDM";
import { TipoMoneda } from "@/tipos";
import { COLORES_RAREZA_HSL } from "@/constantes/objetoConstantes";
import {
  CategoriaEquipo,
  OPCIONES_CATEGORIAS_SELECTOR,
  SUBCATEGORIAS_POR_CATEGORIA
} from "@/constantes/categoriasEquipoConstantes";
import { SelectorDesplegable } from "@/componentes/comunes";
import { Scale, Coins, X, Package } from "lucide-react";

const OPCIONES_SUBCAT_ARMA = [
  { valor: "Sencilla", etiqueta: "Sencilla" },
  { valor: "Marcial", etiqueta: "Marcial" },
  { valor: "De Fuego", etiqueta: "De Fuego" }
];

const OPCIONES_SUBCAT_ARMADURA = [
  { valor: "Ligera", etiqueta: "Ligera" },
  { valor: "Mediana", etiqueta: "Mediana" },
  { valor: "Pesada", etiqueta: "Pesada" }
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
  oCategoria: CategoriaEquipo;
  alCambiarCategoria: (cat: CategoriaEquipo) => void;
  oSubcategoria: string;
  setOSubcategoria: (sub: string) => void;
  oSubcategoriaArma: "Sencilla" | "Marcial" | "De Fuego";
  setOSubcategoriaArma: (sub: "Sencilla" | "Marcial" | "De Fuego") => void;
  oSubcategoriaArmadura: "Ligera" | "Mediana" | "Pesada";
  alCambiarSubcategoriaArmadura: (sub: "Ligera" | "Mediana" | "Pesada") => void;
  oEsConsumible: boolean;
  setOEsConsumible: (esCons: boolean) => void;
  oQuantity: number | "";
  setOQuantity: (cant: number | "") => void;
  oPesoUnitario: number | "";
  setOPesoUnitario: (peso: number | "") => void;
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
  oCategoria,
  alCambiarCategoria,
  oSubcategoria,
  setOSubcategoria,
  oSubcategoriaArma,
  setOSubcategoriaArma,
  oSubcategoriaArmadura,
  alCambiarSubcategoriaArmadura,
  oEsConsumible,
  setOEsConsumible,
  oQuantity,
  setOQuantity,
  oPesoUnitario,
  setOPesoUnitario,
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
  // Construcción reactiva de opciones de subcategoría
  const opcionesSubcat = React.useMemo(() => {
    if (oCategoria === "armas") {
      return OPCIONES_SUBCAT_ARMA;
    }
    if (oCategoria === "armaduras") {
      return OPCIONES_SUBCAT_ARMADURA;
    }
    const sugeridas = SUBCATEGORIAS_POR_CATEGORIA[oCategoria] || [];
    if (oSubcategoria && !sugeridas.some((s) => s.valor === oSubcategoria)) {
      return [{ valor: oSubcategoria, etiqueta: oSubcategoria }, ...sugeridas];
    }
    return sugeridas;
  }, [oCategoria, oSubcategoria]);

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
          <label className={estilos.labelForm}>Categoría Canónica (5.5e):</label>
          <SelectorDesplegable
            valor={oCategoria}
            alCambiar={(val) => alCambiarCategoria(val as CategoriaEquipo)}
            opciones={OPCIONES_CATEGORIAS_SELECTOR}
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Subcategoría:</label>
          {opcionesSubcat.length > 0 ? (
            <SelectorDesplegable
              valor={
                oCategoria === "armas"
                  ? oSubcategoriaArma
                  : oCategoria === "armaduras"
                  ? oSubcategoriaArmadura
                  : oSubcategoria
              }
              alCambiar={(val) => {
                const nuevoStr = String(val);
                setOSubcategoria(nuevoStr);
                if (oCategoria === "armas") {
                  setOSubcategoriaArma(nuevoStr as "Sencilla" | "Marcial" | "De Fuego");
                } else if (oCategoria === "armaduras") {
                  alCambiarSubcategoriaArmadura(nuevoStr as "Ligera" | "Mediana" | "Pesada");
                }
              }}
              opciones={opcionesSubcat}
            />
          ) : (
            <input
              type="text"
              value={oSubcategoria}
              onChange={(e) => setOSubcategoria(e.target.value)}
              placeholder="Ej. Herramienta especial"
              className={estilos.inputForm}
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

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm} style={{ padding: "4px 0" }}>
          <label className={estilos.labelCheckbox}>
            <input
              type="checkbox"
              checked={oCategoria === "armas" || oCategoria === "armaduras" || oCategoria === "escudos" ? true : oEquipable}
              onChange={(e) => setOEquipable(e.target.checked)}
              disabled={oCategoria === "armas" || oCategoria === "armaduras" || oCategoria === "escudos"}
              className={estilos.checkMini}
            />
            <span style={{ fontSize: "12px" }}>
              ¿Equipable en Ranura Activa?
              {(oCategoria === "armas" || oCategoria === "armaduras" || oCategoria === "escudos") && " (Auto)"}
            </span>
          </label>
        </div>

        <div className={estilos.campoForm} style={{ padding: "4px 0" }}>
          <label className={estilos.labelCheckbox}>
            <input
              type="checkbox"
              checked={oEsConsumible}
              onChange={(e) => setOEsConsumible(e.target.checked)}
              className={estilos.checkMini}
            />
            <span style={{ fontSize: "12px" }}>
              ¿Es Consumible / De un solo uso?
            </span>
          </label>
        </div>
      </div>

      {/* METADATOS DE LOTES / COMPRA EN PAQUETE */}
      <div className={estilos.filaDobleForm} style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "8px", borderRadius: "4px", border: "1px dashed rgba(255, 255, 255, 0.1)" }}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>
            <Package size={12} /> Unidades por Lote (Opcional):
          </label>
          <input
            type="number"
            min="1"
            value={oQuantity}
            onChange={(e) => setOQuantity(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
            placeholder="Ej. 20 (flechas), 10 (antorchas)"
            className={estilos.inputForm}
          />
        </div>

        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>
            <Scale size={12} /> Peso Individual / Unidad (lb):
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={oPesoUnitario}
            onChange={(e) => setOPesoUnitario(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="Ej. 0.05"
            className={estilos.inputForm}
          />
        </div>
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
          spellCheck={false}
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
