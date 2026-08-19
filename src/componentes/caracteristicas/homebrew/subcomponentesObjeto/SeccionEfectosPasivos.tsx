import React from "react";
import { Rareza } from "@/almacen/usarAlmacenDM";
import { EfectoPasivo } from "@/tipos";
import { OPCIONES_ATRIBUTOS } from "@/constantes/objetoConstantes";
import { SelectorDesplegable } from "@/componentes/comunes";
import { Sparkles, X } from "lucide-react";

const OPCIONES_CATEGORIA_BONO = [
  { valor: "Resistencia", etiqueta: "Resistencia" },
  { valor: "Inmunidad", etiqueta: "Inmunidad" },
  { valor: "Foco Arcano", etiqueta: "Foco Arcano" },
  { valor: "CA", etiqueta: "Clase de Armadura (CA)" },
  { valor: "CARACTERÍSTICA", etiqueta: "Característica / Atributo" },
  { valor: "SALVACIÓN", etiqueta: "Salvación" },
  { valor: "HABILIDAD", etiqueta: "Pericia / Habilidad" },
  { valor: "Otro", etiqueta: "Otro Efecto" }
];

interface Props {
  oEsMagico: boolean;
  setOEsMagico: (es: boolean) => void;
  oRareza: Rareza;
  oSintonizacionRequerida: boolean;
  setOSintonizacionRequerida: (req: boolean) => void;
  oCondicionSintonizacion: string;
  setOCondicionSintonizacion: (cond: string) => void;
  oCargas: number | "";
  setOCargas: (cargas: number | "") => void;
  oFormulaRecarga: string;
  setOFormulaRecarga: (formula: string) => void;
  oEstaMaldito: boolean;
  setOEstaMaldito: (maldito: boolean) => void;
  oEsConsciente: boolean;
  setOEsConsciente: (consciente: boolean) => void;
  oModificadorAtaqueDano: number | "";
  setOModificadorAtaqueDano: (mod: number | "") => void;
  // Efectos Pasivos
  oEfectosPasivos: EfectoPasivo[];
  oNuevoBonoCategoria: string;
  setONuevoBonoCategoria: (cat: string) => void;
  oNuevoBonoBono: string;
  setONuevoBonoBono: (bono: string) => void;
  oNuevoBonoValor: string | number;
  setONuevoBonoValor: (val: string | number) => void;
  oNuevoBonoDesc: string;
  setONuevoBonoDesc: (desc: string) => void;
  agregarEfectoPasivo: () => void;
  eliminarEfectoPasivoIdx: (idx: number) => void;
  // Hechizos Vinculados
  oHechizosVinculados: Array<{ nombre: string; cd?: number | ""; bonoAtaque?: number | ""; costeCargas?: number | "" }>;
  oNuevoHechizoNombre: string;
  setONuevoHechizoNombre: (nombre: string) => void;
  oNuevoHechizoCd: number | "";
  setONuevoHechizoCd: (cd: number | "") => void;
  oNuevoHechizoBonoAtaque: number | "";
  setONuevoHechizoBonoAtaque: (bono: number | "") => void;
  oNuevoHechizoCosteCargas: number | "";
  setONuevoHechizoCosteCargas: (coste: number | "") => void;
  agregarHechizoVinculado: () => void;
  eliminarHechizoVinculadoIdx: (idx: number) => void;
  estilos: Record<string, string>;
}

