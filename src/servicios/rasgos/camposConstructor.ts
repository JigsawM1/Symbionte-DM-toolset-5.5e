import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import { z } from "zod";

export const EsquemaCamposConstructor = EsquemaRasgoPersonaje.pick({
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
  idSelectorOrigen: true, hpTemporalAlDescansar: true, hpTemporalAlUsarRasgo: true,
  claseConjurosOtorgados: true, vinculoArma: true
});
export type CamposConstructor = z.infer<typeof EsquemaCamposConstructor>;
