/**
 * calculadorClaseArmadura.ts
 * --------------------------
 * Motor de Clase de Armadura (CA) de D&D 5.5e (2024), desventaja en sigilo,
 * ajustes de Forma Salvaje y validación de competencia de armadura y escudo.
 */

import type {
  Caracteristica, MonstruoBase, ObjetoBase, ObjetoHomebrew, ObjetoInventario, PersonajeJugador
} from "@/tipos";
import { ARMADURAS_OFICIALES } from "@/constantes/equipoConstantes";
import { esCompetenteConArmadura } from "@/constantes/competenciasConstantes";
import {
  calcularDefensaSinArmaduraRasgos, obtenerBonoCARasgos, obtenerLimiteDesArmaduraMedia
} from "@/servicios/rasgos/evaluadorVitalidadRasgos";
import { obtenerRasgoFormaBestia } from "@/servicios/reglasFormaSalvaje";
import {
  normalizarTextoEstadistica,
  type CompetenciasExtraRasgos, type ContextoInventarioResuelto,
  type InformacionCA, type PenalizacionArmadura, type ResultadoArmaduraYPenalizacion
} from "./tiposEstadisticasPersonaje";

const REGEX_CA_BONO_PRE = /CA\s*\+\s*(\d+)/i;
const REGEX_CA_BONO_POST = /\+\s*(\d+)\s*CA/i;
const REGEX_CA_FIJO = /CA\s*(\d+)/i;
const REGEX_BONO_MAGICO_NOMBRE = /\+(\d+)/;

const formatearSigno = (valor: number): string => (valor >= 0 ? `+${valor}` : `${valor}`);

function extraerBonoMagicoNombre(item: ObjetoInventario | undefined): number {
  if (!item?.esMagico || !item.nombre) return 0;
  const match = item.nombre.match(REGEX_BONO_MAGICO_NOMBRE);
  return match ? parseInt(match[1], 10) : 0;
}

function tieneDesventajaSigiloItem(
  item: ObjetoInventario | undefined,
  catalogo: ObjetoHomebrew | ObjetoBase | undefined,
  desventajaOficial = false
): boolean {
  if (!item) return false;
  const desventajaCat = Boolean(catalogo && "desventajaSigilo" in catalogo && catalogo.desventajaSigilo);
  if (desventajaOficial || item.desventajaSigilo || desventajaCat) return true;
  return Boolean(item.notas && normalizarTextoEstadistica(item.notas).includes("desventaja en sigilo"));
}

/** Extrae el bono o valor de CA de propiedades textuales (ej. "Escudo, CA +3", "+2 CA", "CA 15"). */
export function extraerCaDePropiedades(propiedades?: string | string[]): number | null {
  if (!propiedades) return null;
  const texto = Array.isArray(propiedades) ? propiedades.join(" ") : String(propiedades);
  const matchBono = texto.match(REGEX_CA_BONO_PRE) || texto.match(REGEX_CA_BONO_POST);
  if (matchBono) return parseInt(matchBono[1], 10);
  const matchFijo = texto.match(REGEX_CA_FIJO);
  return matchFijo ? parseInt(matchFijo[1], 10) : null;
}

function calcularModDesPorArmadura(
  pj: PersonajeJugador | null | undefined,
  tipoArmadura: InformacionCA["tipoArmadura"],
  modDestreza: number,
  limiteOficial?: number | null
): number {
  if (limiteOficial === 0 || (limiteOficial === undefined && tipoArmadura === "Pesada")) return 0;
  if (limiteOficial === 2 || (limiteOficial === undefined && tipoArmadura === "Mediana")) {
    const limiteDes = pj ? obtenerLimiteDesArmaduraMedia(pj) : 2;
    return Math.min(limiteDes, Math.max(0, modDestreza));
  }
  return modDestreza;
}

