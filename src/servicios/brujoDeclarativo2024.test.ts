import { describe, it, expect, beforeEach } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { aplicarBuildClaseAPersonaje, obtenerRasgosClaseYSubclase } from "./gestorClases";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { EsquemaDefinicionClaseJSON, EsquemaInvocacionSobrenaturalJSON } from "@/tipos/esquemasCatalogos";
import { EsquemaPersonajeJugador } from "@/tipos/personaje";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { obtenerResumenDefensasRasgos } from "./rasgos/resumenDefensasRasgos";
import { evaluarEfectosRasgosActivos, aplicarModificadoresInvocacionesAHechizo, tieneConjuroGratuitoActivo, calcularBonoIniciativaRasgos } from "./evaluadorEfectosRasgos";
import { resolverRasgosAcciones } from "./calculadorAccionesCombate";
import { seleccionesValidas, opcionesElegiblesConjuros } from "./rasgos/seleccionesRasgos";
import { construirRasgosDesdeSelectores } from "./rasgos/seleccionesRasgos";
import HECHIZOS from "@/utiles/compendios/all.json";
import brujo from "@/datos/clases/brujo.json";
import invocaciones from "@/datos/invocaciones-sobrenaturales.json";
import type { PersonajeJugador, SelectorRasgo } from "@/tipos";
import { EsquemaHechizoBase } from "@/tipos";
import { obtenerConfiguracionPactoDelFilo } from "./rasgos/evaluadorCombateRasgos";
import { crearBorradorRasgo, construirRasgoDesdeBorrador } from "./rasgos/borradorRasgo";
import { aplicarConfiguracionConjurosRasgos } from "./rasgos/conjurosGratuitosRasgos";
import { validarLanzamiento } from "./servicioLanzamientoConjuros";

const crear = (nivel=9, subclase=""): PersonajeJugador => aplicarBuildClaseAPersonaje({ ...structuredClone(PERSONAJE_POR_DEFECTO),
  id:"brujo-declarativo", especie:"", clase:"Brujo", nivel, caracteristicas:{...PERSONAJE_POR_DEFECTO.caracteristicas,carisma:16},
  trucosConocidosIds:["h_descarga-sobrenatural","h_toque-helado"], rasgos:[] }, "Brujo", nivel, subclase);
const pj = () => usarAlmacenDM.getState().personajes[0];
const rasgo = (nombre: string) => pj().rasgos.find(r => r.nombre===nombre)!;
const elegir = (valores: string[]) => {
  const padre=rasgo("Invocaciones sobrenaturales");
  usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,padre.id,padre.selectores![0].id,valores);
};
const sembrar = (nivel=9,subclase="") => usarAlmacenDM.setState({ personajes:[crear(nivel,subclase)],idPersonajeActivo:"brujo-declarativo",colaIniciativa:[] });

const selectorFiltro = (ids: string[], filtroConjuros: SelectorRasgo["filtroConjuros"]): SelectorRasgo => ({
  id:"selector_regresion_filtro", tipo:"multiple", tipoSelector:"conjuro", etiqueta:"Conjuros",
  maxSelecciones:3, valorActual:[], opciones:ids.map(id=>({id,nombre:id,descripcion:""})), filtroConjuros
});

