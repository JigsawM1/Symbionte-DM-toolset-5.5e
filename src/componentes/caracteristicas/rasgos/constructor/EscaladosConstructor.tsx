import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { RecuperacionRasgo } from "@/tipos";
import { OPCIONES_RECUPERACION } from "./constantesConstructor";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
import { TablaEscaladoEditor } from "./TablaEscaladoEditor";
import estilos from "../ConstructorRasgoDote.module.css";

export function EscaladosConstructor({ borrador: b, actualizarBorrador: cambiar }: {
  borrador: BorradorRasgo; actualizarBorrador: ActualizarBorradorRasgo;
}) {
  return <div className={estilos.seccionCard}>
    <h3>Progresión y recuperación</h3>
    <p className={estilos.pistaCampo}>Los niveles corresponden a la clase de origen; los rasgos personalizados utilizan el nivel del personaje.</p>
    <label className={estilos.campoGrupo}>Usos recuperados en un descanso corto
      <CampoNumerico min={1} value={b.recargaDescansoCorto ?? ""} className={estilos.inputControl}
        alConfirmar={v => cambiar("recargaDescansoCorto", v)} alVaciar={() => cambiar("recargaDescansoCorto", undefined)} />
    </label>
    <TablaEscaladoEditor etiqueta="Dados por nivel" filas={b.escaladoFormulaDados ?? []}
      alCambiar={v => cambiar("escaladoFormulaDados", v.length ? v : undefined)} />
    <SelectorDesplegable valor={b.escaladoUsos?.tipo ?? "por_nivel"} opciones={[
      { valor: "por_nivel", etiqueta: "Usos por nivel" }, { valor: "por_modificador", etiqueta: "Usos por modificador" }
    ]} alCambiar={tipo => cambiar("escaladoUsos", { ...b.escaladoUsos, tipo, minimo: b.escaladoUsos?.minimo ?? 1 })} />
    {b.escaladoUsos?.tipo === "por_modificador" ? <label>Modificador
      <input className={estilos.inputControl} value={b.escaladoUsos.modificador ?? ""}
        onChange={e => cambiar("escaladoUsos", { ...b.escaladoUsos!, modificador: e.target.value })} />
    </label> : <TablaEscaladoEditor etiqueta="Usos por nivel" filas={b.escaladoUsos?.tabla ?? []}
      alCambiar={v => cambiar("escaladoUsos", v.length ? { ...b.escaladoUsos, tipo: "por_nivel", minimo: b.escaladoUsos?.minimo ?? 1, tabla: v.map(f => ({ ...f, valor: Number(f.valor) })) } : undefined)} />}
    {(b.escaladoRecuperacion ?? []).map((f, i) => <div key={i} className={estilos.gridTresColumnas}>
      <CampoNumerico min={1} max={20} value={f.nivelMinimo} aria-label={`Recuperación: nivel ${i + 1}`}
        alConfirmar={v => cambiar("escaladoRecuperacion", b.escaladoRecuperacion?.map((a, j) => j === i ? { ...a, nivelMinimo: v } : a))} />
      <SelectorDesplegable<RecuperacionRasgo> valor={f.valor} opciones={OPCIONES_RECUPERACION}
        alCambiar={v => cambiar("escaladoRecuperacion", b.escaladoRecuperacion?.map((a, j) => j === i ? { ...a, valor: v } : a))} />
      <button type="button" onClick={() => cambiar("escaladoRecuperacion", b.escaladoRecuperacion?.filter((_, j) => j !== i))}>Eliminar recuperación {i + 1}</button>
    </div>)}
    <button type="button" onClick={() => cambiar("escaladoRecuperacion", [...(b.escaladoRecuperacion ?? []), { nivelMinimo: 1, valor: "descanso_largo" }])}>Añadir recuperación por nivel</button>
    {b.efectos.map(ef => <TablaEscaladoEditor key={ef.id ?? `${ef.tipo}:${ef.objetivo}`} etiqueta={`Efecto: ${ef.descripcion ?? ef.objetivo}`}
      filas={b.escaladoEfectos?.find(e => e.tipo === ef.tipo && e.objetivo === ef.objetivo)?.escalones ?? []}
      alCambiar={escalones => cambiar("escaladoEfectos", [
        ...(b.escaladoEfectos ?? []).filter(e => e.tipo !== ef.tipo || e.objetivo !== ef.objetivo),
        ...(escalones.length ? [{ tipo: ef.tipo, objetivo: ef.objetivo, escalones }] : [])
      ])} />)}
    {b.selectores.map(sel => <TablaEscaladoEditor key={sel.id} etiqueta={`Selecciones: ${sel.etiqueta}`}
      filas={sel.escaladoMaxSelecciones ?? []} alCambiar={v => cambiar("selectores", b.selectores.map(s => s.id === sel.id
        ? { ...s, escaladoMaxSelecciones: v.map(f => ({ ...f, valor: Number(f.valor) })) } : s))} />)}
  </div>;
}
