import { PERSONAJE_POR_DEFECTO } from "@/constantes/personajeConstantes";
import { obtenerRasgosClaseYSubclase } from "@/servicios/gestorClases";
import { obtenerEntradasMagiaSalvaje, buscarEntradaPorTirada } from "./servicioMagiaSalvaje";

// Identificadores canónicos usados únicamente por las pruebas del catálogo.
export const ID_RASGO_TABLA_OLEADA = "rasgo_sub_hechicero_tabla_oleada";
export const ID_RASGO_MAREAS_CAOS = "rasgo_sub_hechiceria_de_magia_salvaje_mareas_de_caos";
export const ID_RASGO_OLEADA_DOMADA = "rasgo_sub_hechiceria_de_magia_salvaje_oleada_domada";

export function personaje(nivel = 18) {
  const subclase = "Hechicería de Magia Salvaje";
  return { ...structuredClone(PERSONAJE_POR_DEFECTO), id: "salvaje", nombre: "Prueba", especie: "", nivel,
    clase: "Hechicero", subclase, clases: [{ nombre: "Hechicero", nivel, subclase }],
    rasgos: obtenerRasgosClaseYSubclase("Hechicero", nivel, subclase) };
}

export const entradas = obtenerEntradasMagiaSalvaje(personaje().rasgos.find(r => r.id === ID_RASGO_TABLA_OLEADA)!.tablaAleatoria!.filas!);
export const buscarEntrada = (tirada: number) => buscarEntradaPorTirada(tirada, entradas);
