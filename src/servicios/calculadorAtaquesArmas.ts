import type {
  Arma,
  ObjetoJuego,
  ObjetoInventario,
  Caracteristica,
  PersonajeJugador,
  AtaquePersonajeCalculado
} from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { esCompetenteConArma } from "@/constantes/competenciasConstantes";
import { resolverEstadoMunicionArma } from "@/servicios/gestorMunicion";
import {
  evaluarEfectosRasgosActivos,
  ContextoAtaquePersonaje,
  obtenerCompetenciasExtraRasgos,
  personajeTieneMaestriaArma,
  estaAtaqueTemerarioActivo,
  obtenerConfiguracionPactoDelFilo
} from "@/servicios/evaluadorEfectosRasgos";
import { inferirAtributosArma } from "@/constantes/armasInferenciaConstantes";
import {
  resolverBonosYDadosExtraCombate,
  componerFormulasDano
} from "@/servicios/calculadorDanoCombate";
import { calcularAtaqueDesarmado } from "@/servicios/calculadorAtaqueDesarmado";

export { calcularAtaqueDesarmado };

export interface ParametrosCalculoAtaquesFisicos {
  personajeActivo: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  baseDatosObjetos: ObjetoJuego[];
  caracteristicasArmas: Record<string, Caracteristica>;
}

const normalizar = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/**
 * Calcula el objeto de ataque para un arma equipada específica.
 */
