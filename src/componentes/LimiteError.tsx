import { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import estilos from "./LimiteError.module.css";

interface Props {
  children?: ReactNode;
}

interface State {
  tieneError: boolean;
  error: Error | null;
}

export class LimiteError extends Component<Props, State> {
  public state: State = {
    tieneError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { tieneError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error no capturado por el Simbionte:", error, errorInfo);
  }

  private alReiniciar = () => {
    localStorage.removeItem("dm_monstruos_homebrew");
    localStorage.removeItem("dm_hechizos_homebrew");
    localStorage.removeItem("dm_objetos_homebrew");
    localStorage.removeItem("dm_pendientes");
    localStorage.removeItem("dm_notas");
    localStorage.removeItem("dm_encuentros_guardados");
    window.location.reload();
  };

  public render() {
    if (this.state.tieneError) {
      return (
        <div className={estilos.contenedor}>
          <div className={estilos.tarjeta}>
            <AlertOctagon size={32} className={estilos.icono} />
            <h2 className={estilos.titulo}>ERROR CATASTRÓFICO EN EL SIMBIONTE</h2>
            <p className={estilos.descripcion}>
              El motor reactivo ha detectado una excepción crítica en tiempo de ejecución. 
              Esto suele deberse a un formato JSON corrupto en los datos importados o a una inconsistencia del motor Chromium empotrado de TaleSpire.
            </p>
            
            <div className={estilos.detalles}>
              <strong>Mensaje del Error:</strong>
              <pre className={estilos.codigo}>{this.state.error?.message || "Desconocido"}</pre>
              <strong>Traza del Error:</strong>
              <pre className={estilos.codigo}>{this.state.error?.stack || "No disponible"}</pre>
            </div>

            <div className={estilos.acciones}>
              <button onClick={() => window.location.reload()} className={estilos.botonRecargar}>
                Recargar Simbionte
              </button>
              
              <button onClick={this.alReiniciar} className={estilos.botonReiniciar}>
                <RotateCcw size={12} />
                Reiniciar Caché Total (Borrar datos)
              </button>
            </div>
            
            <p className={estilos.advertencia}>
              * Nota: Reiniciar la caché borrará tus criaturas y conjuros creados localmente para rescatar el sistema.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
