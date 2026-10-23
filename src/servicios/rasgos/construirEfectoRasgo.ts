import type { EfectoMecanicoRasgo, TipoEfectoMecanico } from "@/tipos";

export interface BorradorEfectoRasgo {
  nuevoTipoEfecto: TipoEfectoMecanico;
  nuevoObjetivo: string;
  nuevoValor: string;
  nuevoTipoDano: string;
  nuevoAplicaA: string;
  nuevoLimiteMaximo: number;
  nuevoPermiteEscudo: boolean;
  nuevaDescripcionEfecto: string;
  nuevoCondicion: string;
}

const MAPA_DESCRIPCION_APLICA_A: Record<string, string> = {
  arma_pesada: "Armas Pesadas",
  arma_arrojadiza: "Armas Arrojadizas",
  arma_duelo: "Armas a Una Mano"
};

const MAPA_HP_TEMPORAL: Record<string, string> = {
  bono_competencia: "Otorga puntos de golpe temporales iguales al bono de competencia",
  pb: "Otorga puntos de golpe temporales iguales al bono de competencia",
  bc: "Otorga puntos de golpe temporales iguales al bono de competencia",
  nivel: "Otorga puntos de golpe temporales iguales al nivel del personaje",
  constitucion: "Otorga puntos de golpe temporales iguales al modificador de Constitución",
  con: "Otorga puntos de golpe temporales iguales al modificador de Constitución",
  "2_veces_dado_inspiracion": "Puntos de golpe temporales iguales al doble del dado de inspiración"
};

const GENERADORES_DESCRIPCION: Partial<
  Record<TipoEfectoMecanico, (d: BorradorEfectoRasgo, etiqueta?: string) => string>
