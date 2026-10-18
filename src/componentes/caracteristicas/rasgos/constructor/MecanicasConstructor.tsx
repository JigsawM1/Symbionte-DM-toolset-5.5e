import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { EsquemaCaracteristica, EsquemaTipoLanzador, EsquemaModeloConjuros } from "@/tipos/personaje";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
import estilos from "../ConstructorRasgoDote.module.css";

export function MecanicasConstructor({ borrador: b, actualizarBorrador: cambiar }: {
  borrador: BorradorRasgo; actualizarBorrador: ActualizarBorradorRasgo;
}) {
  const toggles = [
    ["autoDesactivarAlTirarSalvacion", "Desactivar tras la siguiente salvación"],
    ["desactivarConArmaduraPesada", "Impedir y finalizar con armadura pesada"],
    ["autoDesactivarAlTirarDano", "Desactivar tras emitir daño"],
    ["recargarUsoConPadre", "Recargar un uso gastando el recurso padre"],
    ["noGastarAlTirarDados", "Tirar dados sin gastar usos"],
    ["sincronizarEfectosConFormula", "Actualizar los efectos de dados con la fórmula"],
    ["ignorarComponentesConjuro", "El conjuro gratuito no requiere componentes"]
  ] as const;
  const listas = [
    ["desactivarConCondiciones", "Finalizar al recibir estas condiciones"],
    ["eliminarCondicionesAlActivar", "Retirar estas condiciones al ejecutar"],
    ["autoDesactivarEnTirada", "Desactivar tras estas tiradas (iniciativa, habilidad.sigilo, etc.)"]
  ] as const;
  const magia = b.configuracionMagica;
  return <div className={estilos.seccionCard}>
    <h3>Comportamiento y magia</h3>
    {toggles.map(([campo, etiqueta]) => <label key={campo} className={estilos.filaToggle}>
      <span>{etiqueta}</span><input type="checkbox" checked={Boolean(b[campo])} onChange={e => cambiar(campo, e.target.checked)} />
    </label>)}
    {listas.map(([campo, etiqueta]) => <label key={campo} className={estilos.campoGrupo}>
      {etiqueta}<input className={estilos.inputControl} value={(b[campo] ?? []).join(",")}
        onChange={e => cambiar(campo, e.target.value.split(","))} />
    </label>)}
    <label className={estilos.campoGrupo}>Coste por uso
      <CampoNumerico min={1} value={b.costeFijo ?? 1} className={estilos.inputControl} alConfirmar={v => cambiar("costeFijo", v)} />
    </label>
    <label className={estilos.campoGrupo}>Conjuro de lanzamiento gratuito
      <input className={estilos.inputControl} value={b.conjuroGratuito ?? ""} onChange={e => cambiar("conjuroGratuito", e.target.value || undefined)} />
    </label>
    <label>Aptitud del conjuro gratuito
      <SelectorDesplegable valor={b.aptitudConjuroGratuito ?? ""} opciones={[
        { valor: "", etiqueta: "Aptitud habitual" }, ...EsquemaCaracteristica.options.map(valor => ({ valor, etiqueta: valor }))
      ]} alCambiar={v => cambiar("aptitudConjuroGratuito", v || undefined)} />
    </label>
    <label className={estilos.filaToggle}>Otorgar capacidad de lanzamiento mágico
      <input type="checkbox" checked={Boolean(magia)} onChange={e => cambiar("configuracionMagica", e.target.checked
        ? { tipoLanzador: "tercio", habilidadConjuro: "inteligencia", modeloConjuros: "preparados", nivelInicio: b.nivelRequerido ?? 1 } : undefined)} />
    </label>
    {magia && <div className={estilos.gridDosColumnas}>
      <label>Progresión de lanzador<SelectorDesplegable valor={magia.tipoLanzador}
        opciones={EsquemaTipoLanzador.options.map(valor => ({ valor, etiqueta: valor }))}
        alCambiar={tipoLanzador => cambiar("configuracionMagica", { ...magia, tipoLanzador })} /></label>
      <label>Aptitud mágica<SelectorDesplegable valor={magia.habilidadConjuro}
        opciones={EsquemaCaracteristica.options.map(valor => ({ valor, etiqueta: valor }))}
        alCambiar={habilidadConjuro => cambiar("configuracionMagica", { ...magia, habilidadConjuro })} /></label>
      <label>Modelo de conjuros<SelectorDesplegable valor={magia.modeloConjuros}
        opciones={EsquemaModeloConjuros.options.map(valor => ({ valor, etiqueta: valor }))}
        alCambiar={modeloConjuros => cambiar("configuracionMagica", { ...magia, modeloConjuros })} /></label>
      <label>Nivel de inicio<CampoNumerico min={1} max={20} value={magia.nivelInicio}
        alConfirmar={nivelInicio => cambiar("configuracionMagica", { ...magia, nivelInicio })} /></label>
      <label>Lista de conjuros<input className={estilos.inputControl} value={magia.listaConjuros ?? ""}
        onChange={e => cambiar("configuracionMagica", { ...magia, listaConjuros: e.target.value })} /></label>
    </div>}
  </div>;
}
