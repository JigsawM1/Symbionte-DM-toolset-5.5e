import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { obtenerNivelEfectivoParaRasgo } from "@/servicios/clases/catalogoClases";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";
import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import { FormularioNumerico } from "@/componentes/comunes/FormularioNumerico";
import estilos from "./DialogoRasgo.module.css";
import conversion from "./ConversionEspacios.module.css";

export function DialogoConversionEspacios({ personaje, rasgo, alCerrar }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje; alCerrar: () => void }) {
  const pj = usarAlmacenDM(s => s.personajes.find(p => p.id === personaje.id)) ?? personaje;
  const r = pj.rasgos.find(x => x.id === rasgo.id) ?? rasgo;
  const recurso = resolverRasgoRecurso(r, pj.rasgos);
  const filas = r.conversionEspacios?.tabla.filter(f => f.nivelMinimo <= obtenerNivelEfectivoParaRasgo(pj, r)) ?? [];
  const [modo, cambiarModo] = useState<"crear" | "convertir">("crear");
  const [nivel, cambiarNivel] = useState(filas[0]?.nivelEspacio ?? 1);
  const [cantidad, cambiarCantidad] = useState(1);
  const [espacio, cambiarEspacio] = useState("");
  const [error, cambiarError] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);
  const confirmado = useRef(false);
  useEffect(() => { dialogo.current?.showModal(); }, []);
  const disponibles = recurso?.usosRestantes ?? recurso?.usosMaximos ?? 0;
  const coste = (filas.find(f => f.nivelEspacio === nivel)?.coste ?? 0) * cantidad;
  const espacios: { valor: string; etiqueta: string; nivel: number; origen: "ordinario" | "adicional" | "pacto" }[] = [];
  for (let n = 1; n <= 9; n++) {
    const ordinarios = (pj.espaciosConjuroMaximos[n] ?? 0) - (pj.espaciosConjuroGastados[n] ?? 0);
    const adicionales = pj.espaciosConjuroAdicionales?.[n] ?? 0;
    if (ordinarios > 0) espacios.push({ valor: `ordinario:${n}`, etiqueta: `Nivel ${n} · ${ordinarios} ordinarios`, nivel: n, origen: "ordinario" });
    if (adicionales > 0) espacios.push({ valor: `adicional:${n}`, etiqueta: `Nivel ${n} · ${adicionales} adicionales`, nivel: n, origen: "adicional" });
  }
  if (pj.espaciosPactoMaximos > pj.espaciosPactoGastados) espacios.push({ valor: `pacto:${pj.nivelEspacioPacto}`,
    etiqueta: `Pacto · nivel ${pj.nivelEspacioPacto}`, nivel: pj.nivelEspacioPacto, origen: "pacto" });
  const seleccionado = espacios.find(e => e.valor === espacio);
  const recuperacion = Math.max(0, Math.min(seleccionado?.nivel ?? 0, (recurso?.usosMaximos ?? 0) - disponibles));
  const valido = modo === "crear" ? Number.isInteger(cantidad) && cantidad > 0 && coste > 0 && coste <= disponibles : recuperacion > 0;
  const confirmar = () => {
    if (!valido || confirmado.current) return;
    confirmado.current = true;
    const aplicado = usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, modo === "crear"
      ? { tipo: "crearEspacio", idRasgo: r.id, nivel, cantidad }
      : { tipo: "convertirEspacio", idRasgo: r.id, nivel: seleccionado!.nivel, origen: seleccionado!.origen });
    if (aplicado) alCerrar();
    else { confirmado.current = false; cambiarError("Los recursos han cambiado. Revisa la selección."); }
  };
  return <dialog ref={dialogo} className={estilos.dialogo} aria-label="Crear o convertir espacios de conjuro" onCancel={alCerrar} onClick={e => e.stopPropagation()}>
    <header className={estilos.cabecera}><h3>{rasgo.nombre}</h3><button className={estilos.cerrar} type="button" aria-label="Cerrar conversión" onClick={alCerrar}><X size={18} /></button></header>
    <FormularioNumerico className={conversion.formulario} onSubmit={confirmar}>
      <div className={`u-scroll-cef ${estilos.cuerpo} ${conversion.cuerpo}`}>
        <p>{recurso?.nombre}: <strong>{disponibles} / {recurso?.usosMaximos ?? 0}</strong></p>
        {r.conversionEspacios?.permiteConvertir && <div className={conversion.modos}>
          <button type="button" aria-pressed={modo === "crear"} onClick={() => cambiarModo("crear")}>Crear espacios</button>
          <button type="button" aria-pressed={modo === "convertir"} onClick={() => cambiarModo("convertir")}>Convertir en puntos</button>
        </div>}
        {modo === "crear" ? <>
          <label>Nivel del espacio<SelectorDesplegable titulo="Nivel del espacio" valor={String(nivel)} enFlujo
            alCambiar={v => cambiarNivel(Number(v))} opciones={filas.map(f => ({ valor: String(f.nivelEspacio), etiqueta: `Nivel ${f.nivelEspacio} · ${f.coste} puntos` }))} /></label>
          <label>Cantidad de espacios<CampoNumerico aria-label="Cantidad de espacios" min={1} max={Math.max(1, Math.floor(disponibles / (filas.find(f => f.nivelEspacio === nivel)?.coste ?? 1)))} value={cantidad} alConfirmar={cambiarCantidad} /></label>
          <p>Coste total: <strong>{coste} puntos</strong>. Los espacios creados desaparecen tras un descanso largo.</p>
        </> : <>
          <label>Espacio a convertir<SelectorDesplegable titulo="Espacio a convertir" valor={espacio} enFlujo
            alCambiar={cambiarEspacio} opciones={[{ valor: "", etiqueta: "Selecciona un espacio" }, ...espacios.map(e => ({ valor: e.valor, etiqueta: e.etiqueta }))]} /></label>
          <p>Recuperarás <strong>{recuperacion} puntos</strong>{seleccionado && recuperacion < seleccionado.nivel ? " (limitado por el máximo de la reserva)" : ""}.</p>
          {disponibles >= (recurso?.usosMaximos ?? 0) && <p>La reserva ya está completa.</p>}
        </>}
        {error && <p role="alert">{error}</p>}
      </div>
      <footer className={estilos.acciones}><button type="button" onClick={alCerrar}>Cancelar</button><button type="submit" className={estilos.principal} disabled={!valido}>Confirmar {modo === "crear" ? "creación" : "conversión"}</button></footer>
    </FormularioNumerico>
  </dialog>;
}

