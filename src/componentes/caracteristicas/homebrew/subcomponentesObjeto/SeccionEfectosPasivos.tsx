import React, { useState, useMemo } from "react";
import { Rareza } from "@/almacen/usarAlmacenDM";
import { EfectoPasivo, HechizoBase } from "@/tipos";
import { OPCIONES_ATRIBUTOS } from "@/constantes/objetoConstantes";
import { SelectorDesplegable } from "@/componentes/comunes";
import { Sparkles, X, Wand2 } from "lucide-react";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";

const OPCIONES_CATEGORIA_BONO = [
  { valor: "Resistencia", etiqueta: "Resistencia" },
  { valor: "Inmunidad", etiqueta: "Inmunidad" },
  { valor: "CA", etiqueta: "Clase de Armadura (CA)" },
  { valor: "CARACTERÍSTICA", etiqueta: "Característica / Atributo" },
  { valor: "SALVACIÓN", etiqueta: "Salvación" },
  { valor: "HABILIDAD", etiqueta: "Pericia / Habilidad" },
  { valor: "Otro", etiqueta: "Otro Efecto" }
];

// Presets válidos para TaleSpire (d4, d6, d8, etc. Sin d3)
const PRESETS_RECARGA = [
  { etiqueta: "1d4 + 1", formula: "1d4 + 1 al amanecer" },
  { etiqueta: "1d6 + 1", formula: "1d6 + 1 al amanecer" },
  { etiqueta: "1d8 + 1", formula: "1d8 + 1 al amanecer" },
  { etiqueta: "Todas", formula: "Todas al amanecer" }
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
  oHechizosVinculados: Array<{
    nombre: string;
    cd?: number | "";
    bonoAtaque?: number | "";
    costeCargas?: number | "";
    hechizoId?: string;
    nivel?: number;
    tipoAccion?: "accion" | "accionAdicional" | "reaccion";
  }>;
  oNuevoHechizoNombre: string;
  setONuevoHechizoNombre: (nombre: string) => void;
  oNuevoHechizoCd: number | "";
  setONuevoHechizoCd: (cd: number | "") => void;
  oNuevoHechizoBonoAtaque: number | "";
  setONuevoHechizoBonoAtaque: (bono: number | "") => void;
  oNuevoHechizoCosteCargas: number | "";
  setONuevoHechizoCosteCargas: (coste: number | "") => void;
  setONuevoHechizoId: (id?: string) => void;
  setONuevoHechizoNivel: (nivel?: number) => void;
  setONuevoHechizoTipoAccion: (tipo?: "accion" | "accionAdicional" | "reaccion") => void;
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
  setONuevoHechizoId,
  setONuevoHechizoNivel,
  setONuevoHechizoTipoAccion,
  agregarHechizoVinculado,
  eliminarHechizoVinculadoIdx,
  estilos,
}) => {
  const { baseDatosHechizos } = usarEstadoHomebrew();
  const [mostrarSugerenciasHechizos, setMostrarSugerenciasHechizos] = useState(false);

  // Filtrado reactivo de hechizos para typeahead: se activa solo cuando el usuario escribe (mínimo 1 caracter)
  const sugerenciasHechizos = useMemo(() => {
    const q = oNuevoHechizoNombre.trim().toLowerCase();
    if (q.length < 1) return [];

    return (baseDatosHechizos || [])
      .filter((h: HechizoBase) => h.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [baseDatosHechizos, oNuevoHechizoNombre]);

  const seleccionarSugerenciaHechizo = (hechizo: HechizoBase) => {
    setONuevoHechizoNombre(hechizo.nombre);
    setONuevoHechizoId(hechizo.id);
    setONuevoHechizoNivel(hechizo.nivel);

    // Inferencia del tipo de acción
    const tiempo = (hechizo.tiempoLanzamiento || "").toLowerCase();
    let tipoAccion: "accion" | "accionAdicional" | "reaccion" = "accion";
    if (tiempo.includes("adicional") || tiempo.includes("bonus")) {
      tipoAccion = "accionAdicional";
    } else if (tiempo.includes("reaccion") || tiempo.includes("reacción")) {
      tipoAccion = "reaccion";
    }
    setONuevoHechizoTipoAccion(tipoAccion);

    // Coste de cargas sugerido por nivel de hechizo (mínimo 1)
    if (oNuevoHechizoCosteCargas === "") {
      setONuevoHechizoCosteCargas(Math.max(1, hechizo.nivel || 1));
    }

    setMostrarSugerenciasHechizos(false);
  };

  return (
    <div className="u-flex u-flex-col u-gap-md">
      {/* CONTROL ES MÁGICO */}
      <div className={`${estilos.bloqueDinamicoForm} ${estilos.bloqueDinamicoMagico}`}>
        <label className={`${estilos.labelCheckbox} ${estilos.labelCheckboxDestacado}`}>
          <input
            type="checkbox"
            checked={oEsMagico}
            onChange={(e) => setOEsMagico(e.target.checked)}
            className={estilos.checkMini}
            disabled={oRareza !== "Común"}
          />
          <span className={estilos.textoMagicoActivo}>
            <Sparkles size={14} /> Este Objeto es Mágico {oRareza !== "Común" ? "(Auto-activado por Rareza)" : ""}
          </span>
        </label>
      </div>

      {/* ATRIBUTOS MÁGICOS ADICIONALES */}
      {oEsMagico && (
        <div className="u-flex u-flex-col u-gap-md">
          {/* Sintonización, Cargas y Fórmula de Recarga */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.filaDobleForm}>
              <div className={`${estilos.campoForm} ${estilos.campoFormCentrado}`}>
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
                  min="0"
                  value={oCargas}
                  onChange={(e) => setOCargas(e.target.value === "" ? "" : parseInt(e.target.value) || "")}
                  placeholder="Ej. 7 (Opcional)"
                  className={estilos.inputForm}
                />
              </div>
            </div>

            {oSintonizacionRequerida && (
              <div className={`${estilos.campoForm} u-mt-xs`}>
                <label className={estilos.labelForm}>Condición de Sintonización:</label>
                <input
                  type="text"
                  value={oCondicionSintonizacion}
                  onChange={(e) => setOCondicionSintonizacion(e.target.value)}
                  placeholder="Ej. Por un hechicero, mago o brujo..."
                  className={estilos.inputForm}
                />
              </div>
            )}

            {oCargas !== "" && Number(oCargas) > 0 && (
              <div className={`${estilos.campoForm} ${estilos.campoRecargaCargas}`}>
                <label className={estilos.labelForm}>Fórmula de Recarga:</label>
                <input
                  type="text"
                  value={oFormulaRecarga}
                  onChange={(e) => setOFormulaRecarga(e.target.value)}
                  placeholder="Ej. 1d6 + 1 al amanecer o Todas"
                  className={estilos.inputForm}
                />
                <div className={estilos.contenedorPresetsRecarga}>
                  {PRESETS_RECARGA.map((preset) => (
                    <button
                      key={preset.etiqueta}
                      type="button"
                      onClick={() => setOFormulaRecarga(preset.formula)}
                      className={estilos.botonPresetRecarga}
                    >
                      {preset.etiqueta}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modificador Mágico Directo */}
          <div className={`${estilos.campoForm} u-mt-xs`}>
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

            <div className={`${estilos.campoForm} u-mt-sm`}>
              <label className={estilos.labelForm}>Descripción del Efecto (Opcional):</label>
              <div className="u-flex u-gap-xs">
                <input
                  type="text"
                  value={oNuevoBonoDesc}
                  onChange={(e) => setONuevoBonoDesc(e.target.value)}
                  placeholder="Ej. El portador gana resistencia al daño de fuego..."
                  className={`${estilos.inputForm} u-flex-1`}
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
              <div className={`${estilos.listaDinamicaVisual} u-mt-sm`}>
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

          {/* HECHIZOS VINCULADOS CON TYPEAHEAD */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.tituloBloqueDinamico}>
              <span>HECHIZOS VINCULADOS AL OBJETO</span>
            </div>

            <div className={estilos.filaAgregarBono}>
              <div className={`${estilos.campoBonoNombre} ${estilos.campoBonoFlex2}`}>
                <label className={estilos.labelForm}>Nombre del Hechizo:</label>
                <div className={estilos.contenedorBuscadorHechizo}>
                  <input
                    type="text"
                    value={oNuevoHechizoNombre}
                    onChange={(e) => {
                      setONuevoHechizoNombre(e.target.value);
                      setONuevoHechizoId(undefined); // Desvincular id si edita manualmente
                      setMostrarSugerenciasHechizos(true);
                    }}
                    onFocus={() => {
                      if (oNuevoHechizoNombre.trim().length >= 1) {
                        setMostrarSugerenciasHechizos(true);
                      }
                    }}
                    onBlur={() => {
                      // Pequeño timeout para permitir clic en la sugerencia antes de cerrar
                      setTimeout(() => setMostrarSugerenciasHechizos(false), 200);
                    }}
                    placeholder="Ej. Bola de Fuego, Curar Heridas..."
                    className={estilos.inputForm}
                  />

                  {/* MENÚ FLOTANTE DE SUGERENCIAS */}
                  {mostrarSugerenciasHechizos && sugerenciasHechizos.length > 0 && (
                    <div className={estilos.listaSugerenciasHechizos}>
                      {sugerenciasHechizos.map((hechizo) => (
                        <div
                          key={hechizo.id}
                          className={estilos.itemSugerenciaHechizo}
                          onMouseDown={() => seleccionarSugerenciaHechizo(hechizo)}
                        >
                          <div className="u-flex u-items-center u-gap-xs">
                            <Wand2 size={13} className={estilos.textoCianAcento} />
                            <span>{hechizo.nombre}</span>
                          </div>
                          <span className={estilos.itemSugerenciaDetalle}>
                            {hechizo.nivel === 0 ? "Truco" : `Nivel ${hechizo.nivel}`} • {hechizo.escuela}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`${estilos.campoBonoValor} ${estilos.campoBonoFlex1}`}>
                <label className={estilos.labelForm}>CD (Opc. usa la del personaje si esta vacio):</label>
                <input
                  type="number"
                  value={oNuevoHechizoCd}
                  onChange={(e) => setONuevoHechizoCd(e.target.value === "" ? "" : parseInt(e.target.value))}
                  placeholder="Ej. 15"
                  className={estilos.inputForm}
                />
              </div>
            </div>

            <div className={`${estilos.filaTripleForm} u-mt-sm`}>
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
              <div className={`${estilos.campoForm} ${estilos.campoFormFin}`}>
                <button
                  type="button"
                  onClick={agregarHechizoVinculado}
                  className={`${estilos.botonAgregarDinamico} ${estilos.botonAgregarConjuroPasivo}`}
                >
                  + Añadir Hechizo
                </button>
              </div>
            </div>

            {/* LISTA DE HECHIZOS VINCULADOS */}
            {oHechizosVinculados.length > 0 && (
              <div className={`${estilos.listaDinamicaVisual} u-mt-sm`}>
                {oHechizosVinculados.map((hechizo, idx) => (
                  <div key={`hechizo_${idx}`} className={estilos.itemDinamicoVisual}>
                    <div className={estilos.bonoTextoInfo}>
                      <span className={estilos.bonoTagCategoria}>HECHIZO</span>{" "}
                      <strong>{hechizo.nombre}</strong>
                      {hechizo.hechizoId && <span className={estilos.etiquetaCompendioCian}>(Compendio)</span>}
                      {hechizo.cd !== undefined && hechizo.cd !== "" ? ` | CD ${hechizo.cd}` : ` | CD Personaje`}
                      {hechizo.bonoAtaque !== undefined && hechizo.bonoAtaque !== "" ? ` | Bono Ataque: +${hechizo.bonoAtaque}` : ""}
                      {hechizo.costeCargas !== undefined && hechizo.costeCargas !== "" ? ` | Coste: ${hechizo.costeCargas} c.` : ""}
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
        <div className={`${estilos.textoListaVacia} ${estilos.contenedorListaVaciaDashed}`}>
          Este objeto está configurado como no mágico. Selecciona una rareza superior a "Común" para habilitar las propiedades mágicas.
        </div>
      )}
    </div>
  );
};

