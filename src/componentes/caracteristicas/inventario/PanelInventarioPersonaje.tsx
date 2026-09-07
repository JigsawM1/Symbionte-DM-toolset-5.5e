import React, { useState } from "react";
import type { ObjetoInventario } from "@/tipos";
import { usarLanzadorConjuros } from "@/hooks";
import { usarAccionesConfiguracion } from "@/almacen/selectores/usarEstadoConfiguracion";
import { TarjetaObjetoInventario } from "./TarjetaObjetoInventario";
import { ModalAgregarObjeto } from "./ModalAgregarObjeto";
import { usarInventarioOrdenado } from "./usarInventarioOrdenado";
import { BarraMetricasInventario } from "./BarraMetricasInventario";
import { DockMovilizacionRapida } from "./DockMovilizacionRapida";
import { SeccionObjetosEquipados } from "./subcomponentes/SeccionObjetosEquipados";
import { SeccionMochilaInventario } from "./subcomponentes/SeccionMochilaInventario";
import { SeccionContenedoresEspeciales } from "./subcomponentes/SeccionContenedoresEspeciales";
import { ModalInspeccionObjetoFlotante } from "./subcomponentes/ModalInspeccionObjetoFlotante";
import type { PanelInventarioPersonajeProps } from "./subcomponentes/tiposPanelInventario";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

export type { PanelInventarioPersonajeProps };

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
      <SeccionObjetosEquipados
        estaAbierta={seccionesAbiertas.equipados !== false}
        zonaDropActiva={zonaDropActiva}
        objetosEquipados={objetosEquipados}
        alAlternarSeccion={() => alternarSeccion("equipados")}
        alDragOver={manejarDragOver}
        alDragLeave={manejarDragLeave}
        alDrop={manejarDrop}
        renderizarTarjeta={renderizarTarjeta}
      />

      {/* SECCIÓN 3: MOCHILA */}
      <SeccionMochilaInventario
        zonaDropActiva={zonaDropActiva}
        objetosMochilaFiltrados={objetosMochilaFiltrados}
        objetosMochilaBase={objetosMochilaBase}
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
        seccionesAbiertas={seccionesAbiertas}
        alAlternarSeccion={alternarSeccion}
        subseccionesPorTipo={subseccionesPorTipo}
        objetosMochilaOrdenadosPlano={objetosMochilaOrdenadosPlano}
        alDragOver={manejarDragOver}
        alDragLeave={manejarDragLeave}
        alDrop={manejarDrop}
        renderizarTarjeta={renderizarTarjeta}
      />

      {/* SECCIÓN 4: CONTENEDORES EXTERNOS DEDICADOS */}
      <SeccionContenedoresEspeciales
        mapaContenedoresEspeciales={mapaContenedoresEspeciales}
        seccionesAbiertas={seccionesAbiertas}
        zonaDropActiva={zonaDropActiva}
        alAlternarSeccion={alternarSeccion}
        alDragOver={manejarDragOver}
        alDragLeave={manejarDragLeave}
        alDrop={manejarDrop}
        renderizarTarjeta={renderizarTarjeta}
      />

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
      <ModalInspeccionObjetoFlotante
        objeto={objetoInspeccionado}
        baseDatosObjetos={baseDatosObjetos}
        inventarioCompleto={inventario}
        totalSintonizados={totalSintonizados}
        alCerrar={() => setObjetoInspeccionadoId(null)}
        alAlternarEquipado={alAlternarEquipado}
        alAlternarSintonizado={alAlternarSintonizado}
        alActualizarNotas={alActualizarNotas}
        alActualizarObjeto={alActualizarObjeto}
        alCambiarContenedor={alCambiarContenedor}
        alDesempaquetar={alDesempaquetarPaquete}
        alModificarCargas={alModificarCargas}
        puedeLanzar={puedeLanzar}
        motivoBloqueo={motivoBloqueo}
        lanzar={lanzar}
      />
    </div>
  );
};

export default PanelInventarioPersonaje;
