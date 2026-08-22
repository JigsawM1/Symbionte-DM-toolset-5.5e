import React from "react";
import type { PersonajeJugador } from "@/tipos";
import { Shield, Sparkles } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

interface MetricasRapidasPersonajeProps {
  personaje: PersonajeJugador;
  bonoCompetencia: number;
  modDestreza: number;
  alTirarIniciativa: () => void;
  alAlternarInspiracion: () => void;
}

export const MetricasRapidasPersonaje: React.FC<MetricasRapidasPersonajeProps> = ({
  personaje,
  bonoCompetencia,
  modDestreza,
  alTirarIniciativa,
  alAlternarInspiracion
}) => {
  const iniciativaTotal = modDestreza + (personaje.iniciativaBono || 0);
  const textoIniciativa = iniciativaTotal >= 0 ? `+${iniciativaTotal}` : `${iniciativaTotal}`;
  const velocidadTexto =
    typeof personaje.velocidad === "string"
      ? personaje.velocidad
      : `${personaje.velocidad.caminar || 30} pies`;

  return (
    <section className={estilos.filaMetricasRapidas}>
      {/* 1. Clase de Armadura */}
      <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`} title={personaje.caNotas || "Clase de Armadura"}>
        <Shield size={14} style={{ opacity: 0.4, position: "absolute", top: 4, right: 4 }} />
        <span className={estilos.etiquetaMetrica}>Clase Armadura</span>
        <span className={estilos.valorMetrica}>{personaje.ca || 10}</span>
      </div>

      {/* 2. Iniciativa */}
      <div
        className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}
        onClick={alTirarIniciativa}
        style={{ cursor: "pointer" }}
        title="Haz clic para tirar iniciativa en TaleSpire"
      >
        <span className={estilos.etiquetaMetrica}>Iniciativa</span>
        <span className={estilos.valorMetrica}>{textoIniciativa}</span>
      </div>

      {/* 3. Velocidad */}
      <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
        <span className={estilos.etiquetaMetrica}>Velocidad</span>
        <span className={estilos.valorMetrica}>
          {velocidadTexto.replace("pies", "").trim()}{" "}
          <span className={estilos.unidadMetrica}>pies</span>
        </span>
      </div>

      {/* 4. Competencia */}
      <div className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}>
        <span className={estilos.etiquetaMetrica}>Competencia</span>
        <span className={estilos.valorMetrica}>+{bonoCompetencia}</span>
      </div>

      {/* 5. Inspiración Heroica */}
      <div
        className={`${estilos.neoRaised} ${estilos.tarjetaMetrica}`}
        onClick={alAlternarInspiracion}
        style={{ cursor: "pointer" }}
        title={personaje.inspiracion ? "Inspiración activa. Haz clic para gastarla." : "Haz clic para activar inspiración"}
      >
        <span className={estilos.etiquetaMetrica}>Insp.</span>
        <div className={`${estilos.botonInspiracion} ${personaje.inspiracion ? estilos.botonInspiracionActiva : ""}`}>
          <Sparkles size={11} color={personaje.inspiracion ? "#000" : "var(--color-texto-apagado)"} />
        </div>
      </div>
    </section>
  );
};
