import React from "react";
import { Swords, ChevronDown, ChevronRight, Target, Zap } from "lucide-react";
import { TarjetaAtaquePersonaje } from "./TarjetaAtaquePersonaje";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
import { obtenerDadosExtraCriticoArma } from "@/servicios/evaluadorEfectosRasgos";
import type { Caracteristica, PersonajeJugador } from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import type { AtaquePersonajeCalculado } from "./usarCalculoAtaquesJugador";
import estilosVista from "./VistaAtaquesJugador.module.css";
import estilos from "./TarjetaAtaquePersonaje.module.css";

interface SeccionAtaquesFisicosProps {
  ataquesFisicos: AtaquePersonajeCalculado[];
  personajeActivo: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje | null;
  estaAbierta: boolean;
  alAlternar: () => void;
  alTirarAtaque: (ataque: AtaquePersonajeCalculado) => void;
  alTirarDano: (ataque: AtaquePersonajeCalculado, versatil?: boolean | "adicional") => void;
  alTirarCritico: (ataque: AtaquePersonajeCalculado, versatil?: boolean | "adicional") => void;
  alCambiarCaracteristica: (idInstancia: string, nuevaCarac: Caracteristica) => void;
  alAjustarMunicion?: (ataque: AtaquePersonajeCalculado, delta: 1 | -1) => void;
}

export const SeccionAtaquesFisicos: React.FC<SeccionAtaquesFisicosProps> = ({
  ataquesFisicos,
  personajeActivo,
  statsCalculadas,
  estaAbierta,
  alAlternar,
  alTirarAtaque,
  alTirarDano,
  alTirarCritico,
  alCambiarCaracteristica,
  alAjustarMunicion
}) => {
  const [modoCritico, setModoCritico] = React.useState(false);
  const modoCriticoRef = React.useRef(modoCritico);
  modoCriticoRef.current = modoCritico;

  const manejarTirarDanoConModo = React.useCallback(
    (ataque: AtaquePersonajeCalculado, modo?: boolean | "adicional") => {
      if (modoCriticoRef.current) {
        setModoCritico(false);
        alTirarCritico(ataque, modo);
        return;
      }
      alTirarDano(ataque, modo);
    },
    [alTirarCritico, alTirarDano]
  );

  const tieneDanoAdicional = React.useMemo(
    () =>
      Boolean(
        personajeActivo.rasgos?.some(
          (r) => r.resolucionAsistida?.integrarEnDanoDeArma && r.activo !== false
        )
      ),
    [personajeActivo.rasgos]
  );

  // Memoriza evaluaciones por ataque para conservar la igualdad referencial en React.memo
  // cuando cambia únicamente modoCritico.
  const tarjetasPreparadas = React.useMemo(
    () =>
      ataquesFisicos.map((ataque) => {
        const permiteDanoAdicional = ataque.tipo === "Arma" && tieneDanoAdicional;
        return {
          ataque,
          permiteDanoAdicional,
          esDanoFijoPasivo: ataque.esDanoFijo && !permiteDanoAdicional,
          evalCond: evaluarEfectosCondicionesEnTirada({
            tipo: "ataque",
            caracteristica: ataque.caracteristicaUsada as Caracteristica,
            penalizacionArmadura: !!statsCalculadas?.penalizacionArmadura?.sinCompetencia,
            desventajaSigiloArmadura: !!statsCalculadas?.desventajaSigiloArmadura,
            condicionesActivas: personajeActivo?.condicionesActivas,
            personaje: personajeActivo
          }),
          dadosExtraCritico: obtenerDadosExtraCriticoArma(
            personajeActivo,
            ataque.tipoDano || ""
          ),
          modAtributoAtaque:
            statsCalculadas?.modificadores[ataque.caracteristicaUsada as Caracteristica] ?? 0
        };
      }),
    [ataquesFisicos, tieneDanoAdicional, personajeActivo, statsCalculadas]
  );

  if (ataquesFisicos.length === 0) {
    return null;
  }

  return (
    <section
      className={estilosVista.seccionGrupoAtaques}
      aria-label="Ataques con armas y maestría"
    >
      <div
        className={estilos.cabeceraSeccionFisicos}
        data-critico={modoCritico ? "true" : undefined}
      >
        <button
          type="button"
          className={estilos.botonColapsarSeccion}
          onClick={alAlternar}
          aria-expanded={estaAbierta}
          title="Clic para mostrar u ocultar armas y ataques físicos"
        >
          <Swords size={14} color="var(--pj-texto-cian)" aria-hidden="true" />
          <span className={estilos.tituloSeccionTexto}>Ataques con Armas &amp; Maestría</span>
          <span className={estilos.badgeConteoFisicos}>{ataquesFisicos.length}</span>
          {estaAbierta ? (
            <ChevronDown size={14} className={estilos.iconoChevron} aria-hidden="true" />
          ) : (
            <ChevronRight size={14} className={estilos.iconoChevron} aria-hidden="true" />
          )}
        </button>

        <div className={estilos.grupoToggleCritico}>
          <button
            type="button"
            className={estilos.botonToggleCritico}
            aria-pressed={modoCritico}
            data-activo={modoCritico ? "true" : undefined}
            onClick={() => setModoCritico((prev) => !prev)}
            title={
              modoCritico
                ? "Modo Crítico activo: el próximo daño duplicará los dados y volverá a modo normal"
                : "Activar modo Crítico (×2 Dados) para la próxima tirada de daño"
            }
          >
            {modoCritico ? (
              <Zap size={12} className={estilos.iconoToggleOn} aria-hidden="true" />
            ) : (
              <Target size={12} className={estilos.iconoToggleOff} aria-hidden="true" />
            )}
            <span>{modoCritico ? "Crítico ×2 · Activo" : "Crítico (×2 Dados)"}</span>
          </button>
        </div>
      </div>

      {estaAbierta && (
        <div className={estilosVista.listaAtaques}>
          {tarjetasPreparadas.map(
            ({
              ataque,
              permiteDanoAdicional,
              esDanoFijoPasivo,
              evalCond,
              dadosExtraCritico,
              modAtributoAtaque
            }) => (
              <TarjetaAtaquePersonaje
                key={ataque.id}
                ataque={ataque}
                evaluacionCondiciones={evalCond}
                permiteDanoAdicional={permiteDanoAdicional}
                modoCritico={modoCritico && !esDanoFijoPasivo}
                dadosExtraCritico={dadosExtraCritico}
                modAtributoAtaque={modAtributoAtaque}
                alTirarAtaque={alTirarAtaque}
                alTirarDano={manejarTirarDanoConModo}
                alCambiarCaracteristica={alCambiarCaracteristica}
                alAjustarMunicion={alAjustarMunicion}
              />
            )
          )}
        </div>
      )}
    </section>
  );
};
