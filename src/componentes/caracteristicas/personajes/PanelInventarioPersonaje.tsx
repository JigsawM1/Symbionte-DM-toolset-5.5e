import React, { useState } from "react";
import type {
  PersonajeJugador,
  ObjetoJuego,
  ObjetoInventario,
  BolsaMonedas,
  TipoMonedaClave,
  TipoContenedor
} from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";
import {
  Swords,
  Backpack,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { usarLanzadorConjuros } from "@/hooks";
import { usarAccionesConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { TarjetaObjetoInventario } from "./TarjetaObjetoInventario";
import { ModalAgregarObjeto } from "./ModalAgregarObjeto";
import { ModalDetalleObjetoInventario } from "./ModalDetalleObjetoInventario";
import {
  usarInventarioOrdenado,
  CONTENEDORES_ESPECIALES_CONFIG
} from "./usarInventarioOrdenado";
import { BarraMetricasInventario } from "./BarraMetricasInventario";
import { BarraHerramientasInventario } from "./BarraHerramientasInventario";
import { DockMovilizacionRapida } from "./DockMovilizacionRapida";
import estilos from "./HojaPersonaje.module.css";

interface PanelInventarioPersonajeProps {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  baseDatosObjetos: ObjetoJuego[];
  alAgregarObjeto: (objeto: ObjetoInventario | ObjetoInventario[]) => void;
  alQuitarObjeto: (idInstancia: string) => void;
  alModificarCantidad: (idInstancia: string, delta: number) => void;
  alAlternarEquipado: (idInstancia: string) => void;
  alAlternarSintonizado: (idInstancia: string) => void;
  alActualizarNotas: (idInstancia: string, notas: string) => void;
  alActualizarObjeto?: (idInstancia: string, cambios: Partial<ObjetoInventario>) => void;
  alModificarCargas: (idInstancia: string, delta: number) => void;
  alCambiarContenedor?: (idInstancia: string, contenedor: TipoContenedor) => void;
  alReordenarInventario?: (idInstanciaOrigen: string, idInstanciaDestino: string) => void;
  alDesempaquetarPaquete?: (idInstancia: string) => void;
  alEstablecerMonedas: (monedas: Partial<BolsaMonedas>) => void;
  alModificarMoneda: (tipo: TipoMonedaClave, delta: number) => void;
  alUsarObjeto?: (objeto: ObjetoInventario) => void;
}

export const PanelInventarioPersonaje: React.FC<PanelInventarioPersonajeProps> = ({
  personaje,
  statsCalculadas,
  baseDatosObjetos,
  alAgregarObjeto,
  alQuitarObjeto,
  alModificarCantidad,
  alAlternarEquipado,
  alAlternarSintonizado,
  alActualizarNotas,
  alActualizarObjeto,
  alModificarCargas,
  alCambiarContenedor,
  alReordenarInventario,
  alDesempaquetarPaquete,
  alEstablecerMonedas,
  alModificarMoneda: _alModificarMoneda,
  alUsarObjeto
}) => {
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [tabModalAgregar, setTabModalAgregar] = useState<"compendio" | "otrasPosesiones">("compendio");
  const [objetoInspeccionadoId, setObjetoInspeccionadoId] = useState<string | null>(null);

  // Hook centralizado de magia para objetos mágicos
  const { puedeLanzar, motivoBloqueo, lanzar } = usarLanzadorConjuros({
    personaje,
    penalizacionArmadura: statsCalculadas?.penalizacionArmadura
  });

  // Hook desacoplado de ordenamiento, filtros y Drag & Drop
  const {
    seccionesAbiertas,
    alternarSeccion,
    colapsarTodasSecciones,
    expandirTodasSecciones,
    zonaDropActiva,
    setZonaDropActiva,
    arrastrandoItem,
    setArrastrandoItem,
    busquedaMochila,
    setBusquedaMochila,
    criterioOrden,
    setCriterioOrden,
    inventario,
    bolsaMonedas,
    fuerzaEfectiva,
    capacidadCarga,
    pesoTotal,
    sobrecargado,
    porcentajeCarga,
    pesoContenedoresSinCarga,
    totalPOEquivalente,
    totalSintonizados,
    objetosSintonizados,
    objetosEquipados,
    objetosMochilaBase,
    objetosMochilaFiltrados,
    mapaContenedoresEspeciales,
    subseccionesPorTipo,
    objetosMochilaOrdenadosPlano,
    comprobarTieneContents,
    manejarDragOver,
    manejarDragLeave,
    manejarDrop,
    manejarReordenarItems,
    multiplicadorTexto
  } = usarInventarioOrdenado({
    personaje,
    statsCalculadas,
    baseDatosObjetos,
    alCambiarContenedor,
    alAlternarEquipado,
    alReordenarInventario,
    agregarNotificacion
  });

  const objetoInspeccionado = inventario.find((o) => o.idInstancia === objetoInspeccionadoId) || null;

  // Helper DRY para renderizar cualquier tarjeta de objeto
  const renderizarTarjeta = (obj: ObjetoInventario) => (
    <TarjetaObjetoInventario
      key={obj.idInstancia}
      objeto={obj}
      baseDatosObjetos={baseDatosObjetos}
      inventarioCompleto={inventario}
      totalSintonizados={totalSintonizados}
      tieneContents={comprobarTieneContents(obj)}
      alInspeccionar={() => setObjetoInspeccionadoId(obj.idInstancia)}
      alAlternarEquipado={() => alAlternarEquipado(obj.idInstancia)}
      alAlternarSintonizado={() => alAlternarSintonizado(obj.idInstancia)}
      alModificarCantidad={(delta) => alModificarCantidad(obj.idInstancia, delta)}
      alModificarCargas={(delta) => alModificarCargas(obj.idInstancia, delta)}
      alEliminar={() => alQuitarObjeto(obj.idInstancia)}
      alUsar={alUsarObjeto}
      alDesempaquetar={() => alDesempaquetarPaquete?.(obj.idInstancia)}
      alCambiarContenedor={(c) => alCambiarContenedor?.(obj.idInstancia, c)}
      alSoltarReordenar={manejarReordenarItems}
      alIniciarArrastre={() => setArrastrandoItem(true)}
      alFinalizarArrastre={() => {
        setArrastrandoItem(false);
        setZonaDropActiva(null);
      }}
    />
  );

  return (
    <div className={estilos.seccionInventario}>
      {/* SECCIÓN 1: RECURSOS, CARGA Y FINANZAS */}
      <BarraMetricasInventario
        estaAbierta={seccionesAbiertas.recursos !== false}
        alAlternar={() => alternarSeccion("recursos")}
        totalPOEquivalente={totalPOEquivalente}
        sobrecargado={sobrecargado}
        pesoTotal={pesoTotal}
        capacidadCarga={capacidadCarga}
        totalSintonizados={totalSintonizados}
        bolsaMonedas={bolsaMonedas}
        alEstablecerMonedas={alEstablecerMonedas}
        fuerzaEfectiva={fuerzaEfectiva}
        multiplicadorTexto={multiplicadorTexto}
        pesoContenedoresSinCarga={pesoContenedoresSinCarga}
        porcentajeCarga={porcentajeCarga}
        objetosSintonizados={objetosSintonizados}
      />

      {/* SECCIÓN 2: OBJETOS EQUIPADOS */}
      <div
        className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
          zonaDropActiva === "equipados" ? estilos.zonaDropActiva : ""
        }`}
        onDragOver={(e) => manejarDragOver(e, "equipados")}
        onDragLeave={(e) => manejarDragLeave(e, "equipados")}
        onDrop={(e) => manejarDrop(e, "equipados")}
      >
        <div
          className={`${estilos.cabeceraGrupoInventario} ${estilos.cabeceraColapsableInventario}`}
          onClick={() => alternarSeccion("equipados")}
          title="Haz clic para colapsar o expandir (o arrastra aquí para equipar)"
        >
          <div className={estilos.tituloGrupoInventario}>
            <span className={estilos.iconoChevronColapso}>
              {seccionesAbiertas.equipados !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <Swords size={14} color="#60a5fa" />
            <span>Equipados Activos</span>
          </div>
          <span className={estilos.contadorGrupoInventario}>
            {objetosEquipados.length}
          </span>
        </div>

        {seccionesAbiertas.equipados !== false && (
          <div className={estilos.listaItemsInventario}>
            {objetosEquipados.length === 0 ? (
              <div className={estilos.mensajeVacioInventario}>
                No hay armas o armaduras equipadas actualmente. Arrastra objetos aquí para equiparlos.
              </div>
            ) : (
              objetosEquipados.map(renderizarTarjeta)
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: MOCHILA */}
      <div
        className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
          zonaDropActiva === "mochila" ? estilos.zonaDropActiva : ""
        }`}
        onDragOver={(e) => manejarDragOver(e, "mochila")}
        onDragLeave={(e) => manejarDragLeave(e, "mochila")}
        onDrop={(e) => manejarDrop(e, "mochila")}
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
          alCambiarBusqueda={setBusquedaMochila}
          criterioOrden={criterioOrden}
          alCambiarOrden={setCriterioOrden}
          alExpandirTodas={expandirTodasSecciones}
          alColapsarTodas={colapsarTodasSecciones}
          alAbrirModalAgregar={() => {
            setTabModalAgregar("compendio");
            setModalAgregarAbierto(true);
          }}
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
                    onDragOver={(e) => manejarDragOver(e, sub.id)}
                    onDragLeave={(e) => manejarDragLeave(e, sub.id)}
                    onDrop={(e) => manejarDrop(e, sub.id)}
                  >
                    <div
                      className={estilos.cabeceraSubseccionMochila}
                      onClick={() => alternarSeccion(sub.id)}
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
            onDragOver={(e) => manejarDragOver(e, "mochila")}
            onDragLeave={(e) => manejarDragLeave(e, "mochila")}
            onDrop={(e) => manejarDrop(e, "mochila")}
          >
            {objetosMochilaOrdenadosPlano.map(renderizarTarjeta)}
          </div>
        )}
      </div>

      {/* SECCIÓN 4: CONTENEDORES EXTERNOS DEDICADOS */}
      {CONTENEDORES_ESPECIALES_CONFIG
        .filter((cont) => (mapaContenedoresEspeciales[cont.id] || []).length > 0)
        .map((cont) => {
          const itemsContenedor = mapaContenedoresEspeciales[cont.id];
          const pesoContenedor = Math.round(
            itemsContenedor.reduce((acc, o) => acc + (o.pesoLb || 0) * (o.cantidad || 1), 0) * 100
          ) / 100;
          const abierta = seccionesAbiertas[cont.id] !== false;
          const estaSobrevolada = zonaDropActiva === cont.id;

          return (
            <div
              key={cont.id}
              className={`${estilos.neoRaised} ${estilos.grupoListaInventario} ${
                estaSobrevolada ? estilos.zonaDropActiva : ""
              }`}
              onDragOver={(e) => manejarDragOver(e, cont.id)}
              onDragLeave={(e) => manejarDragLeave(e, cont.id)}
              onDrop={(e) => manejarDrop(e, cont.id)}
            >
              <div
                className={`${estilos.cabeceraGrupoInventario} ${estilos.cabeceraColapsableInventario}`}
                onClick={() => alternarSeccion(cont.id)}
                title={`Haz clic para colapsar o expandir (o arrastra aquí para mover a ${cont.titulo})`}
              >
                <div className={estilos.tituloGrupoInventario} style={{ color: cont.color }}>
                  <span className={estilos.iconoChevronColapso}>
                    {abierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  {cont.icono}
                  <span>{cont.titulo}</span>
                </div>
                <div className={estilos.metaSubseccionMochila}>
                  {pesoContenedor > 0 && (
                    <span className={estilos.pesoSubseccionMochila}>
                      {pesoContenedor} lb (0 lb carga)
                    </span>
                  )}
                  <span className={estilos.contadorGrupoInventario}>
                    {itemsContenedor.length}
                  </span>
                </div>
              </div>

              {abierta && (
                <div className={estilos.listaItemsInventario}>
                  {itemsContenedor.length === 0 ? (
                    <div className={estilos.mensajeVacioInventario}>
                      No hay objetos en este compartimento. Arrastra objetos aquí para transferirlos.
                    </div>
                  ) : (
                    itemsContenedor.map(renderizarTarjeta)
                  )}
                </div>
              )}
            </div>
          );
        })}

      {/* Dock Flotante de Movilización Rápida */}
      <DockMovilizacionRapida
        arrastrandoItem={arrastrandoItem}
        zonaDropActiva={zonaDropActiva}
        alDragOver={manejarDragOver}
        alDragLeave={manejarDragLeave}
        alDrop={manejarDrop}
      />

      {/* MODAL DE ADICIÓN DE OBJETOS */}
      {modalAgregarAbierto && (
        <ModalAgregarObjeto
          tabInicial={tabModalAgregar}
          baseDatosObjetos={baseDatosObjetos}
          alAgregarObjeto={alAgregarObjeto}
          alCerrar={() => setModalAgregarAbierto(false)}
        />
      )}

      {/* MODAL DE INSPECCIÓN Y DESCRIPCIÓN DETALLADA */}
      {objetoInspeccionado && (
        <ModalDetalleObjetoInventario
          objeto={objetoInspeccionado}
          baseDatosObjetos={baseDatosObjetos}
          inventarioCompleto={inventario}
          totalSintonizados={totalSintonizados}
          alCerrar={() => setObjetoInspeccionadoId(null)}
          alAlternarEquipado={() => alAlternarEquipado(objetoInspeccionado.idInstancia)}
          alAlternarSintonizado={() => alAlternarSintonizado(objetoInspeccionado.idInstancia)}
          alActualizarNotas={(notas) => alActualizarNotas(objetoInspeccionado.idInstancia, notas)}
          alActualizarObjeto={(cambios) => alActualizarObjeto?.(objetoInspeccionado.idInstancia, cambios)}
          alCambiarContenedor={(c) => alCambiarContenedor?.(objetoInspeccionado.idInstancia, c)}
          alDesempaquetar={() => alDesempaquetarPaquete?.(objetoInspeccionado.idInstancia)}
          alModificarCargas={(delta) => alModificarCargas(objetoInspeccionado.idInstancia, delta)}
          alLanzarHechizo={async (hechizo, objetoNombre, coste) => {
            await lanzar({
              modo: "objetoMagico",
              hechizo: {
                id: hechizo.nombre.toLowerCase().replace(/\s+/g, "-"),
                nombre: hechizo.nombre,
                nivel: 1,
                escuela: "Universal",
                tiempoLanzamiento: "1 Accion",
                alcance: "60 pies",
                componentes: "V, S",
                duracion: "Instantaneo",
                concentracion: false,
                ritual: false,
                descripcion: ""
              },
              objetoNombre,
              objetoInstanciaId: objetoInspeccionado.idInstancia,
              bonoAtaqueObjeto: hechizo.bonoAtaque,
              cdObjeto: hechizo.cd,
              costeCargasObjeto: coste
            });
          }}
          bloqueadoPorArmadura={!puedeLanzar}
          motivoBloqueoArmadura={motivoBloqueo}
        />
      )}
    </div>
  );
};

export default PanelInventarioPersonaje;
