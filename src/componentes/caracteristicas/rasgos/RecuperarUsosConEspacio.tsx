import { useEffect, useMemo, useRef, useState } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { usarSistemaMagia } from "@/almacen/selectores/usarEstadoConfiguracion";
import { calcularCostePuntosRecuperacion, calcularMaxUsosPagablesConPuntos } from "@/servicios/rasgos/conversionRecursosRasgos";
import { AlertCircle, ArrowRight, Check, Minus, Plus, RotateCcw, Sparkles, X, Zap } from "lucide-react";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import modal from "./DialogoRasgo.module.css";
import local from "./RecuperarUsosConEspacio.module.css";

interface OpcionEspacio {
  valor: string;
  etiqueta: string;
  etiquetaCorta: string;
  nivel: number;
  disponibles: number;
  esPacto: boolean;
}

export function RecuperarUsosConEspacio({ personaje, rasgo }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const pj = usarAlmacenDM(s => s.personajes.find(p => p.id === personaje.id)) ?? personaje;
  const r = pj.rasgos.find(x => x.id === rasgo.id) ?? rasgo;
  const sistemaMagia = usarSistemaMagia();

  const [mostrar, setMostrar] = useState(false);
  const [eleccionEspacio, setEleccionEspacio] = useState("");
  const [cantidadPuntos, setCantidadPuntos] = useState(1);
  const [error, setError] = useState("");
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (mostrar) dialogo.current?.showModal();
  }, [mostrar]);

  // Recursos de la reserva de rasgo
  const usosActuales = r.usosRestantes ?? r.usosMaximos ?? 0;
  const usosMaximos = r.usosMaximos ?? 0;
  const cantidadPorEspacio = r.recuperarUsosConEspacio ?? 1;
  const completa = usosActuales >= usosMaximos && usosMaximos > 0;
  const usosFaltantes = Math.max(0, usosMaximos - usosActuales);

  // Detección de estrategia: Puntos de Conjuro vs. Espacios tradicionales
  const esModoPuntos = sistemaMagia === "puntos" && (pj.puntosConjuroMaximos ?? 0) > 0;
  const puntosDisponibles = Math.max(0, (pj.puntosConjuroMaximos ?? 0) - (pj.puntosConjuroGastados ?? 0));
  const vecesPrevias = r.usosRecuperadosConPuntos ?? 0;
  const costeSiguienteUso = (vecesPrevias + 1) * 2;
  const costeTotalPuntos = calcularCostePuntosRecuperacion(vecesPrevias, cantidadPuntos);
  const maximoUsosRecuperablesPuntos = calcularMaxUsosPagablesConPuntos(vecesPrevias, puntosDisponibles, usosFaltantes);

  // Opciones de espacios calculadas de forma compacta
  const opcionesEspacios: OpcionEspacio[] = useMemo(() => {
    const lista: OpcionEspacio[] = Array.from({ length: 9 }, (_, i) => i + 1).flatMap(nivel => {
      const disp = Math.max(0, (pj.espaciosConjuroMaximos[nivel] ?? 0) - (pj.espaciosConjuroGastados[nivel] ?? 0))
        + (pj.espaciosConjuroAdicionales?.[nivel] ?? 0);
      return disp > 0 ? [{ valor: String(nivel), etiqueta: `Nivel ${nivel} · ${disp} disponibles`, etiquetaCorta: `Nivel ${nivel}`, nivel, disponibles: disp, esPacto: false }] : [];
    });
    const pacto = pj.espaciosPactoMaximos - pj.espaciosPactoGastados;
    if (pacto > 0) {
      lista.push({ valor: "pacto", etiqueta: `Pacto nivel ${pj.nivelEspacioPacto} · ${pacto} disponibles`, etiquetaCorta: `Pacto Nv. ${pj.nivelEspacioPacto}`, nivel: pj.nivelEspacioPacto, disponibles: pacto, esPacto: true });
    }
    return lista;
  }, [pj.espaciosConjuroMaximos, pj.espaciosConjuroGastados, pj.espaciosConjuroAdicionales, pj.espaciosPactoMaximos, pj.espaciosPactoGastados, pj.nivelEspacioPacto]);

  const opcionSeleccionada = opcionesEspacios.find(o => o.valor === eleccionEspacio) ?? opcionesEspacios[0];
  const proyeccion = Math.min(usosMaximos, usosActuales + (esModoPuntos ? cantidadPuntos : cantidadPorEspacio));
  const esValido = !completa && (
    esModoPuntos
      ? maximoUsosRecuperablesPuntos > 0 && cantidadPuntos >= 1 && cantidadPuntos <= maximoUsosRecuperablesPuntos
      : opcionesEspacios.some(o => o.valor === eleccionEspacio)
  );

  const abrirModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEleccionEspacio(opcionesEspacios[0]?.valor ?? "");
    setCantidadPuntos(1);
    setError("");
    setMostrar(true);
  };

  const confirmar = () => {
    const operacion = esModoPuntos
      ? { tipo: "recuperarUsosConEspacio" as const, modo: "puntos" as const, idRasgo: r.id, puntos: costeTotalPuntos, cantidadUsos: cantidadPuntos }
      : { tipo: "recuperarUsosConEspacio" as const, modo: "espacio" as const, idRasgo: r.id, nivel: opcionSeleccionada?.esPacto ? pj.nivelEspacioPacto : opcionSeleccionada?.nivel ?? 1, pacto: opcionSeleccionada?.esPacto };
    const aplicado = usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, operacion);
    if (aplicado) setMostrar(false);
    else setError("El recurso o la reserva han cambiado. No se ha gastado ningún recurso.");
  };

  const botonDeshabilitado = completa || r.activo === false || (
    esModoPuntos ? puntosDisponibles < costeSiguienteUso : !opcionesEspacios.length
  );

  return (
    <>
      <button type="button" className={estilos.botonCompacto} disabled={botonDeshabilitado}
        title={esModoPuntos ? "Gastar puntos para recuperar usos" : "Gastar un espacio para recuperar usos"}
        onClick={abrirModal}>
        <RotateCcw size={13} aria-hidden="true" />Recuperar uso
      </button>

      {mostrar && (
        <dialog ref={dialogo} className={modal.dialogo} aria-label={`Recuperar usos: ${r.nombre}`}
          onCancel={() => setMostrar(false)} onClick={e => e.stopPropagation()}>
          <header className={modal.cabecera}>
            <Sparkles size={18} aria-hidden="true" />
            <h3>Recuperar {r.nombre}</h3>
            <button type="button" className={modal.cerrar} aria-label="Cerrar modal" title="Cerrar modal" onClick={() => setMostrar(false)}>
              <X size={18} />
            </button>
          </header>

          <div className={`${modal.cuerpo} ${local.cuerpoDialogo} u-scroll-cef`}>
            <div className={local.tarjetaResumen}>
              <div className={local.filaRegla}>
                <span className={local.insigniaAccion}>
                  <Zap size={11} aria-hidden="true" /> Sin acción requerida
                </span>
                <span className={local.conteoUsos}>
                  {esModoPuntos
                    ? <>Puntos: <strong>{puntosDisponibles} pts</strong> · Reserva: <strong>{usosActuales} / {usosMaximos}</strong></>
                    : <>Reserva: <strong>{usosActuales} / {usosMaximos}</strong></>}
                </span>
              </div>
              <div className={local.flujoConversion}>
                <div className={local.bloqueRecurso}>
                  <span className={local.etiquetaBloque}>Gasto</span>
                  <span className={local.valorBloque}>
                    {esModoPuntos ? `${costeTotalPuntos} ${costeTotalPuntos === 1 ? "Punto" : "Puntos"}` : "1 Espacio"}
                  </span>
                  <span className={local.subBloque}>
                    {esModoPuntos ? `${puntosDisponibles} pts disponibles` : (opcionSeleccionada ? opcionSeleccionada.etiquetaCorta : "Cualquier nivel")}
                  </span>
                </div>
                <div className={local.flechaFlujo} aria-hidden="true">
                  <ArrowRight size={15} />
                </div>
                <div className={local.bloqueRecurso}>
                  <span className={local.etiquetaBloque}>Recuperación</span>
                  <span className={local.valorBloqueGanancia}>
                    +{esModoPuntos ? cantidadPuntos : cantidadPorEspacio} {(esModoPuntos ? cantidadPuntos : cantidadPorEspacio) === 1 ? "uso" : "usos"}
                  </span>
                  <span className={local.subBloque}>Quedará en {proyeccion}/{usosMaximos}</span>
                </div>
              </div>
            </div>

            {esModoPuntos ? (
              maximoUsosRecuperablesPuntos > 0 ? (
                <div className={local.seccionPuntos}>
                  <div className={local.cabeceraSeleccion}>
                    <span className={local.etiquetaSeccion}>Cantidad de usos a recuperar</span>
                    <span className={local.ayudaSeccion}>
                      {vecesPrevias > 0
                        ? `Recuperados este descanso: ${vecesPrevias} · Siguiente: ${costeSiguienteUso} pts`
                        : "Coste escalonado: 2, 4, 6... pts"}
                    </span>
                  </div>
                  <div className={local.tarjetaContador}>
                    <div className={local.filaContador}>
                      <button
                        type="button"
                        className={local.botonContador}
                        disabled={cantidadPuntos <= 1}
                        aria-label="Restar un uso"
                        onClick={() => setCantidadPuntos(c => Math.max(1, c - 1))}
                      >
                        <Minus size={16} />
                      </button>
                      <div className={local.displayContador}>
                        <span className={local.numeroContador}>{cantidadPuntos}</span>
                        <span className={local.etiquetaContador}>{cantidadPuntos === 1 ? "uso" : "usos"}</span>
                      </div>
                      <button
                        type="button"
                        className={local.botonContador}
                        disabled={cantidadPuntos >= maximoUsosRecuperablesPuntos}
                        aria-label="Sumar un uso"
                        onClick={() => setCantidadPuntos(c => Math.min(maximoUsosRecuperablesPuntos, c + 1))}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        className={local.botonMaximo}
                        disabled={cantidadPuntos >= maximoUsosRecuperablesPuntos}
                        onClick={() => setCantidadPuntos(maximoUsosRecuperablesPuntos)}
                      >
                        Máx ({maximoUsosRecuperablesPuntos})
                      </button>
                    </div>
                    <div className={local.resumenCostePuntos}>
                      <div className={local.itemCostePuntos}>
                        <span>Coste total</span>
                        <strong>{costeTotalPuntos} puntos</strong>
                      </div>
                      <div className={local.itemCostePuntos}>
                        <span>Puntos restantes</span>
                        <strong className={local.puntosRestantes}>
                          {puntosDisponibles - costeTotalPuntos} de {pj.puntosConjuroMaximos}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={local.avisoVacio} role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>
                    {puntosDisponibles < costeSiguienteUso
                      ? `No tienes suficientes puntos de conjuro (se requieren ${costeSiguienteUso} puntos para el siguiente uso).`
                      : "Tu reserva de usos ya se encuentra al máximo."}
                  </span>
                </div>
              )
            ) : (
              opcionesEspacios.length > 0 ? (
                <div className={local.seccionSeleccion}>
                  <div className={local.cabeceraSeleccion}>
                    <span className={local.etiquetaSeccion}>Espacio que consumir</span>
                    <span className={local.ayudaSeccion}>Gasta 1 de cualquier nivel</span>
                  </div>
                  <div className={local.rejillaEspacios} role="radiogroup" aria-label="Espacio que gastar">
                    {opcionesEspacios.map(op => {
                      const estaSeleccionada = op.valor === eleccionEspacio;
                      const restantes = op.disponibles - 1;
                      return (
                        <button
                          key={op.valor}
                          type="button"
                          role="radio"
                          aria-checked={estaSeleccionada}
                          className={`${local.tarjetaEspacio} ${estaSeleccionada ? local.tarjetaEspacioActiva : ""}`}
                          onClick={() => {
                            setEleccionEspacio(op.valor);
                            setError("");
                          }}
                        >
                          <div className={local.filaTarjetaEspacio}>
                            <span className={op.esPacto ? local.insigniaPacto : local.insigniaNivel}>
                              {op.esPacto ? `Pacto Nv. ${pj.nivelEspacioPacto}` : `Nivel ${op.nivel}`}
                            </span>
                            {estaSeleccionada && <Check size={14} className={local.checkActivo} aria-hidden="true" />}
                          </div>
                          <div className={local.detallesEspacio}>
                            <span className={local.conteoDisponibles}>{op.disponibles} disp.</span>
                            <span className={local.proyeccionRestante}>Quedarán {restantes}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={local.avisoVacio} role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>No tienes espacios de conjuro disponibles para gastar.</span>
                </div>
              )
            )}

            {error && (
              <div className={local.alertaError} role="alert">
                <AlertCircle size={15} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <footer className={modal.acciones}>
            <button type="button" onClick={() => setMostrar(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className={modal.principal}
              disabled={!esValido}
              onClick={confirmar}
            >
              <Sparkles size={14} aria-hidden="true" />
              {esModoPuntos ? `Gastar ${costeTotalPuntos} puntos y recuperar` : "Gastar espacio y recuperar"}
            </button>
          </footer>
        </dialog>
      )}
    </>
  );
}
