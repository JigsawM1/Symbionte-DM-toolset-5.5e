import type {
  PersonajeJugador,
  HechizoBase,
  HechizoVinculado,
  ObjetoJuego,
  TipoAccionConsumida,
  ConsumibleAccionCalculado
} from "@/tipos";
import { detectarInfoConsumible, esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { obtenerConjurosSubclasePersonaje } from "@/servicios/calculadorMagia";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
import { coincideHechizoId } from "@/servicios/comparadorHechizos";
import { generarIdSlug } from "@/utiles/generarId";
import { resolverOrigenConjuro } from "@/servicios/resolutorOrigenConjuros";
import { obtenerEspeciePorNombre, obtenerSubespeciePorNombre } from "@/servicios/gestorEspecies";

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
 * Resuelve y clasifica por economía de acciones los conjuros conocidos, preparados e innatos
 * (especie, subespecie, linaje, rasgos activos y subclase) del personaje.
 */
export function resolverConjurosAcciones(
  personajeActivo: PersonajeJugador | null,
  baseDatosConjuros: HechizoBase[]
): ConjuroAccionElemento[] {
  if (!personajeActivo) return [];

  const pjNivel = personajeActivo.nivel || 1;

  // 1. Recopilar candidatos directos de la ficha
  const candidatos = new Set<string>([
    ...(personajeActivo.trucosConocidosIds || []),
    ...(personajeActivo.conjurosSiemprePreparadosIds || []),
    ...(personajeActivo.conjurosPreparadosIds || []),
    ...(personajeActivo.conjurosConocidosIds || [])
  ]);

  // 2. Extraer conjuros otorgados por rasgos activos con nivel cumplido
  for (const r of personajeActivo.rasgos || []) {
    if (r.activo === false) continue;
    if (r.nivelRequerido && pjNivel < r.nivelRequerido) continue;

    if (Array.isArray(r.conjurosOtorgados)) {
      for (const c of r.conjurosOtorgados) {
        if (c && c.trim()) candidatos.add(c.trim());
      }
    }

    if (Array.isArray(r.selectores)) {
      for (const sel of r.selectores) {
        const idLower = sel.id.toLowerCase();
        if (
          idLower.includes("truco") ||
          idLower.includes("conjuro") ||
          idLower.includes("hechizo") ||
          idLower.includes("spell") ||
          idLower.includes("cantrip")
        ) {
          if (Array.isArray(sel.valorActual)) {
            for (const val of sel.valorActual) {
              if (val && val.trim()) candidatos.add(val.trim());
            }
          }
        }
      }
    }

    if (Array.isArray(r.efectos)) {
      for (const ef of r.efectos) {
        if (ef.tipo === "conjuro_otorgado") {
          const val = String(ef.valor || ef.objetivo || "").trim();
          if (val) candidatos.add(val);
        }
      }
    }

    const nomNorm = (r.nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (nomNorm.includes("palabras de creacion")) {
      candidatos.add("Palabra de poder: sanar");
      candidatos.add("Palabra de poder: matar");
    }
  }

  // 3. Extraer conjuros innatos de especie y subespecie por catálogo oficial D&D 5.5e
  if (personajeActivo.especie) {
    const espDef = obtenerEspeciePorNombre(personajeActivo.especie);
    if (espDef) {
      for (const ci of espDef.conjurosInnatos || []) {
        if (!ci.nivelRequerido || pjNivel >= ci.nivelRequerido) {
          if (ci.hechizoId) candidatos.add(ci.hechizoId);
          if (ci.nombreHechizo) candidatos.add(ci.nombreHechizo);
        }
      }
      if (personajeActivo.subespecie) {
        const subDef = obtenerSubespeciePorNombre(espDef.id, personajeActivo.subespecie);
        if (subDef) {
          for (const ci of subDef.conjurosInnatos || []) {
            if (!ci.nivelRequerido || pjNivel >= ci.nivelRequerido) {
              if (ci.hechizoId) candidatos.add(ci.hechizoId);
              if (ci.nombreHechizo) candidatos.add(ci.nombreHechizo);
            }
          }
        }
      }
    }
  }

  // 4. Extraer conjuros y trucos dinámicos de subclase
  const resSubclase = obtenerConjurosSubclasePersonaje(
    personajeActivo.clases,
    personajeActivo.clase,
    personajeActivo.subclase,
    personajeActivo.nivel
  );
  for (const c of resSubclase.conjuros) {
    if (c) candidatos.add(c);
  }
  for (const t of resSubclase.trucos) {
    if (t) candidatos.add(t);
  }

  // Índice rápido O(1) para búsqueda inicial de candidatos
  const setRapido = new Set<string>();
  const listaCandidatos = Array.from(candidatos);
  for (const cand of listaCandidatos) {
    const norm = cand.toLowerCase().trim();
    setRapido.add(norm);
    setRapido.add(norm.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    setRapido.add(generarIdSlug("h", cand));
  }

  const idsAgregados = new Set<string>();
  const resultado: ConjuroAccionElemento[] = [];

  for (const h of baseDatosConjuros) {
    if (idsAgregados.has(h.id)) continue;

    const tieneOrigen = resolverOrigenConjuro(personajeActivo, h) !== null;
    const esDeSubclase = verificarHechizoDeSubclase(h, personajeActivo);

    const hIdNorm = (h.id || "").toLowerCase().trim();
    const hNomNorm = (h.nombre || "").toLowerCase().trim();
    const hSinTildes = hNomNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const hSlug = generarIdSlug("h", h.nombre);

    const matchRapido =
      setRapido.has(hIdNorm) ||
      setRapido.has(hNomNorm) ||
      setRapido.has(hSinTildes) ||
      setRapido.has(hSlug);

    const coincideConCandidato =
      matchRapido ||
      listaCandidatos.some((c) => coincideHechizoId(c, h.id) || coincideHechizoId(c, h.nombre));

    if (tieneOrigen || esDeSubclase || coincideConCandidato) {
      idsAgregados.add(h.id);

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
    conjuros.some((cs: string) => normalizar(cs) === idNorm || normalizar(cs) === nomNorm || coincideHechizoId(cs, hechizo.id) || coincideHechizoId(cs, hechizo.nombre)) ||
    trucos.some((ts: string) => normalizar(ts) === idNorm || normalizar(ts) === nomNorm || coincideHechizoId(ts, hechizo.id) || coincideHechizoId(ts, hechizo.nombre))
  );
}
