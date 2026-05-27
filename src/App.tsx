import React from "react";
import { usarAlmacenDM } from "./almacen/usarAlmacenDM";
import { usarConexionTaleSpire } from "./hooks/usarConexionTaleSpire";
import { LimiteError } from "./componentes/LimiteError";
import { BarraSuperior } from "./componentes/BarraSuperior";
import { BarraControl } from "./componentes/BarraControl";
import { GestorIniciativa } from "./componentes/GestorIniciativa";
import { TablasDM } from "./componentes/TablasDM";
import { Pendientes } from "./componentes/Pendientes";
import { ListaHechizos } from "./componentes/ListaHechizos";
import { NotasDM } from "./componentes/NotasDM";
import { CreadorHomebrew } from "./componentes/CreadorHomebrew";
import { ConfiguracionDM } from "./componentes/ConfiguracionDM";
import { PanelDados } from "./componentes/PanelDados";
import estilos from "./App.module.css";

const AppContenido: React.FC = () => {
  const { pestañaActiva } = usarAlmacenDM();

  // Sincronización híbrida mediante hook modular
  usarConexionTaleSpire();

  // Renderizado condicional basado en la pestaña activa
  const renderContenidoPestaña = () => {
    switch (pestañaActiva) {
      case "iniciativa":
        return <GestorIniciativa />;
      case "tablas":
        return <TablasDM />;
      case "pendientes":
        return <Pendientes />;
      case "hechizos":
        return <ListaHechizos />;
      case "notas":
        return <NotasDM />;
      case "homebrew":
        return <CreadorHomebrew />;
      case "configuracion":
        return <ConfiguracionDM />;
      default:
        return <GestorIniciativa />;
    }
  };

  return (
    <div className={estilos.contenedorGeneral}>
      {/* Barra de título y navegación superior */}
      <BarraSuperior />

      {/* Controles del DM */}
      {pestañaActiva === "iniciativa" && <BarraControl />}

      {/* Panel de Contenido Principal Reactivo de Alta Densidad */}
      <main className={estilos.areaContenido}>
        {renderContenidoPestaña()}
      </main>

      {/* Panel flotante premium de dados */}
      <PanelDados />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LimiteError>
      <AppContenido />
    </LimiteError>
  );
};

export default App;
