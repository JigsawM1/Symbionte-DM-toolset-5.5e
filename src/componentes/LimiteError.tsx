import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

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
        <div style={estilos.contenedor}>
          <div style={estilos.tarjeta}>
            <AlertOctagon size={32} style={estilos.icono} />
            <h2 style={estilos.titulo}>ERROR CATASTRÓFICO EN EL SIMBIONTE</h2>
            <p style={estilos.descripcion}>
              El motor reactivo ha detectado una excepción crítica en tiempo de ejecución. 
              Esto suele deberse a un formato JSON corrupto en los datos importados o a una inconsistencia del motor Chromium empotrado de TaleSpire.
            </p>
            
            <div style={estilos.detalles}>
              <strong>Mensaje del Error:</strong>
              <pre style={estilos.codigo}>{this.state.error?.message || "Desconocido"}</pre>
              <strong>Traza del Error:</strong>
              <pre style={estilos.codigo}>{this.state.error?.stack || "No disponible"}</pre>
            </div>

            <div style={estilos.acciones}>
              <button onClick={() => window.location.reload()} style={estilos.botonRecargar}>
                Recargar Simbionte
              </button>
              
              <button onClick={this.alReiniciar} style={estilos.botonReiniciar}>
                <RotateCcw size={12} />
                Reiniciar Caché Total (Borrar datos)
              </button>
            </div>
            
            <p style={estilos.advertencia}>
              * Nota: Reiniciar la caché borrará tus criaturas y conjuros creados localmente para rescatar el sistema.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const estilos: { [key: string]: React.CSSProperties } = {
  contenedor: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#0d0e12",
    padding: "20px",
    boxSizing: "border-box",
    fontFamily: "var(--fuente-principal, sans-serif)",
    color: "#e2e8f0"
  },
  tarjeta: {
    backgroundColor: "#14161f",
    border: "2px solid #f25c54",
    padding: "16px",
    maxWidth: "500px",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  icono: {
    color: "#f25c54",
    alignSelf: "center"
  },
  titulo: {
    fontSize: "13px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#f25c54",
    margin: 0,
    letterSpacing: "0.05em"
  },
  descripcion: {
    fontSize: "10.5px",
    lineHeight: "1.35",
    color: "#94a3b8",
    textAlign: "justify",
    margin: 0
  },
  detalles: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    fontSize: "9px"
  },
  codigo: {
    fontFamily: "var(--fuente-codigo, monospace)",
    fontSize: "8.5px",
    backgroundColor: "#0d0e12",
    border: "1px solid #2d3142",
    padding: "6px",
    margin: "2px 0 6px 0",
    overflow: "auto",
    maxHeight: "120px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    color: "#ffb703"
  },
  acciones: {
    display: "flex",
    gap: "6px",
    marginTop: "4px"
  },
  botonRecargar: {
    flex: 1,
    height: "26px",
    backgroundColor: "#5f5dbb",
    border: "1px solid #7b2cbf",
    color: "#ffffff",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  botonReiniciar: {
    flex: 1,
    height: "26px",
    backgroundColor: "rgba(242, 92, 84, 0.1)",
    border: "1px solid #f25c54",
    color: "#f25c54",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px"
  },
  advertencia: {
    fontSize: "8.5px",
    color: "#475569",
    textAlign: "center",
    margin: 0,
    fontStyle: "italic"
  }
};
