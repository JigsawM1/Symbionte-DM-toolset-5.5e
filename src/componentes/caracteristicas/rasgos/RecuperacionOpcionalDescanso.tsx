import estilos from "./ConversionEspacios.module.css";
import { useState } from "react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { obtenerMaximoRecuperacionDescanso } from "@/servicios/rasgos/conversionRecursosRasgos";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";

export function RecuperacionOpcionalDescanso({ idPersonaje }: { idPersonaje: string }) {
  const pj = usarAlmacenDM(s => s.personajes.find(p => p.id === idPersonaje));
  const [cantidades, cambiarCantidades] = useState<Record<string, number>>({});
  const [recuperados, cambiarRecuperados] = useState<Record<string, number>>({});
  return <>{pj?.rasgos.filter(r => r.recuperacionOpcionalDescanso).map(r => {
    const maximo = obtenerMaximoRecuperacionDescanso(pj, r);
    const cantidad = cantidades[r.id] ?? maximo;
    if (!maximo && !recuperados[r.id]) return null;
    return <section className={estilos.recuperacion} key={r.id} aria-label={r.nombre}>
      <h3>{r.nombre}</h3>
      {recuperados[r.id] ? <p role="status">Recuperados {recuperados[r.id]} puntos. Uso diario consumido.</p> : <>
        <p>Puedes recuperar hasta {maximo} puntos. Confirmar consume el uso diario.</p>
        <CampoNumerico aria-label={`Puntos a recuperar con ${r.nombre}`} min={1} max={maximo} value={cantidad}
          alConfirmar={v => cambiarCantidades(c => ({ ...c, [r.id]: v }))} />
        <button type="button" disabled={!Number.isInteger(cantidad) || cantidad < 1 || cantidad > maximo} onClick={() => {
          if (usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, { tipo: "recuperarDescanso", idRasgo: r.id, cantidad }))
            cambiarRecuperados(c => ({ ...c, [r.id]: cantidad }));
        }}>Recuperar {cantidad} puntos</button>
      </>}
    </section>;
  })}</>;
}
