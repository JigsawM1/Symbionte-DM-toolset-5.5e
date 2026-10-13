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
import { seleccionesValidas } from "./rasgos/seleccionesRasgos";
import { construirRasgosDesdeSelectores } from "./rasgos/seleccionesRasgos";
import HECHIZOS from "@/utiles/compendios/all.json";
import brujo from "@/datos/clases/brujo.json";
import invocaciones from "@/datos/invocaciones-sobrenaturales.json";
import type { PersonajeJugador } from "@/tipos";

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

describe("Brujo PHB 2024: recorrido declarativo completo", () => {
  beforeEach(() => sembrar());
  it("valida sin perder metadatos y no decide las elecciones del jugador", () => {
    const clase=EsquemaDefinicionClaseJSON.parse(brujo);
    expect(clase.rasgos.find(r=>r.nombre==="Astucia mágica")?.recuperarPactoAlUsar).toBe("mitad_maximo");
    expect(clase.rasgos[0].selectores?.[0].valorActual).toEqual([]);
    for(const i of invocaciones) expect(EsquemaInvocacionSobrenaturalJSON.parse(i).id).toBe(i.id);
    expect(rasgo("Magia del pacto").configuracionMagica?.tipoLanzador).toBe("pacto");
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
    expect(resolverRasgosAcciones(pj()).filter(r=>r.nombre==="Castigo arcano")).toHaveLength(1);
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
    const descarga=HECHIZOS.find(h=>h.id==="h_descarga-sobrenatural")!;
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
    usarAlmacenDM.getState().alternarRasgoActivo(pj().id,libro.id);
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
    usarAlmacenDM.getState().recargarUsoRasgoConPacto(pj().id,id);
    expect(rasgo(nombre).usosRestantes).toBe(1);expect(pj().espaciosPactoGastados).toBe(1);
    usarAlmacenDM.getState().recargarUsoRasgoConPacto(pj().id,id);expect(pj().espaciosPactoGastados).toBe(1);
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
});
