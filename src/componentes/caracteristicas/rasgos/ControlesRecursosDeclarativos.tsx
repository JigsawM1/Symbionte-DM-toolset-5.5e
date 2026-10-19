import { ConjurosConRecursoRasgo } from "./ConjurosConRecursoRasgo";
import { ReservaDadosRasgo } from "./ReservaDadosRasgo";
import { TablaAleatoriaRasgo } from "./TablaAleatoriaRasgo";
import { obtenerNivelEfectivoParaRasgo } from "@/servicios/clases/catalogoClases";
import { ConversionEspaciosRasgo } from "./ConversionEspaciosRasgo";
import { useState, useRef, useEffect } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { CampoNumerico, FormularioNumerico, SelectorDesplegable } from "@/componentes/comunes";
import { resolverFormulaDinamica, evaluarExpresionNumericaSegura } from "@/servicios/evaluadorEfectosRasgos";
import { lanzarDadosTaleSpire } from "@/utiles/lanzadorDados";
import { logger } from "@/utiles/logger";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import modalEstilos from "./DialogoRasgo.module.css";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import { Dices, Minus, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";
import { ConjurosRitualesRasgo } from "./ConjurosRitualesRasgo";
import { emitirCuracionConDados } from "@/servicios/rasgos/tiradaCuracionDados";
import { calcularEstadisticasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";

export function ControlesRecursosDeclarativos({ rasgo, idPersonaje, vista = "tarjeta" }: {
  rasgo: RasgoPersonaje; idPersonaje?: string; vista?: "tarjeta" | "detalle";
}) {
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
  const curacion = rasgo.tiradaCuracion ?? (rasgo.tiradaCuracionManual ? { ...rasgo.tiradaCuracionManual, destino: "manual" } : undefined);
  const caras = rasgo.formulaDados?.match(/^1d(\d+)$/)?.[1] ?? "6";
  const restantes = rasgo.usosRestantes ?? rasgo.usosMaximos ?? 0;
  const costeRecarga = rasgo.costeRecargaPadre ?? 1;
  const padre = resolverRasgoRecurso(rasgo, pj.rasgos);
  const maxDados = curacion ? Math.min(restantes, Math.max(1, evaluarExpresionNumericaSegura(
    resolverFormulaDinamica(curacion.maxDados, pj, rasgo.fuente)))) : 1;
  const estadisticas = rasgo.salvacionObjetivo ? calcularEstadisticasPersonaje(pj) : undefined;
  const cd = rasgo.salvacionObjetivo && estadisticas
    ? 8 + estadisticas.bonoCompetencia + estadisticas.modificadores[rasgo.salvacionObjetivo.aptitud] : undefined;
  const lanzar = async () => {
    if (bloqueado.current || !Number.isInteger(dados) || dados < 1 || dados > maxDados) return;
    const actual = usarAlmacenDM.getState().personajes.find(p => p.id === idPersonaje);
    const vigente = actual?.rasgos.find(r => r.id === rasgo.id);
    const cfg = vigente?.tiradaCuracion ?? vigente?.tiradaCuracionManual;
    if (!actual || !vigente || !cfg || (vigente.usosRestantes ?? vigente.usosMaximos ?? 0) < dados
      || dados > Math.max(1, evaluarExpresionNumericaSegura(resolverFormulaDinamica(cfg.maxDados, actual, vigente.fuente)))) return;
    bloqueado.current = true; setEnCurso(true); setError("");
    try {
      const emitida = await emitirCuracionConDados(actual, vigente, dados, (formula, propio) =>
        lanzarDadosTaleSpire(`!${rasgo.nombre}:${formula}`, `${pj.nombre} - ${rasgo.nombre}`, undefined, undefined, undefined,
          propio ? { tipo: "curacionRasgo", personajeId: pj.id, rasgoId: rasgo.id, nombreRasgo: rasgo.nombre, cantidadDadosGastados: dados } : undefined),
        cantidad => usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj.id, rasgo.id, cantidad));
      if (emitida) { setMostrar(false); }
      else setError("No se pudo lanzar la tirada. Los dados siguen disponibles.");
    } catch (err) {
      logger.error("[ControlesRecursosDeclarativos] Error al emitir curación con dados:", err);
      setError("No se pudo lanzar la tirada. Los dados siguen disponibles.");
    } finally { bloqueado.current = false; setEnCurso(false); }
  };
  const gratis = rasgo.usoGratuitoCondicionado;
  const usarOpcion = (evento: React.MouseEvent, gratuito = false) => {
    if (evento.detail > 1 || bloqueado.current) return;
    bloqueado.current = true;
    try {
      if (usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, { tipo: "usarOpcion", idRasgo: rasgo.id, gratis: gratuito }))
        usarAlmacenDM.getState().agregarNotificacion(`${rasgo.nombre}: ${gratuito ? "uso gratuito. Recuerda el límite de una opción gratis por turno propio" : "gasto aplicado. Resuelve la modificación manualmente"}.`, "info");
    } finally { queueMicrotask(() => { bloqueado.current = false; }); }
  };
  return <>
    {vista === "detalle" && rasgo.varianteSinConcentracion && <ConjurosConRecursoRasgo personaje={pj} rasgo={rasgo} />}
    {rasgo.reservaDados && <ReservaDadosRasgo personaje={pj} rasgo={rasgo} />}
    {rasgo.tablaAleatoria && <TablaAleatoriaRasgo personaje={pj} rasgo={rasgo} />}
    {gratis && <div className={estilos.botonesRituales}>
      <button type="button" className={estilos.botonCompacto} disabled={!padre || (padre.usosRestantes ?? padre.usosMaximos ?? 0) < (rasgo.costeFijo ?? 1)}
        onClick={usarOpcion}>Usar · {rasgo.costeFijo ?? 1} puntos</button>
      {obtenerNivelEfectivoParaRasgo(pj, rasgo) >= gratis.nivelMinimo && <button type="button" className={estilos.botonCompacto}
        disabled={!pj.rasgos.some(r => r.id === gratis.idRasgoActivo && r.activo)}
        onClick={e => usarOpcion(e, true)}>Usar gratis este turno</button>}
    </div>}
    <ConversionEspaciosRasgo rasgo={rasgo} idPersonaje={idPersonaje} />
    {rasgo.salvacionObjetivo && <span className={estilos.cd}
      title={`Salvación de ${rasgo.salvacionObjetivo.caracteristica}: CD ${cd}. Aplicación al objetivo manual.`}>
      CD {cd} · {rasgo.salvacionObjetivo.caracteristica.slice(0, 3).toUpperCase()}</span>}
    {vista === "detalle" && rasgo.conjurosRituales?.length ? <ConjurosRitualesRasgo personaje={pj} idRasgo={rasgo.id} /> : null}
    {rasgo.recargarUsoConPadre && <button type="button" className={estilos.botonCompacto}
      disabled={restantes >= (rasgo.usosMaximos ?? 1) || !padre || (padre.usosRestantes ?? padre.usosMaximos ?? 0) < costeRecarga}
      title={`Recargar uso gastando ${costeRecarga} ${costeRecarga === 1 ? "uso" : "usos"} de ${padre?.nombre ?? "la reserva padre"}`} aria-label={`Recargar ${rasgo.nombre} con el recurso padre`}
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
    {curacion && <button type="button" className={estilos.botonCompacto} disabled={restantes < 1}
      title="Elegir cuántos dados de curación gastar" aria-label="Elegir cuántos dados de curación gastar"
      onClick={e => { e.stopPropagation(); setDados(1); setError(""); setMostrar(true); }}><Dices size={13} aria-hidden="true" />Lanzar d{caras}</button>}
    {mostrar && <dialog ref={dialogo} className={modalEstilos.dialogo} aria-label={`Curación: ${rasgo.nombre}`}
      onCancel={() => setMostrar(false)} onClick={e => e.stopPropagation()}>
      <header className={modalEstilos.cabecera}><Dices size={18} aria-hidden="true" /><h3>{rasgo.nombre}</h3>
        <button type="button" className={modalEstilos.cerrar} aria-label="Cerrar curación" disabled={enCurso} onClick={() => setMostrar(false)}><X size={18} /></button></header>
      <FormularioNumerico className={estilos.formulario} onSubmit={() => void lanzar()}>
      <div className={`u-scroll-cef ${modalEstilos.cuerpo}`}>
        <p className={modalEstilos.introduccion}>{curacion?.destino === "propio" ? "La tirada curará a tu personaje." : "Aplica el resultado de la curación manualmente al destinatario."}</p>
        <div className={estilos.cantidadCabecera}><label htmlFor={`dados-${rasgo.id}`}>Dados a gastar</label><span>{restantes}d{caras} disponibles</span></div>
        <div className={estilos.cantidad}>
          <button type="button" aria-label="Gastar un dado menos" disabled={enCurso || dados <= 1} onClick={() => setDados(d => Math.max(1, d - 1))}><Minus size={16} /></button>
          <CampoNumerico id={`dados-${rasgo.id}`} aria-label="Dados de curación" min={1} max={Math.max(1,maxDados)} value={dados} alConfirmar={setDados} disabled={enCurso} />
          <span className={estilos.caras}>d{caras}</span>
          <button type="button" aria-label="Gastar un dado más" disabled={enCurso || dados >= maxDados} onClick={() => setDados(d => Math.min(maxDados, d + 1))}><Plus size={16} /></button>
        </div>
        <p className={estilos.limite}>Hasta {maxDados} {maxDados === 1 ? "dado" : "dados"} por tirada.</p>
        {error && <p className={modalEstilos.error} role="status">{error}</p>}
      </div>
      <footer className={modalEstilos.acciones}><button type="button" disabled={enCurso} onClick={() => setMostrar(false)}>Cancelar</button>
        <button type="submit" className={modalEstilos.principal} disabled={enCurso || maxDados < 1 || !Number.isInteger(dados) || dados < 1 || dados > maxDados}><Dices size={15} aria-hidden="true" />{enCurso ? "Lanzando…" : `Lanzar ${dados}d${caras}`}</button></footer>
      </FormularioNumerico>
    </dialog>}
  </>;
}
