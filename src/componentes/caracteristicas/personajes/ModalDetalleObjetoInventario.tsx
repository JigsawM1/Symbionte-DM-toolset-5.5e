import React from "react";
import type {
  ObjetoInventario,
  ObjetoJuego,
  HechizoVinculado,
  TipoContenedor
} from "@/tipos";
import { usarDetalleObjetoInventario } from "./inventario/usarDetalleObjetoInventario";
import { CabeceraDetalleObjeto } from "./inventario/CabeceraDetalleObjeto";
import { MetricasPrincipalesObjeto } from "./inventario/MetricasPrincipalesObjeto";
import { SeccionDetallesEquipo } from "./inventario/SeccionDetallesEquipo";
import { SeccionMagiaYEfectosObjeto } from "./inventario/SeccionMagiaYEfectosObjeto";
import estilos from "./ModalDetalleObjetoInventario.module.css";

interface ModalDetalleObjetoInventarioProps {
  objeto: ObjetoInventario;
  baseDatosObjetos?: ObjetoJuego[];
  inventarioCompleto?: ObjetoInventario[];
  totalSintonizados: number;
  alCerrar: () => void;
  alAlternarEquipado?: () => void;
  alAlternarSintonizado?: () => void;
  alActualizarNotas?: (notas: string) => void;
  alActualizarObjeto?: (cambios: Partial<ObjetoInventario>) => void;
  alCambiarContenedor?: (contenedor: TipoContenedor) => void;
  alDesempaquetar?: () => void;
  alModificarCargas?: (delta: number) => void;
  alLanzarHechizo?: (hechizo: HechizoVinculado, objetoNombre: string, coste: number) => Promise<boolean | void>;
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
}

export const ModalDetalleObjetoInventario: React.FC<ModalDetalleObjetoInventarioProps> = ({
  objeto,
  baseDatosObjetos,
  inventarioCompleto,
  totalSintonizados,
  alCerrar,
  alAlternarEquipado,
  alAlternarSintonizado,
  alActualizarNotas,
  alActualizarObjeto,
  alCambiarContenedor,
  alDesempaquetar,
  alModificarCargas,
  alLanzarHechizo,
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura
}) => {
  const {
    objetoBase,
    pesoUnitario,
    pesoTotal,
    valorPO,
    rareza,
    rarezaClass,
    subcategoria,
    puedeSintonizar,
    esArma,
    esArmadura,
    armaObj,
    armaduraObj,
    descripcion,
    notasTemp,
    setNotasTemp,
    notasGuardadas,
    manejarGuardarNotas
  } = usarDetalleObjetoInventario({
    objeto,
    baseDatosObjetos,
    totalSintonizados,
    alActualizarNotas
  });

  return (
    <div className={estilos.backdropModal} onClick={alCerrar}>
      <div className={estilos.ventanaModal} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Visor */}
        <CabeceraDetalleObjeto
          nombre={objeto.nombre}
          tipoPrincipal={objeto.tipoPrincipal}
          subcategoria={subcategoria}
          rareza={rareza}
          rarezaClass={rarezaClass}
          esArma={esArma}
          esArmadura={esArmadura}
          esMagico={!!(objeto.esMagico || objetoBase?.esMagico)}
          alCerrar={alCerrar}
        />

        {/* Cuerpo del Visor con scroll táctico */}
        <div className={estilos.cuerpoModal}>
          <MetricasPrincipalesObjeto
            objeto={objeto}
            objetoBase={objetoBase}
            pesoTotal={pesoTotal}
            pesoUnitario={pesoUnitario}
            valorPO={valorPO}
            esArma={esArma}
            esArmadura={esArmadura}
            armaObj={armaObj}
            armaduraObj={armaduraObj}
          />

          <SeccionDetallesEquipo
            objeto={objeto}
            objetoBase={objetoBase}
            esArma={esArma}
            esArmadura={esArmadura}
            armaObj={armaObj}
            armaduraObj={armaduraObj}
            inventarioCompleto={inventarioCompleto}
            alActualizarObjeto={alActualizarObjeto}
          />

          <SeccionMagiaYEfectosObjeto
            objeto={objeto}
            objetoBase={objetoBase}
            descripcion={descripcion}
            puedeSintonizar={puedeSintonizar}
            alAlternarSintonizado={alAlternarSintonizado}
            alCambiarContenedor={alCambiarContenedor}
            alDesempaquetar={alDesempaquetar}
            alCerrar={alCerrar}
            alModificarCargas={alModificarCargas}
            alLanzarHechizo={alLanzarHechizo}
            bloqueadoPorArmadura={bloqueadoPorArmadura}
            motivoBloqueoArmadura={motivoBloqueoArmadura}
            notasTemp={notasTemp}
            setNotasTemp={setNotasTemp}
            notasGuardadas={notasGuardadas}
            manejarGuardarNotas={manejarGuardarNotas}
            alActualizarNotas={alActualizarNotas}
          />
        </div>

        {/* Pie del Modal con Acciones Rápidas */}
        <div className={estilos.pieModal}>
          <div>
            {(esArma || esArmadura) && alAlternarEquipado && (
              <button
                type="button"
                onClick={alAlternarEquipado}
                className={objeto.equipado ? estilos.botonDesequiparModal : estilos.botonEquiparModal}
              >
                {objeto.equipado ? "Desequipar" : "Equipar"}
              </button>
            )}
          </div>

          <button
            type="button"
            className={estilos.botonCerrarVisor}
            onClick={alCerrar}
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleObjetoInventario;
