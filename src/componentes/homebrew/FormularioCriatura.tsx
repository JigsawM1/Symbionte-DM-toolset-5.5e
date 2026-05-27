import React, { useEffect } from "react";
import { usarFormularioCriatura } from "../../hooks/usarFormularioCriatura";
import { usarAlmacenDM } from "../../almacen/usarAlmacenDM";
import { Shield, Heart, Plus, Trash2, Edit2 } from "lucide-react";
import {
  TIPOS_DAÑO_DND,
  CONDICIONES_DND,
  HABILIDADES_LISTA,
  CARACTERISTICAS_CLAVES
} from "../../constantes/homebrewConstantes";
import estilos from "./FormularioCriatura.module.css";

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

export const FormularioCriatura: React.FC<Props> = ({
  idEnEdicion,
  alGuardarExitoso,
  cancelarEdicion
}) => {
  const baseDatosMonstruos = usarAlmacenDM((s) => s.baseDatosMonstruos);

  const {
    monstruoForm,
    subPestanaCriatura,
    setSubPestanaCriatura,
    subDefensas,
    setSubDefensas,
    tRasgoNombre,
    setTRasgoNombre,
    tRasgoDesc,
    setTRasgoDesc,
    tRasgoUso,
    setTRasgoUso,
    tAccionNombre,
    setTAccionNombre,
    tAccionDesc,
    setTAccionDesc,
    tAccionBono,
    setTAccionBono,
    tAccionDaño,
    setTAccionDaño,
    tAccionUso,
    setTAccionUso,
    tReaccionNombre,
    setTReaccionNombre,
    tReaccionDesc,
    setTReaccionDesc,
    tReaccionUso,
    setTReaccionUso,
    tLegendariaNombre,
    setTLegendariaNombre,
    tLegendariaDesc,
    setTLegendariaDesc,
    tLegendariaUso,
    setTLegendariaUso,
    tQNombre,
    setTQNombre,
    tQBono,
    setTQBono,
    tQDados,
    setTQDados,
    tQTipo,
    setTQTipo,
    rasgoEdicionIdx,
    accionEdicionIdx,
    reaccionEdicionIdx,
    legendariaEdicionIdx,
    quickActionEdicionIdx,
    actualizarGeneral,
    actualizarCaracteristica,
    actualizarSalvacion,
    actualizarHabilidad,
    alternarCheckArray,
    agregarRasgo,
    iniciarEditarRasgo,
    cancelarEditarRasgo,
    eliminarRasgoIdx,
    agregarAccion,
    iniciarEditarAccion,
    cancelarEditarAccion,
    eliminarAccionIdx,
    agregarReaccion,
    iniciarEditarReaccion,
    cancelarEditarReaccion,
    eliminarReaccionIdx,
    agregarLegendaria,
    iniciarEditarLegendaria,
    cancelarEditarLegendaria,
    eliminarLegendariaIdx,
    agregarQuickAction,
    iniciarEditarQuickAction,
    cancelarEditarQuickAction,
    eliminarQuickActionIdx,
    cargarCriatura,
    limpiarFormulario,
    manejarGuardarCriatura
  } = usarFormularioCriatura(idEnEdicion, alGuardarExitoso);

  // Sincronizar edición con la base de datos si cambia idEnEdicion
  useEffect(() => {
    if (idEnEdicion) {
      const criatura = baseDatosMonstruos.find((c) => c.id === idEnEdicion);
      if (criatura) {
        cargarCriatura(criatura);
      }
    } else {
      limpiarFormulario();
    }
  }, [idEnEdicion, baseDatosMonstruos]);

  return (
    <form onSubmit={manejarGuardarCriatura} className={estilos.formularioBrutal}>
      {/* Pestañas internas del creador de Criaturas */}
      <div className={estilos.subPestanasCriatura}>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("general")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "general" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("atributos")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "atributos" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          Atribs/Salv
        </button>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("pericias")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "pericias" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          Habilidades
        </button>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("defensas")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "defensas" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          Defensas
        </button>
        <button
          type="button"
          onClick={() => setSubPestanaCriatura("listas")}
          className={`${estilos.subPestanaCriaturaBoton} ${subPestanaCriatura === "listas" ? estilos.subPestanaCriaturaBotonActiva : ""}`}
        >
          Listas/Ataques
        </button>
      </div>

      {/* SECCIÓN GENERAL */}
      {subPestanaCriatura === "general" && (
        <div className={estilos.seccionContenido}>
          <div className={estilos.filaDobleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Nombre del Monstruo:</label>
              <input
                type="text"
                value={monstruoForm.nombre}
                onChange={(e) => actualizarGeneral("nombre", e.target.value)}
                placeholder="Ej. Dragón de Hielo"
                className={estilos.inputForm}
                required
              />
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Tipo de Criatura:</label>
              <select
                value={monstruoForm.tipo}
                onChange={(e) => actualizarGeneral("tipo", e.target.value)}
                className={estilos.selectForm}
              >
                <option value="Humanoide">Humanoide</option>
                <option value="Monstruosidad">Monstruosidad</option>
                <option value="No Muerto">No Muerto</option>
                <option value="Dragón">Dragón</option>
                <option value="Bestia">Bestia</option>
                <option value="Constructo">Constructo</option>
                <option value="Elemental">Elemental</option>
                <option value="Hada">Hada</option>
                <option value="Fata">Fata</option>
                <option value="Gigante">Gigante</option>
                <option value="Aberración">Aberración</option>
                <option value="Celestial">Celestial</option>
                <option value="Infiando">Infiando</option>
                <option value="Planta">Planta</option>
                <option value="Limo">Limo</option>
              </select>
            </div>
          </div>

          <div className={estilos.filaTripleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>
                <Shield size={12} /> CA:
              </label>
              <input
                type="number"
                value={monstruoForm.ca}
                onChange={(e) => actualizarGeneral("ca", parseInt(e.target.value, 10) || 10)}
                className={estilos.inputForm}
                min={1}
              />
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Notas CA:</label>
              <input
                type="text"
                value={monstruoForm.caNotas || ""}
                onChange={(e) => actualizarGeneral("caNotas", e.target.value)}
                placeholder="ej. natural"
                className={estilos.inputForm}
              />
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>
                <Heart size={12} /> HP Máx:
              </label>
              <input
                type="number"
                value={monstruoForm.vidaMaxima}
                onChange={(e) => actualizarGeneral("vidaMaxima", parseInt(e.target.value, 10) || 10)}
                className={estilos.inputForm}
                min={1}
              />
            </div>
          </div>

          <div className={estilos.filaTripleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Notas Vida:</label>
              <input
                type="text"
                value={monstruoForm.vidaNotas || ""}
                onChange={(e) => actualizarGeneral("vidaNotas", e.target.value)}
                placeholder="ej. 8d8+16"
                className={estilos.inputForm}
              />
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Bonif. Inic:</label>
              <input
                type="number"
                value={monstruoForm.iniciativaBonificador}
                onChange={(e) => actualizarGeneral("iniciativaBonificador", parseInt(e.target.value, 10) || 0)}
                className={estilos.inputForm}
              />
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Velocidad:</label>
              <input
                type="text"
                value={monstruoForm.velocidad}
                onChange={(e) => actualizarGeneral("velocidad", e.target.value)}
                placeholder="ej. 30 pies, volar 60"
                className={estilos.inputForm}
              />
            </div>
          </div>

          <div className={estilos.filaDobleForm}>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Desafío (CR):</label>
              <input
                type="text"
                value={monstruoForm.desafio}
                onChange={(e) => actualizarGeneral("desafio", e.target.value)}
                placeholder="Ej. 5 o 1/2"
                className={estilos.inputForm}
              />
            </div>
            <div className={estilos.campoForm}>
              <label className={estilos.labelForm}>Fuente:</label>
              <input
                type="text"
                value={monstruoForm.fuente}
                onChange={(e) => actualizarGeneral("fuente", e.target.value)}
                placeholder="Ej. Manual de Monstruos"
                className={estilos.inputForm}
              />
            </div>
          </div>

          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Sentidos:</label>
            <input
              type="text"
              value={monstruoForm.sentidos || ""}
              onChange={(e) => actualizarGeneral("sentidos", e.target.value)}
              placeholder="Ej. visión en la oscuridad 60 pies, Percepción pasiva 12"
              className={estilos.inputForm}
            />
          </div>

          <div className={estilos.campoForm}>
            <label className={estilos.labelForm}>Idiomas:</label>
            <input
              type="text"
              value={monstruoForm.idiomas || ""}
              onChange={(e) => actualizarGeneral("idiomas", e.target.value)}
              placeholder="Ej. Común, Dracónico"
              className={estilos.inputForm}
            />
          </div>
        </div>
      )}

      {/* SECCIÓN ATRIBUTOS Y SALVACIONES */}
      {subPestanaCriatura === "atributos" && (
        <div className={estilos.seccionContenido}>
          <div className={estilos.cabeceraMiniSeccion}>ATRIBUTOS BÁSICOS</div>
          <div className={estilos.filaSeisForm}>
            {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => (
              <div key={clave} className={estilos.campoMiniForm}>
                <label className={estilos.labelMiniForm}>{etiqueta}</label>
                <input
                  type="number"
                  value={monstruoForm.caracteristicas[clave as keyof typeof monstruoForm.caracteristicas]}
                  onChange={(e) => actualizarCaracteristica(clave, parseInt(e.target.value, 10) || 10)}
                  className={estilos.inputMiniForm}
                  min={0}
                  max={30}
                />
                <span className={estilos.modificadorPrevisualizado}>
                  {Math.floor((monstruoForm.caracteristicas[clave as keyof typeof monstruoForm.caracteristicas] - 10) / 2) >= 0 ? "+" : ""}
                  {Math.floor((monstruoForm.caracteristicas[clave as keyof typeof monstruoForm.caracteristicas] - 10) / 2)}
                </span>
              </div>
            ))}
          </div>

          <div className={estilos.cabeceraMiniSeccion}>TIRADAS DE SALVACIÓN (Modificador Neto)</div>
          <div className={estilos.filaSeisForm}>
            {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => (
              <div key={`salv_${clave}`} className={estilos.campoMiniForm}>
                <label className={estilos.labelMiniForm}>{etiqueta}</label>
                <input
                  type="number"
                  value={monstruoForm.salvaciones?.[clave as keyof typeof monstruoForm.salvaciones] ?? ""}
                  onChange={(e) => actualizarSalvacion(clave, e.target.value)}
                  placeholder="—"
                  className={estilos.inputMiniForm}
                />
              </div>
            ))}
          </div>
          <div className={estilos.notaAyuda}>
            * Deja en blanco las salvaciones si la criatura no tiene un bonificador especial de salvación.
          </div>
        </div>
      )}

      {/* SECCIÓN PERICIAS / HABILIDADES */}
      {subPestanaCriatura === "pericias" && (
        <div className={estilos.seccionContenido}>
          <div className={estilos.cabeceraMiniSeccion}>MODIFICADORES DE HABILIDADES (Pericias)</div>
          <div className={estilos.gridHabilidades}>
            {HABILIDADES_LISTA.map(({ clave, nombre }) => (
              <div key={clave} className={estilos.itemHabilidadFila}>
                <span className={estilos.habilidadNombreEtiqueta}>{nombre}:</span>
                <input
                  type="number"
                  value={monstruoForm.habilidades?.[clave as keyof typeof monstruoForm.habilidades] ?? ""}
                  onChange={(e) => actualizarHabilidad(clave, e.target.value)}
                  placeholder="—"
                  className={estilos.inputHabilidad}
                />
              </div>
            ))}
          </div>
          <div className={estilos.notaAyuda}>
            * Rellena únicamente las habilidades en las que el monstruo esté entrenado o posea bonificadores.
          </div>
        </div>
      )}

      {/* SECCIÓN DEFENSAS, VULNERABILIDADES, RESISTENCIAS, CONDICIONES */}
      {subPestanaCriatura === "defensas" && (
        <div className={estilos.seccionContenido}>
          <div className={estilos.selectorDefensasNavegacion}>
            <button
              type="button"
              onClick={() => setSubDefensas("inmunidades")}
              className={`${estilos.subDefBoton} ${subDefensas === "inmunidades" ? estilos.subDefBotonActivo : ""}`}
            >
              Inm. Daño ({monstruoForm.inmunidadesDaño?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setSubDefensas("resistencias")}
              className={`${estilos.subDefBoton} ${subDefensas === "resistencias" ? estilos.subDefBotonActivo : ""}`}
            >
              Res. Daño ({monstruoForm.resistencias?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setSubDefensas("vulnerabilidades")}
              className={`${estilos.subDefBoton} ${subDefensas === "vulnerabilidades" ? estilos.subDefBotonActivo : ""}`}
            >
              Vuln. Daño ({monstruoForm.vulnerabilidades?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setSubDefensas("condiciones")}
              className={`${estilos.subDefBoton} ${subDefensas === "condiciones" ? estilos.subDefBotonActivo : ""}`}
            >
              Inm. Condic ({monstruoForm.inmunidadesCondicion?.length || 0})
            </button>
          </div>

          <div className={estilos.contenedorChecksDefensas}>
            {/* INMUNIDADES AL DAÑO */}
            {subDefensas === "inmunidades" && (
              <div className={estilos.gridCheckboxMini}>
                {TIPOS_DAÑO_DND.map((daño) => (
                  <label key={`inm_${daño}`} className={estilos.labelCheckMini}>
                    <input
                      type="checkbox"
                      checked={monstruoForm.inmunidadesDaño?.includes(daño) || false}
                      onChange={() => alternarCheckArray("inmunidadesDaño", daño)}
                      className={estilos.checkMini}
                    />
                    {daño}
                  </label>
                ))}
              </div>
            )}

            {/* RESISTENCIAS AL DAÑO */}
            {subDefensas === "resistencias" && (
              <div className={estilos.gridCheckboxMini}>
                {TIPOS_DAÑO_DND.map((daño) => (
                  <label key={`res_${daño}`} className={estilos.labelCheckMini}>
                    <input
                      type="checkbox"
                      checked={monstruoForm.resistencias?.includes(daño) || false}
                      onChange={() => alternarCheckArray("resistencias", daño)}
                      className={estilos.checkMini}
                    />
                    {daño}
                  </label>
                ))}
              </div>
            )}

            {/* VULNERABILIDADES AL DAÑO */}
            {subDefensas === "vulnerabilidades" && (
              <div className={estilos.gridCheckboxMini}>
                {TIPOS_DAÑO_DND.map((daño) => (
                  <label key={`vuln_${daño}`} className={estilos.labelCheckMini}>
                    <input
                      type="checkbox"
                      checked={monstruoForm.vulnerabilidades?.includes(daño) || false}
                      onChange={() => alternarCheckArray("vulnerabilidades", daño)}
                      className={estilos.checkMini}
                    />
                    {daño}
                  </label>
                ))}
              </div>
            )}

            {/* INMUNIDADES A CONDICIONES */}
            {subDefensas === "condiciones" && (
              <div className={estilos.gridCheckboxMini}>
                {CONDICIONES_DND.map((cond) => (
                  <label key={`cond_${cond}`} className={estilos.labelCheckMini}>
                    <input
                      type="checkbox"
                      checked={monstruoForm.inmunidadesCondicion?.includes(cond) || false}
                      onChange={() => alternarCheckArray("inmunidadesCondicion", cond)}
                      className={estilos.checkMini}
                    />
                    {cond}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN LISTAS DINÁMICAS (RASGOS, ACCIONES, REACCIONES, LEGENDARIAS, RÁPIDAS) */}
      {subPestanaCriatura === "listas" && (
        <div className={estilos.seccionContenidoListas}>
          {/* ACCIONES RÁPIDAS */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.tituloBloqueDinamico}>
              {quickActionEdicionIdx !== null
                ? "EDITANDO ATAQUE RÁPIDO"
                : `ATAQUES RÁPIDOS DE 1 CLIC (${monstruoForm.accionesRapidas?.length || 0})`}
            </div>
            <div className={estilos.filaAgregarRapido}>
              <input
                type="text"
                value={tQNombre}
                onChange={(e) => setTQNombre(e.target.value)}
                placeholder="Nombre Ataque (ej. Garra)"
                className={estilos.inputDinamicoMediano}
              />
              <input
                type="text"
                value={tQBono}
                onChange={(e) => setTQBono(e.target.value)}
                placeholder="Bono (+5)"
                className={estilos.inputDinamicoMini}
              />
              <input
                type="text"
                value={tQDados}
                onChange={(e) => setTQDados(e.target.value)}
                placeholder="Dados (2d6+3)"
                className={estilos.inputDinamicoMini}
              />
              <select
                value={tQTipo}
                onChange={(e) => setTQTipo(e.target.value)}
                className={estilos.selectDinamicoMini}
              >
                {TIPOS_DAÑO_DND.map((d) => (
                  <option key={`qa_daño_${d}`} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={agregarQuickAction}
                className={estilos.botonAgregarDinamico}
                style={{
                  backgroundColor: quickActionEdicionIdx !== null ? "var(--color-exito)" : undefined
                }}
                title={quickActionEdicionIdx !== null ? "Guardar Cambios" : "Agregar Ataque"}
              >
                {quickActionEdicionIdx !== null ? "✓" : "+"}
              </button>
              {quickActionEdicionIdx !== null && (
                <button
                  type="button"
                  onClick={cancelarEditarQuickAction}
                  className={estilos.botonAgregarDinamico}
                  style={{
                    backgroundColor: "var(--color-daño)"
                  }}
                  title="Cancelar Edición"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Lista previsualizada */}
            {monstruoForm.accionesRapidas && monstruoForm.accionesRapidas.length > 0 && (
              <div className={estilos.listaDinamicaVisual}>
                {monstruoForm.accionesRapidas.map((qa, idx) => (
                  <div key={`qa_v_${idx}`} className={estilos.itemDinamicoVisual}>
                    <span>
                      <strong>{qa.nombre}</strong>: {qa.bonificadorAtaque} | {qa.dadosDaño} ({qa.tipoDaño})
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => iniciarEditarQuickAction(idx)}
                        className={estilos.botonEliminarDinamico}
                        style={{ color: "var(--color-borde-cian)" }}
                        title="Editar Ataque Rápido"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarQuickActionIdx(idx)}
                        className={estilos.botonEliminarDinamico}
                        title="Eliminar Ataque Rápido"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RASGOS PASIVOS */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.tituloBloqueDinamico}>
              {rasgoEdicionIdx !== null
                ? "EDITANDO RASGO PASIVO"
                : `RASGOS Y HABILIDADES PASIVAS (${monstruoForm.rasgos?.length || 0})`}
            </div>
            <div className={estilos.camposDinamicosGrupo}>
              <input
                type="text"
                value={tRasgoNombre}
                onChange={(e) => setTRasgoNombre(e.target.value)}
                placeholder="Nombre del rasgo"
                className={estilos.inputDinamicoLargo}
              />
              <input
                type="text"
                value={tRasgoUso}
                onChange={(e) => setTRasgoUso(e.target.value)}
                placeholder="Uso opcional (ej. 3/día)"
                className={estilos.inputDinamicoMediano}
              />
              <textarea
                value={tRasgoDesc}
                onChange={(e) => setTRasgoDesc(e.target.value)}
                placeholder="Descripción detallada del rasgo..."
                className={estilos.textareaDinamico}
                rows={calcFilas(tRasgoDesc, 3)}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={agregarRasgo}
                  className={estilos.botonAgregarCompleto}
                  style={{
                    flex: 1,
                    backgroundColor: rasgoEdicionIdx !== null ? "var(--color-exito)" : undefined
                  }}
                >
                  {rasgoEdicionIdx !== null ? "Guardar Cambios del Rasgo" : "Agregar Rasgo"}
                </button>
                {rasgoEdicionIdx !== null && (
                  <button
                    type="button"
                    onClick={cancelarEditarRasgo}
                    className={estilos.botonAgregarCompleto}
                    style={{
                      width: "100px",
                      backgroundColor: "var(--color-daño)"
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
            {/* Lista pasivos */}
            {monstruoForm.rasgos && monstruoForm.rasgos.length > 0 && (
              <div className={estilos.listaDinamicaVisual}>
                {monstruoForm.rasgos.map((r, idx) => (
                  <div key={`r_v_${idx}`} className={estilos.itemDinamicoVisual}>
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <strong>
                        {r.nombre} {r.uso ? `(${r.uso})` : ""}
                      </strong>
                      :
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--color-texto-secundario)",
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        {r.descripcion}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => iniciarEditarRasgo(idx)}
                        className={estilos.botonEliminarDinamico}
                        style={{ color: "var(--color-borde-cian)" }}
                        title="Editar Rasgo"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarRasgoIdx(idx)}
                        className={estilos.botonEliminarDinamico}
                        title="Eliminar Rasgo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACCIONES Y ATAQUES */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.tituloBloqueDinamico}>
              {accionEdicionIdx !== null
                ? "EDITANDO ACCIÓN PRINCIPAL"
                : `ACCIONES Y ATAQUES PRINCIPALES (${monstruoForm.acciones?.length || 0})`}
            </div>
            <div className={estilos.camposDinamicosGrupo}>
              <div className={estilos.filaCamposAlineados}>
                <input
                  type="text"
                  value={tAccionNombre}
                  onChange={(e) => setTAccionNombre(e.target.value)}
                  placeholder="Nombre de la acción"
                  className={estilos.inputDinamicoMediano}
                />
                <input
                  type="number"
                  value={tAccionBono}
                  onChange={(e) => setTAccionBono(e.target.value)}
                  placeholder="Bono (+5)"
                  className={estilos.inputDinamicoMini}
                />
                <input
                  type="text"
                  value={tAccionDaño}
                  onChange={(e) => setTAccionDaño(e.target.value)}
                  placeholder="Daño (1d8+3)"
                  className={estilos.inputDinamicoMini}
                />
                <input
                  type="text"
                  value={tAccionUso}
                  onChange={(e) => setTAccionUso(e.target.value)}
                  placeholder="Recarga (5-6)"
                  className={estilos.inputDinamicoMini}
                />
              </div>
              <textarea
                value={tAccionDesc}
                onChange={(e) => setTAccionDesc(e.target.value)}
                placeholder="Descripción detallada de la acción o ataque..."
                className={estilos.textareaDinamico}
                rows={calcFilas(tAccionDesc, 3)}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={agregarAccion}
                  className={estilos.botonAgregarCompleto}
                  style={{
                    flex: 1,
                    backgroundColor: accionEdicionIdx !== null ? "var(--color-exito)" : undefined
                  }}
                >
                  {accionEdicionIdx !== null ? "Guardar Cambios de la Acción" : "Agregar Acción"}
                </button>
                {accionEdicionIdx !== null && (
                  <button
                    type="button"
                    onClick={cancelarEditarAccion}
                    className={estilos.botonAgregarCompleto}
                    style={{
                      width: "100px",
                      backgroundColor: "var(--color-daño)"
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
            {/* Lista acciones */}
            {monstruoForm.acciones && monstruoForm.acciones.length > 0 && (
              <div className={estilos.listaDinamicaVisual}>
                {monstruoForm.acciones.map((a, idx) => (
                  <div key={`a_v_${idx}`} className={estilos.itemDinamicoVisual}>
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <strong>
                        {a.nombre} {a.uso ? `(${a.uso})` : ""}
                      </strong>
                      :
                      <span style={{ fontSize: "11px", marginLeft: "5px", color: "var(--color-borde-cian)" }}>
                        {a.bonificadorAtaque ? `+${a.bonificadorAtaque}` : ""} {a.daño ? `| ${a.daño}` : ""}
                      </span>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--color-texto-secundario)",
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        {a.descripcion}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => iniciarEditarAccion(idx)}
                        className={estilos.botonEliminarDinamico}
                        style={{ color: "var(--color-borde-cian)" }}
                        title="Editar Acción"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarAccionIdx(idx)}
                        className={estilos.botonEliminarDinamico}
                        title="Eliminar Acción"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REACCIONES */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.tituloBloqueDinamico}>
              {reaccionEdicionIdx !== null ? "EDITANDO REACCIÓN" : `REACCIONES (${monstruoForm.reacciones?.length || 0})`}
            </div>
            <div className={estilos.camposDinamicosGrupo}>
              <input
                type="text"
                value={tReaccionNombre}
                onChange={(e) => setTReaccionNombre(e.target.value)}
                placeholder="Nombre de la reacción"
                className={estilos.inputDinamicoLargo}
              />
              <input
                type="text"
                value={tReaccionUso}
                onChange={(e) => setTReaccionUso(e.target.value)}
                placeholder="Uso opcional (ej. 1/ronda)"
                className={estilos.inputDinamicoMediano}
              />
              <textarea
                value={tReaccionDesc}
                onChange={(e) => setTReaccionDesc(e.target.value)}
                placeholder="Descripción detallada de la reacción..."
                className={estilos.textareaDinamico}
                rows={calcFilas(tReaccionDesc, 3)}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={agregarReaccion}
                  className={estilos.botonAgregarCompleto}
                  style={{
                    flex: 1,
                    backgroundColor: reaccionEdicionIdx !== null ? "var(--color-exito)" : undefined
                  }}
                >
                  {reaccionEdicionIdx !== null ? "Guardar Cambios de la Reacción" : "Agregar Reacción"}
                </button>
                {reaccionEdicionIdx !== null && (
                  <button
                    type="button"
                    onClick={cancelarEditarReaccion}
                    className={estilos.botonAgregarCompleto}
                    style={{
                      width: "100px",
                      backgroundColor: "var(--color-daño)"
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
            {/* Lista reacciones */}
            {monstruoForm.reacciones && monstruoForm.reacciones.length > 0 && (
              <div className={estilos.listaDinamicaVisual}>
                {monstruoForm.reacciones.map((r, idx) => (
                  <div key={`rec_v_${idx}`} className={estilos.itemDinamicoVisual}>
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <strong>
                        {r.nombre} {r.uso ? `(${r.uso})` : ""}
                      </strong>
                      :
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--color-texto-secundario)",
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        {r.descripcion}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => iniciarEditarReaccion(idx)}
                        className={estilos.botonEliminarDinamico}
                        style={{ color: "var(--color-borde-cian)" }}
                        title="Editar Reacción"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarReaccionIdx(idx)}
                        className={estilos.botonEliminarDinamico}
                        title="Eliminar Reacción"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACCIONES LEGENDARIAS */}
          <div className={estilos.bloqueDinamicoForm}>
            <div className={estilos.tituloBloqueDinamico}>
              {legendariaEdicionIdx !== null
                ? "EDITANDO ACCIÓN LEGENDARIA"
                : `ACCIONES LEGENDARIAS (${monstruoForm.accionesLegendarias?.length || 0})`}
            </div>
            <div className={estilos.camposDinamicosGrupo}>
              <input
                type="text"
                value={tLegendariaNombre}
                onChange={(e) => setTLegendariaNombre(e.target.value)}
                placeholder="Nombre de la acción legendaria"
                className={estilos.inputDinamicoLargo}
              />
              <input
                type="text"
                value={tLegendariaUso}
                onChange={(e) => setTLegendariaUso(e.target.value)}
                placeholder="Costo en acciones (ej. consume 2 acciones)"
                className={estilos.inputDinamicoMediano}
              />
              <textarea
                value={tLegendariaDesc}
                onChange={(e) => setTLegendariaDesc(e.target.value)}
                placeholder="Descripción detallada de la acción legendaria..."
                className={estilos.textareaDinamico}
                rows={calcFilas(tLegendariaDesc, 3)}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={agregarLegendaria}
                  className={estilos.botonAgregarCompleto}
                  style={{
                    flex: 1,
                    backgroundColor: legendariaEdicionIdx !== null ? "var(--color-exito)" : undefined
                  }}
                >
                  {legendariaEdicionIdx !== null ? "Guardar Cambios Legendaria" : "Agregar Acción Legendaria"}
                </button>
                {legendariaEdicionIdx !== null && (
                  <button
                    type="button"
                    onClick={cancelarEditarLegendaria}
                    className={estilos.botonAgregarCompleto}
                    style={{
                      width: "100px",
                      backgroundColor: "var(--color-daño)"
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
            {/* Lista legendarias */}
            {monstruoForm.accionesLegendarias && monstruoForm.accionesLegendarias.length > 0 && (
              <div className={estilos.listaDinamicaVisual}>
                {monstruoForm.accionesLegendarias.map((l, idx) => (
                  <div key={`leg_v_${idx}`} className={estilos.itemDinamicoVisual}>
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <strong>
                        {l.nombre} {l.uso ? `(${l.uso})` : ""}
                      </strong>
                      :
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--color-texto-secundario)",
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        {l.descripcion}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => iniciarEditarLegendaria(idx)}
                        className={estilos.botonEliminarDinamico}
                        style={{ color: "var(--color-borde-cian)" }}
                        title="Editar Acción Legendaria"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarLegendariaIdx(idx)}
                        className={estilos.botonEliminarDinamico}
                        title="Eliminar Acción Legendaria"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón de Enviar General */}
      <div className={estilos.grupoBotonesAccion}>
        <button type="submit" className={estilos.botonEnviarBrutal}>
          <Plus size={15} />
          {idEnEdicion ? "Guardar Cambios en la Criatura" : "Guardar Criatura D&D 5.5e Completa"}
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
