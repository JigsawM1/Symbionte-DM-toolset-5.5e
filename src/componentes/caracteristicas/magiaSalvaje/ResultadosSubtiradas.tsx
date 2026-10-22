import type { ResultadoSubtirada } from "@/tipos";
import estilos from "./MagiaSalvaje.module.css";

const ETIQUETA_PROPOSITO = { duracion: "duración", dano: "daño", curacion: "curación", opcion: "opción" };

export function ResultadosSubtiradas({ resultados }: { resultados?: ResultadoSubtirada[] }) {
  if (!resultados?.length) return null;
  return <div className={estilos.resultadosSubtiradas} role="status" aria-label="Resultado de las subtiradas">
    <strong>Resultado de las subtiradas</strong>
    <ul>{resultados.map((sub, i) => <li key={`${sub.formula}_${i}`}>
      {sub.formula}: <strong>{sub.total}</strong>
      {sub.opcionElegida ? ` — ${sub.opcionElegida}` : sub.proposito ? ` (${ETIQUETA_PROPOSITO[sub.proposito]})` : ""}
    </li>)}</ul>
  </div>;
}
