import { useEffect, useRef, useState } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { SelectorDesplegable } from "@/componentes/comunes";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import modal from "./DialogoRasgo.module.css";

export function RecuperarUsosConEspacio({ personaje, rasgo }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [mostrar, setMostrar] = useState(false);
  const [eleccion, setEleccion] = useState("");
  const [error, setError] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (mostrar) dialogo.current?.showModal(); }, [mostrar]);
  const opciones = Array.from({ length: 9 }, (_, i) => i + 1).flatMap(nivel => {
    const disponibles = Math.max(0, (personaje.espaciosConjuroMaximos[nivel] ?? 0) - (personaje.espaciosConjuroGastados[nivel] ?? 0))
      + (personaje.espaciosConjuroAdicionales?.[nivel] ?? 0);
    return disponibles ? [{ valor: String(nivel), etiqueta: `Nivel ${nivel} · ${disponibles} disponibles` }] : [];
  });
  const pacto = personaje.espaciosPactoMaximos - personaje.espaciosPactoGastados;
  if (pacto > 0) opciones.push({ valor: "pacto", etiqueta: `Pacto nivel ${personaje.nivelEspacioPacto} · ${pacto} disponibles` });
  const completa = (rasgo.usosRestantes ?? rasgo.usosMaximos ?? 0) >= (rasgo.usosMaximos ?? 0);
  return <>
    <button type="button" className={estilos.botonCompacto} disabled={completa || !opciones.length || rasgo.activo === false}
      title="Gastar un espacio para recuperar usos" onClick={e => { e.stopPropagation(); setEleccion(opciones[0]?.valor ?? ""); setError(""); setMostrar(true); }}>Recuperar uso</button>
    {mostrar && <dialog ref={dialogo} className={modal.dialogo} aria-label={`Recuperar usos: ${rasgo.nombre}`}
      onCancel={() => setMostrar(false)} onClick={e => e.stopPropagation()}>
      <header className={modal.cabecera}><strong>Recuperar usos de {rasgo.nombre}</strong></header>
      <div className={`${modal.cuerpo} u-scroll-cef`}>
        <p>Gasta un espacio de cualquier nivel para recuperar {rasgo.recuperarUsosConEspacio} uso. No requiere acción.</p>
        <SelectorDesplegable titulo="Espacio que gastar" valor={eleccion} opciones={opciones} alCambiar={setEleccion} enFlujo />
        {error && <p role="alert">{error}</p>}
      </div>
      <footer className={modal.acciones}>
        <button type="button" onClick={() => setMostrar(false)}>Cancelar</button>
        <button type="button" className={modal.principal} disabled={completa || !opciones.some(o => o.valor === eleccion)} onClick={() => {
          const permitido = usarAlmacenDM.getState().operarRecursoRasgoPersonaje(personaje.id, {
            tipo: "recuperarUsosConEspacio", idRasgo: rasgo.id, nivel: eleccion === "pacto" ? personaje.nivelEspacioPacto : Number(eleccion), pacto: eleccion === "pacto"
          });
          if (permitido) setMostrar(false);
          else setError("El espacio o la reserva han cambiado. No se ha gastado ningún recurso.");
        }}>Gastar espacio y recuperar</button>
      </footer>
    </dialog>}
  </>;
}