export function calcularAtaqueArmaEquipada(
  armaInst: ObjetoInventario,
  contexto: {
    personajeActivo: PersonajeJugador;
    statsCalculadas: EstadisticasCalculadasPersonaje;
    baseDatosObjetos: ObjetoJuego[];
    caracteristicasArmas: Record<string, Caracteristica>;
    gruposArmasConsolidados: string[];
    furiaEstaActiva: boolean;
    yaIncluyeFuriaEnEfectos: boolean;
  }
): AtaquePersonajeCalculado {
  const {
    personajeActivo,
    statsCalculadas,
    baseDatosObjetos,
    caracteristicasArmas,
    gruposArmasConsolidados,
    furiaEstaActiva,
    yaIncluyeFuriaEnEfectos
  } = contexto;

  const objetoCompendio = baseDatosObjetos.find(
    (o: ObjetoJuego) => o.id === armaInst.idObjeto || normalizar(o.nombre) === normalizar(armaInst.nombre)
  ) as Arma | undefined;

  const inferidos = inferirAtributosArma(normalizar(armaInst.nombre));

  const propiedades = objetoCompendio?.propiedades || inferidos.propiedades;
  const esPesada = propiedades.some((p) => normalizar(p).includes("pesada") || normalizar(p).includes("heavy"));
  const esSutil = propiedades.some((p) => normalizar(p).includes("sutil") || normalizar(p).includes("finesse"));
  const esDistancia =
    objetoCompendio?.tipoAtaque === "A Distancia" ||
    inferidos.tipoAtaque === "A Distancia" ||
    propiedades.some((p) => normalizar(p).includes("distancia") || normalizar(p).includes("munición"));
  const esCuerpoACuerpo = !esDistancia;

  const esMonje = (personajeActivo.clase || "").toLowerCase().includes("monje");
  const modificadores = statsCalculadas.modificadores;

  const configPactoFilo = obtenerConfiguracionPactoDelFilo(personajeActivo);

  let caracDefecto: Caracteristica = "fuerza";
  if (configPactoFilo.activo && !esDistancia) {
    const modCar = modificadores.carisma || 0;
    const modFue = modificadores.fuerza || 0;
    const modDes = modificadores.destreza || 0;
    if (modCar >= modFue && modCar >= modDes) {
      caracDefecto = "carisma";
    } else if (esSutil) {
      caracDefecto = modDes > modFue ? "destreza" : "fuerza";
    }
  } else if (esDistancia) {
    caracDefecto = "destreza";
  } else if (esSutil) {
    const prefiereFuerzaPorRasgo = furiaEstaActiva || estaAtaqueTemerarioActivo(personajeActivo);
    if (prefiereFuerzaPorRasgo) {
      caracDefecto = "fuerza";
    } else {
      caracDefecto = (modificadores.destreza || 0) > (modificadores.fuerza || 0) ? "destreza" : "fuerza";
    }
  } else if (esMonje) {
    caracDefecto = (modificadores.destreza || 0) > (modificadores.fuerza || 0) ? "destreza" : "fuerza";
  }

  const caracUsada = caracteristicasArmas[armaInst.idInstancia] || caracDefecto;
  const modAtributo = modificadores[caracUsada] || 0;

  let bonoMagico = 0;
  const match = armaInst.nombre.match(/\+(\d+)/);
  if (match) {
    bonoMagico = parseInt(match[1], 10);
  } else if (objetoCompendio && (objetoCompendio as Record<string, unknown>).bonoAtaque) {
    bonoMagico = Number((objetoCompendio as Record<string, unknown>).bonoAtaque) || 0;
  } else if (objetoCompendio && (objetoCompendio as Record<string, unknown>).bonoMagico) {
    bonoMagico = Number((objetoCompendio as Record<string, unknown>).bonoMagico) || 0;
  }

  const esMagicoReal = armaInst.esMagico || !!objetoCompendio?.esMagico || bonoMagico > 0;
  const subcategoriaArma = objetoCompendio?.subcategoria || inferidos.subcategoria;
  const esCompetenteArma =
    (configPactoFilo.activo && !esDistancia) ||
    esCompetenteConArma(
      armaInst.nombre,
      subcategoriaArma,
      gruposArmasConsolidados,
      personajeActivo.competenciasArmasLista || []
    );

  const bonoAtaque = (esCompetenteArma ? statsCalculadas.bonoCompetencia : 0) + modAtributo + bonoMagico;
  const dadoDanoBase = objetoCompendio?.dadoDano || inferidos.dadoBase;

  const contextoAtaqueArma: ContextoAtaquePersonaje = {
    tipo: "arma",
    caracteristica: caracUsada,
    esCuerpoACuerpo,
    esDistancia,
    propiedades,
    esPesada
  };

  const { modDanoTotal, dadosExtra, danosSecundarios, tiposDanoSecundarios } = resolverBonosYDadosExtraCombate({
    personajeActivo,
    statsCalculadas,
    contextoAtaque: contextoAtaqueArma,
    caracUsada,
    modAtributo,
    bonoMagico,
    furiaEstaActiva,
    yaIncluyeFuriaEnEfectos
  });

  const { dadoDanoTotalBase, formulaDano } = componerFormulasDano(
    dadoDanoBase,
    modDanoTotal,
    dadosExtra,
    danosSecundarios
  );

  let formulaVersatil: string | undefined;
  let dadoVersatilBase: string | undefined;
  const esPropiedadVersatil = propiedades.some((p) => normalizar(p).includes("versat") || normalizar(p).includes("versatile"));
  const rawVersatil = objetoCompendio?.danoVersatil || inferidos.danoVersatil;

  if (rawVersatil) {
    const matchDadosV = rawVersatil.match(/(\d+d\d+)/i);
    const dadoV = matchDadosV ? matchDadosV[1] : rawVersatil.trim();
    const resV = componerFormulasDano(dadoV, modDanoTotal, dadosExtra, danosSecundarios);
    dadoVersatilBase = resV.dadoDanoTotalBase;
    formulaVersatil = resV.formulaDano;
  } else if (esPropiedadVersatil) {
    let dadoV: string | undefined;
    if (dadoDanoBase.includes("1d6")) dadoV = "1d8";
    else if (dadoDanoBase.includes("1d8")) dadoV = "1d10";
    else if (dadoDanoBase.includes("1d10")) dadoV = "1d12";
    else if (dadoDanoBase.includes("1d4")) dadoV = "1d6";

    if (dadoV) {
      const resV = componerFormulasDano(dadoV, modDanoTotal, dadosExtra, danosSecundarios);
      dadoVersatilBase = resV.dadoDanoTotalBase;
      formulaVersatil = resV.formulaDano;
    }
  }

  let alcanceStr = inferidos.alcance;
  if (objetoCompendio?.alcanceNormal) {
    alcanceStr = `${objetoCompendio.alcanceNormal}/${objetoCompendio.alcanceLargo || objetoCompendio.alcanceNormal} ft`;
  }

  const estadoMunicion = resolverEstadoMunicionArma(
    armaInst.nombre,
    propiedades,
    personajeActivo.inventario || [],
    baseDatosObjetos
  );

  let tipoDanoBase = objetoCompendio?.tipoDano || inferidos.tipoDano;
  if (configPactoFilo.activo && !esDistancia && configPactoFilo.tipoDano !== "propio") {
    const mapaTipos: Record<string, string> = {
      necrotico: "Necrótico",
      psiquico: "Psíquico",
      radiante: "Radiante"
    };
    tipoDanoBase = mapaTipos[configPactoFilo.tipoDano] || tipoDanoBase;
  }
  const tipoDanoCompleto = (tiposDanoSecundarios && tiposDanoSecundarios.length > 0)
    ? `${tipoDanoBase} / ${tiposDanoSecundarios.join(" / ")}`
    : tipoDanoBase;

  return {
    id: armaInst.idInstancia,
    nombre: armaInst.nombre,
    tipo: "Arma",
    subtipo: objetoCompendio?.tipoAtaque || (esDistancia ? "A Distancia" : "Cuerpo a Cuerpo"),
    tipoAccion: "accion",
    caracteristicaUsada: caracUsada,
    bonoAtaque,
    dadoDano: formulaDano,
    dadoDanoBase: dadoDanoTotalBase,
    modificadorDano: modDanoTotal,
    esDanoFijo: false,
    danoVersatil: formulaVersatil,
    dadoVersatilBase,
    tipoDano: tipoDanoCompleto,
    alcance: alcanceStr,
    propiedades,
    maestria:
      objetoCompendio?.maestria && personajeTieneMaestriaArma(personajeActivo, objetoCompendio.maestria)
        ? objetoCompendio.maestria
        : undefined,
    esMagico: esMagicoReal,
    tieneTiradaAtaque: true,
    requiereMunicion: estadoMunicion.requiereMunicion,
    municionNombre: estadoMunicion.nombreMunicionEsperada,
    municionCantidad: estadoMunicion.municionDisponibleCantidad,
    nombreContenedor: estadoMunicion.tieneContenedorEnInventario ? estadoMunicion.nombreContenedorDetectado : undefined,
    tieneContenedor: estadoMunicion.tieneContenedorEnInventario,
    municionEnContenedor: estadoMunicion.municionEnContenedor,
    municionSueltEnMochila: estadoMunicion.municionSueltEnMochila,
    municionEnCompartimentosExternos: estadoMunicion.municionEnCompartimentosExternos,
    puedeDisparar: estadoMunicion.puedeDisparar,
    motivoBloqueo: estadoMunicion.motivoBloqueo,
    esCompetenteConArma: esCompetenteArma,
    esSutil,
    esDistancia
  };
}

