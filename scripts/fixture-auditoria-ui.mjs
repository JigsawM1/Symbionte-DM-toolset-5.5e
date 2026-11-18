// Datos sintéticos y App real. No se conecta a TaleSpire ni se reutilizan fichas del usuario.
export const htmlAuditoria = `<!doctype html><html lang="es"><body><div id="root"></div>
<script type="module">
import React from 'react'; import {createRoot} from 'react-dom/client';
import App from '/src/App.tsx'; import '/src/index.css';
import {usarAlmacenDM} from '/src/almacen/usarAlmacenDM.ts';
import {PERSONAJE_POR_DEFECTO} from '/src/constantes/personajeConstantes.ts';
import {aplicarBuildClaseAPersonaje} from '/src/servicios/gestorClases.ts';
import {deshidratarPersonaje,hidratarPersonaje} from '/src/servicios/serializadorPersonaje.ts';
import {proyectarBorradorCombatePJ} from '/src/servicios/sincronizacion/proyeccionEstadoCombate.ts';
import HECHIZOS from '/src/utiles/compendios/all.json';
localStorage.clear(); sessionStorage.clear();
usarAlmacenDM.setState({esGM:true,pestañaActiva:'iniciativa',cargandoDatos:false,datosInicialesCargados:false,
 cargarDatosPersistidos:async()=>{},establecerEsGM:()=>{},personajes:[],colaIniciativa:[],baseDatosHechizos:HECHIZOS});
window.estado=()=>usarAlmacenDM.getState();
const alerta={id:'auditoria-alerta',nombre:'Alerta',descripcion:'Bono de competencia a iniciativa',origen:'dote',fuente:'Auditoría',
 tipoAccion:'pasivo',tieneUsosLimitados:false,recuperacion:'ninguno',personalizado:false,activo:true,notas:'',
 efectos:[{tipo:'modificador_stat',objetivo:'iniciativa',valor:'bono_competencia'}]};
const crear=(id,nombre)=>({...aplicarBuildClaseAPersonaje({...structuredClone(PERSONAJE_POR_DEFECTO),especie:'',
 caracteristicas:{fuerza:10,destreza:14,constitucion:12,inteligencia:16,sabiduria:10,carisma:10}},'Mago',2,''),
 id,nombre,idMiniaturaTS:null,hpActual:10,hpMaximo:10,iniciativaBono:3,inventario:[]});
const a=crear('auditoria-a','AUDITORÍA A'),b=crear('auditoria-b','AUDITORÍA B');
a.rasgos=[...a.rasgos,alerta]; b.rasgos=[...b.rasgos,alerta];
a.espaciosConjuroGastados={1:1};b.espaciosConjuroGastados={1:1};
usarAlmacenDM.setState({personajes:[b,a],idPersonajeActivo:b.id});
window.pj=()=>window.estado().personajes.find(p=>p.id===window.estado().idPersonajeActivo);
window.ir=(pestañaActiva,esGM=false)=>usarAlmacenDM.setState({pestañaActiva,esGM});
window.recargar=()=>usarAlmacenDM.setState({personajes:window.estado().personajes.map(p=>hidratarPersonaje(
 JSON.parse(JSON.stringify(deshidratarPersonaje(p))),window.estado().baseDatosHechizos))});
window.pendiente=()=>usarAlmacenDM.setState({borradoresSync:{[b.id]:proyectarBorradorCombatePJ(window.pj())}});
window.renombrar=(nombreA,nombreB)=>usarAlmacenDM.setState({personajes:window.estado().personajes.map(p=>({...p,nombre:p.id===a.id?nombreA:nombreB})),colaIniciativa:[]});
createRoot(document.getElementById('root')).render(React.createElement(App));
</script></body></html>`;

// Componentes reales con renders y filtrado controlados; no requieren estado de juego.
export const htmlSelectoresAuditoria = `<!doctype html><html lang="es"><body><div id="root"></div>
<script type="module">
import React from 'react'; import {createRoot} from 'react-dom/client';
import {SelectorDesplegable} from '/src/componentes/comunes/SelectorDesplegable.tsx';
import {SelectorSugerencias} from '/src/componentes/comunes/SelectorSugerencias.tsx';
function Prueba() {
 const [contador,contar]=React.useState(0),[valor,cambiar]=React.useState('Alfa'),[texto,escribir]=React.useState(''),[grupo,elegirGrupo]=React.useState('');
 const [opciones,cambiarOpciones]=React.useState(['Alfa','Beta','Gamma']);
 window.renderPadre=()=>contar(n=>n+1); window.cambiarOpciones=cambiarOpciones;
 return React.createElement('main',null,React.createElement('output',null,contador),
  React.createElement(SelectorDesplegable,{id:'selector',valor,alCambiar:cambiar,opciones:opciones.map(x=>x)}),
  React.createElement(SelectorSugerencias,{id:'sugerencias',valor:texto,alCambiar:escribir,opciones:['Alfa','Beta','Gamma']}),
  React.createElement(SelectorSugerencias,{id:'grupos',valor:grupo,alCambiar:elegirGrupo,opciones:[
   {valor:'Uno',grupo:'A'},{valor:'Dos',grupo:'B'},{valor:'Tres',grupo:'A'},{valor:'Cuatro'}]}));
}
createRoot(document.getElementById('root')).render(React.createElement(Prueba));
</script></body></html>`;
