import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { procesarResultadosDadosTaleSpire } from './utiles/lanzadorDados';

// Definir manejadores globales para las suscripciones del manifiesto de TaleSpire
const windowAlias = window as any;
windowAlias.manejarCambioEstadoSimbionte = (evento: any) => {
  console.log("[TaleSpire] Evento de estado de simbionte:", evento);
};
windowAlias.manejarEventoIniciativa = (evento: any) => {
  console.log("[TaleSpire] Evento de iniciativa:", evento);
};
windowAlias.manejarResultadosDados = async (resultados: any) => {
  console.log("[TaleSpire] Resultados de dados recibidos:", resultados);
  await procesarResultadosDadosTaleSpire(resultados);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

