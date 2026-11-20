import React from "react";
import { FlaskConical } from "lucide-react";
import { TarjetaConsumibleAccion } from "./TarjetaConsumibleAccion";
import { DivisorSeccionAccion } from "./DivisorSeccionAccion";
import type { ConsumibleAccionCalculado } from "./usarCalculoAtaquesJugador";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionConsumiblesAtaqueProps {
  consumiblesFiltrados: ConsumibleAccionCalculado[];
  mostrarDivisor?: boolean;
  alUsarConsumible: (cons: ConsumibleAccionCalculado) => void;
}

export const SeccionConsumiblesAtaque: React.FC<SeccionConsumiblesAtaqueProps> = ({
  consumiblesFiltrados,
  mostrarDivisor = true,
  alUsarConsumible
}) => {
  if (consumiblesFiltrados.length === 0) {
    return null;
  }

  const listaTarjetas = (
    <div className={estilos.listaAtaques}>
      {consumiblesFiltrados.map((cons) => (
        <TarjetaConsumibleAccion
          key={cons.idInstancia}
          consumible={cons}
          alUsar={alUsarConsumible}
        />
      ))}
    </div>
  );

  if (!mostrarDivisor) {
    return listaTarjetas;
  }

  return (
    <section className={estilos.bloqueSeccionPlana} aria-label="Consumibles y pociones">
      <DivisorSeccionAccion
        icono={<FlaskConical size={13} color="var(--pj-texto-exito)" aria-hidden="true" />}
        titulo="Consumibles y Pociones"
        conteo={consumiblesFiltrados.length}
        tono="exito"
      />
      {listaTarjetas}
    </section>
  );
};
