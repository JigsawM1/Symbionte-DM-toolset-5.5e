import React, { useMemo } from "react";
import { Sliders, Info, PawPrint } from "lucide-react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import type { RasgoAccionCombate } from "@/servicios/calculadorAccionesCombate";
import { useActivacionDeclarativa } from "@/componentes/caracteristicas/rasgos/usarActivacionDeclarativa";
import { obtenerBestiaFormaActiva } from "@/servicios/reglasFormaSalvaje";
import estilos from "./VistaAtaquesJugador.module.css";

export interface BarraSwitchesCombateProps {
  personajeActivo: PersonajeJugador;
  rasgosSwitches: RasgoAccionCombate[];
  alAlternarActivo: (idPj: string, idRasgo: string) => void;
  alAbrirDetalle: (rasgo: RasgoPersonaje) => void;
  obtenerBloqueoToggleRasgo: (r: RasgoPersonaje) => { bloqueado: boolean; motivo?: string };
  resolverRecursosPadre: (r: RasgoPersonaje) => {
    usosPadre?: { restantes: number; maximos: number; nombre: string };
    formulaDadosEfectiva?: string;
  };
}

interface ItemSwitchCombateProps {
  idPersonaje: string;
  item: RasgoAccionCombate;
  alAlternarActivo: (idPj: string, idRasgo: string) => void;
  alAbrirDetalle: (rasgo: RasgoPersonaje) => void;
  bloqueo: { bloqueado: boolean; motivo?: string };
  usosPadre?: { restantes: number; maximos: number; nombre: string };
}

function formatearUsosChip(
  item: RasgoAccionCombate,
  usosPadre?: { restantes: number; maximos: number; nombre: string }
): string | null {
  const r = item.rasgo;
  if (r.tieneUsosLimitados && typeof r.usosMaximos === "number") {
    const restantes = r.usosRestantes ?? r.usosMaximos;
    return `${restantes}/${r.usosMaximos}`;
  }
  if (usosPadre) {
    return `${usosPadre.restantes}/${usosPadre.maximos}`;
  }
  if (r.recursoGastado === "espacio_pacto" && item.usosMaximos > 0) {
    return `${item.usosRestantes}/${item.usosMaximos}`;
  }
  return null;
}

function construirTooltipChip(
  rasgo: RasgoPersonaje,
  bloqueo: { bloqueado: boolean; motivo?: string }
): string {
  if (bloqueo.bloqueado) {
    return bloqueo.motivo || "Acción no disponible";
  }
  if (rasgo.activo) {
    return rasgo.renovarActivacion
      ? "Rasgo activo (clic para renovar)"
      : "Rasgo activo (clic para desactivar)";
  }
  return "Rasgo inactivo (clic para activar)";
}

const ItemSwitchCombate: React.FC<ItemSwitchCombateProps> = ({
  idPersonaje,
  item,
  alAlternarActivo,
  alAbrirDetalle,
  bloqueo,
  usosPadre
}) => {
  const { rasgo } = item;
  const activacion = useActivacionDeclarativa(rasgo, idPersonaje, () =>
    alAlternarActivo(idPersonaje, rasgo.id)
  );
  const estaActivo = Boolean(rasgo.activo);
  const usosTexto = formatearUsosChip(item, usosPadre);
  const tituloToggle = construirTooltipChip(rasgo, bloqueo);

  return (
    <>
      <div
        className={estilos.envolturaChipSwitch}
        data-activo={estaActivo ? "true" : "false"}
        data-deshabilitado={bloqueo.bloqueado ? "true" : undefined}
      >
        <button
          type="button"
          className={estilos.botonChipSwitch}
          aria-pressed={estaActivo}
          disabled={bloqueo.bloqueado}
          onClick={() => {
            if (!bloqueo.bloqueado) {
              activacion.alternar();
            }
          }}
          title={tituloToggle}
        >
          <span className={estilos.indicadorPuntoSwitch} aria-hidden="true" />
          <span className={estilos.nombreChipSwitch}>{rasgo.nombre}</span>
          {estaActivo && <span className={estilos.estadoOnSwitch}>ON</span>}
          {usosTexto && <span className={estilos.contadorChipSwitch}>{usosTexto}</span>}
        </button>

        <button
          type="button"
          className={estilos.botonDetalleChipSwitch}
          aria-label={`Ver ficha de ${rasgo.nombre}`}
          title={`Ver detalles y gestionar usos de ${rasgo.nombre}`}
          onClick={() => alAbrirDetalle(rasgo)}
        >
          <Info size={11} aria-hidden="true" />
        </button>
      </div>
      {activacion.modal}
    </>
  );
};

