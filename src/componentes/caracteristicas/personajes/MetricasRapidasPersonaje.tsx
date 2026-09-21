import React from "react";
import type { PersonajeJugador } from "@/tipos";
import type { InformacionCA, PenalizacionArmadura } from "@/almacen/selectores/usarEstadoPersonajes";
import { Shield, Zap, Footprints, Award, Sparkles, AlertTriangle } from "lucide-react";
import { TooltipUniversal } from "@/componentes/comunes";
import { obtenerVelocidadesEfectivas, calcularBonoIniciativaRasgos } from "@/servicios/evaluadorEfectosRasgos";
import estilos from "./HojaPersonaje.module.css";

interface MetricasRapidasPersonajeProps {
  personaje: PersonajeJugador;
  bonoCompetencia: number;
  modDestreza: number;
  claseArmadura?: InformacionCA;
  penalizacionArmadura?: PenalizacionArmadura;
  bonoVelocidad?: number;
  alTirarIniciativa: () => void;
  alAlternarInspiracion: () => void;
}

const MetricasRapidasPersonajeComponent: React.FC<MetricasRapidasPersonajeProps> = ({
  personaje,
  bonoCompetencia,
  modDestreza,
  claseArmadura,
  penalizacionArmadura,
  bonoVelocidad = 0,
  alTirarIniciativa,
  alAlternarInspiracion
}) => {
  const bonoIniciativaRasgos = calcularBonoIniciativaRasgos(personaje);
  const iniciativaTotal = modDestreza + (personaje.iniciativaBono || 0) + bonoIniciativaRasgos;
  const textoIniciativa = iniciativaTotal >= 0 ? `+${iniciativaTotal}` : `${iniciativaTotal}`;

  const velocidades = obtenerVelocidadesEfectivas(personaje);
  const velocidadTotal = velocidades.caminar;

  const partesVelocidad: string[] = [`Caminar: ${velocidadTotal} ft`];
  if (velocidades.nadar && velocidades.nadar > 0) {
    partesVelocidad.push(`Nadar: ${velocidades.nadar} ft`);
  }
  if (velocidades.volar && velocidades.volar > 0) {
    partesVelocidad.push(`Volar: ${velocidades.volar} ft`);
  }
  if (velocidades.escalar && velocidades.escalar > 0) {
    partesVelocidad.push(`Escalar: ${velocidades.escalar} ft`);
  }

  const velocidadTooltip =
    bonoVelocidad > 0
      ? `Velocidad: ${velocidadTotal} ft (+${bonoVelocidad} ft rasgos)\n${partesVelocidad.join(" • ")}`
      : partesVelocidad.join(" • ");

  const caTotal = claseArmadura?.total ?? personaje.ca ?? 10;
  const avisoNoComp = penalizacionArmadura?.sinCompetencia
    ? ` [SIN COMPETENCIA] (${[penalizacionArmadura.armaduraNoCompetente, penalizacionArmadura.escudoNoCompetente].filter(Boolean).join(", ")}): Desventaja en ataques/pruebas/salvaciones de FUE y DES. No puedes lanzar conjuros.`
    : "";
  const caTooltip = `${claseArmadura?.desglose || personaje.caNotas || "Clase de Armadura"}${avisoNoComp}`;

  return (
    <section className={estilos.filaMetricasRapidas}>
      {/* 1. Clase de Armadura */}
      <TooltipUniversal
        titulo={penalizacionArmadura?.sinCompetencia ? "Clase de Armadura (Sin Competencia)" : "Clase de Armadura"}
        contenido={caTooltip}
        posicion="abajo"
        alineacion="inicio"
        className={estilos.contenedorTooltipMetrica}
      >
        <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
          <Shield size={13} className={estilos.iconoMetricaDecorativo} />
          <span className={estilos.etiquetaMetrica}>
            Clase Armadura
            {penalizacionArmadura?.sinCompetencia && (
              <AlertTriangle size={10} color="#ef4444" className={estilos.alertaSinCompetenciaArmadura} />
            )}
          </span>
          <span className={estilos.valorMetrica}>{caTotal}</span>
        </div>
      </TooltipUniversal>

      {/* 2. Iniciativa */}
      <TooltipUniversal
        titulo="Iniciativa"
        contenido={`Tirada de Iniciativa: 1d20 ${textoIniciativa} (Destreza).\nHaz clic para tirar iniciativa en TaleSpire.`}
        posicion="abajo"
        className={estilos.contenedorTooltipMetrica}
      >
        <div
          className={`${estilos.neoRaised} ${estilos.tarjetaMetrica} ${estilos.tarjetaMetricaInteractiva}`}
          onClick={alTirarIniciativa}
        >
          <Zap size={13} className={estilos.iconoMetricaDecorativo} />
          <span className={estilos.etiquetaMetrica}>Iniciativa</span>
          <span className={`${estilos.valorMetrica} ${estilos.valorMetricaAcento}`}>{textoIniciativa}</span>
        </div>
      </TooltipUniversal>

      {/* 3. Velocidad */}
      <TooltipUniversal
        titulo="Velocidad de Movimiento"
        contenido={velocidadTooltip}
        posicion="abajo"
        className={estilos.contenedorTooltipMetrica}
      >
        <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
          <Footprints size={13} className={estilos.iconoMetricaDecorativo} />
          <span className={estilos.etiquetaMetrica}>Velocidad</span>
          <span className={estilos.valorMetrica}>
            {velocidadTotal}
            <span className={estilos.unidadMetrica}>ft</span>
          </span>
        </div>
      </TooltipUniversal>

      {/* 4. Competencia */}
      <TooltipUniversal
        titulo="Bonificador por Competencia"
        contenido={`Bono de Competencia: +${bonoCompetencia}\nSe suma a tiradas de ataque con armas competentes, tiradas de salvación y habilidades competentes, y a la CD de salvación de conjuros.`}
        posicion="abajo"
        className={estilos.contenedorTooltipMetrica}
      >
        <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
          <Award size={13} className={estilos.iconoMetricaDecorativo} />
          <span className={estilos.etiquetaMetrica}>Competencia</span>
          <span className={`${estilos.valorMetrica} ${estilos.valorMetricaAcento}`}>+{bonoCompetencia}</span>
        </div>
      </TooltipUniversal>

      {/* 5. Inspiración Heroica */}
      <TooltipUniversal
        titulo="Inspiración Heroica"
        contenido={
          personaje.inspiracion
            ? "Inspiración Heroica activa.\nHaz clic para gastarla (permite repetir cualquier tirada de d20)."
            : "Inspiración Heroica inactiva.\nHaz clic para activarla."
        }
        posicion="abajo"
        alineacion="fin"
        className={estilos.contenedorTooltipMetrica}
      >
        <div
          className={`${estilos.neoRaised} ${estilos.tarjetaMetrica} ${estilos.tarjetaMetricaInteractiva}`}
          onClick={alAlternarInspiracion}
        >
          <span className={estilos.etiquetaMetrica}>Insp.</span>
          <div className={`${estilos.botonInspiracion} ${personaje.inspiracion ? estilos.botonInspiracionActiva : ""}`}>
            <Sparkles size={12} color={personaje.inspiracion ? "#000" : "var(--color-texto-apagado, #64748b)"} />
          </div>
        </div>
      </TooltipUniversal>
    </section>
  );
};

export const MetricasRapidasPersonaje = React.memo(MetricasRapidasPersonajeComponent);

