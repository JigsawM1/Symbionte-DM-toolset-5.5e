import React from "react";
import type {
  ObjetoInventario,
  ObjetoJuego,
  TipoContenedor
} from "@/tipos";
import type { SolicitudLanzamiento } from "@/servicios/servicioLanzamientoConjuros";
import { usarEstadoHomebrew } from "@/almacen/selectores/usarEstadoHomebrew";
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
  cdSalvacionPersonaje?: number;
  bonoAtaqueMagico?: number;
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
  cdSalvacionPersonaje,
  bonoAtaqueMagico,
  lanzar
}) => {
  const { baseDatosHechizos } = usarEstadoHomebrew();

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
        const hechizoCompendio = (baseDatosHechizos || []).find(
          (h) => (hechizo.hechizoId && h.id === hechizo.hechizoId) ||
                 h.nombre.toLowerCase().trim() === hechizo.nombre.toLowerCase().trim()
        );

        const objetoHechizoBase = hechizoCompendio || {
          id: hechizo.hechizoId || hechizo.nombre.toLowerCase().replace(/\s+/g, "-"),
          nombre: hechizo.nombre,
          nivel: hechizo.nivel ?? 1,
          escuela: "Universal",
          tiempoLanzamiento: hechizo.tipoAccion === "accionAdicional" ? "1 Accion Adicional" : hechizo.tipoAccion === "reaccion" ? "1 Reaccion" : "1 Accion",
          alcance: "60 pies",
          componentesSeleccionados: {
            verbal: true,
            somatico: true,
            material: false
          },
          duracion: "Instantaneo",
          concentracion: false,
          ritual: false,
          descripcion: ""
        };

        const cdFinal = hechizo.cd !== undefined ? hechizo.cd : cdSalvacionPersonaje;
        const bonoAtaqueFinal = hechizo.bonoAtaque !== undefined ? hechizo.bonoAtaque : bonoAtaqueMagico;

        await lanzar({
          modo: "objetoMagico",
          hechizo: objetoHechizoBase,
          objetoNombre,
          objetoInstanciaId: objeto.idInstancia,
          bonoAtaqueObjeto: bonoAtaqueFinal,
          cdObjeto: cdFinal,
          cdSalvacionPersonaje,
          costeCargasObjeto: coste
        });
      }}
      bloqueadoPorArmadura={!puedeLanzar}
      motivoBloqueoArmadura={motivoBloqueo}
    />
  );
};
