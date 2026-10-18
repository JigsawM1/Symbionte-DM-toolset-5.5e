import type { PersonajeJugador } from "@/tipos";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { obtenerRasgosRituales } from "@/servicios/rasgos/conjurosRitualesRasgos";
import { usarLanzadorConjuros } from "@/hooks/usarLanzadorConjuros";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import estilos from "./ControlesRecursosDeclarativos.module.css";

export function ConjurosRitualesRasgo({ personaje, idRasgo }: { personaje: PersonajeJugador; idRasgo?: string }) {
  const { lanzar, puedeLanzar, motivoBloqueo } = usarLanzadorConjuros({ personaje, penalizacionArmadura: calcularEstadisticasPersonaje(personaje).penalizacionArmadura });
  const rasgos = obtenerRasgosRituales(personaje).filter(r => !idRasgo || r.id === idRasgo);
  if (!rasgos.length) return null;
  return <section className={estilos.rituales} aria-label="Rituales concedidos por rasgos">{rasgos.map(r => <div key={r.id}>
    <p>Rituales · {r.aptitudConjurosRituales ?? "Aptitud del personaje"} · Componentes normales · +10 minutos</p>
    <div className={estilos.botonesRituales}>{r.conjurosRituales?.map(id => {
      const hechizo = HECHIZOS_INICIALES.find(h => h.id === id);
      return hechizo && <button type="button" key={id} className={estilos.botonCompacto} disabled={!puedeLanzar}
        title={motivoBloqueo ?? `Lanzar ritual: ${hechizo.nombre}`} onClick={() => void lanzar({ hechizo, modo: "ritual", idRasgoOrigen: r.id })}>
        Ritual: {hechizo.nombre}</button>;
    })}</div>
  </div>)}</section>;
}
