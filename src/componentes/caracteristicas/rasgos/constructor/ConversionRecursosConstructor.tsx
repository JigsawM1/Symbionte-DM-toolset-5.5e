import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import estilos from "../ConstructorRasgoDote.module.css";

export function ConversionRecursosConstructor({ borrador: b, actualizarBorrador: cambiar }: {
  borrador: BorradorRasgo; actualizarBorrador: ActualizarBorradorRasgo;
}) {
  return <div className={estilos.seccionCard}>
    <h3>Intercambio y recuperación de recursos</h3>
    <label className={estilos.campoGrupo}>ID del rasgo que aporta la reserva
      <input className={estilos.inputControl} value={b.idRasgoRecurso ?? ""} onChange={e => cambiar("idRasgoRecurso", e.target.value || undefined)} />
    </label>
    <label className={estilos.filaToggle}>Crear espacios con la reserva
      <input type="checkbox" checked={Boolean(b.conversionEspacios)} onChange={e => cambiar("conversionEspacios", e.target.checked
        ? { tabla: [{ nivelEspacio: 1, coste: 1, nivelMinimo: 1 }], permiteConvertir: true } : undefined)} />
    </label>
    {b.conversionEspacios && <>
      <label className={estilos.filaToggle}>Permitir convertir espacios en puntos de la reserva
        <input type="checkbox" checked={b.conversionEspacios.permiteConvertir} onChange={e => cambiar("conversionEspacios", { ...b.conversionEspacios!, permiteConvertir: e.target.checked })} />
      </label>
      {b.conversionEspacios.tabla.map((f, i) => <div key={i} className={estilos.gridTresColumnas}>
        {(["nivelEspacio", "coste", "nivelMinimo"] as const).map((campo, c) => <label key={campo} className={estilos.campoGrupo}>{["Nivel del espacio", "Coste en puntos", "Nivel mínimo de clase"][c]}
          <CampoNumerico className={estilos.inputControl} min={1} max={campo === "nivelEspacio" ? 9 : campo === "nivelMinimo" ? 20 : undefined} value={f[campo]} alConfirmar={valor => cambiar("conversionEspacios", {
            ...b.conversionEspacios!, tabla: b.conversionEspacios!.tabla.map((fila, j) => j === i ? { ...fila, [campo]: valor } : fila)
          })} />
        </label>)}
      </div>)}
      <button type="button" onClick={() => cambiar("conversionEspacios", { ...b.conversionEspacios!, tabla: [...b.conversionEspacios!.tabla,
        { nivelEspacio: Math.min(9, b.conversionEspacios!.tabla.length + 1), coste: 1, nivelMinimo: 1 }] })}>Añadir nivel de espacio</button>
      {b.conversionEspacios.tabla.length > 1 && <button type="button" onClick={() => cambiar("conversionEspacios", {
        ...b.conversionEspacios!, tabla: b.conversionEspacios!.tabla.slice(0, -1) })}>Retirar último nivel</button>}
    </>}
    <label className={estilos.filaToggle}>Ofrecer recuperación al terminar un descanso corto
      <input type="checkbox" checked={Boolean(b.recuperacionOpcionalDescanso)} onChange={e => cambiar("recuperacionOpcionalDescanso", e.target.checked
        ? { idRasgoObjetivo: b.idRasgoRecurso || b.ligadoA, formulaCantidad: "mitad_nivel" } : undefined)} />
    </label>
    {b.recuperacionOpcionalDescanso && <>
      <label className={estilos.campoGrupo}>ID de la reserva a recuperar<input className={estilos.inputControl}
        value={b.recuperacionOpcionalDescanso.idRasgoObjetivo} onChange={e => cambiar("recuperacionOpcionalDescanso", { ...b.recuperacionOpcionalDescanso!, idRasgoObjetivo: e.target.value })} /></label>
      <label className={estilos.campoGrupo}>Cantidad máxima (nivel de clase)<input className={estilos.inputControl}
        value={b.recuperacionOpcionalDescanso.formulaCantidad} onChange={e => cambiar("recuperacionOpcionalDescanso", { ...b.recuperacionOpcionalDescanso!, formulaCantidad: e.target.value })} /></label>
    </>}
    <label className={estilos.filaToggle}>Activar con otra reserva al agotarse los usos propios
      <input type="checkbox" checked={Boolean(b.activacionAlternativa)} onChange={e => cambiar("activacionAlternativa", e.target.checked
        ? { idRasgoRecurso: b.idRasgoRecurso || b.ligadoA, coste: 1 } : undefined)} />
    </label>
    {b.activacionAlternativa && <>
      <label className={estilos.campoGrupo}>ID de la reserva alternativa<input className={estilos.inputControl}
        value={b.activacionAlternativa.idRasgoRecurso} onChange={e => cambiar("activacionAlternativa", { ...b.activacionAlternativa!, idRasgoRecurso: e.target.value })} /></label>
      <label>Coste alternativo<CampoNumerico min={1} value={b.activacionAlternativa.coste} alConfirmar={coste => cambiar("activacionAlternativa", { ...b.activacionAlternativa!, coste })} /></label>
    </>}
    <h3>Modificadores de lanzamiento</h3>
    {b.efectos.filter(e => e.tipo === "modificador_cd_conjuro" || (e.tipo === "ventaja" && e.objetivo === "ataque_conjuro")).map(e => <div key={e.id} className={estilos.campoGrupo}>
      <label>{e.tipo === "ventaja" ? "Ventaja en ataques de conjuro" : "Bonificador a CD"} · clase de procedencia
        <input className={estilos.inputControl} value={e.claseConjuro ?? ""} placeholder="Vacío: cualquier clase"
          onChange={v => cambiar("efectos", b.efectos.map(x => x === e ? { ...x, claseConjuro: v.target.value || undefined } : x))} />
      </label>
      {e.tipo === "modificador_cd_conjuro" && <CampoNumerico value={Number(e.valor) || 0} alConfirmar={valor => cambiar("efectos", b.efectos.map(x => x === e ? { ...x, valor } : x))} />}
      <button type="button" onClick={() => cambiar("efectos", b.efectos.filter(x => x !== e))}>Retirar modificador</button>
    </div>)}
    <button type="button" onClick={() => cambiar("efectos", [...b.efectos, { id: crypto.randomUUID(), tipo: "modificador_cd_conjuro", objetivo: "cd_conjuro", valor: 1 }])}>Añadir bono de CD</button>
    <button type="button" onClick={() => cambiar("efectos", [...b.efectos, { id: crypto.randomUUID(), tipo: "ventaja", objetivo: "ataque_conjuro", valor: 1 }])}>Añadir ventaja en ataques de conjuro</button>
  </div>;
}
