import type { PersonajeJugador } from "@/tipos";
import { obtenerResumenDefensasRasgos } from "@/servicios/rasgos/resumenDefensasRasgos";
import estilos from "./ExtrasRasgos.module.css";

export function ResumenDefensasRasgos({ personaje }: { personaje: PersonajeJugador }) {
  const resumen = obtenerResumenDefensasRasgos(personaje);
  return <section className={estilos.resumenDefensas} aria-label="Resistencias e inmunidades">
    <h3>Resistencias e inmunidades</h3>
    <dl>
      <div><dt>Resistencias al daño</dt><dd>{resumen.resistencias.join(", ") || "Sin datos declarados"}</dd></div>
      <div><dt>Inmunidades al daño</dt><dd>{resumen.inmunidadesDano.join(", ") || "Sin datos declarados"}</dd></div>
      <div><dt>Inmunidades a condiciones</dt><dd>{resumen.inmunidadesCondiciones.join(", ") || "Sin datos declarados"}</dd></div>
    </dl>
  </section>;
}