describe("Filtro de conjuros: compatibilidad y cambios de contexto", () => {
  it.each(["h_rayo-de-escarcha", "Rayo de escarcha", " RAYO DE ESCARCHA ", "h_rayo_de_escarcha"])(
    "conserva la opción %s al repetir la consulta", id => {
      const selector=selectorFiltro([id],{requiereDano:true,requiereAtaque:true,alcanceMinimo:10});
      for(let i=0;i<2;i++)expect(opcionesElegiblesConjuros(selector)).toEqual(selector.opciones);
    });
  it("conserva alias de traducción y rechaza identificadores desconocidos en consultas repetidas", () => {
    const selector=selectorFiltro(["Susurros disonantes", "conjuro_desconocido_regresion"],{requiereDano:true});
    for(let i=0;i<2;i++)expect(opcionesElegiblesConjuros(selector).map(o=>o.id)).toEqual(["Susurros disonantes"]);
  });
  it("recalcula la elegibilidad al cambiar preparados y conserva la elección vigente", () => {
    const selector=selectorFiltro(["h_rayo-de-escarcha", "h_alarma"],{excluirPreparados:true});
    const anterior=crear();expect(opcionesElegiblesConjuros(selector,anterior)).toHaveLength(2);
    const actualizado={...anterior,trucosConocidosIds:[...anterior.trucosConocidosIds,"h_rayo-de-escarcha"],conjurosPreparadosIds:["h_alarma"]};
    expect(opcionesElegiblesConjuros(selector,actualizado)).toEqual([]);
    expect(opcionesElegiblesConjuros({...selector,valorActual:["h_rayo-de-escarcha"]},actualizado).map(o=>o.id)).toEqual(["h_rayo-de-escarcha"]);
    expect(opcionesElegiblesConjuros(selector,anterior)).toHaveLength(2);
  });
  it("mantiene el filtro de clase y conocimiento cuando cambian los aprendizajes", () => {
    const selector=selectorFiltro(["h_rayo-de-escarcha", "h_descarga-sobrenatural"],{soloConocidos:true,clase:"brujo",requiereDano:true});
    const anterior=crear();
    expect(opcionesElegiblesConjuros(selector,anterior).map(o=>o.id)).toEqual(["h_descarga-sobrenatural"]);
    expect(opcionesElegiblesConjuros(selector,{...anterior,trucosConocidosIds:["h_rayo-de-escarcha"]})).toEqual([]);
  });
});

