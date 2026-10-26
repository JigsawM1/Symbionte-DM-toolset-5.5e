import { useState, useMemo } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { HECHIZOS_INICIALES } from "@/utiles/datosIniciales";
import { usarLanzadorConjuros } from "@/hooks/usarLanzadorConjuros";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import { SelectorDesplegable } from "@/componentes/comunes";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import { obtenerConcesionConRecurso } from "@/servicios/rasgos/lanzamientoRecursoRasgos";

export function ConjurosConRecursoRasgo({ personaje, rasgo }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [id, elegir] = useState("");
  const [sinConcentracion, cambiar] = useState(false);
  const { lanzar, validar } = usarLanzadorConjuros({ personaje, penalizacionArmadura: calcularEstadisticasPersonaje(personaje).penalizacionArmadura });
  const concesion = personaje.rasgos.find(r => r.id === rasgo.lanzamientoConRecurso?.idRasgoConcesion);
  const conjuros = useMemo(() => HECHIZOS_INICIALES.filter(h => rasgo.lanzamientoConRecurso
    ? obtenerConcesionConRecurso(personaje, rasgo.id, h)
    : h.id === rasgo.conjuroGratuito), [personaje, rasgo]);
  const hechizo = conjuros.find(h => h.id === id) ?? (rasgo.lanzamientoConRecurso?.lista ? undefined : conjuros[0]);
  const cfg = hechizo && obtenerConcesionConRecurso(personaje, rasgo.id, hechizo);
  const solicitud = hechizo && { hechizo, claseLanzamiento: cfg?.clase ?? concesion?.claseConjurosOtorgados,
    ...(rasgo.varianteSinConcentracion ? { sinConcentracion } : {}) };
  const normal = solicitud && { ...solicitud, modo: "espacio" as const };
  const especial = solicitud && (rasgo.lanzamientoConRecurso ? { ...solicitud, modo: "recursoRasgo" as const, idRasgoOrigen: rasgo.id }
    : { ...solicitud, modo: "gratuitoInnato" as const });
  return <section className={estilos.rituales} aria-label={`Lanzamientos de ${rasgo.nombre}`}>
    <SelectorDesplegable titulo="Conjuro concedido" placeholder="Elige un conjuro" valor={hechizo?.id ?? ""} opciones={conjuros.map(h => ({ valor: h.id, etiqueta: `${h.nombre} · Nivel ${h.nivel}` }))} alCambiar={elegir} />
    {rasgo.varianteSinConcentracion && <label><input type="checkbox" checked={sinConcentracion} onChange={e => cambiar(e.target.checked)} />Sin concentración · 1 minuto</label>}
    {rasgo.lanzamientoConRecurso && <p>{rasgo.lanzamientoConRecurso.lista
      ? "Nivel base; no consume espacios ni materiales. Mantiene los demás componentes y la concentración."
      : "Por puntos: nivel base, sin componentes verbales ni somáticos. Comprueba manualmente los materiales consumidos o con coste."}</p>}
    {rasgo.lanzamientoConRecurso?.costeFijo && <p>Usos disponibles: {rasgo.usosRestantes ?? rasgo.usosMaximos ?? 0} / {rasgo.usosMaximos}</p>}
    <div className={estilos.botonesRituales}>
      {!rasgo.lanzamientoConRecurso?.lista && <button type="button" className={estilos.botonCompacto} disabled={!normal || !validar(normal).permitido} onClick={() => { if (normal) void lanzar(normal); }}>Lanzar con espacio</button>}
      <button type="button" className={estilos.botonCompacto} disabled={!especial || !validar(especial).permitido} onClick={() => { if (especial) void lanzar(especial); }}>
        {rasgo.lanzamientoConRecurso?.costeFijo ? `Lanzar · ${rasgo.lanzamientoConRecurso.costeFijo} uso` : rasgo.lanzamientoConRecurso ? `Lanzar por ${hechizo?.nivel ?? 0} puntos` : "Lanzar gratis"}</button>
    </div>
  </section>;
}
