/**
 * calculadorEstadisticasPersonaje.ts
 * ----------------------------------
 * Servicio de dominio puro y orquestador modular para el cálculo de estadísticas
 * derivadas de personajes de D&D 5.5e (2024).
 *
 * Totalmente desacoplado de la capa UI y del almacén Zustand.
 */

import type { ObjetoHomebrew, PersonajeJugador } from "@/tipos";
import { obtenerBonoCompetenciaPorNivel } from "@/constantes/personajeConstantes";
import { obtenerBestiaFormaActiva } from "@/servicios/reglasFormaSalvaje";
import {
  calcularBonoHPMaximoRasgos
} from "@/servicios/rasgos/evaluadorVitalidadRasgos";
import { calcularBonoVelocidadRasgos } from "@/servicios/rasgos/evaluadorMovilidadRasgos";
import {
  obtenerCompetenciasEfectivasTexto,
  obtenerCompetenciasExtraRasgos
} from "@/servicios/rasgos/evaluadorSalvacionesRasgos";
import {
  estaFuriaActiva,
  obtenerBonoDanoFuria,
  obtenerNivelClasePersonaje
} from "@/servicios/rasgos/utilidadesRasgos";
import {
  COMPETENCIAS_EXTRA_VACIAS,
  type CompetenciasEfectivasTexto,
  type EstadisticasCalculadasPersonaje,
  type InformacionCA,
  type PenalizacionArmadura
} from "./tiposEstadisticasPersonaje";
import {
  obtenerObjetosHomebrewFallback,
  resolverInventarioYEfectosPasivos
} from "./resolutorInventarioPasivos";
import { calcularCaracteristicasYModificadores } from "./calculadorCaracteristicas";
import { calcularTiradasSalvacion } from "./calculadorSalvaciones";
import { calcularHabilidadesYPasivas } from "./calculadorHabilidadesPasivas";
import {
  calcularClaseArmaduraYPenalizacion,
  extraerCaDePropiedades
} from "./calculadorClaseArmadura";

export {
  extraerCaDePropiedades,
  type InformacionCA,
  type PenalizacionArmadura,
  type CompetenciasEfectivasTexto,
  type EstadisticasCalculadasPersonaje
};

const cacheEstadisticasPersonaje = new WeakMap<
  PersonajeJugador,
  { catalogo: ObjetoHomebrew[]; valor: EstadisticasCalculadasPersonaje }
>();

/**
 * Función pura que calcula todas las estadísticas derivadas de un personaje
 * conforme a las reglas oficiales de D&D 5.5e.
 * Optimizado con caché referencial WeakMap O(1) e índice Map de inventario O(1).
 */
export function calcularEstadisticasPersonaje(
  pj: PersonajeJugador,
  homebrewsExternos?: ObjetoHomebrew[]
): EstadisticasCalculadasPersonaje {
  const homebrews = homebrewsExternos ?? obtenerObjetosHomebrewFallback();
  if (pj && typeof pj === "object") {
    const enCache = cacheEstadisticasPersonaje.get(pj);
    if (enCache?.catalogo === homebrews) {
      return enCache.valor;
    }
  }

  const nivel = pj?.nivel || 1;
  const bonoCompetencia = obtenerBonoCompetenciaPorNivel(nivel);
  const bestiaActiva = pj ? obtenerBestiaFormaActiva(pj) : null;
  const compExtraRasgos = pj ? obtenerCompetenciasExtraRasgos(pj) : COMPETENCIAS_EXTRA_VACIAS;

  // Etapa 1: Inventario efectivo y efectos pasivos activos en pasada única O(N)
  const contextoInventario = resolverInventarioYEfectosPasivos(pj, homebrews);

  // Etapa 2: Características efectivas y modificadores
  const { puntuacionesEfectivas, modificadores } = calcularCaracteristicasYModificadores(
    pj,
    bestiaActiva,
    contextoInventario.efectosPasivosActivos
  );

  // Etapa 3: Tiradas de salvación
  const salvaciones = calcularTiradasSalvacion(
    pj,
    bonoCompetencia,
    modificadores,
    compExtraRasgos,
    bestiaActiva,
    contextoInventario.efectosPasivosActivos
  );

  // Etapa 4: Habilidades, grados efectivos y puntuaciones pasivas
  const { habilidades, gradosHabilidadesEfectivos, pasivas } = calcularHabilidadesYPasivas(
    pj,
    bonoCompetencia,
    modificadores,
    compExtraRasgos,
    bestiaActiva,
    contextoInventario.efectosPasivosActivos
  );

  // Etapa 5: Clase de Armadura, desventaja en sigilo y penalización de competencia
  const { claseArmadura, penalizacionArmadura, desventajaSigiloArmadura } =
    calcularClaseArmaduraYPenalizacion(
      pj,
      modificadores,
      compExtraRasgos,
      bestiaActiva,
      contextoInventario
    );

  // Etapa 6: Métricas derivadas de combate y competencias textuales
  const nivelBarbaro = pj ? obtenerNivelClasePersonaje(pj, "Bárbaro") : 0;
  const furiaActiva = pj ? estaFuriaActiva(pj) : false;
  const bonoDanoFuria = furiaActiva && nivelBarbaro > 0 ? obtenerBonoDanoFuria(nivelBarbaro) : 0;
  const bonoVelocidadRasgos = pj ? calcularBonoVelocidadRasgos(pj) : 0;
  const bonoHPMaximoRasgos = pj ? calcularBonoHPMaximoRasgos(pj) : 0;
  const hpMaximoEfectivo = pj ? pj.hpMaximo || pj.hpMaximoBase || 10 : 10;
  const competenciasEfectivas = pj
    ? obtenerCompetenciasEfectivasTexto(pj)
    : {
        armasTexto: "Ninguna",
        armadurasTexto: "Ninguna",
        herramientasTexto: "Ninguna",
        herramientasLista: []
      };

  const resultado: EstadisticasCalculadasPersonaje = {
    bonoCompetencia,
    puntuacionesEfectivas,
    modificadores,
    salvaciones,
    habilidades,
    gradosHabilidadesEfectivos,
    pasivas,
    claseArmadura,
    penalizacionArmadura,
    desventajaSigiloArmadura,
    bonoVelocidadRasgos,
    bonoHPMaximoRasgos,
    hpMaximoEfectivo,
    bonoDanoFuria,
    competenciasEfectivas
  };

  if (pj && typeof pj === "object") {
    cacheEstadisticasPersonaje.set(pj, { catalogo: homebrews, valor: resultado });
  }

  return resultado;
}
