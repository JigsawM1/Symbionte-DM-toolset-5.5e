import React, { useState } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { BuscadorMonstruos } from "./control/BuscadorMonstruos";
import { MenuEncuentros } from "./control/MenuEncuentros";
import { SelectorCondiciones } from "./control/SelectorCondiciones";
import {
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import estilosClases from "./BarraControl.module.css";

export const BarraControl: React.FC = () => {
  const colaIniciativa = usarAlmacenDM((s) => s.colaIniciativa);
  const rondaActual = usarAlmacenDM((s) => s.rondaActual);
  const tipoTirada = usarAlmacenDM((s) => s.tipoTirada);
  const avanzarTurno = usarAlmacenDM((s) => s.avanzarTurno);
  const retrocederTurno = usarAlmacenDM((s) => s.retrocederTurno);
  const avanzarRonda = usarAlmacenDM((s) => s.avanzarRonda);
  const retrocederRonda = usarAlmacenDM((s) => s.retrocederRonda);
  const establecerTipoTirada = usarAlmacenDM((s) => s.establecerTipoTirada);
  const agregarCriaturaAIniciativa = usarAlmacenDM((s) => s.agregarCriaturaAIniciativa);
  const autoLanzarIniciativaMonstruos = usarAlmacenDM((s) => s.autoLanzarIniciativaMonstruos);

  const [nombreJugadorRapido, setNombreJugadorRapido] = useState("");

  // Añadir un jugador de forma rápida a la iniciativa
  const manejarAñadirJugadorRapido = () => {
    if (!nombreJugadorRapido.trim()) return;

    // Tirada de iniciativa para jugador
    const tiradaInic = Math.floor(Math.random() * 20) + 1;
    const totalInic = tiradaInic; // sin bonificador por defecto en rápido

    agregarCriaturaAIniciativa(
      nombreJugadorRapido.trim(),
      totalInic,
      30, // HP estándar rápido
      15, // CA estándar rápida
      false, // no es monstruo (es jugador)
      "30 pies",
      0
    );

    setNombreJugadorRapido("");
  };

  // Auto Roll para TODOS los monstruos de la iniciativa que tengan vida actual > 0
  const manejarAutoRollIniciativaMonstruos = () => {
    const monstruos = colaIniciativa.filter((c) => c.esMonstruo);
    if (monstruos.length === 0) return;

    autoLanzarIniciativaMonstruos();
    
    if (window.TS) {
      window.TS.debug?.log("Auto Roll completado de forma masiva para todos los monstruos de la cola.");
    }
  };

  return (
    <div className={estilosClases.barraControles}>
      {/* 1. Buscadores */}
      <div className={estilosClases.bloqueBusqueda}>
        {/* Subcomponente Buscador de Monstruos */}
        <BuscadorMonstruos />

        {/* Añadir Jugador Rápido */}
        <div className={estilosClases.campoBusqueda}>
          <User size={13} style={{ color: "var(--color-borde-cian)" }} />
          <input
            type="text"
            value={nombreJugadorRapido}
            onChange={(e) => setNombreJugadorRapido(e.target.value)}
            placeholder="Añadir Jugador Rápido..."
            className={estilosClases.inputBrutal}
            onKeyDown={(e) => e.key === "Enter" && manejarAñadirJugadorRapido()}
          />
          <button onClick={manejarAñadirJugadorRapido} className={estilosClases.botonAñadir} title="Añadir jugador">
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* 2. Guardar y Cargar Encuentros */}
      <MenuEncuentros />

      {/* 3. Botones de Acción */}
      <div className={estilosClases.grupoAcciones}>
        <button onClick={manejarAutoRollIniciativaMonstruos} className={estilosClases.botonAccionPrincipal} title="Lanzar iniciativa masiva de monstruos">
          <AlertTriangle size={13} style={{ color: "var(--color-advertencia)", marginRight: "4px" }} />
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
          RONDA: <span className="dato-numerico" style={{ color: "var(--color-borde-cian)" }}>{rondaActual}</span>
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
