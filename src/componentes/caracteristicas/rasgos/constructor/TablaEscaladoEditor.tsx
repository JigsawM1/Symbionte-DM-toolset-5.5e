import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import estilos from "../ConstructorRasgoDote.module.css";

interface Props {
  etiqueta: string;
  filas: Array<{ nivelMinimo: number; valor: string | number }>;
  alCambiar: (filas: Array<{ nivelMinimo: number; valor: string }>) => void;
}

export function TablaEscaladoEditor({ etiqueta, filas, alCambiar }: Props) {
  const actuales = filas.map(f => ({ ...f, valor: String(f.valor) }));
  return <fieldset className={estilos.campoGrupo}>
    <legend>{etiqueta}</legend>
    {actuales.map((fila, indice) => <div key={indice} className={estilos.gridTresColumnas}>
      <CampoNumerico min={1} max={20} value={fila.nivelMinimo} className={estilos.inputControl}
        aria-label={`${etiqueta}: nivel ${indice + 1}`}
        alConfirmar={nivelMinimo => alCambiar(actuales.map((f, i) => i === indice ? { ...f, nivelMinimo } : f))} />
      <input className={estilos.inputControl} aria-label={`${etiqueta}: valor ${indice + 1}`} value={fila.valor}
        onChange={e => alCambiar(actuales.map((f, i) => i === indice ? { ...f, valor: e.target.value } : f))} />
      <button type="button" onClick={() => alCambiar(actuales.filter((_, i) => i !== indice))}>Eliminar escalón {indice + 1}</button>
    </div>)}
    <button type="button" onClick={() => alCambiar([...actuales, { nivelMinimo: Math.min(20, (actuales.at(-1)?.nivelMinimo ?? 0) + 1), valor: "1" }])}>Añadir escalón: {etiqueta}</button>
  </fieldset>;
}
