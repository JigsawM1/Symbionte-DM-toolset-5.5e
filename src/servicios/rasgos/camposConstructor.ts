import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import { z } from "zod";

export const EsquemaCamposConstructor = EsquemaRasgoPersonaje.pick({
  escaladoConjurosOtorgados: true,
  resolucionAsistida: true,
  curacionConjuros: true, curacionAlFinalizar: true, renovarActivacion: true,
  costeRecargaPadre: true, costeActivacionPorSelector: true, lanzamientoConRecurso: true,
  ignorarMaterialesConjuro: true, varianteSinConcentracion: true, reservaDados: true,
  usoGratuitoCondicionado: true, gastarUsoTrasTirada: true, tablaAleatoria: true,
  conversionEspacios: true, recuperacionOpcionalDescanso: true, activacionAlternativa: true,
  finalizarAlDescansar: true,
  idRasgoRecurso: true, requiereRasgosActivos: true, activarConRasgo: true,
  recuperarUsosAlActivarRasgo: true, gastarUsoAlEmitirSalvacion: true,
  desactivarSinHp: true, tiradaCuracion: true, idSelectorTipoDano: true, salvacionObjetivo: true, conjurosRituales: true, aptitudConjurosRituales: true,
  escaladoFormulaDados: true, escaladoUsos: true, escaladoRecuperacion: true,
  escaladoEfectos: true, recargaDescansoCorto: true, costeFijo: true,
  sincronizarEfectosConFormula: true, noGastarAlTirarDados: true,
  autoDesactivarAlTirarSalvacion: true, desactivarConCondiciones: true,
  desactivarConArmaduraPesada: true,
  autoDesactivarAlTirarDano: true, autoDesactivarEnTirada: true, recargarUsoConPadre: true,
  eliminarCondicionesAlActivar: true, configuracionMagica: true,
  aptitudConjuroGratuito: true, ignorarComponentesConjuro: true,
  conjuroGratuito: true, recuperacionConjuro: true,
  recuperarPactoAlUsar: true, recargarUsoConPacto: true, tiradaCuracionManual: true,
  idSelectorOrigen: true, hpTemporalAlDescansar: true, hpTemporalAlUsarRasgo: true, hpTemporalAlActivarRasgo: true,
  claseConjurosOtorgados: true, vinculoArma: true
});
export type CamposConstructor = z.infer<typeof EsquemaCamposConstructor>;
