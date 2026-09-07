import type {
  PersonajeJugador,
  Caracteristica
} from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  obtenerDadosExtraAtaque,
  obtenerDanosSecundariosAtaque,
  obtenerBonoDanoFuerzaExtra,
  ContextoAtaquePersonaje
} from "@/servicios/evaluadorEfectosRasgos";
import { coincideIdRasgo, ID_RASGO } from "@/constantes";

const normalizar = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export interface ResultadoBonosCombate {
  modDanoTotal: number;
  dadosExtra: string[];
  danosSecundarios: string[];
}

/**
 * Resuelve los bonos de daño, dados extra (frenesí, golpe brutal) y daños secundarios (furia divina)
 * aplicables a un ataque físico, desarmado o improvisado.
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

  const bonoDanoExtraRasgos = obtenerBonoDanoFuerzaExtra(personajeActivo, contextoAtaque);
  const bonoFuria =
    !yaIncluyeFuriaEnEfectos && caracUsada === "fuerza" && statsCalculadas.bonoDanoFuria > 0
      ? statsCalculadas.bonoDanoFuria
      : 0;

  const modDanoTotal = modAtributo + bonoMagico + bonoFuria + bonoDanoExtraRasgos;

  const dadosExtra: string[] = [];
  const dadosExtraEfectos = obtenerDadosExtraAtaque(personajeActivo, contextoAtaque);
  for (const d of dadosExtraEfectos) {
    dadosExtra.push(d.dados);
  }

  if (caracUsada === "fuerza") {
    const rasgoFrenesi = (personajeActivo.rasgos || []).find(
      (r) => coincideIdRasgo(r, ID_RASGO.FRENESI) && r.activo
    );
    if (rasgoFrenesi && !dadosExtraEfectos.some((d) => d.origen.toLowerCase().includes("frenes"))) {
      const dadosF = rasgoFrenesi.formulaDados || `${statsCalculadas.bonoDanoFuria || 2}d6`;
      dadosExtra.push(dadosF);
    }

    const rasgoGolpeBrutal = furiaEstaActiva
      ? (personajeActivo.rasgos || []).find(
          (r) => coincideIdRasgo(r, ID_RASGO.GOLPE_BRUTAL) && r.activo
        )
      : undefined;
    if (rasgoGolpeBrutal && !dadosExtraEfectos.some((d) => d.origen.toLowerCase().includes("golpe brutal"))) {
      const dadosGb = rasgoGolpeBrutal.formulaDados || "1d10";
      dadosExtra.push(dadosGb);
    }
  }

  const danosSecundarios: string[] = [];
  const danosSecEfectos = obtenerDanosSecundariosAtaque(personajeActivo, contextoAtaque);
  for (const ds of danosSecEfectos) {
    danosSecundarios.push(ds.formula);
  }

  if (caracUsada === "fuerza" && furiaEstaActiva) {
    const rasgoFuriaDivina = (personajeActivo.rasgos || []).find(
      (r) => coincideIdRasgo(r, ID_RASGO.FURIA_DIVINA) && r.activo
    );
    if (rasgoFuriaDivina && !danosSecEfectos.some((d) => d.origen.toLowerCase().includes("furia divina"))) {
      const claseBarbaro = (personajeActivo.clases || []).find((c) => normalizar(c.nombre).includes("barbaro"));
      const nivelBarbaro =
        claseBarbaro?.nivel ||
        (normalizar(personajeActivo.clase || "").includes("barbaro")
          ? personajeActivo.nivel
          : personajeActivo.nivel || 1);
      const bonoMitadNivel = Math.floor(nivelBarbaro / 2);
      const formulaExtraFuriaDivina = bonoMitadNivel > 0 ? `1d6+${bonoMitadNivel}` : "1d6";
      danosSecundarios.push(formulaExtraFuriaDivina);
    }
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
