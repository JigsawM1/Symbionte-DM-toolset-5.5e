import React from "react";
import {
  usarEstadoIniciativa,
  usarAccionesIniciativa,
  usarEstadoConfiguracion,
  usarAccionesConfiguracion,
} from "@/almacen/selectores";
import {
  BuscadorMonstruos,
  MenuEncuentros,
  SelectorCondiciones,
  SelectorJugadorRapido,
} from "@/componentes/caracteristicas/iniciativa";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import estilosClases from "./BarraControl.module.css";
import { logger } from "@/utiles/logger";

export const BarraControl: React.FC = () => {
  const { colaIniciativa, rondaActual } = usarEstadoIniciativa();
  const {
    avanzarTurno,
    retrocederTurno,
    avanzarRonda,
    retrocederRonda,
    autoLanzarIniciativaMonstruos,
  } = usarAccionesIniciativa();
  const { tipoTirada } = usarEstadoConfiguracion();
  const { establecerTipoTirada } = usarAccionesConfiguracion();

  // Auto Roll para TODOS los monstruos de la iniciativa que tengan vida actual > 0
  const manejarAutoRollIniciativaMonstruos = () => {
    const monstruos = colaIniciativa.filter((c) => c.esMonstruo);
    if (monstruos.length === 0) return;

    autoLanzarIniciativaMonstruos();
    
    logger.debug("Auto Roll completado de forma masiva para todos los monstruos de la cola.");
  };

  return (
    <div className={estilosClases.barraControles}>
      {/* 1. Buscadores */}
      <div className={estilosClases.bloqueBusqueda}>
        {/* Subcomponente Buscador de Monstruos */}
        <BuscadorMonstruos />

        {/* Invocador / Buscador de Jugadores y Hojas de Personaje */}
        <SelectorJugadorRapido />
      </div>

      {/* 2. Guardar y Cargar Encuentros */}
      <MenuEncuentros />

      {/* 3. Botones de Acción */}
      <div className={estilosClases.grupoAcciones}>
        <button onClick={manejarAutoRollIniciativaMonstruos} className={estilosClases.botonAccionPrincipal} title="Lanzar iniciativa masiva de monstruos">
          <AlertTriangle size={13} className={estilosClases.iconoAlerta} />
          Auto Roll
        </button>

        <button onClick={retrocederTurno} className={estilosClases.botonNavegacionTurno} title="Turno anterior">
          <ChevronLeft size={16} />
        </button>
        
        <button onClick={avanzarTurno} className={estilosClases.botonNavegacionTurno} title="Siguiente Turno">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 4. Selector de Ventaja / Desventaja */}
      <div className={estilosClases.grupoVentaja}>
        <button
          onClick={() => establecerTipoTirada("desventaja")}
          className={`${estilosClases.botonTirada} ${
            tipoTirada === "desventaja" ? estilosClases.botonDesventajaActivo : ""
          }`}
        >
          DesVent
        </button>
        <button
          onClick={() => establecerTipoTirada("plano")}
          className={`${estilosClases.botonTirada} ${
            tipoTirada === "plano" ? estilosClases.botonPlanoActivo : ""
          }`}
        >
          Plano
        </button>
        <button
          onClick={() => establecerTipoTirada("ventaja")}
          className={`${estilosClases.botonTirada} ${
            tipoTirada === "ventaja" ? estilosClases.botonVentajaActivo : ""
          }`}
        >
          Vent
        </button>
      </div>

      {/* 5. Selector de Condiciones con Barra de Búsqueda Inteligente */}
      <SelectorConditionsWrapper />

      {/* 6. Indicador de Ronda */}
      <div className={estilosClases.indicadorRonda}>
        <button onClick={retrocederRonda} className={estilosClases.botonRondaPaso}>-</button>
        <span className={estilosClases.rondaTexto}>
          RONDA: <span className={`dato-numerico ${estilosClases.numeroRonda}`}>{rondaActual}</span>
        </span>
        <button onClick={avanzarRonda} className={estilosClases.botonRondaPaso}>+</button>
      </div>
    </div>
  );
};

// Wrapper para aislar la carga y renderizado de condiciones
const SelectorConditionsWrapper: React.FC = () => {
  return <SelectorCondiciones />;
};