/**
 * Calcula el objeto de ataque para arma improvisada.
 */
export function calcularAtaqueImprovisado(contexto: {
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

  const compExtra = obtenerCompetenciasExtraRasgos(personajeActivo);
  const esCompetenteImprovisada =
    Boolean(compExtra.armasImprovisadas) ||
    esCompetenteConArma(
      "Armas improvisadas",
      "Improvisada",
      gruposArmasConsolidados,
      personajeActivo.competenciasArmasLista || []
    );

  const modificadores = statsCalculadas.modificadores;
  const caracImprovisada: Caracteristica = caracteristicasArmas["ataque-arma-improvisada"] || "fuerza";
  const modImprovisada = modificadores[caracImprovisada] || 0;
  const contextoImprovisada: ContextoAtaquePersonaje = {
    tipo: "improvisada",
    caracteristica: caracImprovisada,
    esCuerpoACuerpo: true,
    esDistancia: false
  };

  const { modDanoTotal, dadosExtra, danosSecundarios, tiposDanoSecundarios } = resolverBonosYDadosExtraCombate({
    personajeActivo,
    statsCalculadas,
    contextoAtaque: contextoImprovisada,
    caracUsada: caracImprovisada,
    modAtributo: modImprovisada,
    bonoMagico: 0,
    furiaEstaActiva,
    yaIncluyeFuriaEnEfectos
  });

  const bonoAtaqueImprovisada = (esCompetenteImprovisada ? statsCalculadas.bonoCompetencia : 0) + modImprovisada;
  const { dadoDanoTotalBase, formulaDano } = componerFormulasDano(
    "1d4",
    modDanoTotal,
    dadosExtra,
    danosSecundarios
  );

  const tipoDanoImprovisada = (tiposDanoSecundarios && tiposDanoSecundarios.length > 0)
    ? `Contundente / ${tiposDanoSecundarios.join(" / ")}`
    : "Contundente";

  return {
    id: "ataque-arma-improvisada",
    nombre: "Golpe con Arma Improvisada",
    tipo: "Arma",
    subtipo: "Cuerpo a Cuerpo / Arrojadiza",
    tipoAccion: "accion",
    caracteristicaUsada: caracImprovisada,
    bonoAtaque: bonoAtaqueImprovisada,
    dadoDano: formulaDano,
    dadoDanoBase: dadoDanoTotalBase,
    modificadorDano: modDanoTotal,
    esDanoFijo: false,
    tipoDano: tipoDanoImprovisada,
    alcance: "5 ft (20/60 ft arrojadiza)",
    propiedades: ["Improvisada", "Arrojadiza (20/60 ft)"],
    tieneTiradaAtaque: true,
    esCompetenteConArma: esCompetenteImprovisada,
    esSutil: false,
    esDistancia: false
  };
}

/**
 * Función principal que orquesta la generación de toda la lista de ataques físicos.
 */
export function generarListaAtaquesFisicos(
  params: ParametrosCalculoAtaquesFisicos
): AtaquePersonajeCalculado[] {
  const { personajeActivo, statsCalculadas, baseDatosObjetos, caracteristicasArmas } = params;
  if (!personajeActivo || !statsCalculadas) return [];

  const ataques: AtaquePersonajeCalculado[] = [];
  const inventario = personajeActivo.inventario || [];

  const furiaEstaActiva = Boolean(
    (personajeActivo.rasgos || []).some(
      (r) => (r.nombre.toLowerCase().trim() === "furia" || r.id.toLowerCase().trim() === "rasgo_cls_barbaro_furia") && r.activo
    ) ||
    (personajeActivo.condicionesActivas || []).some(
      (c) => c.toLowerCase().includes("furia (rage)") || (c.toLowerCase().includes("furia") && !c.toLowerCase().includes("furia de los dioses"))
    )
  );

  const efectosActivosRasgos = evaluarEfectosRasgosActivos(personajeActivo);
  const yaIncluyeFuriaEnEfectos = efectosActivosRasgos.some(
    (ef) => ef.tipo === "bono_dano_fuerza" && (String(ef.valor).toLowerCase().trim() === "dano_furia" || String(ef.descripcion).toLowerCase().includes("furia"))
  );

  const compExtraRasgos = obtenerCompetenciasExtraRasgos(personajeActivo);
  const gruposArmasConsolidados = Array.from(
    new Set([...(personajeActivo.competenciasArmasGrupos || []), ...compExtraRasgos.armasGrupos])
  );

  const contextoComun = {
    personajeActivo,
    statsCalculadas,
    caracteristicasArmas,
    gruposArmasConsolidados,
    furiaEstaActiva,
    yaIncluyeFuriaEnEfectos
  };

  // 1. Armas Equipadas
  const armasEquipadas = inventario.filter(
    (obj) => obj.equipado && obj.categoria === "armas"
  );

  for (const armaInst of armasEquipadas) {
    const ataqueArma = calcularAtaqueArmaEquipada(armaInst, {
      ...contextoComun,
      baseDatosObjetos
    });
    ataques.push(ataqueArma);
  }
  // 2. Golpe con Arma Improvisada
  const ataqueImprovisado = calcularAtaqueImprovisado(contextoComun);
  ataques.push(ataqueImprovisado);

  // 3. Ataque Desarmado
  const ataqueDesarmado = calcularAtaqueDesarmado(contextoComun);
  ataques.push(ataqueDesarmado);


  return ataques;
}
