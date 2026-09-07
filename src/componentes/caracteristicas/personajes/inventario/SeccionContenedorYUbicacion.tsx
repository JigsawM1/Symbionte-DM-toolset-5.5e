import React from "react";
import type { TipoContenedor } from "@/tipos";
import { Box } from "lucide-react";
import { CONFIG_CONTENEDORES } from "@/servicios/calculadorInventario";
import estilos from "../ModalDetalleObjetoInventario.module.css";

interface SeccionContenedorYUbicacionProps {
  contenedorActual?: TipoContenedor;
  equipado?: boolean;
  alCambiarContenedor?: (contenedor: TipoContenedor) => void;
}

export const SeccionContenedorYUbicacion: React.FC<SeccionContenedorYUbicacionProps> = ({
  contenedorActual = "mochila",
  equipado = false,
  alCambiarContenedor
}) => {
  return (
    <div className={estilos.seccionContenedor}>
      <span className={estilos.tituloSeccion}>
        <Box size={12} /> Ubicación / Contenedor
      </span>
      <div className={estilos.gridContenedores}>
        {(["mochila", "bolsa_contencion", "montura", "almacen"] as TipoContenedor[]).map((contClave) => {
          const info = CONFIG_CONTENEDORES[contClave];
          const seleccionado = contenedorActual === contClave;
          return (
            <button
              key={contClave}
              type="button"
              onClick={() => alCambiarContenedor?.(contClave)}
              disabled={equipado && contClave !== "mochila"}
              className={`${estilos.botonContenedor} ${seleccionado ? estilos.botonContenedorActivo : ""}`}
              style={{
                backgroundColor: seleccionado ? `${info.color}22` : undefined,
                borderColor: seleccionado ? info.color : undefined
              }}
              title={info.descripcion}
            >
              <span className={estilos.nombreContenedor} style={{ color: seleccionado ? info.color : undefined }}>
                {info.nombreCorto}
              </span>
              <span className={info.sumaCargaPersonaje ? estilos.subtextoContenedor : `${estilos.subtextoContenedor} ${estilos.subtextoContenedorExento}`}>
                {info.sumaCargaPersonaje ? "Suma carga" : "0 lb carga"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
