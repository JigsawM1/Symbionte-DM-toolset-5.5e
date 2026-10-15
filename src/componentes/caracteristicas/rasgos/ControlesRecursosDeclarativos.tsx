import { useState, useRef, useEffect } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { CampoNumerico, FormularioNumerico, SelectorDesplegable } from "@/componentes/comunes";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "@/servicios/evaluadorEfectosRasgos";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import { Dices, RotateCcw, Sparkles } from "lucide-react";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";

export function ControlesRecursosDeclarativos({ rasgo, idPersonaje }: { rasgo: RasgoPersonaje; idPersonaje?: string }) {
  const personajes = usarAlmacenDM(s => s.personajes);
  const { objetosHomebrew } = usarEstadoHomebrew();
  const pj = personajes.find(p => p.id === idPersonaje);
  const [mostrar, setMostrar] = useState(false);
  const [dados, setDados] = useState(1);
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);
  const bloqueado = useRef(false);
  useEffect(() => { if (mostrar) dialogo.current?.showModal(); }, [mostrar]);
  if (!pj) return null;
  const restantes = rasgo.usosRestantes ?? rasgo.usosMaximos ?? 0;
  const padre = resolverRasgoRecurso(rasgo, pj.rasgos);
  const maxDados = rasgo.tiradaCuracionManual ? Math.min(restantes, Math.max(1, evaluarExpresionNumericaSegura(
    resolverFormulaDinamica(rasgo.tiradaCuracionManual.maxDados, pj, rasgo.fuente)))) : 1;
  const lanzar = async () => {
    if (bloqueado.current || !Number.isInteger(dados) || dados < 1 || dados > maxDados) return;
    const actual = usarAlmacenDM.getState().personajes.find(p => p.id === idPersonaje);
    const vigente = actual?.rasgos.find(r => r.id === rasgo.id);
    if (!actual || !vigente?.tiradaCuracionManual || (vigente.usosRestantes ?? vigente.usosMaximos ?? 0) < dados
      || dados > Math.max(1, evaluarExpresionNumericaSegura(resolverFormulaDinamica(vigente.tiradaCuracionManual.maxDados, actual, vigente.fuente)))) return;
    bloqueado.current = true; setEnCurso(true); setError("");
    try {
      const formula = (vigente.formulaDados ?? "1d6").replace(/^1d/, `${dados}d`);
      const emitida = await lanzarDadosTaleSpire(`!${rasgo.nombre}:${formula}`, `${pj.nombre} - ${rasgo.nombre}`);
      if (emitida) { usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, rasgo.id, dados); setMostrar(false); }
      else setError("No se pudo lanzar la tirada. Los dados siguen disponibles.");
    } catch {
      setError("No se pudo lanzar la tirada. Los dados siguen disponibles.");
    } finally { bloqueado.current = false; setEnCurso(false); }
  };
  return <>
    {rasgo.recargarUsoConPadre && <button type="button" className={estilos.botonCompacto}
      disabled={restantes >= (rasgo.usosMaximos ?? 1) || !padre || (padre.usosRestantes ?? padre.usosMaximos ?? 0) < 1}
      title={`Recargar uso gastando 1 uso de ${padre?.nombre ?? "la reserva padre"}`} aria-label={`Recargar ${rasgo.nombre} con el recurso padre`}
      onClick={e => { e.stopPropagation(); usarAlmacenDM.getState().recargarUsoRasgoConPadre(pj.id, rasgo.id); }}>
      <RotateCcw size={13} aria-hidden="true" />Recargar</button>}
    {rasgo.vinculoArma && <SelectorDesplegable valor={rasgo.vinculoArma.idInstancia ?? ""} titulo="Arma vinculada" placeholder="Vincular un arma"
      opciones={[{valor:"",etiqueta:"Sin arma vinculada"},...pj.inventario.filter(o => {
        if (o.categoria !== "armas") return false;
        if (!rasgo.vinculoArma?.soloCuerpoACuerpoOMagica || o.esMagico) return true;
        const base = objetosHomebrew.find(b => b.id === o.idObjeto);
        return base && "tipoAtaque" in base && base.tipoAtaque !== "A Distancia";
      }).map(o => ({valor:o.idInstancia,etiqueta:o.nombre}))]}
      alCambiar={idInstancia => usarAlmacenDM.getState().actualizarRasgoPersonaje(pj.id,rasgo.id,{vinculoArma:{...rasgo.vinculoArma!,idInstancia:idInstancia||undefined}})} />}
    {rasgo.recuperarPactoAlUsar && <button type="button" className={estilos.botonCompacto} disabled={restantes < 1}
      title="Usar y recuperar espacios de pacto" aria-label="Usar y recuperar espacios de pacto"
      onClick={e => { e.stopPropagation(); usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, rasgo.id); }}>
      <Sparkles size={13} aria-hidden="true" />Usar</button>}
    {rasgo.recargarUsoConPacto && <button type="button" className={estilos.botonCompacto} disabled={restantes >= (rasgo.usosMaximos ?? 1) || pj.espaciosPactoGastados >= pj.espaciosPactoMaximos}
      title="Recargar uso con un espacio de pacto" aria-label="Recargar uso con un espacio de pacto"
      onClick={e => { e.stopPropagation(); usarAlmacenDM.getState().recargarUsoRasgoConPacto(pj.id, rasgo.id); }}><RotateCcw size={13} aria-hidden="true" />Recargar</button>}
    {rasgo.tiradaCuracionManual && <button type="button" className={estilos.botonCompacto} disabled={restantes < 1}
      title="Elegir cuántos dados de curación gastar" aria-label="Elegir cuántos dados de curación gastar"
      onClick={e => { e.stopPropagation(); setDados(1); setError(""); setMostrar(true); }}><Dices size={13} aria-hidden="true" />Lanzar d6</button>}
    {mostrar && <dialog ref={dialogo} className={estilos.dialogo} aria-label={`Curación: ${rasgo.nombre}`}
      onCancel={() => setMostrar(false)} onClick={e => e.stopPropagation()}>
      <h3>{rasgo.nombre}</h3>
      <FormularioNumerico onSubmit={() => void lanzar()}>
      <p>Elige cuántos dados gastar. Aplica el resultado de la curación manualmente al destinatario.</p>
      <label htmlFor={`dados-${rasgo.id}`}>Dados a gastar (máximo {maxDados})</label>
      <CampoNumerico id={`dados-${rasgo.id}`} aria-label="Dados de curación" min={1} max={Math.max(1,maxDados)} value={dados} alConfirmar={setDados} disabled={enCurso} />
      {error && <p role="status">{error}</p>}
      <div className={estilos.acciones}><button type="button" disabled={enCurso} onClick={() => setMostrar(false)}>Cancelar</button>
        <button type="submit" disabled={enCurso || maxDados < 1 || !Number.isInteger(dados) || dados < 1 || dados > maxDados}>Lanzar {dados}d6</button></div>
      </FormularioNumerico>
    </dialog>}
  </>;
}
