import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorDesplegable, type OpcionDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { BotonNumerico } from "@/componentes/comunes/BotonNumerico";
import type { DatosFormularioInvocacion } from "@/hooks/usarFormularioInvocacion";
import type { AtaqueInvocacion, RasgoInvocacion } from "@/tipos";
import estilos from "../FormularioCriatura.module.css";

interface SeccionHabilidadesInvocacionProps {
  invocacionForm: DatosFormularioInvocacion;
  agregarAtaque: (ataque: AtaqueInvocacion) => void;
  eliminarAtaque: (idx: number) => void;
  agregarRasgoLista: (lista: "rasgos" | "accionesAdicionales" | "reacciones", rasgo: RasgoInvocacion) => void;
  eliminarRasgoLista: (lista: "rasgos" | "accionesAdicionales" | "reacciones", idx: number) => void;
}

const OPCIONES_TIPO_ATAQUE: OpcionDesplegable<AtaqueInvocacion["tipo"]>[] = [
  { valor: "cuerpo_a_cuerpo", etiqueta: "Cuerpo a cuerpo" },
  { valor: "a_distancia", etiqueta: "A distancia" },
  { valor: "ambos", etiqueta: "Cuerpo a cuerpo o distancia" }
];

interface BloqueRasgoInvProps {
  titulo: string;
  items: RasgoInvocacion[];
  alAgregar: (r: RasgoInvocacion) => void;
  alEliminar: (idx: number) => void;
}

