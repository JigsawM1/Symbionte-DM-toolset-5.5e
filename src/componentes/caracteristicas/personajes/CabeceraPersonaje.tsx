import type { PersonajeJugador } from "@/tipos";
import { Settings, Pencil } from "lucide-react";
import estilos from "./CabeceraPersonaje.module.css";

interface CabeceraPersonajeProps {
  personaje: PersonajeJugador;
  alAbrirModalEdicion: () => void;
}

export function CabeceraPersonaje({ personaje, alAbrirModalEdicion }: CabeceraPersonajeProps) {
  const clase = personaje.clases && personaje.clases.length > 1
    ? personaje.clases.map(c => `${c.nombre} ${c.nivel}${c.subclase ? ` (${c.subclase})` : ""}`).join(" / ")
    : `${personaje.clase || "Guerrero"}${personaje.subclase ? ` (${personaje.subclase})` : ""}`;
  const especie = `${personaje.especie || "Humano"}${personaje.subespecie ? ` (${personaje.subespecie})` : ""}`;

  return (
    <section className={estilos.cabecera} aria-label="Identidad del personaje">
      <button
        type="button"
        className={estilos.avatar}
        onClick={alAbrirModalEdicion}
        aria-label="Editar avatar del personaje"
        title="Clic para cambiar avatar o configuración"
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
            <button
              type="button"
              className={estilos.botonEditarNombre}
              onClick={alAbrirModalEdicion}
              title="Editar nombre y datos base"
              aria-label="Editar nombre del personaje"
            >
              <Pencil size={12} />
            </button>
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
    </section>
  );
}

export default CabeceraPersonaje;
