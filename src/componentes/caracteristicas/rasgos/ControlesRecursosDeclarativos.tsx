import { useState, useRef, useEffect } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { CampoNumerico, SelectorDesplegable } from "@/componentes/comunes";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "@/servicios/evaluadorEfectosRasgos";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";

export function ControlesRecursosDeclarativos({ rasgo, idPersonaje }: { rasgo: RasgoPersonaje; idPersonaje?: string }) {
  const personajes = usarAlmacenDM(s => s.personajes);
  const { objetosHomebrew } = usarEstadoHomebrew();
  const pj = personajes.find(p => p.id === idPersonaje);
  const [mostrar, setMostrar] = useState(false);
  const [objetivo, setObjetivo] = useState(idPersonaje ?? "");
  const [dados, setDados] = useState(1);
  const [enCurso, setEnCurso] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const bloqueado = useRef(false);
  useEffect(() => { if (mostrar) dialogo.current?.showModal(); }, [mostrar]);
  if (!pj) return null;
  const restantes = rasgo.usosRestantes ?? rasgo.usosMaximos ?? 0;
  const maxDados = rasgo.curacionDirigida ? Math.min(restantes, Math.max(1, evaluarExpresionNumericaSegura(
    resolverFormulaDinamica(rasgo.curacionDirigida.maxDados, pj, rasgo.fuente)))) : 1;
  const lanzar = async () => {
    if (bloqueado.current || !objetivo || !Number.isInteger(dados) || dados < 1 || dados > maxDados) return;
    const vigente = usarAlmacenDM.getState().personajes.find(p => p.id === idPersonaje)?.rasgos.find(r => r.id === rasgo.id);
    if (!vigente || (vigente.usosRestantes ?? 0) < dados
      || !usarAlmacenDM.getState().personajes.some(p => p.id === objetivo)) return;
    bloqueado.current = true; setEnCurso(true);
    try {
      const formula = (rasgo.formulaDados ?? "1d6").replace(/^1d/, `${dados}d`);
      const emitida = await lanzarDadosTaleSpire(`!${rasgo.nombre}:${formula}`, `${pj.nombre} - ${rasgo.nombre}`, undefined, undefined, undefined,
        { tipo:"curacionRasgo", personajeId:objetivo, rasgoId:rasgo.id, nombreRasgo:rasgo.nombre, cantidadDadosGastados:dados });
      if (emitida) { usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, rasgo.id, dados); setMostrar(false); }
    } finally { bloqueado.current = false; setEnCurso(false); }
  };
  return <>
    {rasgo.vinculoArma && <SelectorDesplegable valor={rasgo.vinculoArma.idInstancia ?? ""} titulo="Arma vinculada" placeholder="Vincular un arma"
      opciones={[{valor:"",etiqueta:"Sin arma vinculada"},...pj.inventario.filter(o => {
        if (o.categoria !== "armas") return false;
        if (!rasgo.vinculoArma?.soloCuerpoACuerpoOMagica || o.esMagico) return true;
        const base = objetosHomebrew.find(b => b.id === o.idObjeto);
        return base && "tipoAtaque" in base && base.tipoAtaque !== "A Distancia";
      }).map(o => ({valor:o.idInstancia,etiqueta:o.nombre}))]}
      alCambiar={idInstancia => usarAlmacenDM.getState().actualizarRasgoPersonaje(pj.id,rasgo.id,{vinculoArma:{...rasgo.vinculoArma!,idInstancia:idInstancia||undefined}})} />}
    {rasgo.recuperarPactoAlUsar && <button type="button" disabled={restantes < 1}
      onClick={e => { e.stopPropagation(); usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, rasgo.id); }}>
      Usar y recuperar espacios de pacto</button>}
    {rasgo.recargarUsoConPacto && <button type="button" disabled={restantes >= (rasgo.usosMaximos ?? 1) || pj.espaciosPactoGastados >= pj.espaciosPactoMaximos}
      onClick={e => { e.stopPropagation(); usarAlmacenDM.getState().recargarUsoRasgoConPacto(pj.id, rasgo.id); }}>Recargar uso con un espacio de pacto</button>}
    {rasgo.curacionDirigida && <button type="button" disabled={restantes < 1}
      onClick={e => { e.stopPropagation(); setDados(1); if (!personajes.some(p => p.id === objetivo)) setObjetivo(pj.id); setMostrar(true); }}>Elegir curación y destinatario</button>}
    {mostrar && <dialog ref={dialogo} className={estilos.dialogo} aria-label={`Curación: ${rasgo.nombre}`}
      onCancel={() => setMostrar(false)} onClick={e => e.stopPropagation()}>
      <h3>{rasgo.nombre}</h3>
      <p>Elige una criatura que puedas ver a {rasgo.curacionDirigida?.alcance} pies o menos. Comprueba la distancia en el tablero.</p>
      <label>Destinatario</label>
      <SelectorDesplegable valor={objetivo} alCambiar={setObjetivo} titulo="Destinatario de la curación" enFlujo
        opciones={personajes.map(p => ({ valor:p.id, etiqueta:p.nombre }))} />
      <label>Dados a gastar (máximo {maxDados})</label>
      <CampoNumerico aria-label="Dados de curación" min={1} max={Math.max(1,maxDados)} value={dados} alConfirmar={setDados} />
      <div className={estilos.acciones}><button type="button" disabled={enCurso} onClick={() => setMostrar(false)}>Cancelar</button>
        <button type="button" disabled={enCurso || maxDados < 1 || !Number.isInteger(dados) || dados > maxDados || !personajes.some(p => p.id === objetivo)} onClick={() => void lanzar()}>Curar {dados}d6</button></div>
    </dialog>}
  </>;
}
