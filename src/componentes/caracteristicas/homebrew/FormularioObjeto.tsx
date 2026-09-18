/**
 * FormularioObjeto.tsx
 * --------------------
 * Orquestador principal del formulario de creación y edición de objetos homebrew.
 * Modularizado mediante subcomponentes atómicos por sección (SRP).
 *
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usarFormularioObjeto } from "@/hooks/usarFormularioObjeto";
import {
  usarEstadoHomebrew,
  usarAccionesHomebrew,
  usarAccionesConfiguracion,
} from "@/almacen/selectores";
import { ObjetoHomebrew } from "@/tipos";
import { Save, Sparkles } from "lucide-react";
import { coincideBusquedaTolerante } from "@/utiles/busquedaTolerante";
import estilos from "./FormularioObjeto.module.css";

import {
  SeccionSelectorPlantilla,
  SeccionDatosGenerales,
  SeccionArma,
  SeccionArmadura,
  SeccionEscudo,
  SeccionEquipoContenedor,
  SeccionEfectosPasivos,
} from "./subcomponentesObjeto";
import { DICCIONARIO_CATEGORIAS_EQUIPO } from "@/constantes/categoriasEquipoConstantes";

interface Props {
  idEnEdicion: string | null;
  objetoPlantilla?: ObjetoHomebrew | null;
  alGuardarExitoso: () => void;
  cancelarEdicion: () => void;
}

export const FormularioObjeto: React.FC<Props> = ({
  idEnEdicion,
  objetoPlantilla,
  alGuardarExitoso,
  cancelarEdicion
}) => {
  const { objetosHomebrew, objetoPlantillaSeleccionado } = usarEstadoHomebrew();
  const { limpiarObjetoPlantilla } = usarAccionesHomebrew();
  const { agregarNotificacion } = usarAccionesConfiguracion();

  const {
    oNombre, setONombre,
    oRareza, alCambiarRareza,
    oPropiedades, setOPropiedades,
    oDescripcion, setODescripcion,
    oPesoLb, setOPesoLb,
    oCostoCantidad, setOCostoCantidad,
    oCostoUnidad, setOCostoUnidad,
    oEsMagico, setOEsMagico,
    oEfectosPasivos,
    oCategoria, alCambiarCategoria,
    oEsConsumible, setOEsConsumible,
    oSubcategoria, setOSubcategoria,
    oQuantity, setOQuantity,
    oPesoUnitario, setOPesoUnitario,
    oCaEscudo, setOCaEscudo,

    oSubcategoriaArma, setOSubcategoriaArma,
    oTipoAtaque, setOTipoAtaque,
    oDadoDano, setODadoDano,
    oTipoDano, setOTipoDano,
    oPropiedadesArma, setOPropiedadesArma,
    oMaestria, setOMaestria,
    oAlcanceNormal, setOAlcanceNormal,
    oAlcanceLargo, setOAlcanceLargo,
    oDanoVersatil, setODanoVersatil,
    oMunicionRequerida, setOMunicionRequerida,

    oSubcategoriaArmadura, alCambiarSubcategoriaArmadura,
    oCaBase, setOCaBase,
    oRequisitoFuerza, setORequisitoFuerza,
    oDesventajaSigilo, setODesventajaSigilo,
    oBonoDestreza, setOBonoDestreza,
    oTiempoEquipar, setOTiempoEquipar,

    oCantidad, setOCantidad,
    oSintonizacionRequerida, setOSintonizacionRequerida,
    oCargas, setOCargas,

    oEsVeneno, setOEsVeneno,
    oTipoVeneno, setOTipoVeneno,
    oEfectoVeneno, setOEfectoVeneno,
    oEquipable, setOEquipable,

    oCondicionSintonizacion, setOCondicionSintonizacion,
    oFormulaRecarga, setOFormulaRecarga,
    oModificadorAtaqueDano, setOModificadorAtaqueDano,
    oHechizosVinculados,
    oArtesaniaTaller, setOArtesaniaTaller,
    oArtesaniaComponentes,
    oNuevoComponente, setONuevoComponente,

    oNuevoBonoCategoria, setONuevoBonoCategoria,
    oNuevoBonoBono, setONuevoBonoBono,
    oNuevoBonoValor, setONuevoBonoValor,
    oNuevoBonoDesc, setONuevoBonoDesc,
    oNuevoHechizoNombre, setONuevoHechizoNombre,
    oNuevoHechizoCd, setONuevoHechizoCd,
    oNuevoHechizoBonoAtaque, setONuevoHechizoBonoAtaque,
    oNuevoHechizoCosteCargas, setONuevoHechizoCosteCargas,
    setONuevoHechizoId,
    setONuevoHechizoNivel,
    setONuevoHechizoTipoAccion,

    // Campos relacionales
    oAmmunitionIndex, setOAmmunitionIndex,
    setOAmmunitionName,
    oStorageIndex, setOStorageIndex,
    setOStorageName,
    oContents, setOContents,
    oCraft, setOCraft,

    cargarObjeto,
    limpiarFormulario,
    agregarEfectoPasivo,
    eliminarEfectoPasivoIdx,
    agregarHechizoVinculado,
    eliminarHechizoVinculadoIdx,
    agregarComponenteArtesania,
    eliminarComponenteArtesaniaIdx,
    manejarGuardarObjeto
  } = usarFormularioObjeto(idEnEdicion, alGuardarExitoso);

  const tieneDatosMagicos = oEsMagico || oRareza !== "Común" || oEfectosPasivos.length > 0 || oSintonizacionRequerida || oCargas !== "";

  // Pestaña activa del formulario
  const [pestanaActiva, setPestanaActiva] = useState<"general" | "atributos" | "magia">("general");

  // Estados locales para relaciones
  const [nuevoContenidoIndex, setNuevoContenidoIndex] = useState("");
  const [nuevoContenidoName, setNuevoContenidoName] = useState("");
  const [nuevoContenidoQty, setNuevoContenidoQty] = useState<number>(1);

  const [nuevoCraftIndex, setNuevoCraftIndex] = useState("");
  const [nuevoCraftName, setNuevoCraftName] = useState("");

  const [busquedaContenidoQuery, setBusquedaContenidoQuery] = useState("");
  const [busquedaCraftQuery, setBusquedaCraftQuery] = useState("");

  // Sincronizar automáticamente oMunicionRequerida con la propiedad "Munición (Ammunition)"
  const tienePropMunicion = oPropiedadesArma.includes("Munición (Ammunition)");
  useEffect(() => {
    setOMunicionRequerida(tienePropMunicion);
  }, [tienePropMunicion, setOMunicionRequerida]);

  const idPlantillaCargadaRef = useRef<string | null>(null);

  // Sincronizar edición o plantilla con el formulario
  useEffect(() => {
    if (idEnEdicion) {
      idPlantillaCargadaRef.current = idEnEdicion;
      const objeto = objetosHomebrew.find((o) => o.id === idEnEdicion);
      if (objeto) {
        cargarObjeto(objeto);
      }
    } else if (objetoPlantillaSeleccionado && idPlantillaCargadaRef.current !== objetoPlantillaSeleccionado.id) {
      idPlantillaCargadaRef.current = objetoPlantillaSeleccionado.id;
      cargarObjeto(objetoPlantillaSeleccionado);
      agregarNotificacion(
        `Plantilla "${objetoPlantillaSeleccionado.nombre}" cargada. Puedes modificar el nombre y guardarlo como un objeto nuevo.`,
        "info"
      );
      limpiarObjetoPlantilla();
    } else if (objetoPlantilla && idPlantillaCargadaRef.current !== objetoPlantilla.id) {
      idPlantillaCargadaRef.current = objetoPlantilla.id;
      cargarObjeto(objetoPlantilla);
    } else if (!idEnEdicion && !objetoPlantillaSeleccionado && !objetoPlantilla && idPlantillaCargadaRef.current === null) {
      limpiarFormulario();
    }
    setPestanaActiva("general");
  }, [idEnEdicion, objetoPlantilla, objetoPlantillaSeleccionado, objetosHomebrew, cargarObjeto, limpiarFormulario, limpiarObjetoPlantilla, agregarNotificacion]);

  const alSeleccionarPlantilla = (idObjeto: string) => {
    if (!idObjeto) return;
    const objBase = objetosHomebrew.find((o) => o.id === idObjeto);
    if (objBase) {
      idPlantillaCargadaRef.current = objBase.id;
      cargarObjeto(objBase);
      agregarNotificacion(
        `Plantilla "${objBase.nombre}" cargada. Puedes modificar el nombre y guardarlo como un objeto nuevo.`,
        "info"
      );
    }
  };

  // Detener clics accidentales al lienzo 3D de TaleSpire
  const detenerPropagacion = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Listas prefiltradas para los selectores relacionales
  const listaTodosObjetos = [...objetosHomebrew].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const resultadosContenido = busquedaContenidoQuery.trim()
    ? listaTodosObjetos
        .filter((o) => coincideBusquedaTolerante([o.nombre, o.categoria, o.subcategoria], busquedaContenidoQuery))
        .slice(0, 5)
    : [];

  const resultadosCraft = busquedaCraftQuery.trim()
    ? listaTodosObjetos
        .filter((o) => coincideBusquedaTolerante([o.nombre, o.categoria, o.subcategoria], busquedaCraftQuery))
        .slice(0, 5)
    : [];

  return (
    <form 
      onSubmit={manejarGuardarObjeto} 
      className={estilos.formularioBrutal}
      onMouseDown={detenerPropagacion}
      onMouseUp={detenerPropagacion}
    >
      {/* SECTOR SUPERIOR: CARGAR DESDE PLANTILLA BASE */}
      <SeccionSelectorPlantilla
        idEnEdicion={idEnEdicion}
        listaTodosObjetos={listaTodosObjetos}
        alSeleccionarPlantilla={alSeleccionarPlantilla}
        estilos={estilos}
      />

      {/* PESTAÑAS HORIZONTALES COMPACTAS */}
      <div className={estilos.pestanasForm}>
        <button
          type="button"
          onClick={() => setPestanaActiva("general")}
          className={`${estilos.pestanaBoton} ${pestanaActiva === "general" ? estilos.pestanaBotonActivo : ""}`}
        >
          [General]
        </button>
        <button
          type="button"
          onClick={() => setPestanaActiva("atributos")}
          className={`${estilos.pestanaBoton} ${pestanaActiva === "atributos" ? estilos.pestanaBotonActivo : ""}`}
        >
          [Atributos: {DICCIONARIO_CATEGORIAS_EQUIPO[oCategoria]?.etiqueta || "Atributos"}]
        </button>
        <button
          type="button"
          onClick={() => setPestanaActiva("magia")}
          className={`${estilos.pestanaBoton} ${estilos.pestanaBotonMagia} ${pestanaActiva === "magia" ? estilos.pestanaBotonActivo : ""}`}
        >
          <span>[Propiedades Mágicas</span>
          {tieneDatosMagicos && (
            <Sparkles size={13} className={estilos.iconoMagiaDorado} />
          )}
          <span>]</span>
        </button>
      </div>

      {/* SECCIÓN 1: GENERAL */}
      {pestanaActiva === "general" && (
        <SeccionDatosGenerales
          oNombre={oNombre}
          setONombre={setONombre}
          oCategoria={oCategoria}
          alCambiarCategoria={alCambiarCategoria}
          oSubcategoria={oSubcategoria}
          setOSubcategoria={setOSubcategoria}
          oSubcategoriaArma={oSubcategoriaArma}
          setOSubcategoriaArma={setOSubcategoriaArma}
          oSubcategoriaArmadura={oSubcategoriaArmadura}
          alCambiarSubcategoriaArmadura={alCambiarSubcategoriaArmadura}
          oEsConsumible={oEsConsumible}
          setOEsConsumible={setOEsConsumible}
          oQuantity={oQuantity}
          setOQuantity={setOQuantity}
          oPesoUnitario={oPesoUnitario}
          setOPesoUnitario={setOPesoUnitario}
          oRareza={oRareza}
          alCambiarRareza={alCambiarRareza}
          oPesoLb={oPesoLb}
          setOPesoLb={setOPesoLb}
          oCostoCantidad={oCostoCantidad}
          setOCostoCantidad={setOCostoCantidad}
          oCostoUnidad={oCostoUnidad}
          setOCostoUnidad={setOCostoUnidad}
          oEquipable={oEquipable}
          setOEquipable={setOEquipable}
          oDescripcion={oDescripcion}
          setODescripcion={setODescripcion}
          oPropiedades={oPropiedades}
          setOPropiedades={setOPropiedades}
          oArtesaniaTaller={oArtesaniaTaller}
          setOArtesaniaTaller={setOArtesaniaTaller}
          oArtesaniaComponentes={oArtesaniaComponentes}
          oNuevoComponente={oNuevoComponente}
          setONuevoComponente={setONuevoComponente}
          agregarComponenteArtesania={agregarComponenteArtesania}
          eliminarComponenteArtesaniaIdx={eliminarComponenteArtesaniaIdx}
          estilos={estilos}
        />
      )}

      {/* SECCIÓN 2: ATRIBUTOS ESPECÍFICOS */}
      {pestanaActiva === "atributos" && (
        <div className="u-flex u-flex-col u-gap-md">
          {oCategoria === "armas" && (
            <SeccionArma
              oTipoAtaque={oTipoAtaque}
              setOTipoAtaque={setOTipoAtaque}
              oMaestria={oMaestria}
              setOMaestria={setOMaestria}
              oDadoDano={oDadoDano}
              setODadoDano={setODadoDano}
              oTipoDano={oTipoDano}
              setOTipoDano={setOTipoDano}
              oAlcanceNormal={oAlcanceNormal}
              setOAlcanceNormal={setOAlcanceNormal}
              oAlcanceLargo={oAlcanceLargo}
              setOAlcanceLargo={setOAlcanceLargo}
              oPropiedadesArma={oPropiedadesArma}
              setOPropiedadesArma={setOPropiedadesArma}
              oDanoVersatil={oDanoVersatil}
              setODanoVersatil={setODanoVersatil}
              oMunicionRequerida={oMunicionRequerida}
              oAmmunitionIndex={oAmmunitionIndex}
              setOAmmunitionIndex={setOAmmunitionIndex}
              setOAmmunitionName={setOAmmunitionName}
              estilos={estilos}
            />
          )}

          {oCategoria === "armaduras" && (
            <SeccionArmadura
              oCaBase={oCaBase}
              setOCaBase={setOCaBase}
              oRequisitoFuerza={oRequisitoFuerza}
              setORequisitoFuerza={setORequisitoFuerza}
              oBonoDestreza={oBonoDestreza}
              setOBonoDestreza={setOBonoDestreza}
              oDesventajaSigilo={oDesventajaSigilo}
              setODesventajaSigilo={setODesventajaSigilo}
              oTiempoEquipar={oTiempoEquipar}
              setOTiempoEquipar={setOTiempoEquipar}
              estilos={estilos}
            />
          )}

          {oCategoria === "escudos" && (
            <SeccionEscudo
              oCaEscudo={oCaEscudo}
              setOCaEscudo={setOCaEscudo}
              oDesventajaSigilo={oDesventajaSigilo}
              setODesventajaSigilo={setODesventajaSigilo}
              estilos={estilos}
            />
          )}

          {oCategoria !== "armas" && oCategoria !== "armaduras" && oCategoria !== "escudos" && (
            <SeccionEquipoContenedor
              oCantidad={oCantidad}
              setOCantidad={setOCantidad}
              oCategoria={oCategoria}
              oEsConsumible={oEsConsumible}
              oSubcategoria={oSubcategoria}
              oEsVeneno={oEsVeneno}
              setOEsVeneno={setOEsVeneno}
              oTipoVeneno={oTipoVeneno}
              setOTipoVeneno={setOTipoVeneno}
              oEfectoVeneno={oEfectoVeneno}
              setOEfectoVeneno={setOEfectoVeneno}
              oStorageIndex={oStorageIndex}
              setOStorageIndex={setOStorageIndex}
              setOStorageName={setOStorageName}
              busquedaContenidoQuery={busquedaContenidoQuery}
              setBusquedaContenidoQuery={setBusquedaContenidoQuery}
              resultadosContenido={resultadosContenido}
              nuevoContenidoIndex={nuevoContenidoIndex}
              setNuevoContenidoIndex={setNuevoContenidoIndex}
              nuevoContenidoName={nuevoContenidoName}
              setNuevoContenidoName={setNuevoContenidoName}
              nuevoContenidoQty={nuevoContenidoQty}
              setNuevoContenidoQty={setNuevoContenidoQty}
              oContents={oContents}
              setOContents={setOContents}
              busquedaCraftQuery={busquedaCraftQuery}
              setBusquedaCraftQuery={setBusquedaCraftQuery}
              resultadosCraft={resultadosCraft}
              nuevoCraftIndex={nuevoCraftIndex}
              setNuevoCraftIndex={setNuevoCraftIndex}
              nuevoCraftName={nuevoCraftName}
              setNuevoCraftName={setNuevoCraftName}
              oCraft={oCraft}
              setOCraft={setOCraft}
              estilos={estilos}
            />
          )}
        </div>
      )}

      {/* SECCIÓN 3: PROPIEDADES MÁGICAS */}
      {pestanaActiva === "magia" && (
        <SeccionEfectosPasivos
          oEsMagico={oEsMagico}
          setOEsMagico={setOEsMagico}
          oRareza={oRareza}
          oSintonizacionRequerida={oSintonizacionRequerida}
          setOSintonizacionRequerida={setOSintonizacionRequerida}
          oCondicionSintonizacion={oCondicionSintonizacion}
          setOCondicionSintonizacion={setOCondicionSintonizacion}
          oCargas={oCargas}
          setOCargas={setOCargas}
          oFormulaRecarga={oFormulaRecarga}
          setOFormulaRecarga={setOFormulaRecarga}
          oModificadorAtaqueDano={oModificadorAtaqueDano}
          setOModificadorAtaqueDano={setOModificadorAtaqueDano}
          oEfectosPasivos={oEfectosPasivos}
          oNuevoBonoCategoria={oNuevoBonoCategoria}
          setONuevoBonoCategoria={setONuevoBonoCategoria}
          oNuevoBonoBono={oNuevoBonoBono}
          setONuevoBonoBono={setONuevoBonoBono}
          oNuevoBonoValor={oNuevoBonoValor}
          setONuevoBonoValor={setONuevoBonoValor}
          oNuevoBonoDesc={oNuevoBonoDesc}
          setONuevoBonoDesc={setONuevoBonoDesc}
          agregarEfectoPasivo={agregarEfectoPasivo}
          eliminarEfectoPasivoIdx={eliminarEfectoPasivoIdx}
          oHechizosVinculados={oHechizosVinculados}
          oNuevoHechizoNombre={oNuevoHechizoNombre}
          setONuevoHechizoNombre={setONuevoHechizoNombre}
          oNuevoHechizoCd={oNuevoHechizoCd}
          setONuevoHechizoCd={setONuevoHechizoCd}
          oNuevoHechizoBonoAtaque={oNuevoHechizoBonoAtaque}
          setONuevoHechizoBonoAtaque={setONuevoHechizoBonoAtaque}
          oNuevoHechizoCosteCargas={oNuevoHechizoCosteCargas}
          setONuevoHechizoCosteCargas={setONuevoHechizoCosteCargas}
          setONuevoHechizoId={setONuevoHechizoId}
          setONuevoHechizoNivel={setONuevoHechizoNivel}
          setONuevoHechizoTipoAccion={setONuevoHechizoTipoAccion}
          agregarHechizoVinculado={agregarHechizoVinculado}
          eliminarHechizoVinculadoIdx={eliminarHechizoVinculadoIdx}
          estilos={estilos}
        />
      )}

      {/* STICKY BOTTOM BAR */}
      <div 
        className={estilos.stickyBottomBar}
        onMouseDown={detenerPropagacion}
        onMouseUp={detenerPropagacion}
      >
        {idEnEdicion && (
          <button 
            type="button" 
            onClick={cancelarEdicion} 
            className={estilos.botonStickyCancelar}
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          className={estilos.botonStickyGuardar}
          disabled={!oNombre.trim() || !oCategoria}
        >
          <Save size={14} />
          {idEnEdicion ? "Guardar Cambios" : "Guardar en Compendio"}
        </button>
      </div>
    </form>
  );
};
