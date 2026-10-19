import { useState } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { usarLanzadorConjuros } from "@/hooks/usarLanzadorConjuros";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { SelectorDesplegable } from "@/componentes/comunes";
import estilos from "./ControlesRecursosDeclarativos.module.css";

export function ConjurosConRecursoRasgo({ personaje, rasgo }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [id, elegir] = useState("");
  const [sinConcentracion, cambiar] = useState(false);
  const { lanzar, validar } = usarLanzadorConjuros({ personaje, penalizacionArmadura: calcularEstadisticasPersonaje(personaje).penalizacionArmadura });
  const concesion = personaje.rasgos.find(r => r.id === rasgo.lanzamientoConRecurso?.idRasgoConcesion);
  const conjuros = HECHIZOS_INICIALES.filter(h => rasgo.lanzamientoConRecurso
    ? h.nivel > 0 && h.nivel <= rasgo.lanzamientoConRecurso.nivelMaximo && concesion?.conjurosOtorgados?.includes(h.id)
    : h.id === rasgo.conjuroGratuito);
  const hechizo = conjuros.find(h => h.id === id) ?? conjuros[0];
  if (!hechizo) return null;
  const solicitud = { hechizo, claseLanzamiento: concesion?.claseConjurosOtorgados,
    ...(rasgo.varianteSinConcentracion ? { sinConcentracion } : {}) };
  const normal = { ...solicitud, modo: "espacio" as const };
  const especial = rasgo.lanzamientoConRecurso ? { ...solicitud, modo: "recursoRasgo" as const, idRasgoOrigen: rasgo.id }
    : { ...solicitud, modo: "gratuitoInnato" as const };
  return <section className={estilos.rituales} aria-label={`Lanzamientos de ${rasgo.nombre}`}>
    <SelectorDesplegable titulo="Conjuro concedido" valor={hechizo.id} opciones={conjuros.map(h => ({ valor: h.id, etiqueta: `${h.nombre} · Nivel ${h.nivel}` }))} alCambiar={elegir} />
    {rasgo.varianteSinConcentracion && <label><input type="checkbox" checked={sinConcentracion} onChange={e => cambiar(e.target.checked)} />Sin concentración · 1 minuto</label>}
    {rasgo.lanzamientoConRecurso && <p>Por puntos: nivel base, sin componentes verbales ni somáticos. Comprueba manualmente los materiales consumidos o con coste.</p>}
    <div className={estilos.botonesRituales}>
      <button type="button" className={estilos.botonCompacto} disabled={!validar(normal).permitido} onClick={() => void lanzar(normal)}>Lanzar con espacio</button>
      <button type="button" className={estilos.botonCompacto} disabled={!validar(especial).permitido} onClick={() => void lanzar(especial)}>
        {rasgo.lanzamientoConRecurso ? `Lanzar por ${hechizo.nivel} ${hechizo.nivel === 1 ? "punto" : "puntos"}` : "Lanzar gratis"}</button>
    </div>
  </section>;
}
