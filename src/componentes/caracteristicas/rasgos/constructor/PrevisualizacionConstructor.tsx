import type { PersonajeJugador } from "@/tipos";
import { TarjetaRasgo } from "../TarjetaRasgo";
import { Eye } from "lucide-react";
import estilos from "../ConstructorRasgoDote.module.css";
import type { usarConstructorRasgo } from "./usarConstructorRasgo";
interface Props {
    personaje: PersonajeJugador;
    rasgoPrevisualizado: ReturnType<typeof usarConstructorRasgo>["rasgoPrevisualizado"];
}
export function PrevisualizacionConstructor({ personaje, rasgoPrevisualizado }: Props) {
    return (<div className={estilos.seccionCard}>
        <div className={estilos.tituloPrevisualizacion}>
          <Eye size={13}/>
          <span>Vista Previa en Vivo (Cómo se verá en tu lista de juego)</span>
        </div>

        <div className={estilos.contenedorPrevisualizacionCentrado}>
          <TarjetaRasgo
            rasgo={{ ...rasgoPrevisualizado, nombre: rasgoPrevisualizado.nombre || "Nombre del Rasgo", descripcion: rasgoPrevisualizado.descripcion || "Descripción del rasgo o dote..." }}
            nombrePersonaje={personaje.nombre || "Personaje"}
          />
        </div>
      </div>);
}
