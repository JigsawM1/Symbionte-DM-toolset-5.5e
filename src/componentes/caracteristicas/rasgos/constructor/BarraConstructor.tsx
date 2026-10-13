import { ArrowLeft, Save, Settings2 } from "lucide-react";
import estilos from "../ConstructorRasgoDote.module.css";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
interface Props {
    borrador: Pick<BorradorRasgo, "nombre">;
    esEdicion: boolean;
    alVolver: () => void;
}
export function BarraConstructor({ borrador, esEdicion, alVolver }: Props) {
    const { nombre } = borrador;
    return (<div className={estilos.barraSuperiorAcciones}>
        <div className={estilos.ladoIzquierdoBarra}>
          <button type="button" className={estilos.botonVolver} onClick={alVolver} title="Volver a la lista de rasgos">
            <ArrowLeft size={14}/>
            <span>Volver a Mis Rasgos</span>
          </button>
          <div className={estilos.tituloConstructor}>
            <Settings2 size={16} color="var(--pj-texto-cian)"/>
            <span>{esEdicion ? "Editando Rasgo / Dote" : "Constructor de Rasgos y Dotes"}</span>
            {esEdicion && <span className={estilos.subtituloEdicion}>({nombre || "Sin nombre"})</span>}
          </div>
        </div>

        <div className={estilos.ladoDerechoBarra}>
          <button
            type="submit"
            className={estilos.botonGuardar}
            disabled={!nombre.trim()}
            title="Guardar rasgo en este personaje"
          >
            <Save size={14}/>
            <span>Guardar en Personaje</span>
          </button>
        </div>
      </div>);
}
