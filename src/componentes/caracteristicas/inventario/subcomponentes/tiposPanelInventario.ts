import type {
  PersonajeJugador,
  ObjetoJuego,
  ObjetoInventario,
  BolsaMonedas,
  TipoMonedaClave,
  TipoContenedor
} from "@/tipos";
import type { EstadisticasCalculadasPersonaje } from "@/almacen/selectores/usarEstadoPersonajes";

export interface PanelInventarioPersonajeProps {
  personaje: PersonajeJugador;
  statsCalculadas: EstadisticasCalculadasPersonaje;
  baseDatosObjetos: ObjetoJuego[];
  alAgregarObjeto: (objeto: ObjetoInventario | ObjetoInventario[]) => void;
  alQuitarObjeto: (idInstancia: string) => void;
  alModificarCantidad: (idInstancia: string, delta: number) => void;
  alAlternarEquipado: (idInstancia: string) => void;
  alAlternarSintonizado: (idInstancia: string) => void;
  alActualizarNotas: (idInstancia: string, notas: string) => void;
  alActualizarObjeto?: (idInstancia: string, cambios: Partial<ObjetoInventario>) => void;
  alModificarCargas: (idInstancia: string, delta: number) => void;
  alCambiarContenedor?: (idInstancia: string, contenedor: TipoContenedor) => void;
  alReordenarInventario?: (idInstanciaOrigen: string, idInstanciaDestino: string) => void;
  alDesempaquetarPaquete?: (idInstancia: string) => void;
  alEstablecerMonedas: (monedas: Partial<BolsaMonedas>) => void;
  alModificarMoneda: (tipo: TipoMonedaClave, delta: number) => void;
  alUsarObjeto?: (objeto: ObjetoInventario) => void;
}
