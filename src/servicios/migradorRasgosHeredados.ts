import type { EfectoMecanicoRasgo, RasgoPersonaje, SelectorRasgo } from "@/tipos";
import { obtenerMaxInvocacionesBrujo } from "@/constantes/invocacionesSobrenaturales";
import { normalizar } from "./rasgos/utilidadesRasgos";

// Compatibilidad al incorporar datos antiguos: las reglas de ejecución solo leen metadatos.
const CONDICIONES_HEREDADAS: Array<[RegExp, string]> = [
  [/furia de los dioses|furia_de_los_dioses/, "Furia de los Dioses"],
  [/^(furia|rasgo_cls_barbaro_furia)$/, "Furia"],
  [/temerario|reckless/, "Ataque Temerario"],
  [/manto de (la )?majestad|manto_de_majestad/, "Manto de Majestad"],
  [/majestad inquebrantable|majestad_inquebrantable/, "Majestad Inquebrantable"],
  [/vuelo draconico|vuelo_draconico/, "Vuelo dracónico"],
  [/afinidad con la piedra|afinidad_con_la_piedra|stonecunning/, "Afinidad con la piedra"],
  [/corona de luz|corona_de_luz/, "Corona de luz"]
];
const TIPOS_DANO_HEREDADOS: Array<[RegExp, string]> = [
  [/necrotic/, "Necrótico"], [/radiant/, "Radiante"], [/psiquic/, "Psíquico"],
  [/fuego/, "Fuego"], [/frio/, "Frío"], [/veneno/, "Veneno"], [/acido/, "Ácido"],
  [/fuerza/, "Fuerza"], [/relampag/, "Relámpago"], [/trueno/, "Trueno"],
  [/golpe divino/, "Radiante"], [/devorador de vida/, "Necrótico"]
];

function textoSeguro(valor: unknown): string {
  return typeof valor === "string" ? normalizar(valor) : "";
}

function migrarEfecto(efecto: EfectoMecanicoRasgo): EfectoMecanicoRasgo {
  if (!efecto || efecto.tipo !== "dano_secundario" || efecto.tipoDano !== undefined) return efecto;
  const descripcion = textoSeguro(efecto.descripcion);
  const tipoDano = TIPOS_DANO_HEREDADOS.find(([patron]) => patron.test(descripcion))?.[1];
  return tipoDano ? { ...efecto, tipoDano } : efecto;
}

function migrarSelector(selector: SelectorRasgo): SelectorRasgo {
  if (!selector || typeof selector !== "object" || (selector.opciones !== undefined && !Array.isArray(selector.opciones))) return selector;
  const id = textoSeguro(selector.id);
  const etiqueta = textoSeguro(selector.etiqueta);
  let tipoSelector = selector.tipoSelector;
  if (tipoSelector === undefined) {
    if (id.includes("invocacion") || etiqueta.includes("invocaci")) tipoSelector = "invocacion";
    else if (id.includes("dote") || etiqueta.includes("dote") || selector.opciones?.some((o) => textoSeguro(o?.id).startsWith("dote_"))) tipoSelector = "dote";
    else if (!id.startsWith("selector_aptitud") && (selector.esConjuroGratuito || /truco|cantrip|conjuro|hechizo|spell|ritual/.test(id))) tipoSelector = "conjuro";
    else tipoSelector = "general";
  }
  const listaHeredada = id.includes("conjuro_nv1") || id.includes("hechizo_nv1") ||
    (etiqueta.includes("nivel 1") && etiqueta.includes("conjuro"));
  let escaladoMaxSelecciones = selector.escaladoMaxSelecciones;
  if (selector.tipoSelector === undefined && tipoSelector === "invocacion" && !escaladoMaxSelecciones?.length) {
    escaladoMaxSelecciones = Array.from({ length: 20 }, (_, i) => ({
      nivelMinimo: i + 1, valor: obtenerMaxInvocacionesBrujo(i + 1)
    })).filter((entrada, i, tabla) => i === 0 || entrada.valor !== tabla[i - 1].valor);
  }
  return {
    ...selector,
    tipoSelector,
    visualizacion: selector.visualizacion ?? (listaHeredada ? "lista" : "normal"),
    escaladoMaxSelecciones,
    opciones: (selector.opciones || []).map((opcion) => opcion && typeof opcion === "object" ? {
      ...opcion,
      efectos: Array.isArray(opcion.efectos) ? opcion.efectos.map(migrarEfecto) : opcion.efectos,
      selectores: Array.isArray(opcion.selectores) ? opcion.selectores.map(migrarSelector) : opcion.selectores
    } : opcion)
  };
}

/** Completa campos ausentes de fichas y rasgos importados, conservando las declaraciones explícitas. */
export function migrarMetadatosRasgos(rasgos: RasgoPersonaje[]): RasgoPersonaje[] {
  return rasgos.map((rasgo) => {
    if (!rasgo || typeof rasgo !== "object" ||
      (rasgo.efectos !== undefined && !Array.isArray(rasgo.efectos)) ||
      (rasgo.selectores !== undefined && !Array.isArray(rasgo.selectores))) return rasgo;
    const nombre = textoSeguro(rasgo.nombre);
    const id = textoSeguro(rasgo.id);
    let ligadoA = rasgo.ligadoA;
    if (ligadoA === undefined) {
      const padreCanonico = /furia divina|furia_divina|frenesi|furia de los dioses|furia_de_los_dioses/.test(`${nombre} ${id}`)
        ? "furia"
        : /golpe brutal|golpe_brutal/.test(`${nombre} ${id}`) ? "ataque temerario" : undefined;
      if (padreCanonico) {
        ligadoA = rasgos.find((r) => textoSeguro(r.nombre) === padreCanonico)?.id ??
          `rasgo_cls_barbaro_${padreCanonico.replaceAll(" ", "_")}`;
      } else if ((rasgo.gastarDePadre || rasgo.heredarDadosPadre) && rasgo.fuente) {
        const candidatos = rasgos.filter((r) => r.id !== rasgo.id && r.tieneUsosLimitados && r.origen === rasgo.origen && r.fuente === rasgo.fuente);
        if (candidatos.length === 1) ligadoA = candidatos[0].id;
      }
    }
    const condicionAlActivar = rasgo.condicionAlActivar ??
      CONDICIONES_HEREDADAS.find(([patron]) => patron.test(nombre) || patron.test(id))?.[1];
    const efectos = (rasgo.efectos || []).map(migrarEfecto);
    if (/aprendiz de mucho|jack of all trades/.test(nombre) && !efectos.some((ef) => ef?.tipo === "medio_bono_habilidades")) {
      efectos.push({ tipo: "medio_bono_habilidades", objetivo: "habilidades_sin_competencia", valor: "mitad_competencia" });
    }
    return {
      ...rasgo,
      ligadoA,
      condicionAlActivar,
      efectos,
      selectores: rasgo.selectores?.map(migrarSelector)
    };
  });
}
