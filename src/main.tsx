import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { procesarResultadosDadosTaleSpire } from './utiles/lanzadorDados';

import { usarAlmacenDM } from './almacen/usarAlmacenDM.ts';

// Helper para leer la cola de iniciativa física y sincronizarla en caliente
const sincronizarColaIniciativaFisica = () => {
  const windowAlias = window as any;
  const ts = windowAlias.TS;
  if (ts && ts.initiative && typeof ts.initiative.getQueue === "function") {
    ts.initiative.getQueue()
      .then((colaTS: any) => {
        console.log("[TaleSpire Callback] Cola física leída con éxito:", colaTS);
        usarAlmacenDM.getState().actualizarColaIniciativaDesdeTaleSpire(colaTS || []);
      })
      .catch((e: any) => {
        console.warn("[TaleSpire Callback] Error al leer la cola física de iniciativa:", e);
      });
  }
};

// Registrar manejadores globales sincrónicos e inmediatos en window
const windowAlias = window as any;

windowAlias.manejarCambioEstadoSimbionte = (evento: any) => {
  console.log("[TaleSpire Callback] Evento de estado de simbionte:", evento);
};

windowAlias.initiativeUpdated = () => {
  console.log("[TaleSpire Callback] initiativeUpdated recibido en window.");
  sincronizarColaIniciativaFisica();
};

windowAlias.manejarEventoIniciativa = () => {
  console.log("[TaleSpire Callback] manejarEventoIniciativa recibido en window.");
  sincronizarColaIniciativaFisica();
};

windowAlias.manejarCambioEstadoCriatura = (evento: any) => {
  console.log("[TaleSpire Callback] Evento de estado de criatura:", evento);
  sincronizarColaIniciativaFisica();
};

windowAlias.manejarCambioSeleccionCriatura = (evento: any) => {
  console.log("[TaleSpire Callback] Evento de selección de criaturas:", evento);
  usarAlmacenDM.getState().actualizarSeleccionCriaturas(evento || []);
};

windowAlias.manejarResultadosDados = async (resultados: any) => {
  console.log("[TaleSpire Callback] Resultados de dados recibidos:", resultados);
  await procesarResultadosDadosTaleSpire(resultados);
};

// Registrar oyentes de eventos DOM estándar en window y document para redundancia de mensajería CEF
const manejarEventoIniciativaDOM = (e: Event) => {
  console.log("[TaleSpire DOM Event] Capturado evento 'initiativeUpdated' en el DOM:", e);
  sincronizarColaIniciativaFisica();
};

window.addEventListener("initiativeUpdated", manejarEventoIniciativaDOM);
document.addEventListener("initiativeUpdated", manejarEventoIniciativaDOM);
window.addEventListener("manejarEventoIniciativa", manejarEventoIniciativaDOM);
document.addEventListener("manejarEventoIniciativa", manejarEventoIniciativaDOM);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
