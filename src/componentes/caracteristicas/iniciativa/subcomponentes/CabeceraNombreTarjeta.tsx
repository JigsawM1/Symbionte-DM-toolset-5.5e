import React from "react";
import type { CriaturaIniciativa } from "@/almacen/usarAlmacenDM";
import type { MonstruoBase } from "@/utiles/datosIniciales";
import { formatearVelocidad } from "@/almacen/sanitizacion";
import { esNombreVacioODot } from "@/servicios/resolutorCriaturas";
import estilosClases from "../TarjetaCriaturaIniciativa.module.css";

interface CabeceraNombreTarjetaProps {
  criatura: CriaturaIniciativa;
  plantilla: MonstruoBase | null;
  esTurnoActivo: boolean;
  estaMuerto: boolean;
  estaSeleccionadaEnTS: boolean;
  onSeleccionar: () => void;
  onAlternarRol?: () => void;
  obtenerPercepcionPasiva: (plantilla: MonstruoBase | null) => number;
}

export const CabeceraNombreTarjeta: React.FC<CabeceraNombreTarjetaProps> = React.memo(({
  criatura,
  plantilla,
  esTurnoActivo,
  estaMuerto,
  estaSeleccionadaEnTS,
  onSeleccionar,
  onAlternarRol,
  obtenerPercepcionPasiva
}) => (
  <div className={estilosClases.cabeceraFilaInfo}>
    <div className={estilosClases.cajaNombres}>
      <span
        onClick={onSeleccionar}
        className={estilosClases.nombreCriaturaLink}
        data-turno-activo={esTurnoActivo}
        data-muerto={estaMuerto}
        title="Ver bloque de estadísticas"
      >
        {esNombreVacioODot(criatura.nombre) ? (
          <span className={estilosClases.textoMiniSinNombre}>
            [Mini sin nombre: {criatura.id.slice(-4)}]
          </span>
        ) : (
          criatura.nombre
        )}
        {esTurnoActivo && <span className={estilosClases.tagTurnoActivo}>ACTIVO</span>}
        {estaSeleccionadaEnTS && <span className={estilosClases.tagSeleccionTS}>SEL</span>}
        <span
          onClick={(e) => {
            e.stopPropagation();
            onAlternarRol?.();
          }}
          className={criatura.esMonstruo ? estilosClases.tagRolMonstruo : estilosClases.tagRolJugador}
          title={criatura.esMonstruo ? "Monstruo / Enemigo (clic para cambiar a Jugador)" : "Jugador / Aliado (clic para cambiar a Monstruo)"}
        >
          {criatura.esMonstruo ? "MON" : "PJ"}
        </span>
      </span>
      <span className={estilosClases.subtituloCriatura}>
        CA: <strong className={estilosClases.valorMetaCianFuente}>{criatura.ca}</strong> | Inic:{" "}
        <strong className={estilosClases.valorMetaAmarilloFuente}>
          {(criatura.bonificadorIniciativa ?? 0) >= 0
            ? `+${criatura.bonificadorIniciativa ?? 0}`
            : criatura.bonificadorIniciativa}
        </strong>{" "}
        <br /> Vel: {formatearVelocidad(criatura.velocidad)}
        {criatura.esMonstruo && plantilla ? (
          <>
            <br /> PP: <strong className={estilosClases.valorMetaCianFuente}>{obtenerPercepcionPasiva(plantilla)}</strong>
          </>
        ) : null}
      </span>
    </div>
  </div>
));

CabeceraNombreTarjeta.displayName = "CabeceraNombreTarjeta";