export const SeccionEfectosPasivos: React.FC<Props> = ({
  oEsMagico,
  setOEsMagico,
  oRareza,
  oSintonizacionRequerida,
  setOSintonizacionRequerida,
  oCondicionSintonizacion,
  setOCondicionSintonizacion,
  oCargas,
  setOCargas,
  oFormulaRecarga,
  setOFormulaRecarga,
  oEstaMaldito,
  setOEstaMaldito,
  oEsConsciente,
  setOEsConsciente,
  oModificadorAtaqueDano,
  setOModificadorAtaqueDano,
  oEfectosPasivos,
  oNuevoBonoCategoria,
  setONuevoBonoCategoria,
  oNuevoBonoBono,
  setONuevoBonoBono,
  oNuevoBonoValor,
  setONuevoBonoValor,
  oNuevoBonoDesc,
  setONuevoBonoDesc,
  agregarEfectoPasivo,
  eliminarEfectoPasivoIdx,
  oHechizosVinculados,
  oNuevoHechizoNombre,
  setONuevoHechizoNombre,
  oNuevoHechizoCd,
  setONuevoHechizoCd,
  oNuevoHechizoBonoAtaque,
  setONuevoHechizoBonoAtaque,
  oNuevoHechizoCosteCargas,
  setONuevoHechizoCosteCargas,
  agregarHechizoVinculado,
  eliminarHechizoVinculadoIdx,
  estilos,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* CONTROL ES MÁGICO */}
      <div className={estilos.bloqueDinamicoForm} style={{ backgroundColor: "rgba(0, 245, 212, 0.02)", borderColor: "var(--color-borde-cian)" }}>
        <label className={estilos.labelCheckbox} style={{ fontSize: "14px", fontWeight: "bold" }}>
          <input
            type="checkbox"
            checked={oEsMagico}
            onChange={(e) => setOEsMagico(e.target.checked)}
            className={estilos.checkMini}
            disabled={oRareza !== "Común"}
          />
          <span style={{ color: "var(--color-borde-cian)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={14} /> Este Objeto es Mágico {oRareza !== "Común" ? "(Auto-activado por Rareza)" : ""}
          </span>
        </label>
      </div>

      {/* ATRIBUTOS MÁGICOS ADICIONALES */}
      {oEsMagico && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Sintonización, Cargas y Propiedades Narrativas */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.filaDobleForm}>
              <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
                <label className={estilos.labelCheckbox}>
                  <input
                    type="checkbox"
                    checked={oSintonizacionRequerida}
                    onChange={(e) => setOSintonizacionRequerida(e.target.checked)}
                    className={estilos.checkMini}
                  />
                  <span>Requiere Sintonización</span>
                </label>
              </div>

              <div className={estilos.campoForm}>
                <label className={estilos.labelForm}>Cargas Máximas:</label>
                <input
                  type="number"
                  value={oCargas}
                  onChange={(e) => setOCargas(e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej. 7 (Opcional)"
                  className={estilos.inputForm}
                />
              </div>
            </div>

            {oSintonizacionRequerida && (
              <div className={estilos.campoForm} style={{ marginTop: "10px" }}>
                <label className={estilos.labelForm}>Condición de Sintonización:</label>
                <input
                  type="text"
                  value={oCondicionSintonizacion}
                  onChange={(e) => setOCondicionSintonizacion(e.target.value)}
                  placeholder="Ej. por un Mago o Elfo, alineamiento bueno..."
                  className={estilos.inputForm}
                />
              </div>
            )}

            {oCargas !== "" && oCargas > 0 && (
              <div className={estilos.campoForm} style={{ marginTop: "10px" }}>
                <label className={estilos.labelForm}>Fórmula de Recarga de Cargas:</label>
                <input
                  type="text"
                  value={oFormulaRecarga}
                  onChange={(e) => setOFormulaRecarga(e.target.value)}
                  placeholder="Ej. 1d6+1 al amanecer..."
                  className={estilos.inputForm}
                />
              </div>
            )}

            <div className={estilos.filaDobleForm} style={{ marginTop: "10px", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "10px" }}>
              <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
                <label className={estilos.labelCheckbox}>
                  <input
                    type="checkbox"
                    checked={oEstaMaldito}
                    onChange={(e) => setOEstaMaldito(e.target.checked)}
                    className={estilos.checkMini}
                  />
                  <span style={{ color: "var(--color-peligro)", fontWeight: "bold" }}>Objeto Maldito (Curse)</span>
                </label>
              </div>

              <div className={estilos.campoForm} style={{ justifyContent: "center" }}>
                <label className={estilos.labelCheckbox}>
                  <input
                    type="checkbox"
                    checked={oEsConsciente}
                    onChange={(e) => setOEsConsciente(e.target.checked)}
                    className={estilos.checkMini}
                  />
                  <span style={{ color: "var(--color-borde-cian)" }}>Objeto Consciente (Sentient)</span>
                </label>
              </div>
            </div>

            <div className={estilos.campoForm} style={{ marginTop: "10px", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "10px" }}>
              <label className={estilos.labelForm}>Modificador Mágico Directo (Ataque, Daño o Defensa):</label>
              <input
                type="number"
                value={oModificadorAtaqueDano}
                onChange={(e) => setOModificadorAtaqueDano(e.target.value === "" ? "" : parseInt(e.target.value))}
                placeholder="Ej. 1 para un objeto +1..."
                className={estilos.inputForm}
                min={-5}
                max={10}
              />
            </div>
          </div>

          {/* EFECTOS PASIVOS Y BONOS */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.tituloBloqueDinamico}>
              <span>EFECTOS PASIVOS Y BONOS AUTOMÁTICOS</span>
            </div>

            <div className={estilos.filaAgregarBono}>
              <div className={estilos.campoBonoCategoria}>
                <label className={estilos.labelForm}>Tipo de Efecto:</label>
                <SelectorDesplegable
                  valor={oNuevoBonoCategoria}
                  alCambiar={(cat) => {
                    setONuevoBonoCategoria(cat);
                    if (OPCIONES_ATRIBUTOS[cat]) {
                      setONuevoBonoBono(OPCIONES_ATRIBUTOS[cat][0]);
                    } else {
                      setONuevoBonoBono("");
                    }
                  }}
                  opciones={OPCIONES_CATEGORIA_BONO}
                />
              </div>
              <div className={estilos.campoBonoNombre}>
                <label className={estilos.labelForm}>Detalle / Nombre:</label>
                {OPCIONES_ATRIBUTOS[oNuevoBonoCategoria] ? (
                  <SelectorDesplegable
                    valor={oNuevoBonoBono}
                    alCambiar={(val) => setONuevoBonoBono(val)}
                    opciones={OPCIONES_ATRIBUTOS[oNuevoBonoCategoria].map((op) => ({ valor: op, etiqueta: op }))}
                  />
                ) : (
                  <input
                    type="text"
                    value={oNuevoBonoBono}
                    onChange={(e) => setONuevoBonoBono(e.target.value)}
                    placeholder="Ej. Daño de Fuego, Sigilo..."
                    className={estilos.inputForm}
                  />
                )}
              </div>
              <div className={estilos.campoBonoValor}>
                <label className={estilos.labelForm}>Valor (Opc.):</label>
                <input
                  type="text"
                  value={oNuevoBonoValor}
                  onChange={(e) => setONuevoBonoValor(e.target.value)}
                  placeholder="Ej. +1 o Ventaja"
                  className={estilos.inputForm}
                />
              </div>
            </div>

            <div className={estilos.campoForm} style={{ marginTop: "10px" }}>
              <label className={estilos.labelForm}>Descripción del Efecto (Opcional):</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={oNuevoBonoDesc}
                  onChange={(e) => setONuevoBonoDesc(e.target.value)}
                  placeholder="Ej. El portador gana resistencia al daño de fuego..."
                  className={estilos.inputForm}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={agregarEfectoPasivo}
                  className={estilos.botonAgregarDinamico}
                >
                  + Agregar
                </button>
              </div>
            </div>

            {/* LISTA DE EFECTOS PASIVOS */}
            {oEfectosPasivos.length > 0 && (
              <div className={estilos.listaDinamicaVisual} style={{ marginTop: "10px" }}>
                {oEfectosPasivos.map((efecto, idx) => (
                  <div key={`efecto_${idx}`} className={estilos.itemDinamicoVisual}>
                    <div className={estilos.bonoTextoInfo}>
                      <span className={estilos.bonoTagCategoria}>
                        [{efecto.tipo}]
                      </span>{" "}
                      <strong>{efecto.bono}</strong>
                      {efecto.valor !== undefined && efecto.valor !== "" && ` (${isNaN(Number(efecto.valor)) ? efecto.valor : (Number(efecto.valor) >= 0 ? `+${efecto.valor}` : efecto.valor)})`}
                      {efecto.descripcion && `: ${efecto.descripcion}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarEfectoPasivoIdx(idx)}
                      className={estilos.botonEliminarDinamico}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HECHIZOS VINCULADOS */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.tituloBloqueDinamico}>
              <span>HECHIZOS VINCULADOS AL OBJETO</span>
            </div>

            <div className={estilos.filaAgregarBono}>
              <div className={estilos.campoBonoNombre} style={{ flex: 2 }}>
                <label className={estilos.labelForm}>Nombre del Hechizo:</label>
                <input
                  type="text"
                  value={oNuevoHechizoNombre}
                  onChange={(e) => setONuevoHechizoNombre(e.target.value)}
                  placeholder="Ej. Bola de Fuego, Curar Heridas..."
                  className={estilos.inputForm}
                />
              </div>
              <div className={estilos.campoBonoValor} style={{ flex: 1 }}>
                <label className={estilos.labelForm}>CD (Opc.):</label>
                <input
                  type="number"
                  value={oNuevoHechizoCd}
                  onChange={(e) => setONuevoHechizoCd(e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej. 15"
                  className={estilos.inputForm}
                />
              </div>
            </div>

            <div className={estilos.filaTripleForm} style={{ marginTop: "10px" }}>
              <div className={estilos.campoForm}>
                <label className={estilos.labelForm}>Bono Ataque (Opc.):</label>
                <input
                  type="number"
                  value={oNuevoHechizoBonoAtaque}
                  onChange={(e) => setONuevoHechizoBonoAtaque(e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej. +7"
                  className={estilos.inputForm}
                />
              </div>
              <div className={estilos.campoForm}>
                <label className={estilos.labelForm}>Coste Cargas (Opc.):</label>
                <input
                  type="number"
                  value={oNuevoHechizoCosteCargas}
                  onChange={(e) => setONuevoHechizoCosteCargas(e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej. 1"
                  className={estilos.inputForm}
                />
              </div>
              <div className={estilos.campoForm} style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={agregarHechizoVinculado}
                  className={estilos.botonAgregarDinamico}
                  style={{ width: "100%", height: "36px", marginTop: "16px" }}
                >
                  + Añadir Hechizo
                </button>
              </div>
            </div>

            {/* LISTA DE HECHIZOS VINCULADOS */}
            {oHechizosVinculados.length > 0 && (
              <div className={estilos.listaDinamicaVisual} style={{ marginTop: "10px" }}>
                {oHechizosVinculados.map((hechizo, idx) => (
                  <div key={`hechizo_${idx}`} className={estilos.itemDinamicoVisual}>
                    <div className={estilos.bonoTextoInfo}>
                      <span className={estilos.bonoTagCategoria}>HECHIZO</span>{" "}
                      <strong>{hechizo.nombre}</strong>
                      {hechizo.cd !== undefined && hechizo.cd !== "" && ` | CD ${hechizo.cd}`}
                      {hechizo.bonoAtaque !== undefined && hechizo.bonoAtaque !== "" && ` | Bono Ataque: +${hechizo.bonoAtaque}`}
                      {hechizo.costeCargas !== undefined && hechizo.costeCargas !== "" && ` | Coste: ${hechizo.costeCargas} c.`}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarHechizoVinculadoIdx(idx)}
                      className={estilos.botonEliminarDinamico}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!oEsMagico && (
        <div className={estilos.textoListaVacia} style={{ padding: "20px", border: "1px dashed rgba(255,255,255,0.05)" }}>
          Este objeto está configurado como no mágico. Selecciona una rareza superior a "Común" para habilitar las propiedades mágicas.
        </div>
      )}
    </div>
  );
};
