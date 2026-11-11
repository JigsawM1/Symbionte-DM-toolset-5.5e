import React, { useState } from "react";
import {
  usarEstadoConfiguracion,
  usarAccionesConfiguracion,
  usarEstadoHomebrew,
  usarAccionesHomebrew,
} from "@/almacen/selectores";
import { usarPersonajeActivo } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  Menu,
  Settings,
  Plus,
  Edit2,
  Shield,
  Crown,
} from "lucide-react";
import estilos from "./BarraSuperior.module.css";

export const BarraSuperior: React.FC = () => {
  const { pestañaActiva, campañaNombre, esGM } = usarEstadoConfiguracion();
  const { establecerPestaña, establecerEsGM } = usarAccionesConfiguracion();
  const { modoHomebrew } = usarEstadoHomebrew();
  const { establecerModoHomebrew } = usarAccionesHomebrew();
  const personajeActivo = usarPersonajeActivo();
  const [mostrarMenuHomebrew, setMostrarMenuHomebrew] = useState(false);

  const esModoDev = typeof window !== "undefined" && !window.TS;

  const alternarRolDev = () => {
    if (esModoDev) {
      establecerEsGM(!esGM);
    }
  };

  const tituloContexto = !esGM
    ? personajeActivo?.nombre || "Hoja de Personaje"
    : campañaNombre || "Campaña DM";

  const kickerContexto = !esGM
    ? `${personajeActivo ? `Nv ${personajeActivo.nivel} · ` : ""}D&D 5.5e`
    : "DM SCREEN · D&D 5.5e";

  return (
    <header className={estilos.cabecera}>
      {/* 1. Zona Izquierda: Badge de Rol */}
      <div className={estilos.zonaIzquierda}>
        <button
          type="button"
          onClick={alternarRolDev}
          className={`${estilos.badgeRol} ${esModoDev ? estilos.badgeRolClickable : ""}`}
          title={
            esModoDev
              ? "Haz clic para alternar rol (DM / Jugador) en desarrollo local"
              : esGM
              ? "Rol activo: Dungeon Master"
              : "Rol activo: Jugador"
          }
        >
          {esGM ? <Crown size={12} aria-hidden="true" /> : <Shield size={12} aria-hidden="true" />}
          <span>{esGM ? "DM" : "PJ"}</span>
        </button>
      </div>

      {/* 2. Zona Centro: Título Contextual Dinámico */}
      <div className={estilos.zonaCentro}>
        <span className={estilos.kickerContexto}>{kickerContexto}</span>
        <span className={estilos.tituloContexto} title={tituloContexto}>
          {tituloContexto}
        </span>
      </div>

      {/* 3. Zona Derecha: Quick Actions */}
      <div className={estilos.zonaDerecha}>
        {/* Botón y Menú Homebrew */}
        <div className="u-pos-relativo">
          <button
            type="button"
            onClick={() => setMostrarMenuHomebrew(!mostrarMenuHomebrew)}
            className={`${estilos.botonAccion} ${
              pestañaActiva === "homebrew" ? estilos.botonActivo : ""
            }`}
            title="Herramientas de Homebrew"
            aria-label="Abrir menú de Homebrew"
          >
            <Menu size={14} />
          </button>

          {mostrarMenuHomebrew && (
            <div className={estilos.menuHomebrewDesplegable}>
              <div className={estilos.cabeceraDesplegable}>Taller Homebrew</div>
              <button
                type="button"
                onClick={() => {
                  establecerPestaña("homebrew");
                  establecerModoHomebrew("crear");
                  setMostrarMenuHomebrew(false);
                }}
                className={`${estilos.itemMenuDesplegable} ${
                  pestañaActiva === "homebrew" && modoHomebrew === "crear"
                    ? estilos.itemMenuActivo
                    : ""
                }`}
              >
                <Plus size={12} />
                <span>Crear Nuevo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  establecerPestaña("homebrew");
                  establecerModoHomebrew("lista");
                  setMostrarMenuHomebrew(false);
                }}
                className={`${estilos.itemMenuDesplegable} ${
                  pestañaActiva === "homebrew" && modoHomebrew === "lista"
                    ? estilos.itemMenuActivo
                    : ""
                }`}
              >
                <Edit2 size={12} />
                <span>Listado / Editar</span>
              </button>
            </div>
          )}
        </div>

        {/* Botón Configuración */}
        <button
          type="button"
          onClick={() => establecerPestaña("configuracion")}
          className={`${estilos.botonAccion} ${
            pestañaActiva === "configuracion" ? estilos.botonActivo : ""
          }`}
          title="Configuración de Sesión e Importación"
          aria-label="Configuración"
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
};

export default BarraSuperior;
