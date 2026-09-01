import React, { useState, useMemo } from "react";
import type { ObjetoInventario, Rareza, TipoContenedor, ObjetoJuego, Arma, Armadura } from "@/tipos";
import { Swords, Link2, Trash2, Plus, Minus, Zap, Sparkles, Heart, PackageOpen, FlaskConical, Target, GripVertical } from "lucide-react";
import { ConfirmDialog } from "@/componentes/comunes/ConfirmDialog";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import { detectarInfoConsumible, esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { CONFIG_CONTENEDORES } from "@/servicios/calculadorInventario";
import {
  calcularAlmacenamientoMunicion,
  calcularContenidoContenedorMunicion
} from "@/servicios/gestorMunicion";
import {
  obtenerInfoMaestria,
  obtenerInfoPropiedadArma,
  obtenerInfoPropiedadArmadura
} from "@/servicios/resolutorPropiedades";
import estilos from "./HojaPersonaje.module.css";

interface TarjetaObjetoInventarioProps {
  objeto: ObjetoInventario;
  baseDatosObjetos?: ObjetoJuego[];
  inventarioCompleto?: ObjetoInventario[];
  totalSintonizados: number;
  tieneContents?: boolean;
  alInspeccionar?: () => void;
  alAlternarEquipado: () => void;
  alAlternarSintonizado: () => void;
  alModificarCantidad: (delta: number) => void;
  alModificarCargas: (delta: number) => void;
  alEliminar: () => void;
  alUsar?: (objeto: ObjetoInventario) => void;
  alDesempaquetar?: () => void;
  alCambiarContenedor?: (contenedor: TipoContenedor) => void;
  alSoltarReordenar?: (idInstanciaOrigen: string, idInstanciaDestino: string) => void;
  alIniciarArrastre?: () => void;
  alFinalizarArrastre?: () => void;
}

const CLASES_RAREZA: Record<Rareza, string> = {
  "Común": estilos.rarezaComun,
  "Poco Común": estilos.rarezaPocoComun,
  "Raro": estilos.rarezaRaro,
  "Muy Raro": estilos.rarezaMuyRaro,
  "Legendario": estilos.rarezaLegendario,
  "Artefacto": estilos.rarezaArtefacto
};

export const TarjetaObjetoInventario: React.FC<TarjetaObjetoInventarioProps> = ({
  objeto,
  baseDatosObjetos,
  inventarioCompleto,
  totalSintonizados,
  tieneContents,
  alInspeccionar,
  alAlternarEquipado,
  alAlternarSintonizado,
  alModificarCantidad,
  alModificarCargas,
  alEliminar,
  alUsar,
  alDesempaquetar,
  alCambiarContenedor: _alCambiarContenedor,
  alSoltarReordenar,
  alIniciarArrastre,
  alFinalizarArrastre
}) => {
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const objetoBase = useMemo<ObjetoJuego | null>(() => {
    if (!baseDatosObjetos) return null;
    const normalizar = (s: string) => s.toLowerCase().trim();
    return (
      baseDatosObjetos.find(
        (o) => o.id === objeto.idObjeto || normalizar(o.nombre) === normalizar(objeto.nombre)
      ) || null
    );
  }, [baseDatosObjetos, objeto.idObjeto, objeto.nombre]);

  const pesoTotal = Math.round((Number(objeto.pesoLb) || 0) * (Number(objeto.cantidad) || 1) * 100) / 100;
  const rarezaClass = CLASES_RAREZA[objeto.rareza as Rareza] || estilos.rarezaComun;

  const puedeSintonizarNuevo = objeto.sintonizado || totalSintonizados < 3;

  // Detección de consumible / poción D&D 5.5e
  const esConsumible = esObjetoConsumible(objeto.nombre, objeto.notas);
  const infoConsumible = esConsumible
    ? detectarInfoConsumible(objeto.nombre, objeto.notas)
    : null;

  const contenedor = objeto.contenedor || "mochila";
  const estaEnContenedorEspecial = !objeto.equipado && contenedor !== "mochila";
  const infoContenedor = CONFIG_CONTENEDORES[contenedor] || CONFIG_CONTENEDORES.mochila;

  const bonoMagico = objetoBase?.modificadorAtaqueDano;
  const esVeneno = Boolean(objetoBase?.esVeneno || objetoBase?.tipoVeneno);
  const esArma = objetoBase?.tipoPrincipal === "Arma";
  const armaObj = esArma ? (objetoBase as Arma) : null;
  const esArmadura = objetoBase?.tipoPrincipal === "Armadura";
  const armaduraObj = esArmadura ? (objetoBase as Armadura) : null;
  const maestria = armaObj?.maestria;

  // 1. Estado detallado de almacenamiento si este ítem es Munición
  const infoAlmacenamientoMunicion = useMemo(() => {
    if (!inventarioCompleto) return null;
    return calcularAlmacenamientoMunicion(objeto, inventarioCompleto, objetoBase || undefined);
  }, [objeto, inventarioCompleto, objetoBase]);

  // 2. Estado de ocupación si este ítem es un Contenedor Físico (ej. Carcaj, Caja de Virotes, Bolsa de Balas)
  const infoContenedorFisico = useMemo(() => {
    if (!inventarioCompleto) return null;
    return calcularContenidoContenedorMunicion(objeto, inventarioCompleto);
  }, [objeto, inventarioCompleto]);

  const manejarDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    alIniciarArrastre?.();
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        idInstancia: objeto.idInstancia,
        nombre: objeto.nombre,
        equipable: Boolean(objeto.equipable),
        equipado: Boolean(objeto.equipado),
        contenedor: objeto.contenedor || "mochila"
      })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const manejarDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
    alFinalizarArrastre?.();
  };

  const manejarDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!alSoltarReordenar) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const manejarDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const manejarDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!alSoltarReordenar) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDragging(false);
    alFinalizarArrastre?.();
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const payload = JSON.parse(raw) as { idInstancia: string };
      if (payload.idInstancia && payload.idInstancia !== objeto.idInstancia) {
        alSoltarReordenar(payload.idInstancia, objeto.idInstancia);
      }
    } catch (err) {
      console.error("[TarjetaObjetoInventario] Error al procesar reordenación:", err);
    }
  };

  return (
    <>
      <div
        className={`${estilos.tarjetaObjetoInventario} ${
          objeto.equipado ? estilos.tarjetaObjetoEquipado : ""
        } ${isDragging ? estilos.tarjetaObjetoArrastrando : ""} ${
          isDragOver ? estilos.tarjetaObjetoSobrevolada : ""
        }`}
        draggable
        onDragStart={manejarDragStart}
        onDragEnd={manejarDragEnd}
        onDragOver={manejarDragOver}
        onDragLeave={manejarDragLeave}
        onDrop={manejarDrop}
      >
        {/* Fila Superior: Nombre + Badges + Eliminar */}
        <div className={estilos.filaSuperiorObjeto}>
          <div className={estilos.columnaInfoObjeto}>
            <span
              className={estilos.iconoGripDrag}
              title="Arrastra para mover a Equipados, Mochila o Contenedores"
            >
              <GripVertical size={11} />
            </span>
            <span
              className={estilos.nombreObjetoClickable}
              onClick={alInspeccionar}
              title={`Ver descripción y detalles de ${objeto.nombre} (Arrastra para mover)`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && alInspeccionar) {
                  e.preventDefault();
                  alInspeccionar();
                }
              }}
            >
              {objeto.nombre}
            </span>
            {bonoMagico !== undefined && bonoMagico > 0 && (
              <TooltipUniversal
                titulo="Bonificador Mágico"
                contenido={`Otorga +${bonoMagico} a las tiradas de ataque y daño (o a la CA).`}
                posicion="arriba"
              >
                <span
                  className={estilos.badgeMeta}
                  style={{
                    backgroundColor: "rgba(236, 72, 153, 0.15)",
                    color: "#fbcfe8",
                    borderColor: "rgba(236, 72, 153, 0.3)",
                    cursor: "help"
                  }}
                >
                  +{bonoMagico}
                </span>
              </TooltipUniversal>
            )}
            {esVeneno && (
              <TooltipUniversal
                titulo="Veneno Aplicado"
                contenido="Objeto impregnado con sustancia venenosa que añade efectos especiales o daño por veneno."
                posicion="arriba"
              >
                <span
                  className={estilos.badgeMeta}
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#6ee7b7",
                    borderColor: "rgba(16, 185, 129, 0.3)",
                    cursor: "help"
                  }}
                >
                  <FlaskConical size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                  Veneno
                </span>
              </TooltipUniversal>
            )}
            {maestria && (() => {
              const infoM = obtenerInfoMaestria(maestria);
              return (
                <TooltipUniversal
                  titulo={infoM.titulo}
                  contenido={infoM.descripcion}
                  posicion="arriba"
                >
                  <span
                    className={estilos.badgeMeta}
                    style={{
                      backgroundColor: "rgba(168, 85, 247, 0.15)",
                      color: "#d8b4fe",
                      borderColor: "rgba(168, 85, 247, 0.3)",
                      cursor: "help"
                    }}
                  >
                    {maestria}
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaObj?.propiedades && armaObj.propiedades.map((p) => {
              const infoP = obtenerInfoPropiedadArma(p);
              return (
                <TooltipUniversal
                  key={p}
                  titulo={infoP.titulo}
                  contenido={infoP.descripcion}
                  posicion="arriba"
                >
                  <span
                    className={estilos.badgeMeta}
                    style={{
                      backgroundColor: "rgba(99, 102, 241, 0.15)",
                      color: "#c7d2fe",
                      borderColor: "rgba(99, 102, 241, 0.3)",
                      cursor: "help"
                    }}
                  >
                    {p}
                  </span>
                </TooltipUniversal>
              );
            })}
            {armaduraObj?.desventajaSigilo && (() => {
              const infoSigilo = obtenerInfoPropiedadArmadura("desventajaSigilo");
              return (
                <TooltipUniversal
                  titulo={infoSigilo.titulo}
                  contenido={infoSigilo.descripcion}
                  posicion="arriba"
                >
                  <span
                    className={estilos.badgeMeta}
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      color: "#fca5a5",
                      borderColor: "rgba(239, 68, 68, 0.3)",
                      cursor: "help"
                    }}
                  >
                    Sigilo (Desv.)
                  </span>
                </TooltipUniversal>
              );
            })()}
            {armaduraObj?.requisitoFuerza && (() => {
              const infoFue = obtenerInfoPropiedadArmadura("requisitoFuerza", armaduraObj.requisitoFuerza);
              return (
                <TooltipUniversal
                  titulo={infoFue.titulo}
                  contenido={infoFue.descripcion}
                  posicion="arriba"
                >
                  <span
                    className={estilos.badgeMeta}
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      color: "#fcd34d",
                      borderColor: "rgba(245, 158, 11, 0.3)",
                      cursor: "help"
                    }}
                  >
                    FUE {armaduraObj.requisitoFuerza}
                  </span>
                </TooltipUniversal>
              );
            })()}

            {/* Badges de Munición y Almacenamiento con Límite de Capacidad */}
            {infoAlmacenamientoMunicion && (
              infoAlmacenamientoMunicion.tieneContenedor ? (
                <>
                  <span
                    className={estilos.badgeMeta}
                    style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#7dd3fc", borderColor: "rgba(56, 189, 248, 0.3)" }}
                    title={`${infoAlmacenamientoMunicion.almacenadasEnContenedor} de ${infoAlmacenamientoMunicion.totalMunicion} proyectiles guardados en ${infoAlmacenamientoMunicion.nombreContenedor}`}
                  >
                    <Target size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                    {infoAlmacenamientoMunicion.almacenadasEnContenedor}/{infoAlmacenamientoMunicion.capacidadTotal} en {infoAlmacenamientoMunicion.nombreContenedor}
                  </span>
                  {infoAlmacenamientoMunicion.sueltasEnMochila > 0 && (
                    <span
                      className={estilos.badgeMeta}
                      style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fcd34d", borderColor: "rgba(245, 158, 11, 0.3)" }}
                      title={`${infoAlmacenamientoMunicion.sueltasEnMochila} proyectiles exceden la capacidad de tu ${infoAlmacenamientoMunicion.nombreContenedor} y van sueltos en la mochila`}
                    >
                      +{infoAlmacenamientoMunicion.sueltasEnMochila} en mochila
                    </span>
                  )}
                </>
              ) : (
                <span
                  className={estilos.badgeMeta}
                  style={{ backgroundColor: "rgba(148, 163, 184, 0.1)", color: "#94a3b8", borderColor: "rgba(148, 163, 184, 0.2)" }}
                  title={`Transportas esta munición suelta en la mochila. Recomendado: ${infoAlmacenamientoMunicion.nombreContenedor}`}
                >
                  Sueltas en mochila
                </span>
              )
            )}

            {/* Badge para el Contenedor Físico (ej. Carcaj, Caja de Virotes, Bolsa de Balas) */}
            {infoContenedorFisico && (
              <span
                className={estilos.badgeMeta}
                style={{
                  backgroundColor: infoContenedorFisico.totalAlmacenado > 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.1)",
                  color: infoContenedorFisico.totalAlmacenado > 0 ? "#6ee7b7" : "#94a3b8",
                  borderColor: infoContenedorFisico.totalAlmacenado > 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(148, 163, 184, 0.2)"
                }}
                title={
                  infoContenedorFisico.totalAlmacenado > 0
                    ? `Alberga ${infoContenedorFisico.totalAlmacenado} de su capacidad máxima de ${infoContenedorFisico.capacidadTotal} ${infoContenedorFisico.tipoProyectil}`
                    : `Capacidad para ${infoContenedorFisico.capacidadTotal} ${infoContenedorFisico.tipoProyectil} (Actualmente vacío)`
                }
              >
                <Target size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                {infoContenedorFisico.totalAlmacenado}/{infoContenedorFisico.capacidadTotal} {infoContenedorFisico.tipoProyectil}
                {infoContenedorFisico.estaLleno && " (Lleno)"}
              </span>
            )}
          </div>

          <div className={estilos.filaAccionesDerecha}>
            {estaEnContenedorEspecial && (
              <span
                className={estilos.badgeMeta}
                style={{
                  backgroundColor: `${infoContenedor.color}18`,
                  borderColor: `${infoContenedor.color}50`,
                  color: infoContenedor.color
                }}
                title={infoContenedor.descripcion}
              >
                {infoContenedor.nombreCorto}
              </span>
            )}
            {objeto.rareza && objeto.rareza !== "Común" && (
              <span className={`${estilos.badgeMeta} ${rarezaClass}`}>
                {objeto.rareza}
              </span>
            )}
            <button
              type="button"
              className={estilos.botonEliminarObjeto}
              onClick={() => setModalEliminarAbierto(true)}
              title="Eliminar del inventario"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Fila Inferior: Peso + Cantidad + Cargas + Botones Acción */}
        <div className={estilos.filaInferiorObjeto}>
          <div className={estilos.badgesMetaObjeto}>
            {/* Peso (Calculado según contenedor) */}
            {estaEnContenedorEspecial ? (
              <TooltipUniversal
                titulo={infoContenedor.nombre}
                contenido={`Peso interior: ${pesoTotal} lb. Al estar en ${infoContenedor.nombreCorto}, no suma peso a la carga del personaje.`}
                posicion="arriba"
              >
                <div className={estilos.grupoPesoContenedor}>
                  <span className={estilos.textoPesoTachado}>
                    {pesoTotal} lb
                  </span>
                  <span className={estilos.textoPesoEfectivo} style={{ color: infoContenedor.color }}>
                    0 lb
                  </span>
                </div>
              </TooltipUniversal>
            ) : (
              <span className={estilos.textoPesoSimple}>
                {pesoTotal > 0 ? `${pesoTotal} lb` : "—"}
              </span>
            )}

            {/* Selector de Cantidad (Solo visible en objetos en la mochila) */}
            {!objeto.equipado && (
              <div className={estilos.grupoModificadorCantidad}>
                <button
                  type="button"
                  className={estilos.botonMonedaMod}
                  onClick={() => alModificarCantidad(-1)}
                  title="Reducir cantidad"
                >
                  <Minus size={9} />
                </button>
                <span className={estilos.valorCantidadItem}>
                  ×{objeto.cantidad}
                </span>
                <button
                  type="button"
                  className={estilos.botonMonedaMod}
                  onClick={() => alModificarCantidad(1)}
                  title="Aumentar cantidad"
                >
                  <Plus size={9} />
                </button>
              </div>
            )}

            {/* Tracker de Cargas si aplica */}
            {objeto.cargasMaximas !== undefined && (
              <div className={estilos.grupoTrackerCargas}>
                <Zap size={10} color="#fbbf24" />
                <button
                  type="button"
                  className={estilos.botonMonedaMod}
                  onClick={() => alModificarCargas(-1)}
                  title="Gastar carga"
                  disabled={(objeto.cargasActuales ?? objeto.cargasMaximas) <= 0}
                >
                  <Minus size={9} />
                </button>
                <span className={estilos.valorCargasItem}>
                  {objeto.cargasActuales ?? objeto.cargasMaximas}/{objeto.cargasMaximas}
                </span>
                <button
                  type="button"
                  className={estilos.botonMonedaMod}
                  onClick={() => alModificarCargas(1)}
                  title="Recuperar carga"
                  disabled={(objeto.cargasActuales ?? objeto.cargasMaximas) >= objeto.cargasMaximas}
                >
                  <Plus size={9} />
                </button>
              </div>
            )}
          </div>

          {/* Botones de acción: Usar, Equipar y Sintonizar */}
          <div className={estilos.accionesObjeto}>
            {/* Botón de Desempaquetar para Paquetes / Kits */}
            {tieneContents && alDesempaquetar && (
              <TooltipUniversal
                titulo="Desempaquetar Paquete"
                contenido="Extrae todos los ítems individuales a tu mochila y descarta este contenedor abstracto."
                posicion="arriba"
                alineacion="fin"
              >
                <button
                  type="button"
                  className={`${estilos.botonAccionObjeto} ${estilos.botonAccionDesempaquetar}`}
                  onClick={alDesempaquetar}
                >
                  <PackageOpen size={10} />
                  <span>Abrir</span>
                </button>
              </TooltipUniversal>
            )}

            {/* Botón de Usar para Consumibles y Pociones */}
            {esConsumible && alUsar && (
              <TooltipUniversal
                titulo={infoConsumible?.esPocion ? "Beber Poción (Acción Adicional)" : "Usar Consumible"}
                contenido={infoConsumible?.descripcionUso || "Consume 1 unidad"}
                posicion="arriba"
                alineacion="fin"
              >
                <button
                  type="button"
                  className={`${estilos.botonAccionObjeto} ${estilos.botonAccionUsar}`}
                  onClick={() => alUsar(objeto)}
                >
                  {infoConsumible?.esCurativo ? <Heart size={10} /> : <Sparkles size={10} />}
                  <span>{infoConsumible?.esPocion ? "Beber" : "Usar"}</span>
                </button>
              </TooltipUniversal>
            )}

            {objeto.sintonizacionRequerida && (
              <button
                type="button"
                className={`${estilos.botonAccionObjeto} ${
                  objeto.sintonizado ? estilos.botonAccionSintonizadoActivo : ""
                }`}
                onClick={alAlternarSintonizado}
                disabled={!puedeSintonizarNuevo}
                title={
                  objeto.sintonizado
                    ? "Des-sintonizar objeto"
                    : totalSintonizados >= 3
                    ? "Límite de 3 sintonizaciones alcanzado"
                    : "Sintonizar objeto mágico"
                }
              >
                <Link2 size={10} />
                {objeto.sintonizado ? "Sintonizado" : "Sintonizar"}
              </button>
            )}

            {objeto.equipable && (
              <button
                type="button"
                className={`${estilos.botonAccionObjeto} ${
                  objeto.equipado ? estilos.botonAccionEquipadoActivo : ""
                }`}
                onClick={alAlternarEquipado}
                title={objeto.equipado ? "Desequipar objeto" : "Equipar objeto"}
              >
                <Swords size={10} />
                {objeto.equipado ? "Equipado" : "Equipar"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de Confirmación para eliminar */}
      <ConfirmDialog
        abierto={modalEliminarAbierto}
        titulo="Eliminar Objeto"
        mensaje={`¿Estás seguro de que deseas eliminar "${objeto.nombre}" del inventario?`}
        onConfirmar={() => {
          setModalEliminarAbierto(false);
          alEliminar();
        }}
        onCancelar={() => setModalEliminarAbierto(false)}
      />
    </>
  );
};
