import { EsquemaOpcionSelector, type OpcionSelector } from "@/tipos/rasgos";
import { validarColeccionJSON } from "@/servicios/cargadorCatalogos";
import datos from "@/datos/maniobras-combate.json";

export const CATALOGO_MANIOBRAS_COMBATE = validarColeccionJSON<OpcionSelector>(
  datos, EsquemaOpcionSelector, "CatalogoManiobrasCombate"
);