describe("Brujo PHB 2024: recorrido declarativo completo", () => {
  beforeEach(() => sembrar());
  it("valida sin perder metadatos y no decide las elecciones del jugador", () => {
    const clase=EsquemaDefinicionClaseJSON.parse(brujo);
    expect(clase.rasgos.find(r=>r.nombre==="Astucia mágica")?.recuperarPactoAlUsar).toBe("mitad_maximo");
    expect(clase.rasgos[0].selectores?.[0].valorActual).toEqual([]);
    for(const i of invocaciones) expect(EsquemaInvocacionSobrenaturalJSON.parse(i).id).toBe(i.id);
    expect(rasgo("Magia del pacto").configuracionMagica?.tipoLanzador).toBe("pacto");
    expect(crear(20).rasgos.filter(r=>r.origen==="dote")).toEqual([]);
  });
  it.each(Array.from({length:20},(_,i)=>i+1))("adquiere los rasgos y recursos de nivel %i sin adelantar progresiones", nivel => {
    const p=crear(nivel);
    const inv=p.rasgos.find(r=>r.nombre==="Invocaciones sobrenaturales")!;
    const limites=[1,3,3,3,5,5,6,6,7,7,7,8,8,8,9,9,9,10,10,10];
    expect(inv.selectores![0].maxSelecciones).toBe(limites[nivel-1]);
    expect(p.espaciosPactoMaximos).toBe(nivel===1?1:nivel<11?2:nivel<17?3:4);
    expect(p.nivelEspacioPacto).toBe(Math.min(5,Math.ceil(nivel/2)));
    expect(p.rasgos.filter(r=>r.selectores?.some(s=>s.destinoConjuros==="arcano_mistico")).length).toBe([11,13,15,17].filter(n=>n<=nivel).length);
  });
  it.each(brujo.subclases.map(s=>s.nombre))("respeta los niveles 3, 6, 10 y 14 de %s", sub => {
    for(const nivel of [2,3,5,6,9,10,13,14,20]){
      const lista=obtenerRasgosClaseYSubclase("Brujo",nivel,sub);
      const originales=brujo.subclases.find(s=>s.nombre===sub)!.rasgos;
      expect(lista.filter(r=>r.origen==="subclase").map(r=>r.nombre)).toEqual(originales.filter(r=>r.nivel<=nivel).map(r=>r.nombre));
    }
  });
  it.each([2,10,11,17,20])("Astucia mágica recupera la cantidad exacta a nivel %i, sin rellenar usos al reaplicar", nivel => {
    sembrar(nivel); usarAlmacenDM.setState({personajes:[{...pj(),espaciosPactoGastados:pj().espaciosPactoMaximos}]});
    const id=rasgo("Astucia mágica").id;
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj().id,id);
    expect(pj().espaciosPactoGastados).toBe(nivel===20?0:Math.floor(pj().espaciosPactoMaximos/2));
    expect(rasgo("Astucia mágica").usosRestantes).toBe(0);
    const anterior=structuredClone(pj()); usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj().id,id);
    expect(pj()).toEqual(anterior);
    expect(aplicarBuildClaseAPersonaje(pj(),"Brujo",nivel).rasgos.find(r=>r.id===id)?.usosRestantes).toBe(0);
    usarAlmacenDM.getState().ejecutarDescansoPersonaje(pj().id,"largo");
    expect(rasgo("Astucia mágica").usosRestantes).toBe(1);
  });
  it("bloquea requisitos, repeticiones inválidas y retirada del requisito de un dependiente", () => {
    elegir(["castigo_arcano"]); expect(rasgo("Invocaciones sobrenaturales").selectores![0].valorActual).toEqual([]);
    elegir(["pacto_del_filo","castigo_arcano"]); expect(rasgo("Castigo arcano").formulaDados).toBe("6d8");
    expect(resolverRasgosAcciones(pj()).filter(r=>r.rasgo.nombre==="Castigo arcano")).toHaveLength(1);
    elegir(["castigo_arcano"]); expect(rasgo("Pacto del filo")).toBeDefined();
    elegir(["armadura_de_sombras","armadura_de_sombras__2"]); expect(rasgo("Pacto del filo")).toBeDefined();
  });
  it("multiclase no desbloquea invocaciones ni escalados de una clase por nivel total", () => {
    const p={...crear(3),nivel:20,clases:[{nombre:"Brujo",subclase:"",nivel:3},{nombre:"Guerrero",subclase:"",nivel:17}]};
    p.rasgos=sincronizarRasgosAutomaticos(p);
    const padre=p.rasgos.find(r=>r.nombre==="Invocaciones sobrenaturales")!;
    padre.selectores![0].valorActual=["pacto_del_filo","castigo_arcano"];
    expect(seleccionesValidas(padre.selectores![0],3,p)).toEqual(["pacto_del_filo"]);
    expect(construirRasgosDesdeSelectores(p).some(r=>r.nombre==="Castigo arcano")).toBe(false);
  });
  it("las invocaciones repetibles modifican solo el truco elegido y no lo conceden", () => {
    elegir(["descarga_agonica:h_descarga-sobrenatural","descarga_agonica__dos:h_toque-helado","lanza_sobrenatural:h_descarga-sobrenatural"]);
    const descarga=EsquemaHechizoBase.parse(HECHIZOS.find(h=>h.id==="h_descarga-sobrenatural"));
    expect(aplicarModificadoresInvocacionesAHechizo(descarga,pj())).toMatchObject({agregarModificadorHabilidad:true,alcance:"390 pies"});
    const conocidos=[...pj().trucosConocidosIds];
    elegir(["descarga_agonica:h_descarga-sobrenatural","descarga_agonica__dos:h_descarga-sobrenatural"]);
    expect(rasgo("Invocaciones sobrenaturales").selectores![0].valorActual).toHaveLength(3);
    elegir([]); expect(pj().trucosConocidosIds).toEqual(conocidos);
    expect(aplicarModificadoresInvocacionesAHechizo(descarga,pj()).agregarModificadorHabilidad).toBe(false);
  });
  it("Don de las profundidades consume su propio uso, conserva movilidad y restaura tras descanso", () => {
    elegir(["don_de_las_profundidades"]);
    const gasto=consumirRecursoConjuro(pj(),{tipo:"gratuitoInnato",hechizoId:"h_respirar-bajo-el-agua"});
    expect(gasto.permitido).toBe(true); if(!gasto.permitido)return;
    usarAlmacenDM.setState({personajes:[gasto.personaje]});
    expect(tieneConjuroGratuitoActivo(pj(),"Respirar bajo el agua")).toBe(false);
    expect(evaluarEfectosRasgosActivos(pj()).some(e=>e.tipo==="movimiento_especial")).toBe(true);
    const restaurado=hidratarPersonaje(EsquemaPersonajeJugador.parse(JSON.parse(JSON.stringify(deshidratarPersonaje(pj())))));
    expect(restaurado.rasgos.find(r=>r.nombre==="Don de las profundidades")?.usosRestantes).toBe(0);
    usarAlmacenDM.getState().ejecutarDescansoPersonaje(pj().id,"largo"); expect(rasgo("Don de las profundidades").usosRestantes).toBe(1);
  });
  it("conserva elecciones del Libro al guardar; encender y apagar retira únicamente sus conjuros", () => {
    elegir(["pacto_del_grimorio"]); const libro=rasgo("Pacto del grimorio");
    const truco=libro.selectores![0].opciones.find(o=>o.nombre==="Luz")!.id;
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,libro.id,libro.selectores![0].id,[truco]);
    expect(pj().trucosConocidosIds).not.toContain(truco);
    usarAlmacenDM.getState().alternarActivoRasgo(pj().id,libro.id);
    expect(pj().trucosConocidosIds).toContain(truco);
    usarAlmacenDM.getState().agregarTrucoConocido(pj().id,truco);
    const restaurado=hidratarPersonaje(deshidratarPersonaje(pj()));
    expect(restaurado.rasgos.find(r=>r.id===libro.id)?.selectores![0].valorActual).toEqual([truco]);
    elegir([]); expect(pj().trucosConocidosIds).toContain(truco);
  });
  it("las resistencias se aplican y se retiran; fuerza no es elegible", () => {
    sembrar(10,"Patrón Infernal"); const r=rasgo("Resiliencia infernal");
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,r.id,r.selectores![0].id,["fuego"]);
    expect(obtenerResumenDefensasRasgos(pj()).resistencias).toContain("Fuego");
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,r.id,r.selectores![0].id,["fuerza"]);
    expect(obtenerResumenDefensasRasgos(pj()).resistencias).toContain("Fuego");
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,r.id,r.selectores![0].id,[]);
    expect(obtenerResumenDefensasRasgos(pj()).resistencias).toEqual([]);
  });
  it.each([["Patrón de los Archihadas","Defensas fascinantes"],["Patrón Infernal","Arrojar al Infierno"],["Patrón del Gran Primigenio","Combatiente clarividente"]])("recarga %s / %s sin gastar dos veces", (sub,nombre) => {
    sembrar(14,sub); const id=rasgo(nombre).id;
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj().id,id);
    usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj().id,{tipo:"recargarUsoConPacto",idRasgo:id});
    expect(rasgo(nombre).usosRestantes).toBe(1);expect(pj().espaciosPactoGastados).toBe(1);
    usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj().id,{tipo:"recargarUsoConPacto",idRasgo:id});expect(pj().espaciosPactoGastados).toBe(1);
  });
  it("recargarUsoConPacto opera mediante operarRecursoRasgoPersonaje y respeta el límite de espacios de pacto", () => {
    sembrar(14, "Patrón Infernal");
    const id = rasgo("Arrojar al Infierno").id;
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj().id, id);
    usarAlmacenDM.setState({
      personajes: [{ ...pj(), espaciosPactoGastados: pj().espaciosPactoMaximos }]
    });
    const aplicadoSinPactos = usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj().id, {
      tipo: "recargarUsoConPacto",
      idRasgo: id
    });
    expect(aplicadoSinPactos).toBe(false);
    expect(rasgo("Arrojar al Infierno").usosRestantes).toBe(0);

    usarAlmacenDM.setState({
      personajes: [{ ...pj(), espaciosPactoGastados: pj().espaciosPactoMaximos - 1 }]
    });
    const aplicadoConPacto = usarAlmacenDM.getState().operarRecursoRasgoPersonaje(pj().id, {
      tipo: "recargarUsoConPacto",
      idRasgo: id
    });
    expect(aplicadoConPacto).toBe(true);
    expect(rasgo("Arrojar al Infierno").usosRestantes).toBe(1);
    expect(pj().espaciosPactoGastados).toBe(pj().espaciosPactoMaximos);
  });
  it("Resiliencia celestial recibe PG propios en ambos descansos y al usar Astucia", () => {
    sembrar(10,"Patrón Celestial");
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj().id,rasgo("Astucia mágica").id);expect(pj().hpTemporal).toBe(13);
    for(const tipo of ["corto","largo"] as const){usarAlmacenDM.setState({personajes:[{...pj(),hpTemporal:0}]});usarAlmacenDM.getState().ejecutarDescansoPersonaje(pj().id,tipo);expect(pj().hpTemporal).toBe(13);}
  });
  it("los arcanos llegan al consumidor por nivel; gastar uno no agota otro", () => {
    sembrar(17);
    for(const r of pj().rasgos.filter(r=>r.selectores?.some(s=>s.destinoConjuros==="arcano_mistico"))){
      const sel=r.selectores![0]; usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,r.id,sel.id,[sel.opciones[0].id]);
    }
    expect(pj().arcanoMisticoIds).toHaveLength(4);
    const gasto=consumirRecursoConjuro(pj(),{tipo:"arcanoMistico",nivel:6});expect(gasto.permitido).toBe(true);if(!gasto.permitido)return;
    expect(consumirRecursoConjuro(gasto.personaje,{tipo:"arcanoMistico",nivel:6}).permitido).toBe(false);
    expect(consumirRecursoConjuro(gasto.personaje,{tipo:"arcanoMistico",nivel:7}).permitido).toBe(true);
  });
  it("una dote de origen se materializa con su efecto una vez y se retira con su invocación", () => {
    elegir(["lecciones_de_los_primeros:dote_alerta"]);
    expect(calcularBonoIniciativaRasgos(pj())).toBe(4);
    elegir([]);expect(calcularBonoIniciativaRasgos(pj())).toBe(0);
  });
  it("el vínculo de arma y las capacidades sobreviven a edición, reconstrucción y guardado", () => {
    elegir(["pacto_del_filo"]);const pacto=rasgo("Pacto del filo");
    expect(obtenerConfiguracionPactoDelFilo(pj(),"espada-1").activo).toBe(false);
    usarAlmacenDM.getState().actualizarRasgoPersonaje(pj().id,pacto.id,{vinculoArma:{...pacto.vinculoArma!,idInstancia:"espada-1"}});
    const actual=rasgo("Pacto del filo");
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,actual.id,actual.selectores![0].id,["psiquico"]);
    expect(obtenerConfiguracionPactoDelFilo(pj(),"espada-1")).toMatchObject({activo:true,caracteristica:"carisma",tipoDano:"psiquico"});
    expect(obtenerConfiguracionPactoDelFilo(pj(),"otra-arma").activo).toBe(false);
    const restaurado=hidratarPersonaje(deshidratarPersonaje(pj()));
    expect(obtenerConfiguracionPactoDelFilo(restaurado,"espada-1").tipoDano).toBe("psiquico");
    const editado=construirRasgoDesdeBorrador(crearBorradorRasgo(rasgo("Astucia mágica")),rasgo("Astucia mágica"));
    expect(editado.recuperarPactoAlUsar).toBe("mitad_maximo");
  });
  it("los trucos del Libro son conjuros de Brujo elegibles incluso si su lista original es otra", () => {
    elegir(["pacto_del_grimorio"]);const libro=rasgo("Pacto del grimorio");
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,libro.id,libro.selectores![0].id,["h_rayo-de-escarcha"]);
    usarAlmacenDM.getState().alternarActivoRasgo(pj().id,libro.id);
    elegir(["pacto_del_grimorio","descarga_agonica:h_rayo-de-escarcha"]);
    expect(pj().rasgos.some(r=>r.nombre==="Descarga agónica")).toBe(true);
    const restaurado=hidratarPersonaje(deshidratarPersonaje(pj()));
    expect(restaurado.rasgos.some(r=>r.nombre==="Descarga agónica")).toBe(true);
    expect(evaluarEfectosRasgosActivos(restaurado).some(e=>e.tipo==="bono_dano_conjuro"&&e.aplicaA==="h_rayo-de-escarcha")).toBe(true);
  });
  it("el Libro y los arcanos conservan Carisma cuando otra clase lanzadora figura primero", () => {
    sembrar(17);elegir(["pacto_del_grimorio"]);const libro=rasgo("Pacto del grimorio");
    usarAlmacenDM.getState().actualizarSeleccionRasgo(pj().id,libro.id,libro.selectores![0].id,["h_rayo-de-escarcha"]);
    usarAlmacenDM.getState().alternarActivoRasgo(pj().id,libro.id);
    const arcano=rasgo("Arcano místico");const sel=arcano.selectores![0];
    usarAlmacenDM.getState().asignarArcanoMistico(pj().id,6,sel.opciones[0].id);
    const multiclase: PersonajeJugador={...pj(),clase:"Mago",nivel:20,
      clases:[{nombre:"Mago",nivel:3,subclase:""},{nombre:"Brujo",nivel:17,subclase:""}],
      clasesLanzadoras:[{clase:"Mago",nivel:3,tipoLanzador:"completo",habilidadConjuro:"inteligencia",modeloConjuros:"preparados"},
        {clase:"Brujo",nivel:17,tipoLanzador:"pacto",habilidadConjuro:"carisma",modeloConjuros:"preparados"}]};
    for(const [id,modo] of [["h_rayo-de-escarcha","truco"],[sel.opciones[0].id,"arcanoMistico"]] as const){
      const hechizo=EsquemaHechizoBase.parse(HECHIZOS.find(h=>h.id===id));
      expect(aplicarConfiguracionConjurosRasgos(multiclase,{hechizo,modo,bonoAtaqueMagico:2,modificadorHabilidad:0}))
        .toMatchObject({modificadorHabilidad:3,bonoAtaqueMagico:9,cdSalvacionPersonaje:17});
    }
  });
  it("Arcano bloquea otra lista, otro conjuro y un rasgo apagado sin reiniciar su gasto", () => {
    sembrar(17);const arcano=rasgo("Arcano místico");const sel=arcano.selectores![0];
    const ajeno=HECHIZOS.find(h=>h.nivel===6&&!h.clases.some(c=>c.toLowerCase()==="brujo"))!;
    usarAlmacenDM.getState().asignarArcanoMistico(pj().id,6,ajeno.id);expect(pj().arcanoMisticoIds).toEqual([]);
    usarAlmacenDM.getState().asignarArcanoMistico(pj().id,6,sel.opciones[0].id);
    expect(validarLanzamiento({modo:"arcanoMistico",hechizo:EsquemaHechizoBase.parse(ajeno)}, {personajeActual:pj()}).permitido).toBe(false);
    usarAlmacenDM.getState().consumirRecursoConjuro(pj().id,{tipo:"arcanoMistico",nivel:6});
    usarAlmacenDM.getState().asignarArcanoMistico(pj().id,6,sel.opciones[1].id);
    expect(pj().arcanoMisticoGastados).toEqual(["6"]);
    usarAlmacenDM.getState().recuperarArcanoMistico(pj().id,6);
    usarAlmacenDM.getState().actualizarRasgoPersonaje(pj().id,arcano.id,{activo:false});
    expect(consumirRecursoConjuro(pj(),{tipo:"arcanoMistico",nivel:6}).permitido).toBe(false);
  });
  it("retirar Maestro al bajar de nivel reconstruye Astucia sin descripción duplicada ni restaurar el uso", () => {
    sembrar(20);const astucia=rasgo("Astucia mágica");
    usarAlmacenDM.getState().gastarUsoRasgoPersonaje(pj().id,astucia.id);
    const reconstruido=aplicarBuildClaseAPersonaje(pj(),"Brujo",20);
    expect(reconstruido.rasgos.find(r=>r.id===astucia.id)!.descripcion.match(/Maestro sobrenatural/g)).toHaveLength(1);
    const reducido=aplicarBuildClaseAPersonaje(reconstruido,"Brujo",19).rasgos.find(r=>r.id===astucia.id)!;
    expect(reducido.recuperarPactoAlUsar).toBe("mitad_maximo");
    expect(reducido.usosRestantes).toBe(0);expect(reducido.descripcion).not.toContain("Maestro sobrenatural");
  });
});
