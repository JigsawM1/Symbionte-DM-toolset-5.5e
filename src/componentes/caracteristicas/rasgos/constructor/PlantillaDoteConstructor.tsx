import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { Sparkles } from "lucide-react";
import estilos from "../ConstructorRasgoDote.module.css";
import type { usarConstructorRasgo } from "./usarConstructorRasgo";
interface Props {
    rasgosAdicionales: ReturnType<typeof usarConstructorRasgo>["rasgosAdicionales"];
    manejarSeleccionarDotePreset: ReturnType<typeof usarConstructorRasgo>["manejarSeleccionarDotePreset"];
    opcionesDotesOficiales: ReturnType<typeof usarConstructorRasgo>["opcionesDotesOficiales"];
}
export function PlantillaDoteConstructor({ rasgosAdicionales, manejarSeleccionarDotePreset, opcionesDotesOficiales }: Props) {
    return (<div className={`${estilos.seccionCard} ${estilos.seccionCardTranslúcida}`}>
        <div className={estilos.filaToggle}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>Cargar Plantilla de Dote Oficial (PHB 2024)</span>
            <span className={estilos.pistaToggle}>Rellena automáticamente el nombre, categoría y descripción oficial</span>
          </div>
          <div className={estilos.selectorDoteAnchoFijo}>
            <SelectorDesplegable
              valor=""
              opciones={opcionesDotesOficiales}
              alCambiar={(val) => {
            if (val)
                manejarSeleccionarDotePreset(val);
        }}
              placeholder="-- Elegir Dote Oficial --"
              tamano="compacto"
            />
          </div>
        </div>

        {rasgosAdicionales.length > 0 && (<div className={estilos.bannerRasgoAdicional}>
            <Sparkles size={14} color="#10b981"/>
            <span>
              Esta dote incluye {rasgosAdicionales.length} rasgo(s) complementario(s) que se añadirá(n) automáticamente al guardar:{" "}
              <strong>{rasgosAdicionales.map((r) => `${r.nombre} (${r.formulaDados ? `Dados: ${r.formulaDados}` : ""}${r.categoriaMecanica === "curacion" ? " - Curación" : ""})`).join(", ")}</strong>
            </span>
          </div>)}
      </div>);
}
