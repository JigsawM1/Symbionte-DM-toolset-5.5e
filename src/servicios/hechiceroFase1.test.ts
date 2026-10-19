import { beforeEach, describe, expect, it } from "vitest";
import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { obtenerRasgosClaseYSubclase } from "./gestorClases";
import type { PersonajeJugador, HechizoBase } from "@/tipos";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { operarRecursoRasgo, obtenerMaximosEspaciosEfectivos, obtenerMaximoRecuperacionDescanso } from "./rasgos/conversionRecursosRasgos";
import { consumirRecursoConjuro } from "./consumidorRecursosConjuros";
import { ejecutarDescansoCorto, ejecutarDescansoLargo } from "./procesadorDescansos";
import { prepararLanzamiento, validarLanzamiento } from "./servicioLanzamientoConjuros";
import { obtenerModificadoresConjuroRasgos, resolverClaseLanzamiento } from "./rasgos/modificadoresConjuroRasgos";
import { deshidratarPersonaje, hidratarPersonaje } from "./serializadorPersonaje";
import { sincronizarRasgosAutomaticos } from "./compendioRasgos";
import { crearBorradorRasgo, construirRasgoDesdeBorrador, validarRasgoParaGuardar } from "./rasgos/borradorRasgo";
import { normalizarCondicionesRasgos } from "./rasgos/estadoCondicionesRasgos";

const fuente = "rasgo_cls_hechicero_fuente_de_magia";
const innata = "rasgo_cls_hechicero_hechiceria_innata";
const conversion = "rasgo_cls_hechicero_crear_espacios";
const restauracion = "rasgo_cls_hechicero_restauracion_hechicera";
function personaje(nivel = 9): PersonajeJugador {
  return { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "hechicero-prueba", nombre: "Prueba", especie: "", clase: "Hechicero", nivel,
    clases: [{ nombre: "Hechicero", nivel, subclase: "" }], rasgos: obtenerRasgosClaseYSubclase("Hechicero", nivel),
    esLanzador: true, clasesLanzadoras: [{ clase: "Hechicero", nivel, tipoLanzador: "completo", modeloConjuros: "preparados", habilidadConjuro: "carisma" }],
    espaciosConjuroMaximos: { "1": 4, "2": 3 }, espaciosConjuroGastados: {}, espaciosConjuroAdicionales: {} };
}
const recurso = (pj: PersonajeJugador, id = fuente) => pj.rasgos.find(r => r.id === id)!;
const gastar = (pj: PersonajeJugador, cantidad: number) => ({ ...pj, rasgos: pj.rasgos.map(r => r.id === fuente ? { ...r, usosRestantes: r.usosMaximos! - cantidad } : r) });
const conjuro: HechizoBase = { id: "truco-prueba", nombre: "Truco", nivel: 0, escuela: "Evocación", tiempoLanzamiento: "Acción", alcance: "60 pies",
  descripcion: "", requiereAtaque: true, ataqueCd: "ATAQUE", dadosDaño: "1d10", clases: ["Hechicero", "Mago"],
  componentesSeleccionados: { verbal: true, somatico: true, material: false } };

beforeEach(() => usarAlmacenDM.setState({ personajes: [], colaIniciativa: [], rondaActual: 1 }));

