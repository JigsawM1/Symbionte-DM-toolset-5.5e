/**
 * Fachada pública retrocompatible del motor de magia (D&D 5.5e / 2024).
 * Delega todas las responsabilidades en submódulos especializados bajo `src/servicios/magia/`.
 */
export * from "./magia/tiposMagia";
export {
  ESTRATEGIAS_TIPO_LANZADOR,
  TRUCOS_POR_CLASE_Y_NIVEL,
  CONJUROS_POR_CLASE_Y_NIVEL,
  acotarNivelClase,
  normalizarTextoMagia,
  normalizarClaveClaseMagica,
  detectarTipoLanzador,
  calcularMaximosConjurosYTrucos
} from "./magia/catalogoProgresionMagica";
export {
  calcularNivelLanzadorMulticlase,
  calcularNivelLanzadorEfectivo,
  calcularEspaciosConjuro,
  calcularPuntosConjuro,
  obtenerCostePuntos
} from "./magia/calculadorRanurasMulticlase";
export {
  esLanzadorDePacto,
  calcularEspaciosPacto,
  obtenerNivelesArcanoMisticoDisponibles,
  calcularTodosRecursosMagicos
} from "./magia/magiaPactoBrujo";
export {
  calcularCDConjuros,
  calcularBonoAtaqueConjuro,
  obtenerHabilidadConjuroPersonaje,
  obtenerModificadorAptitudMagica,
  calcularEstadisticasMagicasPorOrigen
} from "./magia/estadisticasCombateMagico";
export {
  obtenerConjurosSiemprePreparadosSubclase,
  obtenerConjurosSubclasePersonaje,
  calcularConteoPreparadosEfectivos,
  requiereSincronizacionSubclase
} from "./magia/conjurosSubclase";
export {
  obtenerOpcionesLanzamientoConjuro,
  gastarRecursoLanzamientoConjuro,
  resolverGastoLanzamientoConjuro
} from "./magia/lanzamientoYUpcasting";
export {
  obtenerNivelMaximoConjuroPorTipoClase,
  obtenerClasesListaMagicaPersonaje,
  obtenerNivelesLanzablesPorClase,
  obtenerNivelesConjuroDisponiblesPersonaje,
  construirPerfilLanzadorPersonaje,
  puedePersonajeLanzarHechizo
} from "./magia/elegibilidadConjurosPersonaje";
