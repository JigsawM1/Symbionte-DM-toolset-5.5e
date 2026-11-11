import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { resolverTablaRasgo, tirarFilasTabla, resolverFilaTabla, type FilaTablaRasgo } from "@/servicios/rasgos/tablasAleatoriasRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { ts } from "@/utiles/TaleSpireAdapter";
import { logger } from "@/utiles/logger";
import { TextoEnriquecidoDND } from "@/componentes/comunes";
import { Sparkles, Dices, X, Send, Info, CheckCircle2, Flame } from "lucide-react";
import estilos from "./ControlesRecursosDeclarativos.module.css";
import modal from "./DialogoRasgo.module.css";
import estilosTabla from "./TablaAleatoriaRasgo.module.css";

function obtenerIconoRasgoTabla(nombre: string): ReactNode {
  const norm = nombre.toLowerCase();
  if (norm.includes("presagio") || norm.includes("estrella") || norm.includes("cosmico") || norm.includes("augurio")) {
    return <Sparkles size={18} />;
  }
  if (norm.includes("caos") || norm.includes("oleada") || norm.includes("salvaje") || norm.includes("fuego")) {
    return <Flame size={18} />;
  }
  return <Dices size={18} />;
}

export function TablaAleatoriaRasgo({ personaje: pj, rasgo: r }: { personaje: PersonajeJugador; rasgo: RasgoPersonaje }) {
  const [abierto, abrir] = useState(false);
  const [filas, elegir] = useState<{ tirada?: number; fila: FilaTablaRasgo }[]>([]);
  const [ocupado, bloquear] = useState(false);
  const [mensaje, informar] = useState("");
  const candado = useRef(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (abierto) dialogo.current?.showModal(); }, [abierto]);
  const tabla = resolverTablaRasgo(pj, r.id);
  if (!tabla) return r.tablaAleatoria ? <button type="button" disabled title="La referencia o configuración de la tabla no es válida.">Tabla no disponible</button> : null;
  const cfg = tabla.configuracion;
  const accion = tabla.rasgoAccion;
  if (cfg.presentacion === "magia_salvaje") return <button type="button"
    className={`${estilos.botonCompacto} ${estilos.botonMagiaSalvaje}`}
    onClick={e => {
      e.stopPropagation();
      usarAlmacenDM.setState({ pestañaActiva: "magia_salvaje", tablaRasgoAbierta: { idPersonaje: pj.id, idRasgo: r.id } });
    }}>Ver Magia Salvaje</button>;
  const pendiente = accion.resultadoTabla && !accion.resultadoTabla.enviado;
  const recarga = cfg.modo === "recargar";
  const agotado = !tabla.disponible;
  const enviar = async (texto: string) => {
    try {
      const enviado = ts.estaDisponible ? await ts.chat.send(texto) : true;
      if (enviado) usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, { tipo: "enviarTabla", idRasgo: accion.id, textoResultado: texto });
      informar(!ts.estaDisponible ? "Resultado local; TaleSpire no está conectado." : enviado ? "Resultado enviado al chat." : "Falló el envío. Reintenta el mismo resultado.");
    } catch (err) {
      logger.error("[TablaAleatoriaRasgo] Error al enviar resultado al chat:", err);
      informar("Falló el envío. Reintenta el mismo resultado.");
    }
  };
  const resolver = async (fila: FilaTablaRasgo, tirada?: number) => {
    if (candado.current) return;
    candado.current = true; bloquear(true);
    try {
      const texto = `${pj.nombre} · ${r.nombre}${tirada ? ` · 1d${cfg.dado}: ${tirada}` : " · Elección de fila"}\n${resolverFilaTabla(fila)}`;
      if (!usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj.id, { tipo: "guardarTabla", idRasgo: accion.id, texto,
        detalle: { idFila: fila.id, tiradaD100: tirada } })) {
        informar("Los usos o el resultado pendiente cambiaron."); return;
      }
      elegir([]); await enviar(texto);
    } catch (err) {
      logger.error("[TablaAleatoriaRasgo] Error al resolver fila de tabla:", err);
      informar("No se pudo resolver la fila de la tabla.");
    } finally { candado.current = false; bloquear(false); }
  };
  const preparar = () => {
    if (candado.current) return;
    abrir(true); informar("");
    elegir(cfg.modo === "elegir" ? cfg.filas.map(fila => ({ fila })) : []);
  };
  return <>
    <button type="button" className={estilos.botonCompacto} disabled={!pendiente && agotado} onClick={e => { e.stopPropagation(); preparar(); }}>
      {pendiente ? "Ver resultado pendiente" : recarga ? "Confirmar conjuro y recargar" : cfg.modo === "elegir" ? "Elegir efecto de oleada" : "Tirar en la tabla"}</button>
    {abierto && <dialog ref={dialogo} className={`${modal.dialogo} ${estilosTabla.dialogoTabla}`} aria-label={`Tabla: ${r.nombre}`} onClick={e => e.stopPropagation()}
      onCancel={e => { if (ocupado) e.preventDefault(); else abrir(false); }}>
      <header className={estilosTabla.cabecera}>
        <div className={estilosTabla.medallonIcono} aria-hidden="true">
          {obtenerIconoRasgoTabla(r.nombre)}
        </div>
        <div className={estilosTabla.titulos}>
          <span className={estilosTabla.kicker}>
            {cfg.modo === "elegir" ? "Selección de efecto" : "Tabla de rasgo · Augurio & Azar"}
          </span>
          <h3 className={estilosTabla.titulo}>{r.nombre}</h3>
        </div>
        <button
          type="button"
          className={estilosTabla.botonCerrarCabecera}
          title="Cerrar tabla"
          aria-label="Cerrar tabla"
          disabled={ocupado}
          onClick={() => abrir(false)}
        >
          <X size={16} />
        </button>
      </header>

      <div className={`u-scroll-cef ${modal.cuerpo} ${estilosTabla.cuerpo}`}>
        {recarga && (
          <div className={estilosTabla.panelRecarga}>
            <Sparkles size={15} className={estilosTabla.iconoAvisoRecarga} />
            <p className={estilosTabla.textoAvisoRecarga}>
              Confirma que has lanzado un conjuro de hechicero con un espacio. Recuperarás el uso y resolverás una oleada.
            </p>
          </div>
        )}

        <div className={estilosTabla.panelDirectiva}>
          <div className={estilosTabla.iconoDirectiva} aria-hidden="true">
            <Info size={15} />
          </div>
          <div className={estilosTabla.cuerpoDirectiva}>
            <span className={estilosTabla.tituloDirectiva}>Directiva de resolución</span>
            <p className={estilosTabla.textoDirectiva}>
              Elige el resultado antes de resolver las subtiradas. Las consecuencias se aplican manualmente.
            </p>
          </div>
        </div>

        {!pendiente && !filas.length && (
          <div className={estilosTabla.contenedorTiradaInicial}>
            <button
              type="button"
              className={estilosTabla.botonDeterminar}
              disabled={ocupado || agotado}
              onClick={() => {
                try {
                  elegir(tirarFilasTabla(cfg));
                } catch (err) {
                  logger.error("[TablaAleatoriaRasgo] Error al tirar filas de tabla:", err);
                  informar("La configuración de la tabla es inválida.");
                }
              }}
            >
              <Dices size={20} className={estilosTabla.iconoDadoDeterminar} />
              <div className={estilosTabla.textoBotonDeterminar}>
                <span className={estilosTabla.accionPrincipalDeterminar}>
                  {recarga ? "Confirmar conjuro y determinar oleada" : `Determinar ${cfg.tiradas === 2 ? "dos resultados" : "resultado"}`}
                </span>
                <span className={estilosTabla.subtextoDado}>
                  {cfg.dado ? `Tirada en dado 1d${cfg.dado}` : "Tirada en tabla"}
                </span>
              </div>
            </button>
          </div>
        )}

        {!pendiente && filas.length > 0 && (
          <div className={estilosTabla.listaResultados}>
            {filas.map((f, i) => (
              <div key={`${f.fila.id}_${i}`} className={estilosTabla.tarjetaOpcion}>
                <div className={estilosTabla.cabeceraOpcion}>
                  <div className={estilosTabla.badgesOpcion}>
                    {f.tirada !== undefined && (
                      <span className={estilosTabla.badgeTirada}>
                        <Dices size={13} />
                        <span>1d{cfg.dado}: <strong>{f.tirada}</strong></span>
                      </span>
                    )}
                    <span className={estilosTabla.badgeRango}>
                      Rango {f.fila.desde === f.fila.hasta ? f.fila.desde : `${f.fila.desde}–${f.fila.hasta}`}
                    </span>
                  </div>
                  {filas.length > 1 && (
                    <span className={estilosTabla.numeroOpcion}>Opción {i + 1} de {filas.length}</span>
                  )}
                </div>

                <div className={estilosTabla.textoEfecto}>
                  <TextoEnriquecidoDND texto={`${f.fila.desde === f.fila.hasta ? `${f.fila.desde}: ` : `${f.fila.desde}–${f.fila.hasta}: `}${f.fila.texto}`} />
                </div>

                <div className={estilosTabla.pieOpcion}>
                  <button
                    type="button"
                    className={estilosTabla.botonResolverOpcion}
                    disabled={ocupado}
                    onClick={() => void resolver(f.fila, f.tirada)}
                  >
                    <Sparkles size={14} className={estilosTabla.iconoResolver} />
                    <span>Resolver resultado {i + 1}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {accion.resultadoTabla && (
          <div className={estilosTabla.tarjetaResultadoFijado}>
            <div className={estilosTabla.cabeceraResultadoFijado}>
              <CheckCircle2 size={16} className={estilosTabla.iconoExitoFijado} />
              <span className={estilosTabla.tituloResultadoFijado}>
                {pendiente ? "Resultado pendiente de envío" : "Resultado activo en el personaje"}
              </span>
            </div>
            <div className={estilosTabla.cuerpoResultadoFijado}>
              <TextoEnriquecidoDND texto={accion.resultadoTabla.texto} />
            </div>
            {pendiente && (
              <button
                type="button"
                className={estilosTabla.botonReintentarEnvio}
                disabled={ocupado}
                onClick={async () => {
                  if (candado.current) return;
                  candado.current = true;
                  bloquear(true);
                  try {
                    await enviar(accion.resultadoTabla!.texto);
                  } finally {
                    candado.current = false;
                    bloquear(false);
                  }
                }}
              >
                <Send size={13} />
                <span>Reintentar envío</span>
              </button>
            )}
          </div>
        )}

        {mensaje && (
          <div className={estilosTabla.mensajeEstado} role="status">
            <Info size={14} />
            <span>{mensaje}</span>
          </div>
        )}
      </div>

      <footer className={`${modal.acciones} ${estilosTabla.pie}`}>
        <button
          type="button"
          className={estilosTabla.botonCerrarFooter}
          disabled={ocupado}
          onClick={() => abrir(false)}
        >
          Cerrar tabla
        </button>
      </footer>
    </dialog>}
  </>;
}
