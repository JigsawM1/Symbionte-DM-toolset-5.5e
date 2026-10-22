import React from "react";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import estilos from "./AtributosPersonaje.module.css";

const PASIVAS_CONFIG: Array<[string, keyof EstadisticasCalculadasPersonaje["pasivas"]]> = [
  ["PERCEPCIÓN PASIVA", "percepcion"],
  ["INVESTIGACIÓN PASIVA", "investigacion"],
  ["PERSPICACIA PASIVA", "perspicacia"]
];

export function SentidosPasivosPersonaje({ pasivas }: Pick<EstadisticasCalculadasPersonaje, "pasivas">) {
  return (
    <section aria-label="Sentidos pasivos" className={estilos.sentidosPasivos}>
      {PASIVAS_CONFIG.map(([etiqueta, clave], idx) => (
        <React.Fragment key={clave}>
          {idx > 0 && <span className={estilos.separadorSentidoPasivo}>|</span>}
          <span className={estilos.itemSentidoPasivo}>
            {etiqueta}: <strong>{pasivas[clave]}</strong>
          </span>
        </React.Fragment>
      ))}
    </section>
  );
}

export default SentidosPasivosPersonaje;