function resolverConArmadura(
  pj: PersonajeJugador | null | undefined,
  armaduraObj: ObjetoInventario,
  armaduraBase: ObjetoHomebrew | ObjetoBase | undefined,
  modDestreza: number,
  desglosePartes: string[]
): { caBase: number; modDesAplicado: number; tipoArmadura: InformacionCA["tipoArmadura"]; desventajaOficial: boolean } {
  const refOficial = ARMADURAS_OFICIALES[normalizarTextoEstadistica(armaduraObj.nombre)];
  let caBase: number;
  let tipoArmadura: InformacionCA["tipoArmadura"];

  if (refOficial) {
    caBase = refOficial.caBase;
    tipoArmadura = refOficial.tipo;
  } else {
    const caCat = armaduraBase && "caBase" in armaduraBase ? Number(armaduraBase.caBase) : undefined;
    caBase =
      armaduraObj.caBase ??
      (caCat !== undefined && !Number.isNaN(caCat) ? caCat : undefined) ??
      extraerCaDePropiedades(armaduraObj.propiedades) ??
      extraerCaDePropiedades(armaduraBase?.propiedades) ??
      11;
    const subcatNorm = normalizarTextoEstadistica(armaduraObj.subcategoria || armaduraBase?.subcategoria || "");
    const bonoDesNorm = normalizarTextoEstadistica(
      String(armaduraObj.bonoDestreza || (armaduraBase && "bonoDestreza" in armaduraBase ? armaduraBase.bonoDestreza : "") || "")
    );
    tipoArmadura =
      subcatNorm.includes("pesada") || bonoDesNorm.includes("sin")
        ? "Pesada"
        : subcatNorm.includes("mediana") || bonoDesNorm.includes("max") || bonoDesNorm.includes("2")
          ? "Mediana"
          : "Ligera";
  }

  const modDesAplicado = calcularModDesPorArmadura(pj, tipoArmadura, modDestreza, refOficial?.limiteDes);
  desglosePartes.push(`${armaduraObj.nombre} ${caBase}`);
  if (modDesAplicado !== 0) desglosePartes.push(`DES ${formatearSigno(modDesAplicado)}`);
  return { caBase, modDesAplicado, tipoArmadura, desventajaOficial: Boolean(refOficial?.desventajaSigilo) };
}

function resolverSinArmadura(
  pj: PersonajeJugador | null | undefined,
  modificadores: Record<Caracteristica, number>,
  tieneEscudo: boolean,
  desglosePartes: string[]
): number {
  let caBase = 10;
  const modDes = modificadores.destreza || 0;
  desglosePartes.push("Base 10");

  const defSinArmadura = pj ? calcularDefensaSinArmaduraRasgos(pj, modificadores) : null;
  if (defSinArmadura?.aplica) {
    const statNom = (defSinArmadura.caracteristicaExtra || "con").toUpperCase();
    desglosePartes.push(`DES ${formatearSigno(modDes)}`);
    if (defSinArmadura.bonoExtra !== 0) {
      desglosePartes.push(`${statNom} ${formatearSigno(defSinArmadura.bonoExtra)}`);
      caBase += defSinArmadura.bonoExtra;
    }
    return caBase;
  }

  const clasesPj = pj?.clases || [];
  const tieneClase = (objetivo: string): boolean =>
    pj?.clase === objetivo || clasesPj.some(({ nombre }) => nombre === objetivo);
  const statFallback: [string, number] | null = tieneClase("Bárbaro")
    ? ["CON", modificadores.constitucion || 0]
    : tieneClase("Monje") && !tieneEscudo
      ? ["SAB", modificadores.sabiduria || 0]
      : null;

  if (statFallback) {
    desglosePartes.push(`DES ${formatearSigno(modDes)}`);
    if (statFallback[1] !== 0) {
      desglosePartes.push(`${statFallback[0]} ${formatearSigno(statFallback[1])}`);
      caBase += statFallback[1];
    }
  } else if (modDes !== 0) {
    desglosePartes.push(`DES ${formatearSigno(modDes)}`);
  }
  return caBase;
}

