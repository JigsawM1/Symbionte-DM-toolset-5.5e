import React from "react";
import type {
  ObjetoInventario,
  ObjetoJuego,
  TipoContenedor
} from "@/tipos";
import type { SolicitudLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { ModalDetalleObjetoInventario } from "../ModalDetalleObjetoInventario";

interface ModalInspeccionObjetoFlotanteProps {
  objeto: ObjetoInventario | null;
  baseDatosObjetos: ObjetoJuego[];
  inventarioCompleto: ObjetoInventario[];
  totalSintonizados: number;
  alCerrar: () => void;
  alAlternarEquipado: (idInstancia: string) => void;
  alAlternarSintonizado: (idInstancia: string) => void;
  alActualizarNotas: (idInstancia: string, notas: string) => void;
  alActualizarObjeto?: (idInstancia: string, cambios: Partial<ObjetoInventario>) => void;
  alCambiarContenedor?: (idInstancia: string, contenedor: TipoContenedor) => void;
  alDesempaquetar?: (idInstancia: string) => void;
  alModificarCargas: (idInstancia: string, delta: number) => void;
  puedeLanzar: boolean;
  motivoBloqueo?: string;
  lanzar: (solicitud: SolicitudLanzamiento) => Promise<boolean>;
}

export const ModalInspeccionObjetoFlotante: React.FC<ModalInspeccionObjetoFlotanteProps> = ({
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
  puedeLanzar,
  motivoBloqueo,
  lanzar
}) => {
  if (!objeto) return null;

  return (
    <ModalDetalleObjetoInventario
      objeto={objeto}
      baseDatosObjetos={baseDatosObjetos}
      inventarioCompleto={inventarioCompleto}
      totalSintonizados={totalSintonizados}
      alCerrar={alCerrar}
      alAlternarEquipado={() => alAlternarEquipado(objeto.idInstancia)}
      alAlternarSintonizado={() => alAlternarSintonizado(objeto.idInstancia)}
      alActualizarNotas={(notas) => alActualizarNotas(objeto.idInstancia, notas)}
      alActualizarObjeto={(cambios) => alActualizarObjeto?.(objeto.idInstancia, cambios)}
      alCambiarContenedor={(c) => alCambiarContenedor?.(objeto.idInstancia, c)}
      alDesempaquetar={() => alDesempaquetar?.(objeto.idInstancia)}
      alModificarCargas={(delta) => alModificarCargas(objeto.idInstancia, delta)}
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
          objetoInstanciaId: objeto.idInstancia,
          bonoAtaqueObjeto: hechizo.bonoAtaque,
          cdObjeto: hechizo.cd,
          costeCargasObjeto: coste
        });
      }}
      bloqueadoPorArmadura={!puedeLanzar}
      motivoBloqueoArmadura={motivoBloqueo}
    />
  );
};
