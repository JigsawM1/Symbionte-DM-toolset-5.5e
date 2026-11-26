import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { resolverExtensionesRasgos } from "@/servicios/rasgos/extensionesRasgos";
import {
  obtenerGruposPredefiniblesRasgo,
  valorPredefinido
} from "@/servicios/rasgos/respuestasPredefinidasRasgos";
import { guardarResolucionPredefinida, guardarRespuestaPredefinida } from "./guardarRespuestaPredefinida";
import { Zap } from "lucide-react";
import estilos from "./ConfiguracionRespuestaPredefinida.module.css";

interface ConfiguracionRespuestaPredefinidaProps {
  personaje: PersonajeJugador;
  rasgo: RasgoPersonaje;
}

export function ConfiguracionRespuestaPredefinida({
  personaje,
  rasgo
}: ConfiguracionRespuestaPredefinidaProps) {
  const rasgoVigente =
    resolverExtensionesRasgos(personaje.rasgos, personaje.nivel).find(r => r.id === rasgo.id)
    ?? personaje.rasgos.find(r => r.id === rasgo.id)
    ?? rasgo;
  const grupos = obtenerGruposPredefiniblesRasgo(rasgoVigente);
  if (!grupos.length) return null;

  const prefResolucion = rasgoVigente.respuestaPredefinida?.resolucion;
  const cfgAsistida = rasgoVigente.resolucionAsistida;
  const opcionResolucion = prefResolucion
    ? cfgAsistida?.opciones.find(o => o.id === prefResolucion.idOpcion)
    : undefined;
  const admitePropio = Boolean(
    cfgAsistida?.permitePropio
    && (cfgAsistida.curacionSimultanea || ["curacion", "hp_temporal"].includes(opcionResolucion?.tipo ?? ""))
  );

  return (
    <section className={estilos.seccion} aria-label="Respuesta automática">
      <div className={estilos.cabecera}>
        <Zap size={13} aria-hidden="true" />
        <h4 className={estilos.titulo}>Respuesta automática</h4>
      </div>

      <div className={estilos.listaGrupos}>
        {grupos.map(grupo => {
          if (grupo.maxMultiple) {
            const seleccionados = rasgoVigente.respuestaPredefinida?.efectosTirada ?? [];
            const opcionesEfecto = grupo.opciones.filter(o => o.valor !== "preguntar");
            return (
              <div key={grupo.flujo} className={estilos.grupo}>
                <div className={estilos.etiquetaFila}>
                  <span className={estilos.etiqueta}>{grupo.titulo}</span>
                  <span className={estilos.nota}>
                    Máx. {grupo.maxMultiple} · Sin selección pregunta siempre
                  </span>
                </div>
                <div className={estilos.listaChecks}>
                  {opcionesEfecto.map(op => {
                    const marcado = seleccionados.includes(op.valor);
                    const bloqueado = !marcado && seleccionados.length >= grupo.maxMultiple!;
                    return (
                      <label
                        key={op.valor}
                        className={`${estilos.opcionCheck} ${marcado ? estilos.opcionCheckActiva : ""} ${bloqueado ? estilos.opcionCheckBloqueada : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          disabled={bloqueado}
                          onChange={e => {
                            const siguientes = e.target.checked
                              ? [...seleccionados, op.valor].slice(0, grupo.maxMultiple)
                              : seleccionados.filter(v => v !== op.valor);
                            guardarRespuestaPredefinida(personaje.id, rasgoVigente.id, grupo.flujo, siguientes);
                          }}
                        />
                        <span>{op.etiqueta}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div key={grupo.flujo} className={estilos.grupo}>
              <span className={estilos.etiqueta}>{grupo.titulo}</span>
              <SelectorDesplegable
                titulo={grupo.titulo}
                valor={valorPredefinido(rasgoVigente, grupo.flujo)}
                opciones={grupo.opciones}
                alCambiar={valor => guardarRespuestaPredefinida(personaje.id, rasgoVigente.id, grupo.flujo, valor)}
                enFlujo
              />
              {grupo.flujo === "resolucion" && prefResolucion && (cfgAsistida?.dadosOpcionales || admitePropio) && (
                <div className={estilos.opcionesExtra}>
                  {cfgAsistida?.dadosOpcionales && (
                    <label className={estilos.checkExtra}>
                      <input
                        type="checkbox"
                        checked={Boolean(prefResolucion.incluirDados)}
                        onChange={e => guardarResolucionPredefinida(personaje.id, rasgoVigente.id, {
                          ...prefResolucion,
                          incluirDados: e.target.checked
                        })}
                      />
                      <span>Incluir dados opcionales</span>
                    </label>
                  )}
                  {admitePropio && (
                    <label className={estilos.checkExtra}>
                      <input
                        type="checkbox"
                        checked={Boolean(prefResolucion.propio)}
                        onChange={e => guardarResolucionPredefinida(personaje.id, rasgoVigente.id, {
                          ...prefResolucion,
                          propio: e.target.checked
                        })}
                      />
                      <span>Aplicar a mi personaje</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
