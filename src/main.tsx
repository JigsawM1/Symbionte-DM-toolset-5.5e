import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { procesarResultadosDadosTaleSpire } from './utiles/lanzadorDados';


// Registrar oyentes de eventos de TaleSpire a través del EventBus centralizado
import { puenteTaleSpire } from './servicios/puenteTaleSpire';
import { logger } from '@/utiles/logger';

puenteTaleSpire.on('resultadosDados', async (resultados) => {
  logger.debug("[TaleSpire Main] Resultados de dados recibidos en el EventBus:", resultados);
  await procesarResultadosDadosTaleSpire(resultados);
});

// Nota: Las suscripciones de iniciativa y selección se administran reactivamente 
// en usarConexionTaleSpire.ts para integrarse con el ciclo de vida de React.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
