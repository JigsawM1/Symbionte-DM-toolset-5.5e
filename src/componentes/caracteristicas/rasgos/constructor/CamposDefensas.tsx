import type { TipoEfectoMecanico } from "@/tipos";
import estilos from "../ConstructorRasgoDote.module.css";

export function CamposDefensas({ tipo, objetivo, alCambiar }: {
  tipo: TipoEfectoMecanico; objetivo: string; alCambiar: (valor: string) => void;
}) {
  if (!["resistencia_dano", "inmunidad_dano", "inmunidad_condicion"].includes(tipo)) return null;
  return <label className={estilos.campoGrupo}>
    {tipo === "inmunidad_condicion" ? "Condiciones de inmunidad" : "Tipos de daño"}
    <input className={estilos.inputControl} value={objetivo} aria-label={tipo === "inmunidad_condicion" ? "Condiciones de inmunidad" : "Tipos de daño"}
      onChange={e => alCambiar(e.target.value)} placeholder={tipo === "inmunidad_condicion" ? "Asustado, Hechizado" : "Fuego, Psíquico"} />
    <span className={estilos.pistaCampo}>Separa varios valores con comas. Se muestran en el resumen informativo de defensas.</span>
  </label>;
}
