export const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"></head><body><div id="root"></div><script type="module">
import React from 'react'; import { createRoot } from 'react-dom/client';
import '/src/index.css';
import { CampoNumerico } from '/src/componentes/comunes/CampoNumerico.tsx';
import { FormularioNumerico } from '/src/componentes/comunes/FormularioNumerico.tsx';
import { PERSONAJE_POR_DEFECTO } from '/src/constantes/personajeConstantes.ts';
import { usarAlmacenDM } from '/src/almacen/usarAlmacenDM.ts';
import { OBJETOS_INICIALES } from '/src/utiles/datosIniciales.ts';
import { BarraMetricasInventario } from '/src/componentes/caracteristicas/inventario/BarraMetricasInventario.tsx';
import { PanelVitalidadPersonaje } from '/src/componentes/caracteristicas/personajes/PanelVitalidadPersonaje.tsx';
import { PanelAtributosPersonaje } from '/src/componentes/caracteristicas/personajes/PanelAtributosPersonaje.tsx';
import { MetricasRapidasPersonaje } from '/src/componentes/caracteristicas/personajes/MetricasRapidasPersonaje.tsx';
import { calcularEstadisticasPersonaje } from '/src/almacen/selectores/usarEstadoPersonajes.ts';
import { TrackerPuntosConjuro } from '/src/componentes/caracteristicas/personajes/TrackerPuntosConjuro.tsx';
import { TarjetaCriaturaIniciativa } from '/src/componentes/caracteristicas/iniciativa/TarjetaCriaturaIniciativa.tsx';
import { PanelConfiguracionPersonaje } from '/src/componentes/caracteristicas/personajes/PanelConfiguracionPersonaje.tsx';
import { ModalEditarPersonaje } from '/src/componentes/caracteristicas/personajes/ModalEditarPersonaje.tsx';
import { ModalDetalleCaracteristica } from '/src/componentes/caracteristicas/personajes/ModalDetalleCaracteristica.tsx';
import { ModalDetalleHabilidad } from '/src/componentes/caracteristicas/personajes/ModalDetalleHabilidad.tsx';
import { ModalAgregarObjeto } from '/src/componentes/caracteristicas/inventario/ModalAgregarObjeto.tsx';
import { ConstructorRasgoDote } from '/src/componentes/caracteristicas/rasgos/ConstructorRasgoDote.tsx';
import { FormularioObjeto } from '/src/componentes/caracteristicas/homebrew/FormularioObjeto.tsx';
import { FormularioCriatura } from '/src/componentes/caracteristicas/homebrew/FormularioCriatura.tsx';
import { ConversorDivisas } from '/src/componentes/caracteristicas/tablas/ConversorDivisas.tsx';
import { CalculadoraViaje } from '/src/componentes/caracteristicas/tablas/CalculadoraViaje.tsx';
import { CalculadoraSalto } from '/src/componentes/caracteristicas/tablas/CalculadoraSalto.tsx';
const h=React.createElement, raiz=createRoot(document.getElementById('root'));
const inicial={...structuredClone(PERSONAJE_POR_DEFECTO),id:'prueba',nombre:'Prueba numérica',nivel:5,clases:[{nombre:'Mago',nivel:5}],hpActual:20,hpMaximo:30,hpMaximoBase:30,dadosGolpeRestantes:3,dadosGolpeTotal:5,bolsaMonedas:{po:20,pc:0,pp:0,pe:0,ppt:0}};
usarAlmacenDM.setState({personajes:[inicial],idPersonajeActivo:inicial.id,esGM:false,datosInicialesCargados:false});
let version=0;
function Escenario({caso,tema,version}){
 const [pj,setPj]=React.useState(structuredClone(inicial));
 const [simple,setSimple]=React.useState({actual:20,opcional:19,decimal:1.5,identidad:'a'});
 const [criatura,setCriatura]=React.useState({id:'criatura-a',nombre:'Prueba numérica',iniciativa:20,vidaActual:20,vidaMaxima:30,vidaTemporal:0,ca:10,condiciones:[],efectos:[],esMonstruo:false});
 window.actualizar=(cambios)=>{setPj(p=>({...p,...cambios}));setSimple(p=>({...p,...cambios}));setCriatura(p=>({...p,...cambios}));};
 window.leer=()=>({pj,simple,criatura,registros:window.registros,guardado:window.guardado,almacen:usarAlmacenDM.getState().objetosHomebrew});
 const registrar=(tipo,valor)=>window.registros.push({tipo,valor});
 const cambio=(clave,valor)=>{registrar(clave,valor);setPj(p=>({...p,[clave]:valor}));};
 const guardar=valor=>{window.guardado=valor;registrar('guardado',valor);};
 const nada=()=>{};
 let contenido;
 if(caso==='simple')contenido=h(FormularioNumerico,{onSubmit:()=>guardar({...simple})},
  h(CampoNumerico,{'aria-label':'Actual',value:simple.actual,min:0,max:30,readOnly:simple.soloLectura,identidad:simple.identidad,alConfirmar:valor=>{registrar('actual',valor);setSimple(p=>({...p,actual:valor}));}}),
  h(CampoNumerico,{'aria-label':'Opcional',value:simple.opcional,min:1,max:30,alConfirmar:valor=>setSimple(p=>({...p,opcional:valor})),alVaciar:()=>setSimple(p=>({...p,opcional:null}))}),
  h(CampoNumerico,{'aria-label':'Decimal',value:simple.decimal,tipo:'decimal',step:0.5,alConfirmar:valor=>setSimple(p=>({...p,decimal:valor}))}),
  h(CampoNumerico,{'aria-label':'Negativo',value:-3,alConfirmar:valor=>registrar('negativo',valor)}),h('button',{type:'submit'},'Guardar'));
 if(caso==='monedas')contenido=h(BarraMetricasInventario,{estaAbierta:true,alAlternar:nada,totalPOEquivalente:20,sobrecargado:false,pesoTotal:0,capacidadCarga:150,totalSintonizados:0,bolsaMonedas:pj.bolsaMonedas,alEstablecerMonedas:valores=>cambio('bolsaMonedas',{...pj.bolsaMonedas,...valores}),fuerzaEfectiva:10,multiplicadorTexto:'',pesoContenedoresSinCarga:0,porcentajeCarga:0,objetosSintonizados:[]});
 if(caso==='vida')contenido=h(PanelVitalidadPersonaje,{personaje:pj,alModificarHP:valor=>{registrar('dano',valor);setPj(p=>({...p,hpActual:p.hpActual+valor}));},alEstablecerHPActual:valor=>cambio('hpActual',valor),alModificarHPMaximoEfectivo:valor=>cambio('hpMaximo',valor),alModificarHPTemporal:valor=>cambio('hpTemporal',valor),alGastarDadoGolpe:nada,alEstablecerDadosGolpeRestantes:valor=>cambio('dadosGolpeRestantes',valor),alEstablecerSalvacionMuerte:nada,alReiniciarSalvacionesMuerte:nada,alModificarCansancio:nada,alTirarSalvacionMuerte3D:nada});
 if(caso==='atributos')contenido=h(PanelAtributosPersonaje,{personaje:pj,statsCalculadas:calcularEstadisticasPersonaje(pj),alTirarCaracteristica:nada,alTirarSalvacion:nada,alAlternarSalvacion:nada,alModificarCaracteristicaBase:(clave,valor)=>cambio('caracteristicas',{...pj.caracteristicas,[clave]:valor})});
 if(caso==='movimiento')contenido=h(MetricasRapidasPersonaje,{personaje:pj,bonoCompetencia:3,modDestreza:0,alTirarIniciativa:nada,alAlternarInspiracion:nada,alModificarMovimientoRestante:valor=>registrar('movimiento',valor)});
 if(caso==='puntos')contenido=h(TrackerPuntosConjuro,{puntosMaximos:30,puntosGastados:10,nivelMaximo:3,alGastarPuntos:valor=>registrar('gasto',valor),alRecuperarPuntos:valor=>registrar('recuperacion',valor)});
 if(caso==='iniciativa')contenido=h(TarjetaCriaturaIniciativa,{criatura,esTurnoActivo:false,plantilla:null,onEliminar:nada,onSeleccionar:nada,onCurar:valor=>registrar('curacion',valor),onDañar:valor=>registrar('dano',valor),onCambiarTempHP:valor=>{registrar('temporal',valor);setCriatura(p=>({...p,vidaTemporal:valor}));},onAñadirCondicion:nada,onQuitarCondicion:nada,onAñadirEfecto:nada,onQuitarEfecto:nada,onLanzarIniciativa:nada,onEstablecerIniciativa:valor=>{registrar('iniciativa',valor);setCriatura(p=>({...p,iniciativa:valor}));},onEstablecerVidaMaxima:valor=>setCriatura(p=>({...p,vidaMaxima:valor})),onLanzarAtaqueRapido:nada,obtenerPercepcionPasiva:()=>10});
 if(caso==='configuracion')contenido=h(PanelConfiguracionPersonaje,{personaje:pj,alGuardar:guardar,alVolverAFicha:nada});
 if(caso==='editar')contenido=h(ModalEditarPersonaje,{personaje:pj,alGuardar:guardar,alCerrar:nada});
 if(caso==='caracteristica')contenido=h(ModalDetalleCaracteristica,{personaje:pj,caracteristicaClave:'fuerza',alGuardar:(clave,valor)=>guardar(valor),alCerrar:nada});
 if(caso==='habilidad')contenido=h(ModalDetalleHabilidad,{personaje:pj,habilidadClave:'atletismo',nombreHabilidad:'Atletismo',alGuardarPersonalizacion:(clave,grado,valor)=>guardar(valor),alCerrar:nada});
 if(caso==='agregar')contenido=h(ModalAgregarObjeto,{baseDatosObjetos:OBJETOS_INICIALES,alAgregarObjeto:guardar,alCerrar:nada});
 if(caso==='constructor')contenido=h(ConstructorRasgoDote,{personaje:pj,alGuardar:guardar,alVolver:nada});
 if(caso==='objeto')contenido=h(FormularioObjeto,{idEnEdicion:null,alGuardarExitoso:()=>guardar('objeto'),cancelarEdicion:nada});
 if(caso==='criatura')contenido=h(FormularioCriatura,{idEnEdicion:null,alGuardarExitoso:()=>guardar('criatura'),cancelarEdicion:nada});
 if(caso==='divisas')contenido=h(ConversorDivisas);
 if(caso==='viaje')contenido=h(CalculadoraViaje);
 if(caso==='salto')contenido=h(CalculadoraSalto);
 return h('div',{'data-tema':tema,'data-caso':caso,'data-version':version},contenido);
}
window.cargar=(caso,tema='jugador')=>{window.registros=[];window.guardado=null;raiz.render(h(Escenario,{key:++version,version,caso,tema}));return version;};
window.cargar('simple');window.listo=true;
</script></body></html>`;
