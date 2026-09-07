import React from "react";
import type { ObjetoInventario } from "@/tipos";
import { Backpack, ChevronDown, ChevronRight } from "lucide-react";
import type { CriterioOrdenMochila, SubseccionMochilaTipo } from "../usarInventarioOrdenado";
import { BarraHerramientasInventario } from "../BarraHerramientasInventario";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

interface SeccionMochilaInventarioProps {
  zonaDropActiva: string | null;
  objetosMochilaFiltrados: ObjetoInventario[];
  objetosMochilaBase: ObjetoInventario[];
  busquedaMochila: string;
  alCambiarBusqueda: (v: string) => void;
  criterioOrden: CriterioOrdenMochila;
  alCambiarOrden: (v: CriterioOrdenMochila) => void;
  alExpandirTodas: () => void;
  alColapsarTodas: () => void;
  alAbrirModalAgregar: () => void;
  seccionesAbiertas: Record<string, boolean>;
  alAlternarSeccion: (id: string) => void;
  subseccionesPorTipo: SubseccionMochilaTipo[];
  objetosMochilaOrdenadosPlano: ObjetoInventario[];
  alDragOver: (e: React.DragEvent, zona: string) => void;
  alDragLeave: (e: React.DragEvent, zona: string) => void;
  alDrop: (e: React.DragEvent, zona: string) => void;
  renderizarTarjeta: (obj: ObjetoInventario) => React.ReactNode;
}

export const SeccionMochilaInventario: React.FC<SeccionMochilaInventarioProps> = ({
  zonaDropActiva,
  objetosMochilaFiltrados,
  objetosMochilaBase,
  busquedaMochila,
  alCambiarBusqueda,
  criterioOrden,
  alCambiarOrden,
  alExpandirTodas,
  alColapsarTodas,
  alAbrirModalAgregar,
  seccionesAbiertas,
  alAlternarSeccion,
  subseccionesPorTipo,
  objetosMochilaOrdenadosPlano,
  alDragOver,
  alDragLeave,
  alDrop,
  renderizarTarjeta
}) => {
  return (
    <div
      className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
        zonaDropActiva === "mochila" ? estilos.zonaDropActiva : ""
      }`}
      onDragOver={(e) => alDragOver(e, "mochila")}
      onDragLeave={(e) => alDragLeave(e, "mochila")}
      onDrop={(e) => alDrop(e, "mochila")}
    >
      <div className={estilos.cabeceraGrupoInventario}>
        <div className={estilos.tituloGrupoInventario}>
          <Backpack size={14} color="#f59e0b" />
          <span>Mochila</span>
        </div>
        <span className={estilos.contadorGrupoInventario}>
          {objetosMochilaFiltrados.length} / {objetosMochilaBase.length}
        </span>
      </div>

      {/* Barra de Búsqueda Rápida, Selector de Orden y Controles de Colapso */}
      <BarraHerramientasInventario
        busquedaMochila={busquedaMochila}
        alCambiarBusqueda={alCambiarBusqueda}
        criterioOrden={criterioOrden}
        alCambiarOrden={alCambiarOrden}
        alExpandirTodas={alExpandirTodas}
        alColapsarTodas={alColapsarTodas}
        alAbrirModalAgregar={alAbrirModalAgregar}
      />

      {/* Contenido de la Mochila */}
      {objetosMochilaBase.length === 0 ? (
        <div className={estilos.mensajeVacioInventario}>
          La mochila está vacía. Añade equipo o consumibles arriba.
        </div>
      ) : objetosMochilaFiltrados.length === 0 ? (
        <div className={estilos.mensajeVacioInventario}>
          No se encontraron objetos que coincidan con "{busquedaMochila}".
        </div>
      ) : criterioOrden === "tipo" ? (
        /* MODO 1: ORGANIZACIÓN POR SUBSECCIONES TEMÁTICAS */
        <div className={estilos.listaSubseccionesMochila}>
          {subseccionesPorTipo
            .filter((sub) => sub.items.length > 0)
            .map((sub) => {
              const abierta = seccionesAbiertas[sub.id] !== false;
              const estaSobrevolada = zonaDropActiva === sub.id;
              return (
                <div
                  key={sub.id}
                  className={`${estilos.subseccionMochila} ${estaSobrevolada ? estilos.zonaDropActiva : ""}`}
                  onDragOver={(e) => alDragOver(e, sub.id)}
                  onDragLeave={(e) => alDragLeave(e, sub.id)}
                  onDrop={(e) => alDrop(e, sub.id)}
                >
                  <div
                    className={estilos.cabeceraSubseccionMochila}
                    onClick={() => alAlternarSeccion(sub.id)}
                    title="Haz clic para colapsar o expandir (o arrastra aquí para mover)"
                  >
                    <div className={estilos.tituloSubseccionMochila} style={{ color: sub.color }}>
                      <span className={estilos.iconoChevronColapso}>
                        {abierta ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </span>
                      {sub.icono}
                      <span>{sub.titulo}</span>
                    </div>
                    <div className={estilos.metaSubseccionMochila}>
                      {sub.pesoTotal > 0 && (
                        <span className={estilos.pesoSubseccionMochila}>
                          {sub.pesoTotal} lb
                        </span>
                      )}
                      <span className={estilos.contadorGrupoInventario}>
                        {sub.items.length}
                      </span>
                    </div>
                  </div>

                  {abierta && (
                    <div className={estilos.listaItemsInventario}>
                      {sub.items.map(renderizarTarjeta)}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        /* MODO 2: LISTA PLANA ORDENADA */
        <div
          className={`${estilos.listaItemsInventario} ${zonaDropActiva === "mochila" ? estilos.zonaDropActiva : ""}`}
          onDragOver={(e) => alDragOver(e, "mochila")}
          onDragLeave={(e) => alDragLeave(e, "mochila")}
          onDrop={(e) => alDrop(e, "mochila")}
        >
          {objetosMochilaOrdenadosPlano.map(renderizarTarjeta)}
        </div>
      )}
    </div>
  );
};
