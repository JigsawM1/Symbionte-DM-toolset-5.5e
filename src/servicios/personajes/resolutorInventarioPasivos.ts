/**
 * resolutorInventarioPasivos.ts
 * -----------------------------
 * Resolución pura del inventario efectivo (incluyendo Forma Salvaje),
 * indexación O(1) de objetos de compendio/homebrew y extracción de efectos
 * pasivos activos en una única pasada.
 *
 * Desacoplado del almacén Zustand mediante inversión de dependencias.
 */

import type {
  EfectoPasivo,
  ObjetoBase,
  ObjetoHomebrew,
  ObjetoInventario,
  PersonajeJugador
} from "@/tipos";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
import { inventarioEnFormaBestia } from "@/servicios/reglasFormaSalvaje";
import {
  normalizarTextoEstadistica,
  type ContextoInventarioResuelto
} from "./tiposEstadisticasPersonaje";

const CATALOGO_HOMEBREW_VACIO: ObjetoHomebrew[] = [];
let proveedorObjetosHomebrew: () => ObjetoHomebrew[] = () => CATALOGO_HOMEBREW_VACIO;

let cacheMapaObjetosRef: unknown = null;
let cacheMapaObjetos: Map<string, ObjetoHomebrew | ObjetoBase> | null = null;

/**
 * Registra el proveedor externo que resuelve objetos homebrew cuando no se inyecta
 * explícitamente un catálogo al calculador. Permite mantener este servicio puro y sin ciclos.
 */
export function registrarProveedorObjetosHomebrew(proveedor: () => ObjetoHomebrew[]): void {
  proveedorObjetosHomebrew = proveedor;
}

/** Obtiene el catálogo de objetos homebrew mediante el proveedor registrado. */
export function obtenerObjetosHomebrewFallback(): ObjetoHomebrew[] {
  return proveedorObjetosHomebrew();
}

/**
 * Construye (y memoriza por identidad referencial de `homebrews`) un índice O(1)
 * con prioridad de `homebrews` sobre `OBJETOS_INICIALES` por ID y por nombre normalizado.
 */
export function obtenerMapaObjetos(
  homebrews: ObjetoHomebrew[]
): Map<string, ObjetoHomebrew | ObjetoBase> {
  if (cacheMapaObjetosRef === homebrews && cacheMapaObjetos) {
    return cacheMapaObjetos;
  }

  cacheMapaObjetosRef = homebrews;
  const mapa = new Map<string, ObjetoHomebrew | ObjetoBase>();

  for (const obj of OBJETOS_INICIALES) {
    if (obj.id) mapa.set(obj.id, obj);
    if (obj.nombre) mapa.set(normalizarTextoEstadistica(obj.nombre), obj);
  }
  for (const obj of homebrews) {
    if (obj?.id) mapa.set(obj.id, obj);
    if (obj?.nombre) mapa.set(normalizarTextoEstadistica(obj.nombre), obj);
  }

  cacheMapaObjetos = mapa;
  return mapa;
}

/** Busca la definición base de un objeto de inventario en O(1) por ID o nombre normalizado. */
export function buscarObjetoCatalogo(
  mapaObjetos: ReadonlyMap<string, ObjetoHomebrew | ObjetoBase>,
  item: Pick<ObjetoInventario, "idObjeto" | "nombre">
): ObjetoHomebrew | ObjetoBase | undefined {
  if (item.idObjeto) {
    const porId = mapaObjetos.get(item.idObjeto);
    if (porId) return porId;
  }
  if (item.nombre) {
    return mapaObjetos.get(normalizarTextoEstadistica(item.nombre));
  }
  return undefined;
}

/**
 * Resuelve en una sola pasada el inventario efectivo del personaje, la armadura/escudo
 * equipados junto a sus plantillas base, los efectos pasivos activos y los bonificadores
 * directos de armadura/escudo.
 */
export function resolverInventarioYEfectosPasivos(
  pj: PersonajeJugador | null | undefined,
  homebrews: ObjetoHomebrew[]
): ContextoInventarioResuelto {
  const inventarioEfectivo = pj ? inventarioEnFormaBestia(pj) : [];
  const mapaObjetos = obtenerMapaObjetos(homebrews);
  const efectosPasivosActivos: EfectoPasivo[] = [];

  let bonosModificadorDirectoArmadura = 0;
  let armaduraEquipada: ObjetoInventario | undefined;
  let armaduraCatalogo: ObjetoHomebrew | ObjetoBase | undefined;
  let escudoEquipado: ObjetoInventario | undefined;
  let escudoCatalogo: ObjetoHomebrew | ObjetoBase | undefined;

  for (const item of inventarioEfectivo) {
    if (!item.equipado) continue;

    const objetoComp = buscarObjetoCatalogo(mapaObjetos, item);
    if (!armaduraEquipada && item.categoria === "armaduras") {
      armaduraEquipada = item;
      armaduraCatalogo = objetoComp;
    } else if (!escudoEquipado && item.categoria === "escudos") {
      escudoEquipado = item;
      escudoCatalogo = objetoComp;
    }

    if (item.sintonizacionRequerida && !item.sintonizado) continue;

    const efectosDirectos = item.efectosPasivos;
    const efectosComp = objetoComp?.efectosPasivos;
    const listaEfectos =
      Array.isArray(efectosDirectos) && efectosDirectos.length > 0 ? efectosDirectos : efectosComp;

    if (Array.isArray(listaEfectos) && listaEfectos.length > 0) {
      efectosPasivosActivos.push(...listaEfectos);
    }

    const modDirecto = item.modificadorAtaqueDano ?? objetoComp?.modificadorAtaqueDano;
    if (modDirecto && (item.categoria === "armaduras" || item.categoria === "escudos")) {
      bonosModificadorDirectoArmadura += Number(modDirecto) || 0;
    }
  }

  return {
    efectosPasivosActivos,
    bonosModificadorDirectoArmadura,
    armaduraEquipada,
    escudoEquipado,
    armaduraCatalogo,
    escudoCatalogo
  };
}