const BloqueRasgosInvocacion: React.FC<BloqueRasgoInvProps> = ({ titulo, items, alAgregar, alEliminar }) => {
  const [nombre, setNombre] = useState("");
  const [subtipoRequerido, setSubtipoRequerido] = useState("");
  const [uso, setUso] = useState("");
  const [recarga, setRecarga] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const manejarAgregar = () => {
    if (!nombre.trim() || !descripcion.trim()) return;
    alAgregar({
      nombre: nombre.trim(),
      subtipoRequerido: subtipoRequerido.trim() || undefined,
      uso: uso.trim() || undefined,
      recarga: recarga.trim() || undefined,
      descripcion: descripcion.trim()
    });
    setNombre("");
    setSubtipoRequerido("");
    setUso("");
    setRecarga("");
    setDescripcion("");
  };

  return (
    <div className={estilos.bloqueDinamicoForm}>
      <div className={estilos.tituloBloqueDinamico}>{titulo} ({items.length})</div>
      <div className={estilos.camposDinamicosGrupo}>
        <div className={estilos.filaCamposAlineados}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className={estilos.inputDinamicoMediano}
          />
          <input
            type="text"
            value={subtipoRequerido}
            onChange={(e) => setSubtipoRequerido(e.target.value)}
            placeholder="Subtipo req. (opc.)"
            className={estilos.inputDinamicoMini}
          />
          <input
            type="text"
            value={uso}
            onChange={(e) => setUso(e.target.value)}
            placeholder="Uso (ej. 1/día)"
            className={estilos.inputDinamicoMini}
          />
          <input
            type="text"
            value={recarga}
            onChange={(e) => setRecarga(e.target.value)}
            placeholder="Recarga (ej. 5-6)"
            className={estilos.inputDinamicoMini}
          />
        </div>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (puedes usar {CD} o {NIVEL} como marcadores)..."
          rows={2}
          className={estilos.textareaDinamico}
          spellCheck={false}
        />
        <button
          type="button"
          onClick={manejarAgregar}
          className={`${estilos.botonAgregarCompleto} ${estilos.botonAgregarCompletoNormal}`}
        >
          Agregar a {titulo}
        </button>
      </div>

      {items.length > 0 && (
        <div className={estilos.listaDinamicaVisual}>
          {items.map((item, idx) => (
            <div key={`${titulo}_${idx}`} className={estilos.itemDinamicoVisual}>
              <div className={estilos.itemVisualCuerpo}>
                <strong>
                  {item.nombre}
                  {item.subtipoRequerido ? ` [${item.subtipoRequerido}]` : ""}
                  {item.uso || item.recarga ? ` (${[item.uso, item.recarga].filter(Boolean).join(" / ")})` : ""}
                </strong>
                <div className={estilos.itemVisualDescripcion}>{item.descripcion}</div>
              </div>
              <button
                type="button"
                onClick={() => alEliminar(idx)}
                className={estilos.botonEliminarDinamico}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Pestaña de Ataques escalables, Rasgos, Acciones Adicionales y Reacciones de la invocación.
 */
export const SeccionHabilidadesInvocacion: React.FC<SeccionHabilidadesInvocacionProps> = ({
  invocacionForm,
  agregarAtaque,
  eliminarAtaque,
  agregarRasgoLista,
  eliminarRasgoLista
}) => {
  const [atqNombre, setAtqNombre] = useState("");
  const [atqTipo, setAtqTipo] = useState<AtaqueInvocacion["tipo"]>("cuerpo_a_cuerpo");
  const [atqAlcance, setAtqAlcance] = useState("5 pies");
  const [atqDados, setAtqDados] = useState("1d8");
  const [atqModFijo, setAtqModFijo] = useState<number>(3);
  const [atqTipoDano, setAtqTipoDano] = useState("fuerza");
  const [atqSumaNivel, setAtqSumaNivel] = useState(true);
  const [atqUsaConjuro, setAtqUsaConjuro] = useState(true);
  const [atqNotas, setAtqNotas] = useState("");

  const manejarAgregarAtaque = () => {
    if (!atqNombre.trim() || !atqDados.trim()) return;
    agregarAtaque({
      nombre: atqNombre.trim(),
      tipo: atqTipo,
      usaModificadorAtaqueConjuros: atqUsaConjuro,
      alcance: atqAlcance.trim() || "5 pies",
      dadosDanoBase: atqDados.trim(),
      modificadorDanoFijo: atqModFijo,
      sumaNivelAlDano: atqSumaNivel,
      tipoDano: atqTipoDano.trim() || "fuerza",
      descripcionExtra: atqNotas.trim() || undefined
    });
    setAtqNombre("");
    setAtqNotas("");
  };

  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.bloqueDinamicoForm}>
        <div className={estilos.tituloBloqueDinamico}>
          ATAQUES ESCALABLES ({invocacionForm.ataques.length})
        </div>
        <div className={estilos.camposDinamicosGrupo}>
          <div className={estilos.filaCamposAlineados}>
            <input
              type="text"
              value={atqNombre}
              onChange={(e) => setAtqNombre(e.target.value)}
              placeholder="Nombre (ej. Hoja Feérica)"
              className={estilos.inputDinamicoMediano}
            />
            <div className={estilos.selectorDanoCompacto}>
              <SelectorDesplegable
                valor={atqTipo}
                alCambiar={setAtqTipo}
                opciones={OPCIONES_TIPO_ATAQUE}
                tamano="compacto"
                enFlujo
              />
            </div>
            <input
              type="text"
              value={atqAlcance}
              onChange={(e) => setAtqAlcance(e.target.value)}
              placeholder="Alcance (5 pies)"
              className={estilos.inputDinamicoMini}
            />
            <input
              type="text"
              value={atqDados}
              onChange={(e) => setAtqDados(e.target.value)}
              placeholder="Dados (1d8)"
              className={estilos.inputDinamicoMini}
            />
            <CampoNumerico
              value={atqModFijo}
              alConfirmar={setAtqModFijo}
              placeholder="Mod (+3)"
              tipo="entero"
              className={estilos.inputDinamicoMini}
            />
          </div>
          <div className={estilos.filaCamposAlineados}>
            <input
              type="text"
              value={atqTipoDano}
              onChange={(e) => setAtqTipoDano(e.target.value)}
              placeholder="Tipo daño (ej. fuerza)"
              className={estilos.inputDinamicoMediano}
            />
            <label className={estilos.checkboxFila}>
              <input
                type="checkbox"
                checked={atqSumaNivel}
                onChange={(e) => setAtqSumaNivel(e.target.checked)}
              />
              <span>+ Nivel conjuro al daño</span>
            </label>
            <label className={estilos.checkboxFila}>
              <input
                type="checkbox"
                checked={atqUsaConjuro}
                onChange={(e) => setAtqUsaConjuro(e.target.checked)}
              />
              <span>Usa mod. ataque conjuros</span>
            </label>
            <BotonNumerico
              ambito="form"
              type="button"
              onClick={manejarAgregarAtaque}
              className={estilos.botonAgregarDinamico}
            >
              <Plus size={14} /> Agregar
            </BotonNumerico>
          </div>
          <input
            type="text"
            value={atqNotas}
            onChange={(e) => setAtqNotas(e.target.value)}
            placeholder="Descripción extra (ej. +1d6 de fuerza adicional)"
            className={estilos.inputDinamicoLargo}
          />
        </div>

        {invocacionForm.ataques.length > 0 && (
          <div className={estilos.listaDinamicaVisual}>
            {invocacionForm.ataques.map((atq, idx) => (
              <div key={`atq_inv_${idx}`} className={estilos.itemDinamicoVisual}>
                <span>
                  <strong>{atq.nombre}</strong>: {atq.dadosDanoBase}
                  {atq.modificadorDanoFijo ? `+${atq.modificadorDanoFijo}` : ""}
                  {atq.sumaNivelAlDano ? "+Nv" : ""} ({atq.tipoDano}) | {atq.alcance}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarAtaque(idx)}
                  className={estilos.botonEliminarDinamico}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BloqueRasgosInvocacion
        titulo="RASGOS"
        items={invocacionForm.rasgos}
        alAgregar={(r) => agregarRasgoLista("rasgos", r)}
        alEliminar={(idx) => eliminarRasgoLista("rasgos", idx)}
      />

      <BloqueRasgosInvocacion
        titulo="ACCIONES ADICIONALES"
        items={invocacionForm.accionesAdicionales}
        alAgregar={(r) => agregarRasgoLista("accionesAdicionales", r)}
        alEliminar={(idx) => eliminarRasgoLista("accionesAdicionales", idx)}
      />

      <BloqueRasgosInvocacion
        titulo="REACCIONES"
        items={invocacionForm.reacciones}
        alAgregar={(r) => agregarRasgoLista("reacciones", r)}
        alEliminar={(idx) => eliminarRasgoLista("reacciones", idx)}
      />
    </div>
  );
};