/**
 * Barra superior compacta de modos activos y switches de combate (Propuesta C).
 * Ocupa 0 px cuando no hay rasgos activables directos ni Forma Salvaje activa.
 */
export const BarraSwitchesCombate: React.FC<BarraSwitchesCombateProps> = React.memo(({
  personajeActivo,
  rasgosSwitches,
  alAlternarActivo,
  alAbrirDetalle,
  obtenerBloqueoToggleRasgo,
  resolverRecursosPadre
}) => {
  const bestiaActiva = useMemo(
    () => obtenerBestiaFormaActiva(personajeActivo),
    [personajeActivo]
  );

  if (rasgosSwitches.length === 0 && !bestiaActiva) {
    return null;
  }

  const rasgoFormaSalvaje = bestiaActiva
    ? (personajeActivo.rasgos || []).find((r) => Boolean(r.formasBestia))
    : undefined;

  const activosCount =
    rasgosSwitches.filter((item) => Boolean(item.rasgo.activo)).length + (bestiaActiva ? 1 : 0);

  return (
    <section
      className={estilos.barraSwitchesCombate}
      aria-label="Modos activos y switches de combate"
    >
      <div className={estilos.cabeceraSwitchesCombate}>
        <div className={estilos.tituloSwitchesCombate}>
          <Sliders size={12} color="var(--pj-texto-oro)" aria-hidden="true" />
          <span>Modos de combate</span>
        </div>
        {activosCount > 0 && (
          <span className={estilos.badgeActivosSwitches}>
            {activosCount} {activosCount === 1 ? "activo" : "activos"}
          </span>
        )}
      </div>

      <div className={estilos.listaChipsSwitches}>
        {bestiaActiva &&
          (rasgoFormaSalvaje ? (
            <button
              type="button"
              className={estilos.chipFormaSalvajeSwitch}
              onClick={() => alAbrirDetalle(rasgoFormaSalvaje)}
              title={`Forma salvaje activa: ${bestiaActiva.nombre}. Clic para ver detalle`}
            >
              <PawPrint size={11} aria-hidden="true" />
              <span>{bestiaActiva.nombre}</span>
              <span className={estilos.estadoOnSwitch}>ON</span>
            </button>
          ) : (
            <span className={estilos.chipFormaSalvajeSwitch}>
              <PawPrint size={11} aria-hidden="true" />
              <span>{bestiaActiva.nombre}</span>
              <span className={estilos.estadoOnSwitch}>ON</span>
            </span>
          ))}

        {rasgosSwitches.map((item, idx) => (
          <ItemSwitchCombate
            key={`${item.rasgo.id}_${idx}`}
            idPersonaje={personajeActivo.id}
            item={item}
            alAlternarActivo={alAlternarActivo}
            alAbrirDetalle={alAbrirDetalle}
            bloqueo={obtenerBloqueoToggleRasgo(item.rasgo)}
            usosPadre={resolverRecursosPadre(item.rasgo).usosPadre}
          />
        ))}
      </div>
    </section>
  );
});

BarraSwitchesCombate.displayName = "BarraSwitchesCombate";
