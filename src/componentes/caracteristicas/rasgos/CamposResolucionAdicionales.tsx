import type { RasgoPersonaje } from "@/tipos";
import { CampoNumerico } from "@/componentes/comunes";

export function CamposResolucionAdicionales({ rasgo, idOpcion, propio, cantidad, tirada, cambiarCantidad, cambiarTirada }: {
  rasgo: RasgoPersonaje; idOpcion: string; propio: boolean; cantidad: number; tirada: number;
  cambiarCantidad: (n: number) => void; cambiarTirada: (n: number) => void;
}) {
  const opcion = rasgo.resolucionAsistida?.opciones.find(o => o.id === idOpcion);
  return <>
    {propio && rasgo.resolucionAsistida?.reparto && <label>PG para mi personaje (el resto se reparte manualmente)
      <CampoNumerico min={0} value={cantidad} alConfirmar={cambiarCantidad} />
    </label>}
    {opcion?.tipo === "modificador_tirada" && <label>Total del ataque fallido, sin volver a tirar
      <CampoNumerico value={tirada} alConfirmar={cambiarTirada} />
      <span>{opcion.tipoAccion === "reaccion" ? "Consume tu reacción: ataque de otra criatura a 30 pies." : "Ataque propio: no consume acción."}</span>
    </label>}
  </>;
}
