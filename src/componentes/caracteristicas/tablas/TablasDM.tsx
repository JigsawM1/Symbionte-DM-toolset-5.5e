import React, { useId, useState } from "react";
import { BookOpen, Footprints, Sparkles, HelpCircle } from "lucide-react";
import { DiccionarioCondiciones } from "./DiccionarioCondiciones";
import { CalculadoraViaje } from "./CalculadoraViaje";
import { CalculadoraSalto } from "./CalculadoraSalto";
import { ConversorDivisas } from "./ConversorDivisas";
import { ConsolaCriticosPifias } from "./ConsolaCriticosPifias";
import { ReglasBasicas } from "./ReglasBasicas";
import estilos from "./TablasDM.module.css";

const SUBPESTANAS = [
  { id: "condiciones", titulo: "Condiciones", detalle: "Estados y efectos", Icono: BookOpen },
  { id: "fisica", titulo: "Calculadoras", detalle: "Viaje, salto y divisas", Icono: Footprints },
  { id: "pifias", titulo: "Críticos y pifias", detalle: "Tablas de combate · d12", Icono: Sparkles },
  { id: "reglas", titulo: "Reglas básicas", detalle: "Referencia rápida", Icono: HelpCircle },
] as const;
type SubCategoria = typeof SUBPESTANAS[number]["id"];

export const TablasDM: React.FC = () => {
  const [subCategoria, setSubCategoria] = useState<SubCategoria>("condiciones");
  const id = useId();

  const navegarConTeclado = (evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) => {
    let siguiente: number;
    switch (evento.key) {
      case "ArrowRight": siguiente = (indice + 1) % SUBPESTANAS.length; break;
      case "ArrowLeft": siguiente = (indice + SUBPESTANAS.length - 1) % SUBPESTANAS.length; break;
      case "Home": siguiente = 0; break;
      case "End": siguiente = SUBPESTANAS.length - 1; break;
      default: return;
    }
    evento.preventDefault();
    setSubCategoria(SUBPESTANAS[siguiente].id);
    evento.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[siguiente].focus();
  };

  return (
    <div className={estilos.contenedorTablas}>
      <div className={estilos.subNavegacion} role="tablist" aria-label="Tablas del DM">
        {SUBPESTANAS.map(({ id: categoria, titulo, detalle, Icono }, indice) => (
          <button key={categoria} type="button" role="tab" id={`${id}-${categoria}`}
            title={detalle}
            aria-controls={`${id}-panel`} aria-selected={subCategoria === categoria}
            tabIndex={subCategoria === categoria ? 0 : -1}
            onClick={() => setSubCategoria(categoria)} onKeyDown={evento => navegarConTeclado(evento, indice)}
            className={`${estilos.subBotonNav} ${subCategoria === categoria ? estilos.subBotonNavActivo : ""}`}>
            <Icono size={14} aria-hidden="true" />
            <span className={estilos.tituloNav}>{titulo}</span>
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${subCategoria}`}
        tabIndex={0} className={estilos.cuerpoVisualizador}>
        {subCategoria === "condiciones" && <DiccionarioCondiciones />}
        {subCategoria === "fisica" && (
          <div className={estilos.seccionCalculadoras}>
            <CalculadoraViaje /><CalculadoraSalto /><ConversorDivisas />
          </div>
        )}
        {subCategoria === "pifias" && <ConsolaCriticosPifias />}
        {subCategoria === "reglas" && <ReglasBasicas />}
      </div>
    </div>
  );
};
