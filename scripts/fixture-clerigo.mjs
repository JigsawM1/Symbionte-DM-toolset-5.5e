export const htmlClerigo = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react';import{createRoot}from'react-dom/client';import App from'/src/App.tsx';import'/src/index.css';
import{usarAlmacenDM}from'/src/almacen/usarAlmacenDM.ts';import{PERSONAJE_POR_DEFECTO}from'/src/constantes/personajeConstantes.ts';
import{aplicarBuildClaseAPersonaje}from'/src/servicios/gestorClases.ts';
import{deshidratarPersonaje,hidratarPersonaje}from'/src/servicios/serializadorPersonaje.ts';
import{ejecutarDescansoCorto,ejecutarDescansoLargo}from'/src/servicios/procesadorDescansos.ts';
import HECHIZOS from'/src/utiles/compendios/all.json';
usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',cargandoDatos:false,datosInicialesCargados:false,
 cargarDatosPersistidos:async()=>{},establecerEsGM:()=>{},personajes:[],idPersonajeActivo:'',colaIniciativa:[],baseDatosHechizos:HECHIZOS});
window.estado=()=>usarAlmacenDM.getState();window.pj=()=>window.estado().personajes.find(p=>p.id===window.estado().idPersonajeActivo);
window.rasgo=n=>window.pj().rasgos.find(r=>r.id==='rasgo_cls_clerigo_'+n);
window.recargar=()=>usarAlmacenDM.setState({personajes:[hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(window.pj()))),HECHIZOS)]});
window.sembrar=(nivel=20)=>{
 usarAlmacenDM.setState({personajes:[],colaIniciativa:[],baseDatosHechizos:HECHIZOS});
 const base={...structuredClone(PERSONAJE_POR_DEFECTO),nombre:'Clérigo de prueba',especie:'',
 caracteristicas:{fuerza:10,destreza:14,constitucion:12,inteligencia:20,sabiduria:18,carisma:10}};
 const id=window.estado().crearPersonaje(aplicarBuildClaseAPersonaje(base,'Clérigo',nivel));
 usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',idPersonajeActivo:id});return id;
};
window.descansar=(largo=false)=>window.estado().actualizarPersonaje(window.pj().id,(largo?ejecutarDescansoLargo(window.pj()):ejecutarDescansoCorto(window.pj(),0)).personajeActualizado);
window.sembrar();createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`;
