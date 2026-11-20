import React, { useMemo } from "react";
import { Sparkles, Zap, BookOpen, AlertTriangle } from "lucide-react";
import { DivisorSeccionAccion } from "./DivisorSeccionAccion";
import type { HechizoBase } from "@/tipos";
import type { HechizoObjetoMagicoAccion } from "./usarCalculoAtaquesJugador";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionHechizosObjetosMagicosProps {
  hechizosObjetosFiltrados: HechizoObjetoMagicoAccion[];
  mostrarDivisor?: boolean;
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  cdSalvacionPersonaje?: number;
  alAbrirDetalle?: (hechizo: HechizoBase) => void;
  alLanzar: (opciones: {
    modo: "objetoMagico";
    hechizo: HechizoBase;
    objetoNombre: string;
    objetoInstanciaId: string;
    bonoAtaqueObjeto?: number;
    cdObjeto?: number;
    costeCargasObjeto?: number;
  }) => Promise<boolean>;
}

export const SeccionHechizosObjetosMagicos: React.FC<SeccionHechizosObjetosMagicosProps> = React.memo(({
  hechizosObjetosFiltrados,
  mostrarDivisor = true,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  cdSalvacionPersonaje,
  alAbrirDetalle,
  alLanzar
}) => {
  const { baseDatosHechizos } = usarEstadoHomebrew();

  const indiceCompendio = useMemo(() => {
    if (hechizosObjetosFiltrados.length === 0 || !baseDatosHechizos?.length) {
      return null;
    }
    const porId = new Map<string, HechizoBase>();
    const porNombre = new Map<string, HechizoBase>();
    for (const h of baseDatosHechizos) {
      porId.set(h.id, h);
      porNombre.set(h.nombre.toLowerCase().trim(), h);
    }
    return { porId, porNombre };
  }, [hechizosObjetosFiltrados.length, baseDatosHechizos]);

  if (hechizosObjetosFiltrados.length === 0) {
    return null;
  }

  const listaTarjetas = (
    <div className={estilos.listaAtaques}>
      {hechizosObjetosFiltrados.map((item) => {
            const coste = Number(item.hechizo.costeCargas) || 0;
            const tieneCargas = coste === 0 || item.cargasActuales >= coste;

            // Búsqueda O(1) en el índice precalculado del compendio
            const hechizoCompendio =
              (item.hechizo.hechizoId ? indiceCompendio?.porId.get(item.hechizo.hechizoId) : undefined) ||
              indiceCompendio?.porNombre.get(item.hechizo.nombre.toLowerCase().trim());

            const cdFinal = item.hechizo.cd !== undefined ? item.hechizo.cd : cdSalvacionPersonaje;

            const objetoHechizoBase: HechizoBase = hechizoCompendio || {
              id: item.hechizo.hechizoId || item.hechizo.nombre.toLowerCase().replace(/\s+/g, "-"),
              nombre: item.hechizo.nombre,
              nivel: item.hechizo.nivel ?? 1,
              escuela: "Universal",
              tiempoLanzamiento:
                item.tipoAccion === "accionAdicional"
                  ? "1 Accion Adicional"
                  : item.tipoAccion === "reaccion"
                  ? "1 Reaccion"
                  : "1 Accion",
              alcance: "60 pies",
              componentesSeleccionados: {
                verbal: true,
                somatico: true,
                material: false
              },
              duracion: "Instantaneo",
              concentracion: false,
              ritual: false,
              descripcion: ""
            };

            const lanzarHechizo = async () => {
              await alLanzar({
                modo: "objetoMagico",
                hechizo: objetoHechizoBase,
                objetoNombre: item.objetoNombre,
                objetoInstanciaId: item.objetoInstanciaId,
                bonoAtaqueObjeto: item.hechizo.bonoAtaque,
                cdObjeto: cdFinal,
                costeCargasObjeto: coste
              });
            };

            const claseBadgeAccion =
              item.tipoAccion === "accionAdicional"
                ? estilos.badgeAccionAdicional
                : item.tipoAccion === "reaccion"
                ? estilos.badgeReaccion
                : "";

            const etiquetaBadgeAccion =
              item.tipoAccion === "accionAdicional"
                ? "Adicional"
                : item.tipoAccion === "reaccion"
                ? "Reacción"
                : "Acción";

            const estaBloqueado = !tieneCargas || estaBloqueadoPorArmadura;

            return (
              <article
                key={`${item.objetoInstanciaId}_${item.hechizo.hechizoId || item.hechizo.nombre}_${item.tipoAccion}`}
                className={estilos.tarjetaHechizoObjetoV2}
                data-accion={item.tipoAccion}
                data-bloqueado={estaBloqueado ? "true" : undefined}
              >
                <div className={estilos.filaSuperiorTarjetaV2}>
                  <div className={estilos.grupoTituloIzquierdaV2}>
                    <Sparkles size={14} color="var(--pj-texto-magia)" aria-hidden="true" />
                    <div className={estilos.bloqueTituloObjetoV2}>
                      {alAbrirDetalle ? (
                        <button
                          type="button"
                          className={estilos.botonTituloHechizoObjeto}
                          onClick={() => alAbrirDetalle(objetoHechizoBase)}
                          title={`Ver ficha completa de ${item.hechizo.nombre}`}
                        >
                          <span>{item.hechizo.nombre}</span>
                          <span className={estilos.chipFichaObjeto}>
                            <BookOpen size={10} aria-hidden="true" />
                            <span>Ficha</span>
                          </span>
                        </button>
                      ) : (
                        <span>{item.hechizo.nombre}</span>
                      )}
                      <span className={estilos.subtituloOrigenObjeto}>
                        {item.objetoNombre}
                        {hechizoCompendio
                          ? ` · Nv. ${hechizoCompendio.nivel} · ${hechizoCompendio.escuela} · ${hechizoCompendio.alcance}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className={estilos.badgesDerechaTarjetaV2}>
                    {item.cargasMaximas > 0 ? (
                      <span
                        className={estilos.pillCargasObjeto}
                        data-estado={tieneCargas ? "disponible" : "agotado"}
                      >
                        <Zap size={10} aria-hidden="true" /> {item.cargasActuales}/{item.cargasMaximas}
                      </span>
                    ) : (
                      coste === 0 && (
                        <span className={estilos.pillCargasObjeto} data-estado="voluntad">
                          A voluntad
                        </span>
                      )
                    )}
                    <span className={`${estilos.badgeAccionTipo} ${claseBadgeAccion}`.trim()}>
                      {etiquetaBadgeAccion}
                    </span>
                  </div>
                </div>

                <div className={estilos.bandaMetricasObjetoV2}>
                  <div className={estilos.grupoMetricasObjetoV2}>
                    <div className={estilos.itemMetricaObjetoV2}>
                      <span className={estilos.etiquetaMetricaObjeto}>
                        {item.hechizo.bonoAtaque !== undefined
                          ? "Impacto"
                          : cdFinal !== undefined
                          ? "Salvación"
                          : "Efecto"}
                      </span>
                      <span className={estilos.valorMetricaObjeto}>
                        {item.hechizo.bonoAtaque !== undefined
                          ? `+${item.hechizo.bonoAtaque}`
                          : cdFinal !== undefined
                          ? `CD ${cdFinal}`
                          : "Especial"}
                      </span>
                    </div>

                    {(hechizoCompendio?.dadosDaño || hechizoCompendio?.duracion) && (
                      <>
                        <span className={estilos.separadorMetricaObjeto} aria-hidden="true" />
                        <div className={estilos.itemMetricaObjetoV2}>
                          <span className={estilos.etiquetaMetricaObjeto}>
                            {hechizoCompendio.dadosDaño ? "Daño" : "Duración"}
                          </span>
                          <span className={estilos.valorMetricaSecundaria}>
                            {hechizoCompendio.dadosDaño
                              ? `${hechizoCompendio.dadosDaño}${
                                  hechizoCompendio.tipoDaño ? ` ${hechizoCompendio.tipoDaño}` : ""
                                }`
                              : hechizoCompendio.duracion}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {estaBloqueado ? (
                    <button
                      type="button"
                      disabled
                      className={estilos.botonBloqueadoObjeto}
                      title={
                        estaBloqueadoPorArmadura
                          ? motivoBloqueoArmadura || "Bloqueado por armadura sin competencia"
                          : "Cargas insuficientes para lanzar este conjuro"
                      }
                    >
                      <AlertTriangle size={12} aria-hidden="true" />
                      <span>
                        {estaBloqueadoPorArmadura
                          ? "Bloqueado: Armadura"
                          : `Sin cargas (${item.cargasActuales}/${item.cargasMaximas})`}
                      </span>
                    </button>
                  ) : (
                    <div className={estilos.splitLanzarObjeto}>
                      <span
                        className={estilos.celdaCosteObjeto}
                        data-voluntad={coste === 0 ? "true" : undefined}
                      >
                        {coste > 0 ? `-${coste} ${coste === 1 ? "carga" : "cargas"}` : "0 cargas"}
                      </span>
                      <button
                        type="button"
                        className={estilos.botonLanzarSplitObjeto}
                        onClick={lanzarHechizo}
                        title="Lanzar conjuro desde el objeto"
                      >
                        <Sparkles size={12} aria-hidden="true" />
                        <span>Lanzar</span>
                      </button>
                    </div>
                  )}
                </div>
              </article>
          );
        })}
      </div>
  );

  if (!mostrarDivisor) {
    return listaTarjetas;
  }

  return (
    <section className={estilos.bloqueSeccionPlana} aria-label="Hechizos de objetos mágicos">
      <DivisorSeccionAccion
        icono={<Sparkles size={13} color="var(--pj-texto-magia)" aria-hidden="true" />}
        titulo="Objetos Mágicos"
        conteo={hechizosObjetosFiltrados.length}
        tono="magia"
      />
      {listaTarjetas}
    </section>
  );
});

SeccionHechizosObjetosMagicos.displayName = "SeccionHechizosObjetosMagicos";