function resolverEscudoYBonosMagicos(
  pj: PersonajeJugador | null | undefined,
  contextoInventario: ContextoInventarioResuelto,
  desglosePartes: string[]
): { bonoEscudo: number; escudoNombre: string | null; bonosMagicos: number } {
  const { armaduraEquipada, escudoEquipado, escudoCatalogo, efectosPasivosActivos, bonosModificadorDirectoArmadura } =
    contextoInventario;
  let bonoEscudo = 0;
  let escudoNombre: string | null = null;
  let bonoMagicoEscudoPorNombre = 0;

  if (escudoEquipado) {
    escudoNombre = escudoEquipado.nombre;
    const caCatEsc = escudoCatalogo && "caBase" in escudoCatalogo ? Number(escudoCatalogo.caBase) : undefined;
    bonoEscudo =
      escudoEquipado.caBase ??
      (caCatEsc !== undefined && !Number.isNaN(caCatEsc) ? caCatEsc : undefined) ??
      extraerCaDePropiedades(escudoEquipado.propiedades) ??
      extraerCaDePropiedades(escudoCatalogo?.propiedades) ??
      2;
    const bonoNombreEsc = extraerBonoMagicoNombre(escudoEquipado);
    if (bonoNombreEsc > 0 && !(bonoEscudo > 2 && bonoEscudo >= 2 + bonoNombreEsc)) {
      bonoMagicoEscudoPorNombre = bonoNombreEsc;
    }
    desglosePartes.push(`${escudoEquipado.nombre} +${bonoEscudo}`);
  }

  let bonosMagicos = 0;
  const agregarBono = (etiqueta: string, monto: number) => {
    bonosMagicos += monto;
    desglosePartes.push(`${etiqueta} +${monto}`);
  };
  const bonoNombreArm = extraerBonoMagicoNombre(armaduraEquipada);
  if (bonoNombreArm > 0) agregarBono("Magia", bonoNombreArm);
  if (bonoMagicoEscudoPorNombre > 0) agregarBono("Escudo Mágico", bonoMagicoEscudoPorNombre);

  let bonosPasivosCA = 0;
  for (const efecto of efectosPasivosActivos) {
    const tipoNorm = normalizarTextoEstadistica(efecto.tipo || "");
    if (tipoNorm === "ca" || tipoNorm === "defensa" || tipoNorm === "clase de armadura") {
      bonosPasivosCA += Number(efecto.valor) || (efecto.bono && !isNaN(Number(efecto.bono)) ? Number(efecto.bono) : 1);
    }
  }
  if (bonosPasivosCA > 0) agregarBono("Objetos Mágicos", bonosPasivosCA);

  const tieneBonoEnNombre =
    REGEX_BONO_MAGICO_NOMBRE.test(armaduraEquipada?.nombre || "") ||
    REGEX_BONO_MAGICO_NOMBRE.test(escudoEquipado?.nombre || "");
  if (bonosModificadorDirectoArmadura > 0 && !tieneBonoEnNombre) {
    agregarBono("Refuerzo Mágico", bonosModificadorDirectoArmadura);
  }

  const bonosCARasgos = pj ? obtenerBonoCARasgos(pj) : { bonoTotal: 0, fuentes: [] };
  if (bonosCARasgos.bonoTotal !== 0) {
    bonosMagicos += bonosCARasgos.bonoTotal;
    for (const f of bonosCARasgos.fuentes) desglosePartes.push(`${f.nombre} ${formatearSigno(f.valor)}`);
  }

  return { bonoEscudo, escudoNombre, bonosMagicos };
}

