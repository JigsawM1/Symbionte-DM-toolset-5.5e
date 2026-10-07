import React from "react";
import { Eye, Search, Brain } from "lucide-react";
import type { PasivasCombatePJ } from "@/tipos/sync";
import estilosClases from "./TarjetaCriaturaIniciativa.module.css";

interface InsigniasPasivasJugadorProps {
  pasivas: Partial<PasivasCombatePJ>;
}

/**
 * Insignias visuales de alta densidad para mostrar la percepción pasiva,
 * la investigación pasiva y la perspicacia pasiva en las tarjetas de jugador
 * dentro del Combat Tracker del Dungeon Master.
 */
export const InsigniasPasivasJugador: React.FC<InsigniasPasivasJugadorProps> = React.memo(({ pasivas }) => {
  return (
    <div className={estilosClases.contenedorPasivasJugador}>
      <div className={estilosClases.badgePasivaJugador} title="Percepción Pasiva">
        <Eye size={11} className={estilosClases.iconoPasivaPercepcion} />
        <span className={estilosClases.textoPasivaLabel}>PP:</span>
        <strong className={estilosClases.valorPasiva}>{pasivas.percepcion ?? 10}</strong>
      </div>
      <div className={estilosClases.badgePasivaJugador} title="Investigación Pasiva">
        <Search size={11} className={estilosClases.iconoPasivaInvestigacion} />
        <span className={estilosClases.textoPasivaLabel}>INV:</span>
        <strong className={estilosClases.valorPasiva}>{pasivas.investigacion ?? 10}</strong>
      </div>
      <div className={estilosClases.badgePasivaJugador} title="Perspicacia Pasiva">
        <Brain size={11} className={estilosClases.iconoPasivaPerspicacia} />
        <span className={estilosClases.textoPasivaLabel}>PERS:</span>
        <strong className={estilosClases.valorPasiva}>{pasivas.perspicacia ?? 10}</strong>
      </div>
    </div>
  );
});

InsigniasPasivasJugador.displayName = "InsigniasPasivasJugador";
