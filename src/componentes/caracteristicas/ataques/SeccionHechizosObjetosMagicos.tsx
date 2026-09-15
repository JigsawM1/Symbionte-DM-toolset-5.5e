import React from "react";
import { Sparkles, Zap, ChevronDown, ChevronRight } from "lucide-react";
import type { HechizoBase } from "@/tipos";
import type { HechizoObjetoMagicoAccion } from "./usarCalculoAtaquesJugador";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
import estilos from "./VistaAtaquesJugador.module.css";

interface SeccionHechizosObjetosMagicosProps {
  hechizosObjetosFiltrados: HechizoObjetoMagicoAccion[];
  estaAbierta: boolean;
  alAlternar: () => void;
  estaBloqueadoPorArmadura: boolean;
  motivoBloqueoArmadura?: string;
  cdSalvacionPersonaje?: number;
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

export const SeccionHechizosObjetosMagicos: React.FC<SeccionHechizosObjetosMagicosProps> = ({
  hechizosObjetosFiltrados,
  estaAbierta,
  alAlternar,
  estaBloqueadoPorArmadura,
  motivoBloqueoArmadura,
  cdSalvacionPersonaje,
  alLanzar
}) => {
  const { baseDatosHechizos } = usarEstadoHomebrew();

  if (hechizosObjetosFiltrados.length === 0) {
    return null;
  }

  return (
    <div className={estilos.seccionGrupoAtaques}>
      <div
        className={estilos.cabeceraGrupoAtaques}
        onClick={alAlternar}
        role="button"
        tabIndex={0}
        title="Clic para mostrar u ocultar hechizos de objetos mágicos"
      >
        <div className={estilos.tituloGrupoAtaques}>
          <Sparkles size={14} color="#ec4899" />
          <span>Hechizos de Objetos Mágicos</span>
          <span className={estilos.badgeConteoSeccion}>{hechizosObjetosFiltrados.length}</span>
        </div>
        <div className={estilos.ladoDerechoCabecera}>
          {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {estaAbierta && (
        <div className={estilos.listaAtaques}>
          {hechizosObjetosFiltrados.map((item, idx) => {
            const coste = Number(item.hechizo.costeCargas) || 0;
            const tieneCargas = coste === 0 || item.cargasActuales >= coste;

            // Buscar en compendio si existe el hechizo real
            const hechizoCompendio = (baseDatosHechizos || []).find(
              (h) => (item.hechizo.hechizoId && h.id === item.hechizo.hechizoId) ||
                     h.nombre.toLowerCase().trim() === item.hechizo.nombre.toLowerCase().trim()
            );

            const cdFinal = item.hechizo.cd !== undefined ? item.hechizo.cd : cdSalvacionPersonaje;

            const lanzarHechizo = async () => {
              const objetoHechizoBase: HechizoBase = hechizoCompendio || {
                id: item.hechizo.hechizoId || item.hechizo.nombre.toLowerCase().replace(/\s+/g, "-"),
                nombre: item.hechizo.nombre,
                nivel: item.hechizo.nivel ?? 1,
                escuela: "Universal",
                tiempoLanzamiento: item.tipoAccion === "accionAdicional" ? "1 Accion Adicional" : item.tipoAccion === "reaccion" ? "1 Reaccion" : "1 Accion",
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

            return (
              <div
                key={idx}
                className={`${estilos.tarjetaAtaque} ${estilos.tarjetaHechizoObjeto}`}
              >
                <div className={estilos.filaSuperiorAtaque}>
                  <div className={estilos.grupoTitulo}>
                    <Sparkles size={14} color="#ec4899" />
                    <span className={estilos.nombreAtaque}>{item.hechizo.nombre}</span>
                    <span className={estilos.nombreFuenteObjeto}>({item.objetoNombre})</span>
                  </div>
                  <div className={estilos.grupoTitulo}>
                    {item.cargasMaximas > 0 && (
                      <span className={item.cargasActuales > 0 ? estilos.badgeCargasObjeto : estilos.badgeCargasVacias}>
                        <Zap size={10} /> {item.cargasActuales}/{item.cargasMaximas} cargas
                      </span>
                    )}
                    <span className={estilos.badgeAccionTipo}>
                      {item.tipoAccion === "accionAdicional" ? "Acción Adicional" : item.tipoAccion === "reaccion" ? "Reacción" : "Acción"}
                    </span>
                  </div>
                </div>

                <div className={estilos.filaMetricasAtaque}>
                  <div className={estilos.bloqueBonoImpacto}>
                    <span className={estilos.etiquetaMicro}>
                      {item.hechizo.bonoAtaque !== undefined ? "Impacto" : cdFinal !== undefined ? "Salvación" : "Efecto"}
                    </span>
                    <span className={estilos.valorBonoImpacto}>
                      {item.hechizo.bonoAtaque !== undefined
                        ? `+${item.hechizo.bonoAtaque}`
                        : cdFinal !== undefined
                        ? `CD ${cdFinal}`
                        : "Especial"}
                    </span>
                  </div>

                  {coste > 0 && (
                    <div className={estilos.bloqueDano}>
                      <span className={estilos.etiquetaMicro}>Coste</span>
                      <span className={`${estilos.valorDano} ${estilos.costeCargasTexto}`}>
                        {coste} {coste === 1 ? "carga" : "cargas"}
                      </span>
                    </div>
                  )}

                  <div className={estilos.filaAccionesTirada}>
                    <button
                      type="button"
                      className={`${estilos.botonTirarAtaque} ${estilos.botonLanzarObjeto}`}
                      onClick={lanzarHechizo}
                      disabled={!tieneCargas || estaBloqueadoPorArmadura}
                      title={
                        estaBloqueadoPorArmadura
                          ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
                          : !tieneCargas
                          ? "Cargas insuficientes para lanzar este conjuro"
                          : "Lanzar conjuro desde el objeto"
                      }
                      style={estaBloqueadoPorArmadura ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                    >
                      <Sparkles size={11} />
                      <span>{coste > 0 ? `Lanzar (-${coste})` : "Lanzar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
