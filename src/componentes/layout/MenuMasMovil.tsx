import React, { useEffect } from "react";
import {
  usarEstadoConfiguracion,
  usarAccionesConfiguracion,
} from "@/almacen/selectores";
import {
  BookMarked,
  FileText,
  Play,
  X,
  type LucideIcon,
} from "lucide-react";
import estilos from "./MenuMasMovil.module.css";

interface ElementoOpcion {
  id: string;
  titulo: string;
  descripcion: string;
  Icono: LucideIcon;
}

const OPCIONES_JUGADOR: ElementoOpcion[] = [
  {
    id: "rasgos",
    titulo: "Rasgos y Dotes",
    descripcion: "Dotes, trasfondo y clase",
    Icono: BookMarked,
  },
  {
    id: "notas",
    titulo: "Notas",
    descripcion: "Bitácora y apuntes de misión",
    Icono: FileText,
  },
  {
    id: "iniciativa",
    titulo: "Iniciativa",
    descripcion: "Tracker y turnos de combate",
    Icono: Play,
  },
];

export interface PropsMenuMasMovil {
  abierto: boolean;
  alCerrar: () => void;
}

export const MenuMasMovil: React.FC<PropsMenuMasMovil> = ({ abierto, alCerrar }) => {
  const { pestañaActiva, esGM } = usarEstadoConfiguracion();
  const { establecerPestaña } = usarAccionesConfiguracion();

  useEffect(() => {
    if (!abierto) return;

    const manejarKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        alCerrar();
      }
    };

    window.addEventListener("keydown", manejarKeyDown);
    return () => window.removeEventListener("keydown", manejarKeyDown);
  }, [abierto, alCerrar]);

  // En modo DM las 5 pestañas están directamente en la barra inferior
  if (!abierto || esGM) return null;

  const seleccionarOpcion = (id: string) => {
    establecerPestaña(id);
    alCerrar();
  };

  return (
    <div
      className={estilos.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Más pestañas de la ficha de personaje"
    >
      <div className={`${estilos.hojaInferior} u-scroll-cef`}>
        <div className={estilos.manijaArrastre} aria-hidden="true" />

        <div className={estilos.cabeceraHoja}>
          <div className={estilos.titulosCabecera}>
            <span className={estilos.kicker}>Vistas Adicionales</span>
            <h3 className={estilos.tituloPrincipal}>Más Opciones</h3>
          </div>
          <button
            type="button"
            className={estilos.botonCerrar}
            onClick={alCerrar}
            title="Cerrar panel"
            aria-label="Cerrar panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className={estilos.cuerpoOpciones}>
          {OPCIONES_JUGADOR.map((opc) => {
            const esActiva = pestañaActiva === opc.id;
            const Icono = opc.Icono;

            return (
              <button
                key={opc.id}
                type="button"
                className={`${estilos.tarjetaOpcion} ${esActiva ? estilos.tarjetaOpcionActiva : ""}`}
                onClick={() => seleccionarOpcion(opc.id)}
                title={opc.descripcion}
              >
                <div className={estilos.iconoMedallon}>
                  <Icono size={18} />
                </div>
                <div className={estilos.textosOpcion}>
                  <span className={estilos.tituloOpcion}>{opc.titulo}</span>
                  <span className={estilos.descripcionOpcion}>{opc.descripcion}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MenuMasMovil;
