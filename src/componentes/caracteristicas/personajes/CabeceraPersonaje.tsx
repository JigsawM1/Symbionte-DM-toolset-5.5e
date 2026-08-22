import React, { useEffect, useRef, useState } from "react";
import type { PersonajeJugador } from "@/tipos";
import { ts } from "@/utiles/TaleSpireAdapter";
import { Settings } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

interface CabeceraPersonajeProps {
  personaje: PersonajeJugador;
  alAbrirModalEdicion: () => void;
  alVincularMiniaturaTS: (idMini: string | null) => void;
}

export const CabeceraPersonaje: React.FC<CabeceraPersonajeProps> = ({
  personaje,
  alAbrirModalEdicion,
  alVincularMiniaturaTS
}) => {
  const [nombreMiniTS, setNombreMiniTS] = useState<string | null>(null);
  const [elementoThumbnail, setElementoThumbnail] = useState<HTMLElement | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Intentar resolver la miniatura y su thumbnail 3D en TaleSpire si está disponible
  useEffect(() => {
    let cancelado = false;

    const resolverMiniatura = async () => {
      try {
        if (!ts.estaDisponible || !personaje.idMiniaturaTS) {
          setElementoThumbnail(null);
          setNombreMiniTS(null);
          return;
        }

        // 1. Obtener información de la criatura vinculada
        const infos = await ts.creatures.getMoreInfo([personaje.idMiniaturaTS]);
        if (!infos || infos.length === 0 || cancelado) return;

        const mini = infos[0];
        setNombreMiniTS(mini.name || "Miniatura");

        // 2. Intentar obtener el thumbnail 3D de TaleSpire a través de contentPacks
        if (ts.contentPacks && typeof ts.contentPacks.getContentPacks === "function") {
          const packs = await ts.contentPacks.getContentPacks();
          const packsInfos = await ts.contentPacks.getMoreInfo(packs);

          // Buscar el morph o asset de la miniatura
          const morphObj = (mini as any).morphs?.[0] || mini;
          const morphId = morphObj?.morphId || morphObj?.id || (mini as any).assetId;

          if (morphId) {
            try {
              const boardObject = await ts.contentPacks.findBoardObjectInPacks(morphId, packsInfos);
              if (boardObject && !cancelado) {
                const thumbEl = await ts.contentPacks.createThumbnailElementForBoardObject(boardObject, 72);
                if (thumbEl && !cancelado) {
                  setElementoThumbnail(thumbEl as HTMLElement);
                }
              }
            } catch (errPacks) {
              // Si falla la búsqueda en packs, no rompe la UI
              console.debug("[CabeceraPersonaje] Mini no encontrada en content packs:", errPacks);
            }
          }
        }
      } catch (err) {
        console.error("[CabeceraPersonaje] Error al resolver miniatura TS:", err);
      }
    };

    resolverMiniatura();
    return () => {
      cancelado = true;
    };
  }, [personaje.idMiniaturaTS]);

  // Manejador para vincular con la miniatura actualmente seleccionada en TaleSpire
  const manejarVincularMiniSeleccionada = async () => {
    try {
      if (!ts.estaDisponible) return;
      const seleccionadas = await ts.creatures.getSelectedCreatures();
      if (seleccionadas && seleccionadas.length > 0) {
        const mini = seleccionadas[0];
        alVincularMiniaturaTS(mini.id);
        const info = await ts.creatures.getMoreInfo([mini.id]);
        if (info && info.length > 0) {
          setNombreMiniTS(info[0].name || "Miniatura");
        }
      } else {
        // Desvincular si no hay selección
        alVincularMiniaturaTS(null);
        setNombreMiniTS(null);
        setElementoThumbnail(null);
      }
    } catch (err) {
      console.error("[CabeceraPersonaje] Error al vincular miniatura seleccionada:", err);
    }
  };

  const inicial = (personaje.nombre || "P")[0].toUpperCase();

  return (
    <section className={`${estilos.neoRaised} ${estilos.seccionCabecera}`}>
      {/* Contenedor Avatar / Token con soporte para TaleSpire e imagen URL */}
      <div
        ref={avatarRef}
        className={`${estilos.contenedorAvatar} ${estilos.neoPressed}`}
        onClick={manejarVincularMiniSeleccionada}
        title={
          personaje.idMiniaturaTS
            ? `Miniatura 3D vinculada: ${nombreMiniTS || personaje.idMiniaturaTS}. Clic para revincular con la seleccionada en TaleSpire.`
            : "Haz clic para vincular con la miniatura seleccionada en TaleSpire, o edita la ficha para ingresar una URL de imagen."
        }
      >
        {elementoThumbnail ? (
          <div
            ref={(nodo) => {
              if (nodo && elementoThumbnail) {
                nodo.innerHTML = "";
                nodo.appendChild(elementoThumbnail);
              }
            }}
            className={estilos.avatarThumbnailContenedor}
          />
        ) : personaje.avatarUrl ? (
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
            title="Miniatura 3D de TaleSpire vinculada"
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
            <span className={estiquetaNivelClass(estilos)}>{personaje.subclase ? "Niv / Sub" : "Nivel"}</span>
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
            <span className={estilos.valorDetalle}>{personaje.clase || "Mago"}</span>
            <span className={estilos.labelDetalle}>Clase</span>
          </div>

          <div className={`${estilos.pastillaDetalle} ${estilos.neoPressed}`}>
            <span className={estilos.valorDetalle}>{personaje.especie || "Humano"}</span>
            <span className={estilos.labelDetalle}>Especie</span>
          </div>

          <div className={`${estilos.pastillaDetalle} ${estilos.neoPressed}`}>
            <span className={estilos.valorDetalle}>{personaje.trasfondo || "Erudito"}</span>
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
