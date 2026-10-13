import type React from "react";
import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
import { usarConstructorRasgo } from "./constructor/usarConstructorRasgo";
import type { ConstructorRasgoDoteProps } from "./constructor/tiposConstructor";
import { BarraConstructor } from "./constructor/BarraConstructor";
import { PlantillaDoteConstructor } from "./constructor/PlantillaDoteConstructor";
import { IdentidadConstructor } from "./constructor/IdentidadConstructor";
import { ActivacionConstructor } from "./constructor/ActivacionConstructor";
import { RecursosConstructor } from "./constructor/RecursosConstructor";
import { EfectosConstructor } from "./constructor/EfectosConstructor";
import { SelectoresConstructor } from "./constructor/SelectoresConstructor";
import { PrevisualizacionConstructor } from "./constructor/PrevisualizacionConstructor";
import estilos from "./ConstructorRasgoDote.module.css";

export const ConstructorRasgoDote: React.FC<ConstructorRasgoDoteProps> = (props) => {
  const constructor = usarConstructorRasgo(props);
  return <FormularioNumerico className={estilos.panelConstructor} key={`${props.personaje.id}:${props.rasgoInicial?.id ?? "nuevo"}`} onSubmit={() => constructor.manejarGuardar()}>
    <BarraConstructor
      borrador={constructor.borrador}
      esEdicion={Boolean(props.rasgoInicial)}
      alVolver={props.alVolver}
    />
    <PlantillaDoteConstructor
      rasgosAdicionales={constructor.rasgosAdicionales}
      manejarSeleccionarDotePreset={constructor.manejarSeleccionarDotePreset}
      opcionesDotesOficiales={constructor.opcionesDotesOficiales}
    />
    <IdentidadConstructor
      borrador={constructor.borrador}
      actualizarBorrador={constructor.actualizarBorrador}
      errores={constructor.errores}
    />
    <ActivacionConstructor
      borrador={constructor.borrador}
      actualizarBorrador={constructor.actualizarBorrador}
      opcionesRasgosPadre={constructor.opcionesRasgosPadre}
    />
    <RecursosConstructor
      borrador={constructor.borrador}
      actualizarBorrador={constructor.actualizarBorrador}
      opcionesRasgosPadre={constructor.opcionesRasgosPadre}
      errores={constructor.errores}
    />
    <EfectosConstructor borrador={constructor.borrador} actualizarBorrador={constructor.actualizarBorrador} />
    <SelectoresConstructor borrador={constructor.borrador} actualizarBorrador={constructor.actualizarBorrador} />
    <PrevisualizacionConstructor
      personaje={props.personaje}
      rasgoPrevisualizado={constructor.rasgoPrevisualizado}
    />
    {Object.keys(constructor.errores).length > 0 && <div role="alert">
      {Object.entries(constructor.errores).map(([campo, mensaje]) => <p id={`error-rasgo-${campo}`} key={campo}>{mensaje}</p>)}
    </div>}
  </FormularioNumerico>;
};