describe("Hechicero general mediante capacidades declarativas", () => {
  it.each([1, 2, 5, 7, 9, 20])("construye recursos sin duplicados al nivel %i", nivel => {
    const pj = personaje(nivel);
    expect(new Set(pj.rasgos.map(r => r.id)).size).toBe(pj.rasgos.length);
    expect(pj.rasgos.find(r => r.nombre === "Lanzamiento de conjuros")?.tieneUsosLimitados).toBe(false);
    expect(recurso(pj, innata).usosMaximos).toBe(2);
    expect(recurso(pj)?.usosMaximos).toBe(nivel >= 2 ? nivel : undefined);
    expect(Boolean(recurso(pj, innata).activacionAlternativa)).toBe(nivel >= 7);
  });

  it.each([[1, 2, 2], [2, 3, 3], [3, 5, 5], [4, 6, 7], [5, 7, 9]])("crea un espacio de nivel %i con su coste y desbloqueo", (nivel, coste, minimo) => {
    const pj = personaje(Math.max(9, minimo));
    const nuevo = operarRecursoRasgo(pj, { tipo: "crearEspacio", idRasgo: conversion, nivel, cantidad: 1 })!;
    expect(nuevo.espaciosConjuroAdicionales[nivel]).toBe(1);
    expect(recurso(nuevo).usosRestantes).toBe(pj.nivel - coste);
    expect(nuevo.espaciosConjuroMaximos).toEqual(pj.espaciosConjuroMaximos);
    const inferior = { ...pj, nivel: minimo - 1, clases: [{ nombre: "Hechicero", nivel: minimo - 1, subclase: "" }] };
    expect(operarRecursoRasgo(inferior, { tipo: "crearEspacio", idRasgo: conversion, nivel, cantidad: 1 })).toBeUndefined();
  });

  it("rechaza cantidades inválidas y no mezcla puntos de conjuro con la reserva", () => {
    const pj = { ...gastar(personaje(), 9), puntosConjuroMaximos: 100 };
    for (const cantidad of [0, -1, 1.5, NaN, Infinity, 1])
      expect(operarRecursoRasgo(pj, { tipo: "crearEspacio", idRasgo: conversion, nivel: 1, cantidad })).toBeUndefined();
    expect(operarRecursoRasgo(personaje(), { tipo: "crearEspacio", idRasgo: conversion, nivel: 6, cantidad: 1 })).toBeUndefined();
  });

  it("consume primero los adicionales y después los ordinarios, con estado vigente", () => {
    const pj = { ...personaje(), espaciosConjuroAdicionales: { "1": 1 }, espaciosConjuroGastados: { "1": 3 } };
    const primero = consumirRecursoConjuro(pj, { tipo: "espacio", nivel: 1 });
    expect(primero.permitido).toBe(true);
    if (!primero.permitido) return;
    expect(primero.personaje.espaciosConjuroGastados[1]).toBe(3);
    expect(primero.personaje.espaciosConjuroAdicionales[1]).toBe(0);
    const segundo = consumirRecursoConjuro(primero.personaje, { tipo: "espacio", nivel: 1 });
    expect(segundo.permitido).toBe(true);
    if (segundo.permitido) expect(consumirRecursoConjuro(segundo.personaje, { tipo: "espacio", nivel: 1 }).permitido).toBe(false);
  });

  it.each(["ordinario", "adicional", "pacto"] as const)("convierte un espacio %s con límite de reserva", origen => {
    const pj = { ...gastar(personaje(), 1), espaciosConjuroAdicionales: { "2": 1 }, nivelEspacioPacto: 2, espaciosPactoMaximos: 1, espaciosPactoGastados: 0 };
    const nuevo = operarRecursoRasgo(pj, { tipo: "convertirEspacio", idRasgo: conversion, nivel: 2, origen })!;
    expect(recurso(nuevo).usosRestantes).toBe(9);
    expect(nuevo.espaciosConjuroGastados[2] ?? 0).toBe(origen === "ordinario" ? 1 : 0);
    expect(nuevo.espaciosConjuroAdicionales[2]).toBe(origen === "adicional" ? 0 : 1);
    expect(nuevo.espaciosPactoGastados).toBe(origen === "pacto" ? 1 : 0);
    expect(operarRecursoRasgo(nuevo, { tipo: "convertirEspacio", idRasgo: conversion, nivel: 2, origen })).toBeUndefined();
  });

  it("conserva adicionales y gastos al guardar/reconstruir, y los elimina al descansar largo", () => {
    const creado = operarRecursoRasgo(personaje(), { tipo: "crearEspacio", idRasgo: conversion, nivel: 5, cantidad: 1 })!;
    const cargado = hidratarPersonaje(JSON.parse(JSON.stringify(deshidratarPersonaje(creado))));
    expect(cargado.espaciosConjuroAdicionales).toEqual({ "5": 1 });
    expect(recurso(cargado).usosRestantes).toBe(2);
    expect(obtenerMaximosEspaciosEfectivos(cargado)[5]).toBe(1);
    const descanso = ejecutarDescansoLargo(cargado).personajeActualizado;
    expect(descanso.espaciosConjuroAdicionales).toEqual({});
    expect(recurso(descanso).usosRestantes).toBe(9);
  });

  it("ofrece recuperación parcial solo tras corto y consume el uso al aceptar", () => {
    const pj = gastar(personaje(), 8);
    expect(obtenerMaximoRecuperacionDescanso(pj, recurso(pj, restauracion))).toBe(0);
    const corto = ejecutarDescansoCorto(pj, 0).personajeActualizado;
    expect(obtenerMaximoRecuperacionDescanso(corto, recurso(corto, restauracion))).toBe(4);
    const nuevo = operarRecursoRasgo(corto, { tipo: "recuperarDescanso", idRasgo: restauracion, cantidad: 3 })!;
    expect(recurso(nuevo).usosRestantes).toBe(4);
    expect(recurso(nuevo, restauracion).usosRestantes).toBe(0);
    const segundoCorto = ejecutarDescansoCorto(nuevo, 0).personajeActualizado;
    expect(operarRecursoRasgo(segundoCorto, { tipo: "recuperarDescanso", idRasgo: restauracion, cantidad: 1 })).toBeUndefined();
    const lleno = ejecutarDescansoCorto(personaje(), 0).personajeActualizado;
    expect(operarRecursoRasgo(lleno, { tipo: "recuperarDescanso", idRasgo: restauracion, cantidad: 1 })).toBeUndefined();
    expect(recurso(lleno, restauracion).usosRestantes).toBe(1);
  });

  it("usa el nivel de clase al recuperar puntos en multiclase", () => {
    const pj = { ...gastar(personaje(5), 5), nivel: 15, clases: [{ nombre: "Hechicero", nivel: 5, subclase: "" }, { nombre: "Mago", nivel: 10, subclase: "" }] };
    const corto = ejecutarDescansoCorto(pj, 0).personajeActualizado;
    expect(obtenerMaximoRecuperacionDescanso(corto, recurso(corto, restauracion))).toBe(2);
  });

  it("activa Innata con dos puntos solo al agotar usos y retira efectos al apagar", () => {
    const pj = personaje(7);
    usarAlmacenDM.setState({ personajes: [pj] });
    const leer = () => usarAlmacenDM.getState().personajes[0];
    const alternar = () => usarAlmacenDM.getState().alternarActivoRasgo(pj.id, innata);
    alternar();
    expect(recurso(leer()).usosRestantes).toBe(7);
    expect(recurso(leer(), innata).usosRestantes).toBe(1);
    expect(leer().efectosActivos.find(e => e.idRasgoOrigen === innata)?.expiraRonda).toBe(11);
    alternar(); alternar(); alternar();
    expect(recurso(leer(), innata).usosRestantes).toBe(0);
    alternar();
    expect(recurso(leer()).usosRestantes).toBe(5);
    expect(recurso(leer(), innata).activo).toBe(true);
    alternar();
    expect(leer().efectosActivos.some(e => e.idRasgoOrigen === innata)).toBe(false);
  });

  it("bloquea activaciones alternativas sin puntos o antes del nivel requerido", () => {
    for (const nivel of [6, 7]) {
      const pj = gastar(personaje(nivel), nivel);
      recurso(pj, innata).usosRestantes = 0;
      usarAlmacenDM.setState({ personajes: [pj] });
      usarAlmacenDM.getState().alternarActivoRasgo(pj.id, innata);
      expect(recurso(usarAlmacenDM.getState().personajes[0], innata).activo).toBe(false);
    }
  });

  it("Innata modifica CD y ataque por procedencia, caduca sin reponer usos", () => {
    const pj = personaje(); recurso(pj, innata).activo = true;
    pj.condicionesActivas = ["Hechicería Innata"];
    pj.efectosActivos = [{ id: "ef", nombre: "Hechicería Innata", idRasgoOrigen: innata, expiraRonda: 11, concentracion: false }];
    expect(obtenerModificadoresConjuroRasgos(pj, "Hechicero")).toEqual({ bonoCD: 1, ventaja: true });
    expect(obtenerModificadoresConjuroRasgos(pj, "Mago")).toEqual({ bonoCD: 0, ventaja: false });
    expect(prepararLanzamiento({ hechizo: conjuro, modo: "truco", cdSalvacionPersonaje: 15 }, { personajeActual: pj })).toMatchObject({ cdSalvacion: 16, tipoTirada: "ventaja" });
    const multiclase = { ...pj, clasesLanzadoras: [...pj.clasesLanzadoras, { ...pj.clasesLanzadoras[0], clase: "Mago" }] };
    expect(resolverClaseLanzamiento(multiclase, conjuro)).toBeUndefined();
    expect(prepararLanzamiento({ hechizo: conjuro, modo: "truco", claseLanzamiento: "Mago", cdSalvacionPersonaje: 15 }, { personajeActual: multiclase })).toMatchObject({ cdSalvacion: 15 });
    const expirado = normalizarCondicionesRasgos(pj, 11);
    expect(recurso(expirado, innata).activo).toBe(false);
    expect(obtenerModificadoresConjuroRasgos(expirado, "Hechicero").bonoCD).toBe(0);
  });

  it("el motor admite lanzar usando únicamente un espacio adicional", () => {
    const pj = { ...personaje(), espaciosConjuroMaximos: {}, espaciosConjuroAdicionales: { "5": 1 } };
    const solicitud = { hechizo: { ...conjuro, nivel: 5 }, modo: "espacio" as const, nivelLanzamiento: 5 };
    expect(validarLanzamiento(solicitud, { personajeActual: pj, sistemaMagia: "espacios" }).permitido).toBe(true);
    expect(prepararLanzamiento(solicitud, { personajeActual: pj, sistemaMagia: "espacios" }).gasto).toEqual({ tipo: "espacio", nivel: 5 });
  });

  it("las capacidades sobreviven al constructor personalizado y ejecutan sin nombres canónicos", () => {
    const pj = personaje();
    const b = crearBorradorRasgo(recurso(pj, conversion)); b.nombre = "Alquimia de recursos"; b.origen = "personalizado";
    const construido = construirRasgoDesdeBorrador(b, recurso(pj, conversion));
    expect(validarRasgoParaGuardar(construido).valido).toBe(true);
    expect(construido.conversionEspacios).toEqual(recurso(pj, conversion).conversionEspacios);
    pj.rasgos = pj.rasgos.map(r => r.id === conversion ? construido : r);
    expect(operarRecursoRasgo(pj, { tipo: "crearEspacio", idRasgo: conversion, nivel: 1, cantidad: 1 })?.espaciosConjuroAdicionales[1]).toBe(1);
  });

  it("los duplicados informativos no borran gastos y la migración antigua no duplica reservas", () => {
    const pj = gastar(personaje(), 4);
    pj.rasgos.push({ ...recurso(pj), tieneUsosLimitados: false, usosMaximos: undefined, usosRestantes: undefined });
    pj.rasgos = sincronizarRasgosAutomaticos(pj);
    expect(pj.rasgos.filter(r => r.id === fuente)).toHaveLength(1);
    expect(recurso(pj).usosRestantes).toBe(5);
    const legado = personaje(); legado.rasgos = []; legado.puntosHechiceriaMaximos = 9; legado.puntosHechiceriaActuales = 3;
    expect(recurso(hidratarPersonaje(legado)).usosRestantes).toBe(3);
  });

  it("la progresión de la reserva conserva los puntos gastados", () => {
    const pj = gastar(personaje(5), 3);
    const subido = { ...pj, nivel: 9, clases: [{ nombre: "Hechicero", nivel: 9, subclase: "" }] };
    subido.rasgos = sincronizarRasgosAutomaticos(subido);
    expect(recurso(subido).usosRestantes).toBe(6);
    subido.nivel = 5; subido.clases[0].nivel = 5;
    subido.rasgos = sincronizarRasgosAutomaticos(subido);
    expect(recurso(subido).usosRestantes).toBe(2);
  });

  it.each(["corto", "largo"])("finaliza Innata al completar un descanso %s", tipo => {
    const pj = personaje(); recurso(pj, innata).activo = true;
    pj.condicionesActivas = ["Hechicería Innata", "Envenenado"];
    pj.efectosActivos = [{ id: "ef", nombre: "Hechicería Innata", idRasgoOrigen: innata, expiraRonda: 11, concentracion: false }];
    const nuevo = (tipo === "corto" ? ejecutarDescansoCorto(pj, 0) : ejecutarDescansoLargo(pj)).personajeActualizado;
    expect(recurso(nuevo, innata).activo).toBe(false);
    expect(nuevo.efectosActivos).toEqual([]);
    expect(nuevo.condicionesActivas).toContain("Envenenado");
    expect(obtenerModificadoresConjuroRasgos(nuevo, "Hechicero").bonoCD).toBe(0);
  });

  it("retirar el efecto desde el almacén elimina los beneficios sin reponer usos", () => {
    usarAlmacenDM.setState({ personajes: [personaje()] });
    const s = usarAlmacenDM.getState(); s.alternarActivoRasgo("hechicero-prueba", innata);
    const activo = usarAlmacenDM.getState().personajes[0];
    s.quitarEfectoPersonaje(activo.id, activo.efectosActivos[0].id);
    const final = usarAlmacenDM.getState().personajes[0];
    expect(recurso(final, innata).usosRestantes).toBe(1);
    expect(obtenerModificadoresConjuroRasgos(final, "Hechicero").ventaja).toBe(false);
  });

  it("la CD modificada llega a la emisión y no se aplica a concesiones ajenas", () => {
    const pj = personaje(); recurso(pj, innata).activo = true;
    const solicitud = { hechizo: { ...conjuro, ataqueCd: "CD" as const }, modo: "truco" as const, cdSalvacionPersonaje: 15 };
    const preparado = prepararLanzamiento(solicitud, { personajeActual: pj });
    expect(preparado.formula.etiquetaLog).toContain("CD 16");
    expect(prepararLanzamiento({ ...solicitud, modo: "gratuitoInnato" }, { personajeActual: pj }).cdSalvacion).toBe(15);
    expect(prepararLanzamiento({ ...solicitud, modo: "objetoMagico" }, { personajeActual: pj }).cdSalvacion).toBe(15);
    expect(prepararLanzamiento({ ...solicitud, modo: "ritual", idRasgoOrigen: "otro_origen" }, { personajeActual: pj }).cdSalvacion).toBe(15);
    expect(validarLanzamiento({ ...solicitud, claseLanzamiento: "Mago" }, { personajeActual: pj }).permitido).toBe(false);
    // Un conjuro concedido fuera de la lista de clase sigue siendo lanzable; no recibe el bono de esa clase.
    const concedido = { ...solicitud, hechizo: { ...solicitud.hechizo, clases: ["Mago"] }, claseLanzamiento: "Hechicero" };
    expect(validarLanzamiento(concedido, { personajeActual: pj }).permitido).toBe(true);
    expect(prepararLanzamiento(concedido, { personajeActual: pj }).cdSalvacion).toBe(15);
  });

  it("las relaciones del constructor conservan recuperación y activación alternativa", () => {
    const pj = personaje();
    for (const id of [innata, restauracion]) {
      const inicial = recurso(pj, id);
      const b = crearBorradorRasgo(inicial); b.nombre = "Capacidad personalizada";
      const nuevo = construirRasgoDesdeBorrador(b, inicial);
      expect(validarRasgoParaGuardar(nuevo).valido).toBe(true);
      expect(nuevo.activacionAlternativa).toEqual(inicial.activacionAlternativa);
      expect(nuevo.recuperacionOpcionalDescanso).toEqual(inicial.recuperacionOpcionalDescanso);
      expect(nuevo.efectos).toEqual(inicial.efectos);
    }
  });

  it("previsualiza capacidades recién habilitadas sin aceptar identificadores incompletos al guardar", () => {
    const b = crearBorradorRasgo(); b.nombre = "Rasgo en edición";
    b.activacionAlternativa = { idRasgoRecurso: "", coste: 2 };
    b.recuperacionOpcionalDescanso = { idRasgoObjetivo: "", formulaCantidad: "" };
    const preview = construirRasgoDesdeBorrador(b);
    expect(preview.activacionAlternativa?.coste).toBe(2);
    expect(validarRasgoParaGuardar(preview).valido).toBe(false);
    b.activacionAlternativa.idRasgoRecurso = fuente;
    b.recuperacionOpcionalDescanso = { idRasgoObjetivo: fuente, formulaCantidad: "mitad_nivel" };
    expect(validarRasgoParaGuardar(construirRasgoDesdeBorrador(b)).valido).toBe(true);
  });
});
