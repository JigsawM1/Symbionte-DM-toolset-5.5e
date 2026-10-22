import type { PersonajeJugador } from "@/tipos";
import { useState } from "react";
import { Settings } from "lucide-react";
import { ModalRetratoPersonaje } from "./ModalRetratoPersonaje";
import estilos from "./CabeceraPersonaje.module.css";

interface CabeceraPersonajeProps {
  personaje: PersonajeJugador;
  alAbrirModalEdicion: () => void;
}

export function CabeceraPersonaje({ personaje, alAbrirModalEdicion }: CabeceraPersonajeProps) {
  const [verRetrato, setVerRetrato] = useState(false);
  const clase = personaje.clases && personaje.clases.length > 1
    ? personaje.clases.map(c => `${c.nombre} ${c.nivel}${c.subclase ? ` (${c.subclase})` : ""}`).join(" / ")
    : `${personaje.clase || "Guerrero"}${personaje.subclase ? ` (${personaje.subclase})` : ""}`;
  const especie = `${personaje.especie || "Humano"}${personaje.subespecie ? ` (${personaje.subespecie})` : ""}`;

  return (
    <section className={estilos.cabecera} aria-label="Identidad del personaje">
      <button
        type="button"
        className={estilos.avatar}
        onClick={() => personaje.avatarUrl ? setVerRetrato(true) : alAbrirModalEdicion()}
        aria-label={personaje.avatarUrl ? "Ampliar retrato del personaje" : "Añadir avatar del personaje"}
        title={personaje.avatarUrl ? "Ver retrato ampliado" : "Añadir avatar en la configuración"}
      >
        {(personaje.nombre || "P")[0].toUpperCase()}
        {personaje.avatarUrl && (
          <img
            src={personaje.avatarUrl}
            alt={personaje.nombre}
            onError={e => { e.currentTarget.hidden = true; }}
          />
        )}
        {personaje.idMiniaturaTS && (
          <span className={estilos.vinculada} title="Miniatura de TaleSpire vinculada" />
        )}
      </button>

      <div className={estilos.identidad}>
        <div className={estilos.fila}>
          <div className={estilos.bloqueNombre}>
            <h1 title={personaje.jugador ? `PJ de ${personaje.jugador}` : undefined}>
              {personaje.nombre || "Sin nombre"}
            </h1>
          </div>

          <div className={estilos.accionesDerecha}>
            <span className={estilos.badgeNivel}>NVL {personaje.nivel}</span>
            <button
              type="button"
              className={estilos.editar}
              onClick={alAbrirModalEdicion}
              title="Configuración de la ficha"
              aria-label="Configuración de la ficha"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        <div className={estilos.detalles}>
          <div className={estilos.cajaDetalle}>
            <span className={estilos.etiquetaDetalle}>CLASE</span>
            <strong className={estilos.valorDetalle}>{clase}</strong>
          </div>
          <div className={estilos.cajaDetalle}>
            <span className={estilos.etiquetaDetalle}>ESPECIE</span>
            <strong className={estilos.valorDetalle}>{especie}</strong>
          </div>
          <div className={estilos.cajaDetalle}>
            <span className={estilos.etiquetaDetalle}>TRASFONDO</span>
            <strong className={estilos.valorDetalle}>{personaje.trasfondo || "Personalizado"}</strong>
          </div>
        </div>
      </div>
      {verRetrato && personaje.avatarUrl && (
        <ModalRetratoPersonaje
          key={`${personaje.id}:${personaje.avatarUrl}`}
          nombre={personaje.nombre || "Sin nombre"}
          imagen={personaje.avatarUrl}
          alCerrar={() => setVerRetrato(false)}
        />
      )}
    </section>
  );
}

export default CabeceraPersonaje;
