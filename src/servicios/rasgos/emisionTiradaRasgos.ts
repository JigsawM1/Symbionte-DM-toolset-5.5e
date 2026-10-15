import type { PersonajeJugador, AtaquePersonajeCalculado } from "@/tipos";
import { evaluarEfectosRasgosActivos, cumpleCondicionEfecto } from "./evaluadorExpresionesRasgos";
import { aplicaEfectoAAtaque, type ContextoAtaquePersonaje } from "./evaluadorCombateRasgos";
import { resolverExtensionesRasgos } from "./extensionesRasgos";

const pendientes = new Set<string>();

/** Una tirada de daño ajena al ámbito del efecto conserva su activación pendiente. */
export function emitirTiradaDanoConRasgos(personaje: PersonajeJugador, ataque: AtaquePersonajeCalculado,
  emitir: () => Promise<boolean>, desactivar: (id: string) => void): Promise<boolean> {
  const contexto: ContextoAtaquePersonaje = {
    tipo: ataque.tipo === "Desarmado" ? "desarmado" : ataque.tipo === "Conjuro" ? "conjuro" : "arma",
    caracteristica: ataque.caracteristicaUsada, esDistancia: !!ataque.esDistancia, esCuerpoACuerpo: !ataque.esDistancia,
    propiedades: ataque.propiedades
  };
  const efectivos = resolverExtensionesRasgos(personaje.rasgos, personaje.nivel);
  return emitirTiradaConRasgos(personaje, "dano", emitir, id => {
    const efectos = efectivos.find(r => r.id === id)?.efectos?.filter(e => ["dado_extra_dano", "dano_secundario", "bono_dano_ataque", "bono_dano_fuerza"].includes(e.tipo)) ?? [];
    if (!efectos.length || efectos.some(e => e.activo !== false && cumpleCondicionEfecto(e.condicion, personaje)
      && aplicaEfectoAAtaque(e.aplicaA, e.objetivo, contexto))) desactivar(id);
  });
}

/** Dados que forman parte de la prueba; no se convierten en bonificadores numéricos de la ficha. */
export function dadosAdicionalesTirada(personaje: PersonajeJugador, objetivo: string): string {
  return evaluarEfectosRasgosActivos(personaje).filter(e => e.tipo === "dado_extra_tirada" && e.objetivo === objetivo)
    .map(e => `+${e.valor}`).join("");
}

/** La finalización solo ocurre tras una emisión correcta. Un personaje tiene una emisión pendiente. */
export async function emitirTiradaConRasgos(
  personaje: PersonajeJugador, objetivo: string, emitir: () => Promise<boolean>, desactivar: (id: string) => void
): Promise<boolean> {
  if (pendientes.has(personaje.id)) return false;
  pendientes.add(personaje.id);
  try {
    const emitida = await emitir();
    if (emitida) for (const r of personaje.rasgos) {
      if (r.activo && (r.autoDesactivarEnTirada?.includes(objetivo)
        || (objetivo === "dano" && r.autoDesactivarAlTirarDano))) desactivar(r.id);
    }
    return emitida;
  } finally { pendientes.delete(personaje.id); }
}
