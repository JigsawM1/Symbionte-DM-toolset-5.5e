import React from "react";
import type { PersonajeJugador } from "@/tipos";
import { Settings } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

interface CabeceraPersonajeProps {
  personaje: PersonajeJugador;
  alAbrirModalEdicion: () => void;
  alVincularMiniaturaTS?: (idMini: string | null) => void;
}

export const CabeceraPersonaje: React.FC<CabeceraPersonajeProps> = ({
  personaje,
  alAbrirModalEdicion
}) => {
  const inicial = (personaje.nombre || "P")[0].toUpperCase();

  return (
    <section className={`${estilos.neoRaised} ${estilos.seccionCabecera}`}>
      {/* Contenedor Avatar / Token con soporte para imagen URL y fallback */}
      <div
        className={`${estilos.contenedorAvatar} ${estilos.neoPressed}`}
        onClick={alAbrirModalEdicion}
        title={
          personaje.avatarUrl
            ? "Avatar del personaje (Clic para editar parámetros o imagen)"
            : "Clic para abrir configuración y añadir una URL de imagen de avatar"
        }
      >
        {personaje.avatarUrl ? (
          <img
            src={personaje.avatarUrl}
            alt={personaje.nombre}
            className={estilos.avatarImagen}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className={estilos.avatarFallback}>{inicial}</div>
        )}

        {personaje.idMiniaturaTS && (
          <div
            className={estilos.indicadorMiniVinculada}
            title="Miniatura física de TaleSpire vinculada"
          />
        )}
      </div>

      {/* Información de Identidad */}
      <div className={estilos.infoIdentidad}>
        <div className={estilos.filaNombreNivel}>
          <div className={`${estilos.cajaNombre} ${estilos.neoPressed}`}>
            <h1 className={estilos.nombrePersonaje}>{personaje.nombre || "Sin Nombre"}</h1>
            <p className={estilos.subtituloNombre}>
              {personaje.jugador ? `PJ de ${personaje.jugador}` : "Nombre del Personaje"}
            </p>
          </div>

          <div className={`${estilos.cajaNivel} ${estilos.neoPressed}`}>
            <span className={estilos.numeroNivel}>{personaje.nivel}</span>
            <span className={estiquetaNivelClass(estilos)}>Nivel</span>
          </div>

          <button
            type="button"
            className={estilos.botonConfigurarPj}
            onClick={alAbrirModalEdicion}
            title="Editar parámetros base de la ficha"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Cuadrícula de 3 pastillas de detalles */}
        <div className={estilos.cuadriculaDetalles}>
          <div className={`${estilos.pastillaDetalle} ${estilos.neoPressed}`}>
            <span className={estilos.valorDetalle} title={personaje.clase || "Guerrero"}>
              {personaje.clases && personaje.clases.length > 1
                ? personaje.clases.map((c) => `${c.nombre} ${c.nivel}`).join(" / ")
                : (personaje.clase || "Guerrero") + (personaje.subclase ? ` (${personaje.subclase})` : "")}
            </span>
            <span className={estilos.labelDetalle}>Clase</span>
          </div>

          <div className={`${estilos.pastillaDetalle} ${estilos.neoPressed}`}>
            <span
              className={estilos.valorDetalle}
              title={personaje.subespecie ? `${personaje.especie || "Humano"} (${personaje.subespecie})` : personaje.especie || "Humano"}
            >
              {personaje.subespecie
                ? `${personaje.especie || "Humano"} (${personaje.subespecie})`
                : personaje.especie || "Humano"}
            </span>
            <span className={estilos.labelDetalle}>Especie</span>
          </div>

          <div className={`${estilos.pastillaDetalle} ${estilos.neoPressed}`}>
            <span className={estilos.valorDetalle}>{personaje.trasfondo || "Personalizado"}</span>
            <span className={estilos.labelDetalle}>Trasfondo</span>
          </div>
        </div>
      </div>
    </section>
  );
};

function estiquetaNivelClass(estilos: Record<string, string>): string {
  return estilos.etiquetaNivel || "";
}

export default CabeceraPersonaje;
