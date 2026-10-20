import React from "react";
import type { TipoContenedor } from "@/tipos";
import { Backpack, Box, Package, Sparkles } from "lucide-react";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

const OPCIONES_CONTENEDOR_DESTINO: {
  clave: TipoContenedor;
  nombre: string;
  subtitulo: string;
  color: string;
}[] = [
  {
    clave: "mochila",
    nombre: "Mochila",
    subtitulo: "Carga directa",
    color: "var(--pj-texto-oro)"
  },
  {
    clave: "bolsa_contencion",
    nombre: "Bolsa Contención",
    subtitulo: "0 lb carga",
    color: "var(--pj-texto-magia)"
  },
  {
    clave: "montura",
    nombre: "Montura",
    subtitulo: "0 lb carga",
    color: "var(--pj-texto-cian)"
  },
  {
    clave: "almacen",
    nombre: "Almacén",
    subtitulo: "0 lb carga",
    color: "var(--pj-texto-terciario)"
  }
];

interface SelectorContenedorDestinoProps {
  contenedorSeleccionado: TipoContenedor;
  alSeleccionarContenedor: (contenedor: TipoContenedor) => void;
}

export const SelectorContenedorDestino: React.FC<SelectorContenedorDestinoProps> = ({
  contenedorSeleccionado,
  alSeleccionarContenedor
}) => {
  return (
    <div className={estilos.campoFormulario}>
      <label className={estilos.labelFormulario}>Guardar en:</label>
      <div className={estilos.cuadriculaSelectoresDestino}>
        {OPCIONES_CONTENEDOR_DESTINO.map((opc) => {
          const activo = contenedorSeleccionado === opc.clave;
          return (
            <button
              key={opc.clave}
              type="button"
              className={`${estilos.botonSelectorDestino} ${activo ? estilos.botonSelectorDestinoActivo : ""}`}
              data-caja={opc.clave}
              onClick={() => alSeleccionarContenedor(opc.clave)}
            >
              <div className={estilos.iconoSelectorDestino}>
                {opc.clave === "mochila" && <Backpack size={13} color={opc.color} />}
                {opc.clave === "bolsa_contencion" && <Sparkles size={13} color={opc.color} />}
                {opc.clave === "montura" && <Box size={13} color={opc.color} />}
                {opc.clave === "almacen" && <Package size={13} color={opc.color} />}
              </div>
              <div className={estilos.infoSelectorDestino}>
                <span className={estilos.nombreSelectorDestino}>
                  {opc.nombre}
                </span>
                <span className={estilos.subtituloSelectorDestino}>
                  {opc.subtitulo}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
