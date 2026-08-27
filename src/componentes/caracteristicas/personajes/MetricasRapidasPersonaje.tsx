import React from "react";
import type { PersonajeJugador } from "@/tipos";
import type { InformacionCA } from "@/almacen/selectores/usarEstadoPersonajes";
import { Shield, Zap, Footprints, Award, Sparkles } from "lucide-react";
import { TooltipUniversal } from "@/componentes/comunes";
import estilos from "./HojaPersonaje.module.css";

interface MetricasRapidasPersonajeProps {
  personaje: PersonajeJugador;
  bonoCompetencia: number;
  modDestreza: number;
  claseArmadura?: InformacionCA;
  alTirarIniciativa: () => void;
  alAlternarInspiracion: () => void;
}

export const MetricasRapidasPersonaje: React.FC<MetricasRapidasPersonajeProps> = ({
  personaje,
  bonoCompetencia,
  modDestreza,
  claseArmadura,
  alTirarIniciativa,
  alAlternarInspiracion
}) => {
  const iniciativaTotal = modDestreza + (personaje.iniciativaBono || 0);
  const textoIniciativa = iniciativaTotal >= 0 ? `+${iniciativaTotal}` : `${iniciativaTotal}`;
  const velocidadTexto =
    typeof personaje.velocidad === "string"
      ? personaje.velocidad
      : `${personaje.velocidad.caminar || 30} pies`;

  const caTotal = claseArmadura?.total ?? personaje.ca ?? 10;
  const caTooltip = claseArmadura?.desglose || personaje.caNotas || "Clase de Armadura (D&D 5.5e)";

  return (
    <section className={estilos.filaMetricasRapidas}>
      {/* 1. Clase de Armadura */}
      <TooltipUniversal
        titulo="Clase de Armadura"
        contenido={caTooltip}
        posicion="abajo"
      >
        <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
          <Shield size={13} className={estilos.iconoMetricaDecorativo} />
          <span className={estilos.etiquetaMetrica}>Clase Armadura</span>
          <span className={estilos.valorMetrica}>{caTotal}</span>
        </div>
      </TooltipUniversal>

      {/* 2. Iniciativa */}
      <div
        className={`${estilos.neoRaised} ${estilos.tarjetaMetrica} ${estilos.tarjetaMetricaInteractiva}`}
        onClick={alTirarIniciativa}
        style={{ cursor: "pointer" }}
        title="Haz clic para tirar iniciativa en TaleSpire"
      >
        <Zap size={13} className={estilos.iconoMetricaDecorativo} />
        <span className={estilos.etiquetaMetrica}>Iniciativa</span>
        <span className={`${estilos.valorMetrica} ${estilos.valorMetricaAcento}`}>{textoIniciativa}</span>
      </div>

      {/* 3. Velocidad */}
      <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
        <Footprints size={13} className={estilos.iconoMetricaDecorativo} />
        <span className={estilos.etiquetaMetrica}>Velocidad</span>
        <span className={estilos.valorMetrica}>
          {velocidadTexto.replace("pies", "").trim()}
          <span className={estilos.unidadMetrica}>ft</span>
        </span>
      </div>

      {/* 4. Competencia */}
      <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
        <Award size={13} className={estilos.iconoMetricaDecorativo} />
        <span className={estilos.etiquetaMetrica}>Competencia</span>
        <span className={`${estilos.valorMetrica} ${estilos.valorMetricaAcento}`}>+{bonoCompetencia}</span>
      </div>

      {/* 5. Inspiración Heroica */}
      <div
        className={`${estilos.neoRaised} ${estilos.tarjetaMetrica} ${estilos.tarjetaMetricaInteractiva}`}
        onClick={alAlternarInspiracion}
        style={{ cursor: "pointer" }}
        title={personaje.inspiracion ? "Inspiración Heroica activa. Clic para gastarla." : "Inspiración Heroica. Clic para activar."}
      >
        <span className={estilos.etiquetaMetrica}>Insp.</span>
        <div className={`${estilos.botonInspiracion} ${personaje.inspiracion ? estilos.botonInspiracionActiva : ""}`}>
          <Sparkles size={12} color={personaje.inspiracion ? "#000" : "var(--color-texto-apagado, #64748b)"} />
        </div>
      </div>
    </section>
  );
};

