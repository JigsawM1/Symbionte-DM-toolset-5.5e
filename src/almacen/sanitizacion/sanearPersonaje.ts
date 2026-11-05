import { EsquemaPersonajeJugador, type PersonajeJugador } from "@/tipos";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { resolverGruposYSustitutosCompetencias } from "@/constantes/competenciasConstantes";
import { resolverCategoriaDesdeSRD, CATEGORIAS_EQUIPO } from "@/constantes/categoriasEquipoConstantes";
import { generarId } from "@/utiles/generarId";
import { logger } from "@/utiles/logger";
import { migrarMetadatosRasgos } from "@/servicios/migradorRasgosHeredados";
import { aplanarValor } from "./comun";

/**
 * Sanea y valida un objeto de personaje garantizando que cumpla con el esquema
 * estricto de D&D 5.5e y rellenando propiedades faltantes de versiones anteriores.
 */
export function sanearPersonaje(p: unknown): PersonajeJugador {
  if (!p || typeof p !== "object") {
    return {
      ...PERSONAJE_POR_DEFECTO,
      id: generarId("pj")
    };
  }

  const raw = p as Record<string, unknown>;
  const rawHPMaximo = typeof raw.hpMaximo === "number" && raw.hpMaximo > 0 ? raw.hpMaximo : undefined;
  const rawHPMaximoBase = typeof raw.hpMaximoBase === "number" && raw.hpMaximoBase > 0 ? raw.hpMaximoBase : undefined;
  const hpBaseNormalizado = rawHPMaximoBase ?? rawHPMaximo ?? PERSONAJE_POR_DEFECTO.hpMaximoBase ?? 10;
  const hpMaxNormalizado = rawHPMaximo ?? rawHPMaximoBase ?? PERSONAJE_POR_DEFECTO.hpMaximo ?? 10;

  // Fusionamos con los valores por defecto de primer y segundo nivel
  const fusionado: Record<string, unknown> = {
    ...PERSONAJE_POR_DEFECTO,
    ...raw,
    hpMaximoBase: hpBaseNormalizado,
    hpMaximo: hpMaxNormalizado,
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : generarId("pj"),
    nombre: typeof raw.nombre === "string" && raw.nombre.trim() ? raw.nombre.trim() : "Nuevo Personaje",
    caracteristicas: {
      ...PERSONAJE_POR_DEFECTO.caracteristicas,
      ...(typeof raw.caracteristicas === "object" && raw.caracteristicas ? (raw.caracteristicas as Record<string, number>) : {})
    },
    overridesFijos: {
      ...PERSONAJE_POR_DEFECTO.overridesFijos,
      ...(typeof raw.overridesFijos === "object" && raw.overridesFijos ? (raw.overridesFijos as Record<string, number | null>) : {})
    },
    competenciasSalvacion: {
      ...PERSONAJE_POR_DEFECTO.competenciasSalvacion,
      ...(typeof raw.competenciasSalvacion === "object" && raw.competenciasSalvacion ? (raw.competenciasSalvacion as Record<string, boolean>) : {})
    },
    gradosHabilidades: {
      ...PERSONAJE_POR_DEFECTO.gradosHabilidades,
      ...(typeof raw.gradosHabilidades === "object" && raw.gradosHabilidades ? (raw.gradosHabilidades as Record<string, unknown>) : {})
    },
    salvacionesMuerte: {
      ...PERSONAJE_POR_DEFECTO.salvacionesMuerte,
      ...(typeof raw.salvacionesMuerte === "object" && raw.salvacionesMuerte ? (raw.salvacionesMuerte as Record<string, number>) : {})
    },
    bolsaMonedas: {
      ...PERSONAJE_POR_DEFECTO.bolsaMonedas,
      ...(typeof raw.bolsaMonedas === "object" && raw.bolsaMonedas ? (raw.bolsaMonedas as Record<string, number>) : {})
    },
    clases: Array.isArray(raw.clases) && raw.clases.length > 0
      ? raw.clases.filter(
          (c: unknown, idx: number, self: unknown[]) =>
            c &&
            typeof c === "object" &&
            self.findIndex(
              (otro: unknown) =>
                otro &&
                typeof otro === "object" &&
                (otro as Record<string, unknown>).nombre === (c as Record<string, unknown>).nombre
            ) === idx
        )
      : [{ nombre: (typeof raw.clase === "string" && raw.clase) || "Guerrero", subclase: (typeof raw.subclase === "string" && raw.subclase) || "", nivel: (typeof raw.nivel === "number" && raw.nivel) || 1 }],
    inventario: Array.isArray(raw.inventario)
      ? raw.inventario
          .map((item: unknown) => {
            if (!item || typeof item !== "object") return null;
            const o = item as Record<string, unknown>;
            const res = resolverCategoriaDesdeSRD(o);
            const categoria =
              typeof o.categoria === "string" && (CATEGORIAS_EQUIPO as readonly string[]).includes(o.categoria)
                ? o.categoria
                : res.categoria;
            const esConsumible = o.esConsumible !== undefined ? Boolean(o.esConsumible) : res.esConsumible;
            return {
              ...o,
              categoria,
              esConsumible,
              subcategoria: aplanarValor(o.subcategoria || "")
            };
          })
          .filter(Boolean)
      : [],
    trucosConocidosIds: Array.isArray(raw.trucosConocidosIds) ? raw.trucosConocidosIds : [],
    conjurosConocidosIds: Array.isArray(raw.conjurosConocidosIds) ? raw.conjurosConocidosIds : [],
    conjurosPreparadosIds: Array.isArray(raw.conjurosPreparadosIds) ? raw.conjurosPreparadosIds : [],
    conjurosSiemprePreparadosIds: Array.isArray(raw.conjurosSiemprePreparadosIds) ? raw.conjurosSiemprePreparadosIds : [],
    rasgos: Array.isArray(raw.rasgos)
      ? raw.rasgos
          .filter((r: unknown): r is Record<string, unknown> => {
            if (!r || typeof r !== "object") return false;
            const obj = r as Record<string, unknown>;
            const nom = typeof obj.nombre === "string" ? obj.nombre.toLowerCase().trim() : "";
            return nom !== "rasgo de subclase" && !nom.includes("rasgo de subclase");
          })
          .filter((r: Record<string, unknown>, idx: number, self: Record<string, unknown>[]) => {
            const idVal = typeof r.id === "string" && r.id ? r.id : `${r.nombre}_${r.nivelRequerido || 0}`;
            return (
              self.findIndex(
                (item) => (typeof item.id === "string" && item.id ? item.id : `${item.nombre}_${item.nivelRequerido || 0}`) === idVal
              ) === idx
            );
          })
          .map((r: Record<string, unknown>) => {
            const esActivable = Boolean(r.esActivable);
            const nomL = typeof r.nombre === "string" ? r.nombre.toLowerCase().trim() : "";
            const idL = typeof r.id === "string" ? r.id.toLowerCase().trim() : "";
            const esRevelacion = nomL.includes("revelacion celestial") || idL.includes("revelacion_celestial");
            const efectos: Record<string, unknown>[] = Array.isArray(r.efectos)
              ? [...(r.efectos as Record<string, unknown>[])]
              : [];
            if (esRevelacion && (!efectos.some((e) => e.tipo === "bono_dano_conjuro") || efectos.length === 0)) {
              const tieneAtaque = efectos.some((e) => e.tipo === "bono_dano_ataque");
              if (!tieneAtaque) {
                efectos.push({
                  tipo: "bono_dano_ataque",
                  objetivo: "todos_ataques",
                  valor: "bono_competencia",
                  aplicaA: "todos_ataques",
                  descripcion: "Revelación celestial (+PB daño en ataques)"
                });
              }
              efectos.push({
                tipo: "bono_dano_conjuro",
                objetivo: "todos_conjuros",
                valor: "bono_competencia",
                aplicaA: "todos_conjuros",
                descripcion: "Revelación celestial (+PB daño en conjuros)"
              });
            }
            const origL = typeof r.origen === "string" ? r.origen.toLowerCase().trim() : "";
            const ORIGENES_VALIDOS = ["especie", "subespecie", "clase", "subclase", "dote", "trasfondo", "personalizado"];
            const origenValido = ORIGENES_VALIDOS.includes(origL)
              ? origL
              : (origL === "raza" || origL === "subraza" ? (origL === "raza" ? "especie" : "subespecie") : "personalizado");

            return {
              ...r,
              origen: origenValido,
              esActivable,
              activo: typeof r.activo === "boolean" ? r.activo : (esActivable ? false : true),
              efectos
            };
          })
      : [],
    dotes: Array.isArray(raw.dotes) ? raw.dotes : [],
    conjurosOcultos: (() => {
      if (Array.isArray(raw.conjurosOcultos)) {
        return Array.from(new Set(raw.conjurosOcultos.filter((id): id is string => typeof id === "string" && id.trim().length > 0)));
      }
      const storage = typeof localStorage !== "undefined" ? localStorage : (typeof window !== "undefined" ? window.localStorage : undefined);
      if (raw.conjurosOcultos === undefined && typeof raw.id === "string" && storage) {
        try {
          const item = storage.getItem(`ts_conjuros_ocultos_${raw.id}`);
          if (item) {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed)) {
              return Array.from(new Set(parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0)));
            }
          }
        } catch (e) {
          logger.debug("[sanearPersonaje] Error al leer caché antigua de conjuros ocultos:", e);
        }
      }
      return [];
    })()
  };

  // Normalizar y enriquecer competencias de equipo si vienen crudas o vacías
  const rawArmasGrupos = Array.isArray(raw.competenciasArmasGrupos) ? (raw.competenciasArmasGrupos as string[]) : [];
  const rawArmasTexto = typeof raw.competenciasArmas === "string" ? raw.competenciasArmas.split(",") : [];
  const rawArmadurasGrupos = Array.isArray(raw.competenciasArmadurasGrupos) ? (raw.competenciasArmadurasGrupos as string[]) : [];
  const rawArmadurasTexto = typeof raw.competenciasArmaduras === "string" ? raw.competenciasArmaduras.split(",") : [];

  const necesitaSaneamientoComp =
    rawArmasGrupos.some((g) => g.includes(" ")) ||
    rawArmadurasGrupos.some((g) => g.includes(" ")) ||
    ((!Array.isArray(raw.competenciasArmasLista) || raw.competenciasArmasLista.length === 0) && (rawArmasGrupos.length > 0 || rawArmasTexto.length > 0));

  if (necesitaSaneamientoComp) {
    const resComp = resolverGruposYSustitutosCompetencias(
      [...rawArmasGrupos, ...rawArmasTexto],
      [...rawArmadurasGrupos, ...rawArmadurasTexto]
    );
    fusionado.competenciasArmasGrupos = resComp.competenciasArmasGrupos;
    fusionado.competenciasArmasLista = Array.isArray(raw.competenciasArmasLista) && (raw.competenciasArmasLista as string[]).length > 0
      ? Array.from(new Set([...(raw.competenciasArmasLista as string[]), ...resComp.competenciasArmasLista]))
      : resComp.competenciasArmasLista;
    fusionado.competenciasArmas = resComp.competenciasArmas;

    fusionado.competenciasArmadurasGrupos = resComp.competenciasArmadurasGrupos;
    fusionado.competenciasArmadurasLista = Array.isArray(raw.competenciasArmadurasLista) && (raw.competenciasArmadurasLista as string[]).length > 0
      ? Array.from(new Set([...(raw.competenciasArmadurasLista as string[]), ...resComp.competenciasArmadurasLista]))
      : resComp.competenciasArmadurasLista;
    fusionado.competenciasArmaduras = resComp.competenciasArmaduras;
  }

  // Migrar antes de Zod para distinguir campos ausentes de valores declarados explícitamente.
  fusionado.rasgos = migrarMetadatosRasgos(fusionado.rasgos as PersonajeJugador["rasgos"]);
  const resultado = EsquemaPersonajeJugador.safeParse(fusionado);
  if (resultado.success) {
    const pjValido = resultado.data;
    pjValido.hpActual = Math.min(pjValido.hpActual, pjValido.hpMaximo);
    return pjValido;
  }

  // La capa de carga conserva el original rechazado; ningún dato inválido entra al estado activo.
  logger.warn(
    `[sanearPersonaje] Advertencia de validación Zod en personaje "${fusionado.nombre}" (${fusionado.id}):`,
    resultado.error.issues
  );
  throw new Error(`Ficha inválida: ${resultado.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`, { cause: resultado.error });
}
