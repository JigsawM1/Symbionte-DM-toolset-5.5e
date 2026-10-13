export const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react'; import { createRoot } from 'react-dom/client';
import '/src/index.css'; import app from '/src/App.module.css';
import { usarAlmacenDM } from '/src/almacen/usarAlmacenDM.ts';
import { PERSONAJE_POR_DEFECTO } from '/src/constantes/personajeConstantes.ts';
import { BarraSuperior } from '/src/componentes/layout/BarraSuperior.tsx';
import { PanelDados } from '/src/componentes/layout/PanelDados.tsx';
import { VistaJugadores } from '/src/componentes/caracteristicas/personajes/VistaJugadores.tsx';
import { VistaAtaquesJugador } from '/src/componentes/caracteristicas/ataques/VistaAtaquesJugador.tsx';
import { VistaInventarioJugador } from '/src/componentes/caracteristicas/inventario/VistaInventarioJugador.tsx';
import { VistaRasgosJugador } from '/src/componentes/caracteristicas/rasgos/VistaRasgosJugador.tsx';
import { Compendio } from '/src/componentes/caracteristicas/compendio/Compendio.tsx';
import { IniciativaJugador } from '/src/componentes/caracteristicas/iniciativa/IniciativaJugador.tsx';
import { GestorIniciativa } from '/src/componentes/caracteristicas/iniciativa/GestorIniciativa.tsx';
import { NotasDM } from '/src/componentes/caracteristicas/notas/NotasDM.tsx';
import { FichaHechizo } from '/src/componentes/caracteristicas/compendio/FichaHechizo.tsx';
import { TooltipUniversal } from '/src/componentes/comunes/TooltipUniversal.tsx';
import { SelectorDesplegable } from '/src/componentes/comunes/SelectorDesplegable.tsx';
import { PanelConfiguracionPersonaje } from '/src/componentes/caracteristicas/personajes/PanelConfiguracionPersonaje.tsx';
import { ConstructorRasgoDote } from '/src/componentes/caracteristicas/rasgos/ConstructorRasgoDote.tsx';
import { ModalAgregarObjeto } from '/src/componentes/caracteristicas/inventario/ModalAgregarObjeto.tsx';
import { ModalDetalleObjetoInventario } from '/src/componentes/caracteristicas/inventario/ModalDetalleObjetoInventario.tsx';
import { ModalDetalleRasgo } from '/src/componentes/caracteristicas/rasgos/ModalDetalleRasgo.tsx';
import { CreadorHomebrew } from '/src/componentes/caracteristicas/homebrew/CreadorHomebrew.tsx';
import { EsquemaRasgoPersonaje } from '/src/tipos/rasgos.ts';
import { EsquemaObjetoInventario } from '/src/tipos/personaje.ts';
import { OBJETOS_INICIALES } from '/src/utiles/datosIniciales.ts';
const modulos = import.meta.glob('/src/**/*.module.css', { eager: true, import: 'default' });
const pj = { ...structuredClone(PERSONAJE_POR_DEFECTO), id: 'prueba', nombre: 'Armonía del Zafiro', clase: 'Mago', clases: [{ nombre: 'Mago', nivel: 5, subclase: '' }], nivel: 5, hpActual: 24, hpMaximo: 36 };
const criaturas = [{ id:'criatura-prueba', nombre:'Armonía del Zafiro', iniciativa:18, vidaActual:24, vidaMaxima:36, ca:14, condiciones:['Envenenado'], efectos:[], esMonstruo:false, velocidad:'30 pies' }];
const conjuro = { ...usarAlmacenDM.getState().baseDatosHechizos[0], nombre:'Armonía de las estaciones', descripcion:'Primer párrafo de lectura.\\n\\nSegundo párrafo con **énfasis** y 1d4.\\nLínea siguiente.' };
const rasgo=EsquemaRasgoPersonaje.parse({id:'rasgo-prueba',nombre:'Escudo del zafiro',descripcion:'Primera parte.\\n\\nSegunda parte.',tipoAccion:'reaccion',tieneUsosLimitados:true,usosMaximos:3,usosRestantes:2,recuperacion:'descanso_largo',esActivable:true});
const objeto=EsquemaObjetoInventario.parse({idInstancia:'objeto-prueba',idObjeto:'custom-prueba',nombre:'Amuleto del zafiro',categoria:'equipo-aventurero',pesoLb:1,esMagico:true,rareza:'Raro',notas:'Primera parte.\\n\\nSegunda parte.'});
pj.rasgos=[rasgo];pj.inventario=[objeto];pj.esLanzador=true;pj.inspiracion=true;pj.espaciosConjuroMaximos={'1':4,'2':3,'3':2};pj.espaciosConjuroGastados={'1':1};pj.conjurosConocidosIds=[conjuro.id];pj.conjurosPreparadosIds=[conjuro.id];
usarAlmacenDM.setState({ esGM:false, personajes:[pj], idPersonajeActivo:pj.id, colaIniciativa:criaturas, rondaActual:2, indiceTurnoActivo:0, datosInicialesCargados:false });
const vistas = { caracteristicas:VistaJugadores, acciones:VistaAtaquesJugador, inventario:VistaInventarioJugador, rasgos:VistaRasgosJugador, conjuros:Compendio, iniciativa:IniciativaJugador, notas:NotasDM, dm:GestorIniciativa };
Object.assign(vistas,{
 'configuracion-personaje':()=>React.createElement(PanelConfiguracionPersonaje,{personaje:pj,alGuardar:()=>{},alVolverAFicha:()=>{}}),
 constructor:()=>React.createElement(ConstructorRasgoDote,{personaje:pj,alGuardar:()=>{},alVolver:()=>{}}),
 'agregar-objeto':()=>React.createElement(ModalAgregarObjeto,{baseDatosObjetos:OBJETOS_INICIALES,alAgregarObjeto:objeto=>{window.objetoAgregado=objeto;},alCerrar:()=>{window.modalCerrado=true;}}),
 'detalle-objeto':()=>React.createElement(ModalDetalleObjetoInventario,{objeto,totalSintonizados:0,alCerrar:()=>{}}),
 'detalle-rasgo':()=>React.createElement(ModalDetalleRasgo,{rasgo,nombrePersonaje:pj.nombre,nivelPersonaje:5,alCerrar:()=>{},alGastarUso:()=>{},alRecuperarUso:()=>{},alAlternarActivo:()=>{}}),
 homebrew:CreadorHomebrew
});
const raiz = createRoot(document.getElementById('root'));
function Aplicacion() {
 const estado = usarAlmacenDM(s => ({ esGM:s.esGM, pestañaActiva:s.pestañaActiva }));
 const vista = estado.pestañaActiva;
 const componente = vistas[vista] || VistaJugadores;
 return React.createElement('div',{className:app.contenedorGeneral,'data-tema':estado.esGM?'dm':'jugador'},
  React.createElement(BarraSuperior),React.createElement('main',{className:app.areaContenido},
   vista==='detalle' ? React.createElement(FichaHechizo,{hechizo:conjuro,onClose:()=>window.mostrar('conjuros')}) : React.createElement(componente)),React.createElement(PanelDados));
}
window.mostrar = (vista,tema='jugador') => {usarAlmacenDM.setState({ pestañaActiva:vista, esGM:tema==='dm' });raiz.render(React.createElement(Aplicacion));};
window.probarComunes = () => raiz.render(React.createElement('div',{'data-tema':'jugador'},
 React.createElement(SelectorDesplegable,{opciones:['Primera','Segunda'],valor:'Primera',alCambiar:()=>{}}),
 React.createElement(TooltipUniversal,{contenido:'Contenido legible',titulo:'Detalle'},React.createElement('button',{id:'tooltip-prueba'},'Mostrar detalle'))));
window.probarDM = () => {
 const raizPruebas = document.createElement('div'); raizPruebas.dataset.tema='dm'; document.body.append(raizPruebas);
 const propiedades = ['color','backgroundColor','borderTopColor','borderRadius','fontSize','fontFamily','fontWeight','lineHeight','boxShadow','padding','height','width'];
 const resultados = {};
 for (const [archivo,clases] of Object.entries(modulos)) {
  if (!/comunes|layout|homebrew|notas|compendio\\/(FichaHechizo|Compendio|ListaHechizos)\\.module\\.css$/.test(archivo)) continue;
  for(const [nombre,clase] of Object.entries(clases)) {
   const el=document.createElement('div');el.className=clase;el.textContent='Texto';raizPruebas.append(el);
   const estilo=getComputedStyle(el);resultados[archivo+'/'+nombre]=Object.fromEntries(propiedades.map(p=>[p,estilo[p]]));el.remove();
  }
 }
 raizPruebas.remove();return resultados;
};
window.mostrar('caracteristicas');raiz.render(React.createElement(Aplicacion));window.listo=true;
</script></body></html>`;
