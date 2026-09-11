import type {
  PersonajeJugador,
  Caracteristica
} from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  obtenerDadosExtraAtaque,
  obtenerDanosSecundariosAtaque,
  obtenerBonoDanoAtaqueExtra,
  resolverFormulaDinamica,
  ContextoAtaquePersonaje
} from "@/servicios/evaluadorEfectosRasgos";

export interface ResultadoBonosCombate {
  modDanoTotal: number;
  dadosExtra: string[];
  danosSecundarios: string[];
}

/**
 * Resuelve los bonos de daño numéricos, dados extra y daños secundarios
 * aplicables a un ataque físico, desarmado o improvisado de forma 100% genérica.
 */
export function resolverBonosYDadosExtraCombate(params: {
  personajeActivo: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  contextoAtaque: ContextoAtaquePersonaje;
  caracUsada: Caracteristica;
  modAtributo: number;
  bonoMagico: number;
  furiaEstaActiva: boolean;
  yaIncluyeFuriaEnEfectos: boolean;
}): ResultadoBonosCombate {
  const {
    personajeActivo,
    statsCalculadas,
    contextoAtaque,
    caracUsada,
    modAtributo,
    bonoMagico,
    furiaEstaActiva,
    yaIncluyeFuriaEnEfectos
  } = params;

  const bonoDanoExtraRasgos = obtenerBonoDanoAtaqueExtra(personajeActivo, contextoAtaque);
  const bonoFuria =
    furiaEstaActiva && !yaIncluyeFuriaEnEfectos && caracUsada === "fuerza" && statsCalculadas.bonoDanoFuria > 0
      ? statsCalculadas.bonoDanoFuria
      : 0;

  const modDanoTotal = modAtributo + bonoMagico + bonoFuria + bonoDanoExtraRasgos;

  const dadosExtra: string[] = [];
  const dadosExtraEfectos = obtenerDadosExtraAtaque(personajeActivo, contextoAtaque);
  for (const d of dadosExtraEfectos) {
    dadosExtra.push(d.dados);
  }

  // Soporte genérico para rasgos activables con formulaDados que no definan efectos mecánicos explícitos
  for (const r of personajeActivo.rasgos || []) {
    if (r.activo && r.formulaDados && r.esActivable) {
      const tieneEfectoDeDano = (r.efectos || []).some(
        (e) => e.tipo === "dado_extra_dano" || e.tipo === "dano_secundario"
      );
      if (!tieneEfectoDeDano) {
        const dadosResueltos = resolverFormulaDinamica(r.formulaDados, personajeActivo);
        if (dadosResueltos && /^\d+d\d+/i.test(dadosResueltos)) {
          dadosExtra.push(dadosResueltos);
        }
      }
    }
  }

  const danosSecundarios: string[] = [];
  const danosSecEfectos = obtenerDanosSecundariosAtaque(personajeActivo, contextoAtaque);
  for (const ds of danosSecEfectos) {
    danosSecundarios.push(ds.formula);
  }

  return {
    modDanoTotal,
    dadosExtra,
    danosSecundarios
  };
}

/**
 * Compone las fórmulas de texto para daño base y daño con modificadores (incluyendo subgrupos /).
 */
export function componerFormulasDano(
  dadoBase: string,
  modDanoTotal: number,
  dadosExtra: string[],
  danosSecundarios: string[]
): { dadoDanoTotalBase: string; formulaDano: string } {
  const strExtra = dadosExtra.length > 0 ? `+${dadosExtra.join("+")}` : "";
  const signoMod = modDanoTotal >= 0 ? `+${modDanoTotal}` : `${modDanoTotal}`;

  let dadoDanoTotalBase = `${dadoBase}${strExtra}`;
  let formulaDano = modDanoTotal !== 0 ? `${dadoDanoTotalBase}${signoMod}` : dadoDanoTotalBase;

  for (const formulaSec of danosSecundarios) {
    dadoDanoTotalBase = `${dadoDanoTotalBase}/${formulaSec}`;
    formulaDano = `${formulaDano}/${formulaSec}`;
  }

  return { dadoDanoTotalBase, formulaDano };
}
