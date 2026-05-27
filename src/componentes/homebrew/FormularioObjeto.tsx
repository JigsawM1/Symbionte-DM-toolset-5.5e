import React, { useEffect } from "react";
import { usarFormularioObjeto } from "../../hooks/usarFormularioObjeto";
import { usarAlmacenDM } from "../../almacen/usarAlmacenDM";
import { Plus, Trash2 } from "lucide-react";
import { TIPOS_DAÑO_DND } from "../../constantes/homebrewConstantes";
import estilos from "./FormularioObjeto.module.css";

interface Props {
  idEnEdicion: string | null;
  alGuardarExitoso: () => void;
  cancelarEdicion: () => void;
}

/** Calcula el número de filas necesarias para mostrar todo el texto sin scroll */
const calcFilas = (valor: string, minFilas = 2, maxFilas = 20): number => {
  if (!valor) return minFilas;
  const lineas = valor.split("\n").length;
  const porLongitud = Math.ceil(valor.length / 80);
  return Math.min(maxFilas, Math.max(minFilas, lineas, porLongitud));
};

export const FormularioObjeto: React.FC<Props> = ({
  idEnEdicion,
  alGuardarExitoso,
  cancelarEdicion
}) => {
  const objetosHomebrew = usarAlmacenDM((s) => s.objetosHomebrew);

  const {
    oNombre,
    setONombre,
    oRareza,
    setORareza,
    oPropiedades,
    setOPropiedades,
    oDescripcion,
    setODescripcion,
    oCategoria,
    setOCategoria,
    oCostoValor,
    setOCostoValor,
    oCostoUnidad,
    setOCostoUnidad,
    oPeso,
    setOPeso,
    oTipoArma,
    setOTipoArma,
    oEstiloAtaque,
    setOEstiloAtaque,
    oAlcance,
    setOAlcance,
    oPropiedadesArma,
    setOPropiedadesArma,
    oDadosDaño,
    setODadosDaño,
    oTipoDaño,
    setOTipoDaño,
    oBonoAtaque,
    setOBonoAtaque,
    oBonoDaño,
    setOBonoDaño,
    oBonosMagicos,
    oNuevoBonoCategoria,
    setONuevoBonoCategoria,
    oNuevoBonoBono,
    setONuevoBonoBono,
    oNuevoBonoValor,
    setONuevoBonoValor,
    cargarObjeto,
    limpiarFormulario,
    agregarBonoMagico,
    eliminarBonoMagicoIdx,
    manejarGuardarObjeto
  } = usarFormularioObjeto(idEnEdicion, alGuardarExitoso);

  // Sincronizar edición con la base de datos si cambia idEnEdicion
  useEffect(() => {
    if (idEnEdicion) {
      const objeto = objetosHomebrew.find((o) => o.id === idEnEdicion);
      if (objeto) {
        cargarObjeto(objeto);
      }
    } else {
      limpiarFormulario();
    }
  }, [idEnEdicion, objetosHomebrew]);

  return (
    <form onSubmit={manejarGuardarObjeto} className={estilos.formularioBrutal}>
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
          <label className={estilos.labelForm}>Categoría del Equipo:</label>
          <select
            value={oCategoria}
            onChange={(e) => setOCategoria(e.target.value)}
            className={estilos.selectForm}
          >
            <option value="ARMA">Arma</option>
            <option value="ARMADURA">Armadura</option>
            <option value="ACCESORIO">Accesorio / Maravilloso</option>
            <option value="POCIÓN">Poción</option>
            <option value="PERGAMINO">Pergamino</option>
            <option value="ANILLO">Anillo</option>
            <option value="BASTÓN">Bastón</option>
            <option value="VARITA">Varita</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Rareza:</label>
          <select
            value={oRareza}
            onChange={(e) => setORareza(e.target.value)}
            className={estilos.selectForm}
          >
            <option value="Común">Común</option>
            <option value="Poco Común">Poco Común</option>
            <option value="Raro">Raro</option>
            <option value="Muy Raro">Muy Raro</option>
            <option value="Legendario">Legendario</option>
            <option value="Artefacto">Artefacto</option>
          </select>
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Costo:</label>
          <div className={estilos.cajaCosto}>
            <input
              type="number"
              value={oCostoValor}
              onChange={(e) => setOCostoValor(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className={estilos.inputCostoValor}
            />
            <select
              value={oCostoUnidad}
              onChange={(e) => setOCostoUnidad(e.target.value)}
              className={estilos.selectCostoUnidad}
            >
              <option value="PC">PC</option>
              <option value="PP">PP</option>
              <option value="PE">PE</option>
              <option value="PO">PO</option>
              <option value="PPT">PPT</option>
            </select>
          </div>
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Peso (lb.):</label>
          <input
            type="text"
            value={oPeso}
            onChange={(e) => setOPeso(e.target.value)}
            placeholder="Ej. 3 lb"
            className={estilos.inputForm}
          />
        </div>
      </div>

      {/* DETALLES DE ARMA (SÓLO SI CATEGORÍA ES ARMA) */}
      {oCategoria === "ARMA" && (
        <div className={estilos.bloqueDinamicoForm} style={{ borderColor: "rgba(255,165,0,0.3)" }}>
          <div className={estilos.tituloBloqueDinamico} style={{ color: "var(--color-advertencia)" }}>
            PROPIEDADES TÁCTICAS DEL ARMA
          </div>

          <div className={estilos.filaTripleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Tipo de Arma:</label>
              <select
                value={oTipoArma}
                onChange={(e) => setOTipoArma(e.target.value)}
                className={estilos.selectForm}
              >
                <option value="SIMPLE">Arma Simple</option>
                <option value="MARCIAL">Arma Marcial</option>
                <option value="N/A">N/A</option>
              </select>
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Estilo de Ataque:</label>
              <select
                value={oEstiloAtaque}
                onChange={(e) => setOEstiloAtaque(e.target.value)}
                className={estilos.selectForm}
              >
                <option value="CUERPO A CUERPO">Cuerpo a Cuerpo</option>
                <option value="A DISTANCIA">A Distancia</option>
                <option value="N/A">N/A</option>
              </select>
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Alcance:</label>
              <input
                type="text"
                value={oAlcance}
                onChange={(e) => setOAlcance(e.target.value)}
                placeholder="Ej. 20/60 pies"
                className={estilos.inputForm}
              />
            </div>
          </div>

          <div className={estilos.filaDobleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Dados de Daño:</label>
              <input
                type="text"
                value={oDadosDaño}
                onChange={(e) => setODadosDaño(e.target.value)}
                placeholder="Ej. 1d8"
                className={estilos.inputForm}
              />
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Tipo de Daño:</label>
              <select
                value={oTipoDaño}
                onChange={(e) => setOTipoDaño(e.target.value)}
                className={estilos.selectForm}
              >
                <option value="N/A">N/A</option>
                {TIPOS_DAÑO_DND.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={estilos.filaDobleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Bonificador Mágico Ataque:</label>
              <input
                type="text"
                value={oBonoAtaque}
                onChange={(e) => setOBonoAtaque(e.target.value)}
                placeholder="Ej. +1"
                className={estilos.inputForm}
              />
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Bonificador Mágico Daño:</label>
              <input
                type="text"
                value={oBonoDaño}
                onChange={(e) => setOBonoDaño(e.target.value)}
                placeholder="Ej. +1"
                className={estilos.inputForm}
              />
            </div>
          </div>

          {/* CHECKBOXES PROPIEDADES DE ARMAS */}
          <div style={{ marginTop: "6px" }}>
            <div className={estilos.labelForm} style={{ marginBottom: "8px" }}>Propiedades del Arma:</div>
            <div className={estilos.gridClasesDnd}>
              {[
                "Sutil",
                "Versátil",
                "Pesado",
                "Ligero",
                "Carga",
                "Alcance",
                "Arrojadiza",
                "A dos manos",
                "Plateado",
                "Especial",
                "Munición",
                "Improvisada",
                "Sintonización",
                "Tiene Cargas"
              ].map((prop) => {
                const estaChecked = oPropiedadesArma.includes(prop);
                return (
                  <label key={prop} className={estilos.labelCheckbox}>
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
                    />
                    <span>{prop}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN DE BONOS MÁGICOS DINÁMICOS */}
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>BONOS MÁGICOS DINÁMICOS AL PERSONAJE</div>

        <div className={estilos.filaAgregarBono}>
          <div className={estilos.campoBonoCategoria}>
            <label className={estilos.labelForm}>Categoría del Bono:</label>
            <select
              value={oNuevoBonoCategoria}
              onChange={(e) => setONuevoBonoCategoria(e.target.value)}
              className={estilos.selectForm}
            >
              <option value="CA">Clase de Armadura (CA)</option>
              <option value="CARACTERÍSTICA">Característica / Atributo</option>
              <option value="SALVACIÓN">Salvación</option>
              <option value="HABILIDAD">Pericia / Habilidad</option>
              <option value="OTRO">Otro Bono</option>
            </select>
          </div>
          <div className={estilos.campoBonoNombre}>
            <label className={estilos.labelForm}>Nombre / Atributo:</label>
            <input
              type="text"
              value={oNuevoBonoBono}
              onChange={(e) => setONuevoBonoBono(e.target.value)}
              placeholder="Ej. Fuerza, Sigilo, CA"
              className={estilos.inputForm}
            />
          </div>
          <div className={estilos.campoBonoValor}>
            <label className={estilos.labelForm}>Valor:</label>
            <input
              type="number"
              value={oNuevoBonoValor}
              onChange={(e) => setONuevoBonoValor(parseInt(e.target.value) || 0)}
              className={estilos.inputForm}
            />
          </div>
          <button
            type="button"
            onClick={agregarBonoMagico}
            className={estilos.botonAgregarDinamico}
          >
            + Agregar
          </button>
        </div>

        {/* LISTA DE BONOS MÁGICOS APLICADOS */}
        {oBonosMagicos.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {oBonosMagicos.map((bono, idx) => (
              <div key={`bono_${idx}`} className={estilos.itemDinamicoVisual}>
                <div className={estilos.bonoTextoInfo}>
                  <span className={estilos.bonoTagCategoria}>
                    [{bono.categoria}]
                  </span>{" "}
                  {bono.bono}: <strong>{bono.valor >= 0 ? `+${bono.valor}` : bono.valor}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarBonoMagicoIdx(idx)}
                  className={estilos.botonEliminarDinamico}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Descripción Detallada:</label>
        <textarea
          value={oDescripcion}
          onChange={(e) => setODescripcion(e.target.value)}
          placeholder="Escribe la historia o efectos mágicos detallados..."
          className={estilos.textareaBrutal}
          rows={calcFilas(oDescripcion, 5, 25)}
          required
        />
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Propiedades Rápidas (Opcional):</label>
        <input
          type="text"
          value={oPropiedades}
          onChange={(e) => setOPropiedades(e.target.value)}
          placeholder="Ej. Espada Larga, Raro, Sintonización. Deja en blanco para autogenerar."
          className={estilos.inputForm}
        />
      </div>

      <div className={estilos.grupoBotonesAccion}>
        <button type="submit" className={estilos.botonEnviarBrutal}>
          <Plus size={15} />
          {idEnEdicion ? "Guardar Cambios en el Objeto" : "Guardar Objeto Homebrew"}
        </button>
        {idEnEdicion && (
          <button type="button" onClick={cancelarEdicion} className={estilos.botonCancelarBrutal}>
            Cancelar Edición
          </button>
        )}
      </div>
    </form>
  );
};