> = {
  dado_extra_dano: (d) => `+${d.nuevoValor} al daño (${d.nuevoAplicaA})`,
  dano_secundario: (d) => `/${d.nuevoValor} [${d.nuevoTipoDano}]`,
  bono_ataque: (d) => `+${d.nuevoValor} a tiradas de ataque (${d.nuevoAplicaA})`,
  bono_dano_ataque: (d) =>
    MAPA_DESCRIPCION_APLICA_A[d.nuevoAplicaA]
      ? `+${d.nuevoValor} al daño (${MAPA_DESCRIPCION_APLICA_A[d.nuevoAplicaA]})`
      : `+${d.nuevoValor} al daño físico`,
  bono_dano_fuerza: (d) =>
    MAPA_DESCRIPCION_APLICA_A[d.nuevoAplicaA]
      ? `+${d.nuevoValor} al daño (${MAPA_DESCRIPCION_APLICA_A[d.nuevoAplicaA]})`
      : `+${d.nuevoValor} al daño físico`,
  bono_dano_conjuro: (d) => `+${d.nuevoValor} al daño mágico (${d.nuevoAplicaA})`,
  modificador_ca: (d) =>
    d.nuevoObjetivo === "defensa_sin_armadura"
      ? `Defensa sin armadura (${d.nuevoValor})`
      : `+${d.nuevoValor} a la CA (${d.nuevoCondicion === "con_armadura" ? "con armadura" : d.nuevoCondicion || "incondicional"})`,
  modificador_stat: (d) => `+${d.nuevoValor} a ${d.nuevoObjetivo} (Límite ${d.nuevoLimiteMaximo})`,
  modificador_velocidad: (d) => `+${d.nuevoValor} pies de velocidad`,
  movimiento_especial: (d) => {
    const esIgual = d.nuevoValor === "caminar" || d.nuevoValor === "velocidad_caminar";
    const tipo =
      d.nuevoObjetivo.includes("escalar") || d.nuevoObjetivo.includes("trepar")
        ? "trepando"
        : d.nuevoObjetivo.includes("nadar")
        ? "de nado"
        : "volando";
    return esIgual ? `Velocidad ${tipo} igual a tu velocidad` : `Velocidad ${tipo}: ${d.nuevoValor} pies`;
  },
  ventaja: (d, etiq) => (etiq ? `Ventaja: ${etiq}` : `Ventaja en ${d.nuevoObjetivo}`),
  bono_salvacion: (d) => `+${d.nuevoValor} a salvación de ${d.nuevoObjetivo}`,
  habilidad_con_fuerza: (d) => `Usar Fuerza en ${d.nuevoValor}`,
  medio_bono_habilidades: () => "Medio bono de competencia a habilidades sin competencia",
  ataque_desarmado: (d) => `Ataque sin armas con ${d.nuevoObjetivo} (${d.nuevoValor})`,
  conjuro_otorgado: (d) => `Conjuro otorgado: ${d.nuevoValor}`,
  conjuro_gratuito: (d) => `Lanzamiento gratuito: ${d.nuevoValor}`,
  modificador_capacidad_carga: (d) => `Capacidad de carga ×${d.nuevoValor}`,
  modificador_tamano: (d) => `Tamaño modificado a ${d.nuevoValor}`,
  hp_temporal: (d) =>
    MAPA_HP_TEMPORAL[d.nuevoValor.trim().toLowerCase()] || `Puntos de golpe temporales: ${d.nuevoValor}`,
  modificador_hp_maximo: (d) => `Modificador de HP Máximo: ${d.nuevoValor}`,
  restaurar_recurso: (d) => {
    const objNorm = d.nuevoObjetivo.trim().toLowerCase();
    if (objNorm === "inspiracion" || objNorm === "inspiracion_heroica" || objNorm.includes("inspiracion")) {
      const condTexto = d.nuevoCondicion.includes("corto") ? "un descanso corto" : "un descanso largo";
      return `Recupera Inspiración Heroica tras finalizar ${condTexto}`;
    }
    return `Restaurar ${d.nuevoValor} uso(s) de ${d.nuevoObjetivo}${d.nuevoCondicion ? ` (${d.nuevoCondicion})` : ""}`;
  },
  competencia: (d) => `Competencia con ${d.nuevoObjetivo}`,
  limite_des_armadura_media: (d) => `Límite de Destreza en armadura media: ${d.nuevoValor}`,
  dado_extra_critico: (d) => `+${d.nuevoValor} dado extra en crítico (${d.nuevoAplicaA || d.nuevoObjetivo})`
};

export function construirEfectoRasgo(
  datos: BorradorEfectoRasgo,
  id: string,
  etiquetaObjetivo?: string
): EfectoMecanicoRasgo {
  const {
    nuevoTipoEfecto,
    nuevoObjetivo,
    nuevoValor,
    nuevoTipoDano,
    nuevoAplicaA,
    nuevoLimiteMaximo,
    nuevoPermiteEscudo,
    nuevaDescripcionEfecto,
    nuevoCondicion
  } = datos;

  let descFinal = nuevaDescripcionEfecto.trim();
  if (!descFinal) {
    descFinal =
      GENERADORES_DESCRIPCION[nuevoTipoEfecto]?.(datos, etiquetaObjetivo) ||
      `${nuevoTipoEfecto}: ${nuevoValor}`;
  }

  const nuevoEfecto: EfectoMecanicoRasgo = {
    id,
    tipo: nuevoTipoEfecto,
    objetivo: nuevoTipoEfecto === "conjuro_gratuito" ? nuevoValor.trim() : nuevoObjetivo.trim() || "general",
    valor: nuevoValor.trim(),
    condicion: nuevoCondicion.trim() || undefined,
    tipoDano: nuevoTipoEfecto === "dano_secundario" ? nuevoTipoDano.trim() || "Radiante" : undefined,
    aplicaA: nuevoAplicaA,
    limiteMaximo: nuevoTipoEfecto === "modificador_stat" ? nuevoLimiteMaximo : undefined,
    permiteEscudo: nuevoTipoEfecto === "modificador_ca" ? nuevoPermiteEscudo : undefined,
    descripcion: descFinal,
    activo: true
  };

  return nuevoEfecto;
}
