import type { PersonajeJugador } from "@/tipos";

const pendientes = new Set<string>();

/** Solo retira estados de una salvación después de emitirla; evita dos emisiones simultáneas. */
export async function emitirSalvacionConRasgos(
  personaje: PersonajeJugador, emitir: () => Promise<boolean>, desactivar: (idRasgo: string) => void, consumir?: (idRasgo: string) => void
): Promise<boolean> {
  if (pendientes.has(personaje.id)) return false;
  pendientes.add(personaje.id);
  try {
    const emitida = await emitir();
    if (emitida) for (const r of personaje.rasgos) if (r.activo && r.autoDesactivarAlTirarSalvacion) {
      if (r.gastarUsoAlEmitirSalvacion) consumir?.(r.id);
      desactivar(r.id);
    }
    return emitida;
  } finally { pendientes.delete(personaje.id); }
}
