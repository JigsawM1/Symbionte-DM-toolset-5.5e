import React, { useState } from "react";
import type { ObjetoInventario, Rareza, TipoContenedor } from "@/tipos";
import { Swords, Link2, Trash2, Plus, Minus, Zap, Sparkles, Heart } from "lucide-react";
import { ConfirmDialog } from "@/componentes/comunes/ConfirmDialog";
import { TooltipUniversal } from "@/componentes/comunes/TooltipUniversal";
import { detectarInfoConsumible, esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { CONFIG_CONTENEDORES } from "@/servicios/calculadorInventario";
import estilos from "./HojaPersonaje.module.css";

interface TarjetaObjetoInventarioProps {
  objeto: ObjetoInventario;
  totalSintonizados: number;
  alInspeccionar?: () => void;
  alAlternarEquipado: () => void;
  alAlternarSintonizado: () => void;
  alModificarCantidad: (delta: number) => void;
  alModificarCargas: (delta: number) => void;
  alEliminar: () => void;
  alUsar?: (objeto: ObjetoInventario) => void;
  alCambiarContenedor?: (contenedor: TipoContenedor) => void;
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
  totalSintonizados,
  alInspeccionar,
  alAlternarEquipado,
  alAlternarSintonizado,
  alModificarCantidad,
  alModificarCargas,
  alEliminar,
  alUsar,
  alCambiarContenedor: _alCambiarContenedor
}) => {
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

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

  return (
    <>
      <div
        className={`${estilos.tarjetaObjetoInventario} ${
          objeto.equipado ? estilos.tarjetaObjetoEquipado : ""
        }`}
      >
        {/* Fila Superior: Nombre + Badges + Eliminar */}
        <div className={estilos.filaSuperiorObjeto}>
          <div className={estilos.columnaInfoObjeto}>
            <span
              className={estilos.nombreObjetoClickable}
              onClick={alInspeccionar}
              title={`Ver descripción y detalles de ${objeto.nombre}`}
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
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {estaEnContenedorEspecial && (
              <span
                className={estilos.badgeMeta}
                style={{
                  backgroundColor: `${infoContenedor.color}18`,
                  borderColor: `${infoContenedor.color}50`,
                  color: infoContenedor.color,
                  fontSize: 8.5
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
                <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 9.5, color: "#64748b", textDecoration: "line-through" }}>
                    {pesoTotal} lb
                  </span>
                  <span style={{ fontSize: 10, color: infoContenedor.color, fontWeight: 700 }}>
                    0 lb
                  </span>
                </div>
              </TooltipUniversal>
            ) : (
              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                {pesoTotal > 0 ? `${pesoTotal} lb` : "—"}
              </span>
            )}

            {/* Selector de Cantidad (Solo visible en objetos en la mochila) */}
            {!objeto.equipado && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
                <button
                  type="button"
                  className={estilos.botonMonedaMod}
                  onClick={() => alModificarCantidad(-1)}
                  title="Reducir cantidad"
                >
                  <Minus size={9} />
                </button>
                <span style={{ fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: "center", color: "#f1f5f9" }}>
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
              <div style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
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
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24" }}>
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
