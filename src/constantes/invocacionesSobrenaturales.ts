import type { InvocacionSobrenatural, OpcionSelector } from "@/tipos/rasgos";
import { EsquemaInvocacionSobrenaturalJSON } from "@/tipos/esquemasCatalogos";
import { validarColeccionJSON } from "@/servicios/cargadorCatalogos";
import { obtenerOpcionesDinamicas } from "@/servicios/hidratadorDotes";
import invocacionesRaw from "@/datos/invocaciones-sobrenaturales.json";
import { copiarMecanicasRasgo } from "@/tipos/mecanicasRasgos";

// =========================================================================
// CATÁLOGO OFICIAL DE INVOCACIONES SOBRENATURALES DEL BRUJO (D&D 5.5e / 2024)
// Fuente: src/datos/invocaciones-sobrenaturales.json
// =========================================================================

export const CATALOGO_INVOCACIONES_SOBRENATURALES: InvocacionSobrenatural[] =
  validarColeccionJSON<InvocacionSobrenatural>(
    invocacionesRaw as unknown[],
    EsquemaInvocacionSobrenaturalJSON,
    "CatalogoInvocacionesSobrenaturales"
  );

/**
 * Retorna el nivel de los espacios de magia del pacto del Brujo según su nivel (D&D 5.5e):
 * Nivel 1-2: Nivel 1
 * Nivel 3-4: Nivel 2
 * Nivel 5-6: Nivel 3
 * Nivel 7-8: Nivel 4
 * Nivel 9-20: Nivel 5
 */
export function obtenerNivelEspacioPacto(nivelBrujo: number): number {
  const n = Math.max(1, Math.min(20, Math.floor(nivelBrujo) || 1));
  return Math.min(5, Math.ceil(n / 2));
}

/**
 * Tabla canónica de progresión de invocaciones conocidas del Brujo (D&D 5.5e / 2024).
 * Nv 1: 1 | Nv 2-4: 3 | Nv 5-6: 5 | Nv 7-8: 6 | Nv 9-11: 7 | Nv 12-14: 8 | Nv 15-17: 9 | Nv 18-20: 10
 */
const MAX_INVOCACIONES_POR_NIVEL = [1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10];

export function obtenerMaxInvocacionesBrujo(nivelBrujo: number): number {
  const n = Math.max(1, Math.min(20, Math.floor(nivelBrujo) || 1));
  return MAX_INVOCACIONES_POR_NIVEL[n - 1];
}

/**
 * Genera la lista de opciones para el selector interactivo de Invocaciones Sobrenaturales
 * a partir del catálogo canónico.
 */
export function generarOpcionesSelectorInvocaciones(_nivelBrujo: number = 20): OpcionSelector[] {
  return CATALOGO_INVOCACIONES_SOBRENATURALES.map((inv) => {
    let desc = inv.descripcion;
    if (inv.requisitoPrevio) {
      desc = `**Requisitos:** ${inv.requisitoPrevio}\n\n${desc}`;
    }

    return {
      ...copiarMecanicasRasgo(inv),
      esActivable: inv.esActivable,
      id: inv.id,
      nombre: inv.nombre,
      descripcion: desc,
      nivelMinimo: inv.nivelMinimo,
      requisito: inv.requisitoPrevio,
      requisitoInvocacion: inv.requisitoInvocacion,
      repetible: inv.repetible,
      tipoAccion: inv.tipoAccion,
      categoriaMecanica: inv.categoriaMecanica,
      recursoGastado: inv.recursoGastado,
      formulaDados: inv.formulaDados,
      escaladoFormulaDados: inv.escaladoFormulaDados ? structuredClone(inv.escaladoFormulaDados) : undefined,
      tieneUsosLimitados: inv.tieneUsosLimitados,
      usosMaximos: inv.usosMaximos,
      usosRestantes: inv.usosRestantes,
      recuperacion: inv.recuperacion,
      conjuroGratuito: inv.conjuroGratuito,
      recuperacionConjuro: inv.recuperacionConjuro,
      selectores: inv.selectores
        ? inv.selectores.map((sel) => {
            if (sel.claveOpcionesDinamicas && (!sel.opciones || sel.opciones.length === 0)) {
              return {
                ...sel,
                opciones: obtenerOpcionesDinamicas(sel.claveOpcionesDinamicas)
              };
            }
            return structuredClone(sel);
          })
        : undefined,
      efectos: inv.efectos ? structuredClone(inv.efectos) : undefined
    };
  });
}
