import { useState } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ModalTiendaRecuperacionEspacios } from "./ModalTiendaRecuperacionEspacios";
import estilos from "./ConversionEspacios.module.css";

export function ConversionEspaciosRasgo({ rasgo, idPersonaje }: { rasgo: RasgoPersonaje; idPersonaje?: string }) {
  const [abierto, cambiarAbierto] = useState(false);
  const pj = usarAlmacenDM(s => s.personajes.find(p => p.id === idPersonaje));
  if (!rasgo.conversionEspacios || !pj) return null;
  return <><button type="button" className={estilos.boton} aria-label={`Crear o convertir espacios con ${rasgo.nombre}`} onClick={e => { e.stopPropagation(); cambiarAbierto(true); }}>Crear / convertir espacios</button>
    {abierto && <ModalTiendaRecuperacionEspacios personaje={pj} rasgo={rasgo} alConfirmar={() => {}} alCerrar={() => cambiarAbierto(false)} />}</>;
}
