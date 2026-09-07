import React from "react";
import type { ObjetoInventario, ObjetoJuego } from "@/tipos";
import { Check, Box, Target, AlertTriangle, Package } from "lucide-react";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import {
  calcularAlmacenamientoMunicion,
  calcularContenidoContenedorMunicion,
  normalizarTexto
} from "@/servicios/gestorMunicion";
import { OPCIONES_ESPECIALIZACION_BOLSAS } from "./usarDetalleObjetoInventario";
import estilos from "../ModalDetalleObjetoInventario.module.css";

interface SeccionAlmacenamientoMunicionProps {
  objeto: ObjetoInventario;
  objetoBase: ObjetoJuego | null;
  inventarioCompleto?: ObjetoInventario[];
  alActualizarObjeto?: (cambios: Partial<ObjetoInventario>) => void;
}

export const SeccionAlmacenamientoMunicion: React.FC<SeccionAlmacenamientoMunicionProps> = ({
  objeto,
  objetoBase,
  inventarioCompleto,
  alActualizarObjeto
}) => {
  const nomNorm = normalizarTexto(objeto.nombre);
  const idNorm = normalizarTexto(objeto.idObjeto || "");
  const esContenedorBolsa =
    nomNorm.includes("bols") ||
    nomNorm.includes("pouch") ||
    nomNorm.includes("estuche de agujas") ||
    nomNorm.includes("needle case") ||
    nomNorm.includes("cartuchera") ||
    idNorm === "pouch" ||
    idNorm === "bullet-pouch" ||
    idNorm === "needle-case" ||
    idNorm === "cartridge-pouch";

  let valorActual = "pouch";
  if (idNorm === "bullet-pouch" || nomNorm.includes("bolsa de balas")) valorActual = "bullet-pouch";
  else if (idNorm === "needle-case" || nomNorm.includes("estuche de agujas") || nomNorm.includes("needle case")) valorActual = "needle-case";
  else if (idNorm === "cartridge-pouch" || nomNorm.includes("cartuchera")) valorActual = "cartridge-pouch";

  const opcionActual = OPCIONES_ESPECIALIZACION_BOLSAS.find((o) => o.id === valorActual);

  const infoMunicion = inventarioCompleto
    ? calcularAlmacenamientoMunicion(objeto, inventarioCompleto, objetoBase || undefined)
    : null;
  const infoContenedor = inventarioCompleto
    ? calcularContenidoContenedorMunicion(objeto, inventarioCompleto)
    : null;

  return (
    <>
      {/* Selector de Especialización de Contenedor */}
      {esContenedorBolsa && alActualizarObjeto && (
        <div className={estilos.seccionEspecializacionContenedor}>
          <div className={estilos.cabeceraEspecializacion}>
            <span className={estilos.tituloEspecializacion}>
              <Box size={13} /> Especialización del Contenedor
            </span>
            <SelectorDesplegable<string>
              valor={valorActual}
              alCambiar={(nuevaId) => {
                const seleccionada = OPCIONES_ESPECIALIZACION_BOLSAS.find((o) => o.id === nuevaId);
                if (seleccionada) {
                  alActualizarObjeto({
                    idObjeto: seleccionada.idObjeto,
                    nombre: seleccionada.nombre
                  });
                }
              }}
              tamano="compacto"
              opciones={OPCIONES_ESPECIALIZACION_BOLSAS.map((opc) => ({
                valor: opc.id,
                etiqueta: opc.etiqueta
              }))}
            />
          </div>
          {opcionActual && (
            <span className={estilos.descripcionEspecializacion}>
              {opcionActual.descripcion}
            </span>
          )}
        </div>
      )}

      {/* Regla de Almacenamiento / Capacidad de Munición */}
      {infoMunicion && (
        <div className={estilos.filaBadges} style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          {infoMunicion.tieneContenedor ? (
            <>
              <span className={`${estilos.badgeMeta} ${estilos.badgeStorage}`} style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#7dd3fc", borderColor: "rgba(56, 189, 248, 0.35)" }}>
                <Check size={10} /> Almacenamiento: {infoMunicion.almacenadasEnContenedor} de {infoMunicion.totalMunicion} en {infoMunicion.nombreContenedor} (Capacidad: {infoMunicion.capacidadTotal})
              </span>
              {infoMunicion.sueltasEnMochila > 0 && (
                <span className={`${estilos.badgeMeta}`} style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fcd34d", borderColor: "rgba(245, 158, 11, 0.35)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <AlertTriangle size={10} /> {infoMunicion.sueltasEnMochila} proyectiles exceden la capacidad de tu {infoMunicion.nombreContenedor} y van sueltos en la mochila
                </span>
              )}
            </>
          ) : (
            <span className={`${estilos.badgeMeta} ${estilos.badgeStorage}`} style={{ backgroundColor: "rgba(148, 163, 184, 0.1)", color: "#94a3b8", borderColor: "rgba(148, 163, 184, 0.2)" }}>
              <Package size={10} /> Suelto en mochila. Requiere: {infoMunicion.nombreContenedor} (Capacidad: {infoMunicion.capacidadUnitaria} uds)
            </span>
          )}
        </div>
      )}

      {infoContenedor && (
        <div className={estilos.filaBadges} style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <span className={`${estilos.badgeMeta}`} style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7", borderColor: "rgba(16, 185, 129, 0.35)" }}>
            <Target size={10} /> Capacidad de Munición: {infoContenedor.totalAlmacenado} / {infoContenedor.capacidadTotal} {infoContenedor.tipoProyectil} ({infoContenedor.capacidadUnitaria} por unidad)
            {infoContenedor.estaLleno && " • Completo"}
          </span>
        </div>
      )}
    </>
  );
};
