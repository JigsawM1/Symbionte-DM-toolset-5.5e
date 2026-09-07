import type {
  PersonajeJugador,
  Caracteristica
} from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import type { AtaquePersonajeCalculado } from "@/componentes/caracteristicas/ataques/TarjetaAtaquePersonaje";
import { esCompetenteConArma } from "@/constantes/competenciasConstantes";
import {
  evaluarAtaqueDesarmadoEspecial,
  ContextoAtaquePersonaje
} from "@/servicios/evaluadorEfectosRasgos";
import {
  resolverBonosYDadosExtraCombate,
  componerFormulasDano
} from "@/servicios/calculadorDanoCombate";

export function calcularAtaqueDesarmado(contexto: {
  personajeActivo: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  caracteristicasArmas: Record<string, Caracteristica>;
  gruposArmasConsolidados: string[];
  furiaEstaActiva: boolean;
  yaIncluyeFuriaEnEfectos: boolean;
}): AtaquePersonajeCalculado {
  const {
    personajeActivo,
    statsCalculadas,
    caracteristicasArmas,
    gruposArmasConsolidados,
    furiaEstaActiva,
    yaIncluyeFuriaEnEfectos
  } = contexto;

  const esCompetenteDesarmado =
    esCompetenteConArma(
      "Ataque desarmado",
      "Sencilla",
      gruposArmasConsolidados,
      personajeActivo.competenciasArmasLista || []
    ) ||
    (!personajeActivo.competenciasArmas && (personajeActivo.competenciasArmasLista || []).length === 0);

  const modificadores = statsCalculadas.modificadores;
  const modFue = modificadores.fuerza || 0;
  const modDes = modificadores.destreza || 0;
  const esMonje = (personajeActivo.clase || "").toLowerCase().includes("monje");
  const ataqueDesarmadoEsp = evaluarAtaqueDesarmadoEspecial(personajeActivo);

  let caracDefectoDesarmado: Caracteristica = "fuerza";
  if (esMonje) {
    caracDefectoDesarmado = modDes > modFue ? "destreza" : "fuerza";
  } else if (ataqueDesarmadoEsp.aplica && ataqueDesarmadoEsp.caracteristicaSugerida) {
    caracDefectoDesarmado = ataqueDesarmadoEsp.caracteristicaSugerida;
  }

  const caracDesarmado: Caracteristica = caracteristicasArmas["ataque-desarmado"] || caracDefectoDesarmado;
  const modDesarmado = modificadores[caracDesarmado] || 0;
  const bonoAtaqueDesarmado = (esCompetenteDesarmado ? statsCalculadas.bonoCompetencia : 0) + modDesarmado;

  // 1. Monje (Artes Marciales)
  if (esMonje) {
    const nivelPj = personajeActivo.nivel || 1;
    let dadoMonje = "1d6";
    if (nivelPj >= 17) dadoMonje = "1d12";
    else if (nivelPj >= 11) dadoMonje = "1d10";
    else if (nivelPj >= 5) dadoMonje = "1d8";

    const formulaMonje =
      modDesarmado !== 0
        ? `${dadoMonje}${modDesarmado >= 0 ? `+${modDesarmado}` : modDesarmado}`
        : dadoMonje;

    return {
      id: "ataque-desarmado",
      nombre: "Golpe sin Armas (Artes Marciales)",
      tipo: "Desarmado",
      subtipo: "Cuerpo a Cuerpo",
      tipoAccion: "accion",
      caracteristicaUsada: caracDesarmado,
      bonoAtaque: bonoAtaqueDesarmado,
      dadoDano: formulaMonje,
      dadoDanoBase: dadoMonje,
      modificadorDano: modDesarmado,
      esDanoFijo: false,
      tipoDano: "Contundente",
      alcance: "5 ft",
      propiedades: ["Artes Marciales", "Sutil"],
      tieneTiradaAtaque: true,
      esCompetenteConArma: esCompetenteDesarmado,
      esSutil: true,
      esDistancia: false
    };
  }

  // 2. Ataque desarmado especial (Bardo u otro)
  if (ataqueDesarmadoEsp.aplica) {
    const dadoBaseEsp = ataqueDesarmadoEsp.dadoDanoBase || "1d6";
    const formulaEsp =
      modDesarmado !== 0
        ? `${dadoBaseEsp}${modDesarmado >= 0 ? `+${modDesarmado}` : modDesarmado}`
        : dadoBaseEsp;

    return {
      id: "ataque-desarmado",
      nombre: ataqueDesarmadoEsp.nombreAtaque || "Daño Bárdico",
      tipo: "Desarmado",
      subtipo: "Cuerpo a Cuerpo",
      tipoAccion: "accion",
      caracteristicaUsada: caracDesarmado,
      bonoAtaque: bonoAtaqueDesarmado,
      dadoDano: formulaEsp,
      dadoDanoBase: dadoBaseEsp,
      modificadorDano: modDesarmado,
      esDanoFijo: false,
      tipoDano: "Contundente",
      alcance: "5 ft",
      propiedades: ataqueDesarmadoEsp.propiedades || ["Daño Bárdico", "Sutil"],
      tieneTiradaAtaque: true,
      esCompetenteConArma: esCompetenteDesarmado,
      esSutil: true,
      esDistancia: false
    };
  }

  // 3. Golpe Desarmado Estándar
  const contextoDesarmado: ContextoAtaquePersonaje = {
    tipo: "desarmado",
    caracteristica: caracDesarmado,
    esCuerpoACuerpo: true,
    esDistancia: false
  };

  const { modDanoTotal, dadosExtra, danosSecundarios } = resolverBonosYDadosExtraCombate({
    personajeActivo,
    statsCalculadas,
    contextoAtaque: contextoDesarmado,
    caracUsada: caracDesarmado,
    modAtributo: modDesarmado,
    bonoMagico: 0,
    furiaEstaActiva,
    yaIncluyeFuriaEnEfectos
  });

  const hayDanoSec = danosSecundarios.length > 0;
  let formulaDesarmado: string;
  let dadoBaseDesarmado: string;
  let esDanoFijoDesarmado: boolean;
  let tipoDanoDesarmado = "Contundente";
  let modDanoDesarmadoFinal = modDanoTotal;

  if (hayDanoSec) {
    const formulaSec = danosSecundarios[0];
    const matchSec = formulaSec.match(/^(\d+d\d+)(.*)$/i);
    const dadoPrincipalSec = matchSec ? matchSec[1] : "1d6";
    const extraNumSec = matchSec && matchSec[2] ? parseInt(matchSec[2], 10) || 0 : 0;

    modDanoDesarmadoFinal = modDanoTotal + extraNumSec;
    const { dadoDanoTotalBase, formulaDano } = componerFormulasDano(
      dadoPrincipalSec,
      modDanoDesarmadoFinal,
      dadosExtra,
      []
    );
    formulaDesarmado = formulaDano;
    dadoBaseDesarmado = dadoDanoTotalBase;
    esDanoFijoDesarmado = false;
    tipoDanoDesarmado = "Contundente (Extra)";
  } else if (dadosExtra.length > 0) {
    const { dadoDanoTotalBase, formulaDano } = componerFormulasDano(
      dadosExtra[0],
      modDanoDesarmadoFinal,
      dadosExtra.slice(1),
      []
    );
    formulaDesarmado = formulaDano;
    dadoBaseDesarmado = dadoDanoTotalBase;
    esDanoFijoDesarmado = false;
  } else {
    const danoFijo = Math.max(1, 1 + modDanoTotal);
    formulaDesarmado = `${danoFijo}`;
    dadoBaseDesarmado = "1";
    esDanoFijoDesarmado = true;
  }

  return {
    id: "ataque-desarmado",
    nombre: "Golpe sin Armas",
    tipo: "Desarmado",
    subtipo: "Cuerpo a Cuerpo",
    tipoAccion: "accion",
    caracteristicaUsada: caracDesarmado,
    bonoAtaque: bonoAtaqueDesarmado,
    dadoDano: formulaDesarmado,
    dadoDanoBase: dadoBaseDesarmado,
    modificadorDano: modDanoDesarmadoFinal,
    esDanoFijo: esDanoFijoDesarmado,
    tipoDano: tipoDanoDesarmado,
    alcance: "5 ft",
    propiedades: [],
    tieneTiradaAtaque: true,
    esCompetenteConArma: esCompetenteDesarmado,
    esSutil: false,
    esDistancia: false
  };
}
