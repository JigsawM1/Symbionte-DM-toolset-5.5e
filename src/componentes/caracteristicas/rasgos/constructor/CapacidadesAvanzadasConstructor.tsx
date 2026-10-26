import { CampoNumerico } from "@/componentes/comunes";
import { EsquemaMecanicasRasgo } from "@/tipos/mecanicasRasgos";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
import estilos from "../ConstructorRasgoDote.module.css";
import { EditorCapacidadJSON } from "./EditorCapacidadJSON";

export function CapacidadesAvanzadasConstructor({ borrador: b, actualizarBorrador: cambiar }: {
  borrador: BorradorRasgo; actualizarBorrador: ActualizarBorradorRasgo;
}) {
  return <div className={estilos.seccionCard}>
    <h3>Reservas, lanzamientos y tablas</h3>
    <EditorCapacidadJSON etiqueta="Resolución asistida" valor={b.resolucionAsistida} esquema={EsquemaMecanicasRasgo.shape.resolucionAsistida}
      cambiar={v => cambiar("resolucionAsistida", v)} />
    <EditorCapacidadJSON etiqueta="Lanzamiento con recurso: configuración completa" valor={b.lanzamientoConRecurso} esquema={EsquemaMecanicasRasgo.shape.lanzamientoConRecurso}
      cambiar={v => cambiar("lanzamientoConRecurso", v)} />
    <label>Coste de recarga con la reserva padre<CampoNumerico min={1} value={b.costeRecargaPadre ?? 1} alConfirmar={v => cambiar("costeRecargaPadre", v)} /></label>
    <label className={estilos.filaToggle}>Cobrar por cada opción elegida al activar<input type="checkbox" checked={!!b.costeActivacionPorSelector}
      onChange={e => cambiar("costeActivacionPorSelector", e.target.checked ? { idSelector: b.selectores[0]?.id ?? "", costePorOpcion: 1 } : undefined)} /></label>
    {b.costeActivacionPorSelector && <div className={estilos.gridDosColumnas}>
      <label>ID del selector<input className={estilos.inputControl} value={b.costeActivacionPorSelector.idSelector}
        onChange={e => cambiar("costeActivacionPorSelector", { ...b.costeActivacionPorSelector!, idSelector: e.target.value })} /></label>
      <label>Coste por opción<CampoNumerico min={1} value={b.costeActivacionPorSelector.costePorOpcion}
        alConfirmar={costePorOpcion => cambiar("costeActivacionPorSelector", { ...b.costeActivacionPorSelector!, costePorOpcion })} /></label>
    </div>}
    <label className={estilos.filaToggle}>Comprar una reserva independiente de dados<input type="checkbox" checked={!!b.reservaDados}
      onChange={e => cambiar("reservaDados", e.target.checked ? { caras: 8, maximo: 5, costePorDado: 1 } : undefined)} /></label>
    {b.reservaDados && <div className={estilos.gridTresColumnas}>{(["caras", "maximo", "costePorDado"] as const).map((campo, i) =>
      <label key={campo}>{["Caras", "Máximo de dados", "Coste por dado"][i]}<CampoNumerico min={campo === "caras" ? 2 : 1} value={b.reservaDados![campo]}
        alConfirmar={v => cambiar("reservaDados", { ...b.reservaDados!, [campo]: v })} /></label>)}</div>}
    <label className={estilos.filaToggle}>Lanzar conjuros concedidos pagando su nivel en la reserva<input type="checkbox" checked={!!b.lanzamientoConRecurso}
      onChange={e => cambiar("lanzamientoConRecurso", e.target.checked ? { idRasgoConcesion: "", nivelMaximo: 5 } : undefined)} /></label>
    {b.lanzamientoConRecurso && <>
      <label>ID del rasgo que concede los conjuros<input className={estilos.inputControl} value={b.lanzamientoConRecurso.idRasgoConcesion ?? ""}
        onChange={e => cambiar("lanzamientoConRecurso", { ...b.lanzamientoConRecurso!, idRasgoConcesion: e.target.value })} /></label>
      <label>Nivel máximo de conjuro<CampoNumerico min={1} max={9} value={b.lanzamientoConRecurso.nivelMaximo}
        alConfirmar={nivelMaximo => cambiar("lanzamientoConRecurso", { ...b.lanzamientoConRecurso!, nivelMaximo })} /></label>
    </>}
    {([ ["ignorarMaterialesConjuro", "Ignorar solo materiales del conjuro vinculado"], ["varianteSinConcentracion", "Permitir variante de 1 minuto sin concentración"],
      ["gastarUsoTrasTirada", "Preparar la siguiente prueba d20 y gastar solo tras emitirla"] ] as const).map(([campo, etiqueta]) => <label key={campo} className={estilos.filaToggle}>
        {etiqueta}<input type="checkbox" checked={!!b[campo]} onChange={e => cambiar(campo, e.target.checked)} /></label>)}
    <label className={estilos.filaToggle}>Ofrecer uso gratuito condicionado<input type="checkbox" checked={!!b.usoGratuitoCondicionado}
      onChange={e => cambiar("usoGratuitoCondicionado", e.target.checked ? { idRasgoActivo: "", nivelMinimo: 1 } : undefined)} /></label>
    {b.usoGratuitoCondicionado && <>
      <label>ID del rasgo requerido activo<input className={estilos.inputControl} value={b.usoGratuitoCondicionado.idRasgoActivo}
        onChange={e => cambiar("usoGratuitoCondicionado", { ...b.usoGratuitoCondicionado!, idRasgoActivo: e.target.value })} /></label>
      <label>Nivel mínimo<CampoNumerico min={1} max={20} value={b.usoGratuitoCondicionado.nivelMinimo}
        alConfirmar={nivelMinimo => cambiar("usoGratuitoCondicionado", { ...b.usoGratuitoCondicionado!, nivelMinimo })} /></label>
    </>}
    <EditorCapacidadJSON etiqueta="Tabla aleatoria editable" valor={b.tablaAleatoria} esquema={EsquemaMecanicasRasgo.shape.tablaAleatoria}
      plantillaInicial={{ dado: 100, tiradas: 1, modo: "aleatoria", filas: [{ id: "resultado", desde: 1, hasta: 100, texto: "Efecto" }] }}
      ayuda={'Define dado, tiradas (1 o 2), modo (aleatoria, elegir, recargar o consultar), filas con desde/hasta/texto y subtiradas con formula y siResultado opcional. Para compartir una tabla usa idRasgoTabla. Consultar ejecuta la tabla referenciada sin gastar ni recargar el rasgo de acceso. presentacion: "magia_salvaje" abre la vista de percentiles y requiere dado: 100. excluirUltima impide elegir la última fila declarada.'}
      cambiar={v => cambiar("tablaAleatoria", v)} />
  </div>;
}
