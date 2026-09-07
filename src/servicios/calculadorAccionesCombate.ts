import type {
  PersonajeJugador,
  HechizoBase,
  HechizoVinculado,
  ObjetoJuego
} from "@/tipos";
import type { TipoAccionConsumida } from "@/componentes/caracteristicas/ataques/TarjetaAtaquePersonaje";
import type { ConsumibleAccionCalculado } from "@/componentes/caracteristicas/ataques/TarjetaConsumibleAccion.tipos";
import { detectarInfoConsumible, esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { obtenerConjurosSubclasePersonaje } from "@/servicios/calculadorMagia";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";

export interface HechizoObjetoMagicoAccion {
  objetoInstanciaId: string;
  objetoNombre: string;
  cargasActuales: number;
  cargasMaximas: number;
  hechizo: HechizoVinculado;
  tipoAccion: TipoAccionConsumida;
}

export interface ConjuroAccionElemento {
  hechizo: HechizoBase;
  tipoAccion: TipoAccionConsumida;
}

const normalizar = (s: string): string => s.toLowerCase().trim();

/**
 * Resuelve y clasifica por economía de acciones los conjuros conocidos y preparados del personaje.
 */
export function resolverConjurosAcciones(
  personajeActivo: PersonajeJugador | null,
  baseDatosConjuros: HechizoBase[]
): ConjuroAccionElemento[] {
  if (!personajeActivo) return [];

  const listaIds = [
    ...(personajeActivo.trucosConocidosIds || []),
    ...(personajeActivo.conjurosSiemprePreparadosIds || []),
    ...(personajeActivo.conjurosPreparadosIds || []),
    ...(personajeActivo.conjurosConocidosIds || [])
  ];

  const idsUnicos = Array.from(new Set(listaIds));
  const resultado: ConjuroAccionElemento[] = [];

  for (const id of idsUnicos) {
    const h = baseDatosConjuros.find(
      (c: HechizoBase) => c.id === id || normalizar(c.nombre) === normalizar(id)
    );
    if (h) {
      const tiempo = (h.tiempoLanzamiento || "").toLowerCase();
      let tipoAccion: TipoAccionConsumida = "accion";
      if (tiempo.includes("adicional") || tiempo.includes("bonus")) {
        tipoAccion = "accionAdicional";
      } else if (tiempo.includes("reacci")) {
        tipoAccion = "reaccion";
      }

      resultado.push({ hechizo: h, tipoAccion });
    }
  }

  resultado.sort((a, b) => a.hechizo.nivel - b.hechizo.nivel || a.hechizo.nombre.localeCompare(b.hechizo.nombre, "es"));
  return resultado;
}

/**
 * Resuelve la lista de consumibles disponibles en el inventario para uso en combate.
 */
export function resolverConsumiblesCombate(
  personajeActivo: PersonajeJugador | null
): ConsumibleAccionCalculado[] {
  if (!personajeActivo) return [];
  const inventario = personajeActivo.inventario || [];
  const resultado: ConsumibleAccionCalculado[] = [];

  for (const obj of inventario) {
    const esConsumible = esObjetoConsumible(obj.nombre, obj.notas);

    if (esConsumible && obj.cantidad > 0) {
      const info = detectarInfoConsumible(obj.nombre, obj.notas);
      resultado.push({
        idInstancia: obj.idInstancia,
        nombre: obj.nombre,
        cantidad: obj.cantidad,
        tipoAccion: info.esAccionAdicional ? "accionAdicional" : "accion",
        esPocion: info.esPocion,
        esCurativo: info.esCurativo,
        formulaCuracion: info.formulaCuracion,
        descripcionUso: info.descripcionUso,
        notas: obj.notas
      });
    }
  }

  return resultado;
}

/**
 * Resuelve hechizos vinculados a objetos mágicos equipados y sintonizados con control de cargas.
 */
export function resolverHechizosObjetosMagicos(
  personajeActivo: PersonajeJugador | null,
  objetosHomebrew: ObjetoJuego[]
): HechizoObjetoMagicoAccion[] {
  if (!personajeActivo) return [];
  const inventario = personajeActivo.inventario || [];
  const lista: HechizoObjetoMagicoAccion[] = [];

  for (const obj of inventario) {
    if (!obj.equipado) continue;
    if (obj.sintonizacionRequerida && !obj.sintonizado) continue;

    const objComp =
      objetosHomebrew.find((b) => b.id === obj.idObjeto || normalizar(b.nombre) === normalizar(obj.nombre)) ||
      OBJETOS_INICIALES.find((b) => b.id === obj.idObjeto || normalizar(b.nombre) === normalizar(obj.nombre));

    const hechizos = (obj as Record<string, unknown>).hechizosVinculados || objComp?.hechizosVinculados;
    if (hechizos && Array.isArray(hechizos)) {
      const cMax = obj.cargasMaximas ?? ((objComp as Record<string, unknown>)?.cargasMaximas as number | undefined) ?? 0;
      const cAct = obj.cargasActuales ?? cMax;
      for (const h of hechizos as HechizoVinculado[]) {
        let tipoAccion: TipoAccionConsumida = "accion";
        const hTipoAccion = (h as Record<string, unknown>).tipoAccion as string | undefined;
        const taNorm = normalizar(hTipoAccion || "");
        if (taNorm.includes("adicional") || taNorm.includes("bonus")) tipoAccion = "accionAdicional";
        else if (taNorm.includes("reaccion") || taNorm.includes("reacción")) tipoAccion = "reaccion";

        lista.push({
          objetoInstanciaId: obj.idInstancia,
          objetoNombre: obj.nombre,
          cargasActuales: cAct,
          cargasMaximas: cMax,
          hechizo: h,
          tipoAccion
        });
      }
    }
  }
  return lista;
}

/**
 * Determina si un conjuro específico proviene de la subclase del personaje.
 */
export function verificarHechizoDeSubclase(
  hechizo: HechizoBase,
  personajeActivo: PersonajeJugador | null
): boolean {
  if (!personajeActivo) return false;
  const { conjuros, trucos } = obtenerConjurosSubclasePersonaje(
    personajeActivo.clases,
    personajeActivo.clase,
    personajeActivo.subclase,
    personajeActivo.nivel
  );
  const idNorm = normalizar(hechizo.id);
  const nomNorm = normalizar(hechizo.nombre);
  return (
    conjuros.some((cs: string) => normalizar(cs) === idNorm || normalizar(cs) === nomNorm) ||
    trucos.some((ts: string) => normalizar(ts) === idNorm || normalizar(ts) === nomNorm)
  );
}
