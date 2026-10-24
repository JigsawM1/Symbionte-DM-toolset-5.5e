export const htmlBardo = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react';import{createRoot}from'react-dom/client';import App from'/src/App.tsx';import'/src/index.css';
import{usarAlmacenDM}from'/src/almacen/usarAlmacenDM.ts';import{PERSONAJE_POR_DEFECTO}from'/src/constantes/personajeConstantes.ts';
import{aplicarBuildClaseAPersonaje}from'/src/servicios/gestorClases.ts';import{calcularEstadisticasPersonaje}from'/src/almacen/selectores/usarEstadoPersonajes.ts';
import{deshidratarPersonaje,hidratarPersonaje}from'/src/servicios/serializadorPersonaje.ts';
import{ejecutarDescansoCorto}from'/src/servicios/procesadorDescansos.ts';
import HECHIZOS from'/src/utiles/compendios/all.json';
usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',cargandoDatos:false,datosInicialesCargados:false,
 cargarDatosPersistidos:async()=>{},establecerEsGM:()=>{},personajes:[],idPersonajeActivo:'',colaIniciativa:[],baseDatosHechizos:HECHIZOS});
window.estado=()=>usarAlmacenDM.getState();window.pj=()=>window.estado().personajes.find(p=>p.id===window.estado().idPersonajeActivo);
window.rasgo=n=>window.pj().rasgos.find(r=>r.nombre===n);window.stats=()=>calcularEstadisticasPersonaje(window.pj());
window.ir=pestañaActiva=>usarAlmacenDM.setState({pestañaActiva});
window.recargar=()=>usarAlmacenDM.setState({personajes:[hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(window.pj()))),window.estado().baseDatosHechizos)]});
window.sembrar=(nivel=9,colegio='')=>{
 usarAlmacenDM.setState({personajes:[],colaIniciativa:[],baseDatosHechizos:HECHIZOS});
 const base={...structuredClone(PERSONAJE_POR_DEFECTO),nombre:'Bardo de prueba',especie:'',
 caracteristicas:{fuerza:10,destreza:14,constitucion:12,inteligencia:10,sabiduria:12,carisma:18},
 gradosHabilidades:{...PERSONAJE_POR_DEFECTO.gradosHabilidades,interpretacion:'competente',persuasion:'competente',historia:'competente',sigilo:'competente'}};
 const id=window.estado().crearPersonaje(aplicarBuildClaseAPersonaje(base,'Bardo',nivel,colegio));
 usarAlmacenDM.setState({esGM:false,pestañaActiva:'rasgos',idPersonajeActivo:id});return id;
};
window.descansar=()=>window.estado().actualizarPersonaje(window.pj().id,ejecutarDescansoCorto(window.pj(),0).personajeActualizado);
window.sembrar();createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`;