/** Calcula la Clase de Armadura, desventaja en sigilo y penalización por falta de competencia. */
export function calcularClaseArmaduraYPenalizacion(
  pj: PersonajeJugador | null | undefined,
  modificadores: Record<Caracteristica, number>,
  compExtraRasgos: CompetenciasExtraRasgos,
  bestiaActiva: MonstruoBase | null,
  contextoInventario: ContextoInventarioResuelto
): ResultadoArmaduraYPenalizacion {
  const { armaduraEquipada: armaduraObj, armaduraCatalogo: armaduraBase, escudoEquipado: escudoObj, escudoCatalogo: escudoBase } =
    contextoInventario;
  const desglosePartes: string[] = [];
  let modDesAplicado = modificadores.destreza || 0;
  let caBase = 10;
  let tipoArmadura: InformacionCA["tipoArmadura"] = "Sin Armadura";
  let armaduraNombre: string | null = null;
  let desventajaOficial = false;

  if (armaduraObj) {
    armaduraNombre = armaduraObj.nombre;
    ({ caBase, modDesAplicado, tipoArmadura, desventajaOficial } =
      resolverConArmadura(pj, armaduraObj, armaduraBase, modDesAplicado, desglosePartes));
  } else {
    caBase = resolverSinArmadura(pj, modificadores, Boolean(escudoObj), desglosePartes);
  }

  let { bonoEscudo, escudoNombre, bonosMagicos } = resolverEscudoYBonosMagicos(pj, contextoInventario, desglosePartes);
  let desventajaSigiloArmadura =
    tieneDesventajaSigiloItem(armaduraObj, armaduraBase, desventajaOficial) ||
    tieneDesventajaSigiloItem(escudoObj, escudoBase);
  let totalCA = caBase + modDesAplicado + bonoEscudo + bonosMagicos;
  const equipoConservado = pj?.formaSalvaje?.equipoConservadoIds;

  if (bestiaActiva && (!armaduraObj || !equipoConservado)) {
    const ajustes = pj && obtenerRasgoFormaBestia(pj)?.ajustesFormaBestia;
    const modSab = modificadores.sabiduria || 0;
    const caBestia = bestiaActiva.ca || 10;
    const caFinal = ajustes ? Math.max(caBestia, ajustes.baseCaSabiduria + modSab) : caBestia;
    totalCA = equipoConservado ? caFinal + bonoEscudo + bonosMagicos : caFinal;
    caBase = caFinal;
    modDesAplicado = 0;
    if (!equipoConservado) { bonoEscudo = 0; bonosMagicos = 0; escudoNombre = null; }
    armaduraNombre = null;
    tipoArmadura = "Sin Armadura";
    desventajaSigiloArmadura = false;
    desglosePartes.splice(
      0, desglosePartes.length,
      ...(ajustes && caFinal > caBestia
        ? [`Base de forma ${ajustes.baseCaSabiduria}`, `SAB ${formatearSigno(modSab)}`]
        : [`${bestiaActiva.nombre} (${caBestia})`])
    );
  }

  const claseArmadura: InformacionCA = {
    total: totalCA, base: caBase, modDestrezaAplicado: modDesAplicado, bonoEscudo, bonosMagicos,
    armaduraEquipadaNombre: armaduraNombre, escudoEquipadoNombre: escudoNombre, tipoArmadura,
    desglose: `CA ${totalCA} (${desglosePartes.join(" + ")})`, desventajaSigilo: desventajaSigiloArmadura
  };

  let armaduraNoCompetente: string | null = null;
  let escudoNoCompetente: string | null = null;
  if ((armaduraObj || escudoObj) && (!bestiaActiva || equipoConservado)) {
    const gruposArmadura = Array.from(new Set([...(pj?.competenciasArmadurasGrupos || []), ...compExtraRasgos.armadurasGrupos]));
    const listaArmaduras = pj?.competenciasArmadurasLista || [];
    const subcat = tipoArmadura !== "Sin Armadura" ? tipoArmadura : "Ligera";
    if (armaduraObj && !esCompetenteConArmadura(armaduraObj.nombre, subcat, gruposArmadura, listaArmaduras)) {
      armaduraNoCompetente = armaduraObj.nombre;
    }
    if (escudoObj && !esCompetenteConArmadura(escudoObj.nombre, "Escudo", gruposArmadura, listaArmaduras)) {
      escudoNoCompetente = escudoObj.nombre;
    }
  }

  const penalizacionArmadura: PenalizacionArmadura = {
    sinCompetencia: Boolean(armaduraNoCompetente || escudoNoCompetente),
    armaduraNoCompetente,
    escudoNoCompetente
  };
  return { claseArmadura, penalizacionArmadura, desventajaSigiloArmadura };
}
