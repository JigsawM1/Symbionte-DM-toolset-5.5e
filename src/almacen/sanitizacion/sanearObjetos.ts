import type { ObjetoHomebrew, Rareza, ObjetoBase } from "@/tipos";
import { resolverCategoriaDesdeSRD, CATEGORIAS_EQUIPO, type CategoriaEquipo } from "@/constantes/categoriasEquipoConstantes";
import { generarId } from "@/utiles/generarId";
import { aplanarValor, normalizarTexto } from "./comun";
import { sanearPropiedadesArma } from "./sanearPropiedadesArma";
import {
  sanearPropiedadesArmadura,
  sanearPropiedadesEscudo,
  sanearPropiedadesEquipoAventuras
} from "./sanearPropiedadesArmadura";

function despacharSanitizacionPorCategoria(
  baseObjeto: ObjetoBase,
  obj: Record<string, unknown>,
  categoriaSaneada: CategoriaEquipo,
  propiedadesSaneadas?: string | string[]
): ObjetoHomebrew {
  switch (categoriaSaneada) {
    case "armas":
      return sanearPropiedadesArma(baseObjeto, obj);
    case "armaduras":
      return sanearPropiedadesArmadura(baseObjeto, obj, propiedadesSaneadas);
    case "escudos":
      return sanearPropiedadesEscudo(baseObjeto, obj, propiedadesSaneadas);
    default:
      return sanearPropiedadesEquipoAventuras(baseObjeto, obj, categoriaSaneada, propiedadesSaneadas);
  }
}

export function sanearObjetoHomebrew(o: unknown): ObjetoHomebrew {
  if (!o || typeof o !== "object") {
    return {
      id: generarId('o'),
      nombre: "Objeto Desconocido",
      descripcion: "Sin descripción disponible.",
      pesoLb: 0,
      valorPO: 0,
      rareza: "Común",
      esMagico: false,
      categoria: "equipo-aventurero",
      esConsumible: false,
      subcategoria: "Maravilloso",
      equipable: false
    };
  }

  const obj = o as Record<string, unknown>;
  const idSaneado = aplanarValor(obj.id || obj.index || generarId('o')).trim();
  const nombreSaneado = aplanarValor(obj.nombre || obj.name || "Objeto Desconocido");

  // Procesar descripción — puede ser string o array de strings
  const descField = obj.descripcion !== undefined ? obj.descripcion
                  : obj.description !== undefined ? obj.description
                  : obj.desc;
  let descSaneada: string;
  if (Array.isArray(descField)) {
    descSaneada = descField.map(aplanarValor).filter(Boolean).join("\n");
  } else {
    descSaneada = aplanarValor(descField || "Sin descripción disponible.");
  }

  // Tratamiento de ability y utilize -> Añadir al final de la descripción como texto plano limpio
  let infoAdicionalTexto = "";
  if (obj.ability && typeof obj.ability === "object") {
    const abObj = obj.ability as Record<string, unknown>;
    infoAdicionalTexto += `\n\nCaracterística asociada: ${aplanarValor(abObj.name || abObj.index).toUpperCase()}`;
  }
  if (Array.isArray(obj.utilize) && obj.utilize.length > 0) {
    infoAdicionalTexto += `\n\nAcción de Utilizar:`;
    obj.utilize.forEach((u: unknown) => {
      if (u && typeof u === "object") {
        const uObj = u as Record<string, unknown>;
        const uName = aplanarValor(uObj.name);
        let dcText = "";
        if (uObj.dc && typeof uObj.dc === "object") {
          const dcObj = uObj.dc as Record<string, unknown>;
          const dcTypeObj = dcObj.dc_type as Record<string, unknown> | undefined;
          const dcTypeName = dcTypeObj ? aplanarValor(dcTypeObj.name || dcTypeObj.index).toUpperCase() : "";
          const dcVal = dcObj.dc_value !== undefined ? String(dcObj.dc_value) : "";
          if (dcTypeName && dcVal) {
            dcText = ` (CD ${dcVal} ${dcTypeName})`;
          } else if (dcVal) {
            dcText = ` (CD ${dcVal})`;
          }
        }
        infoAdicionalTexto += `\n- ${uName}${dcText}`;
      }
    });
  }

  if (infoAdicionalTexto) {
    if (descSaneada === "Sin descripción disponible.") {
      descSaneada = infoAdicionalTexto.trim();
    } else {
      descSaneada += infoAdicionalTexto;
    }
  }

  // Extraer Rareza limpia
  let rarezaSaneada: Rareza = "Común";
  let rarezaTxt = "";
  if (obj.rarity && typeof obj.rarity === "object") {
    const rObj = obj.rarity as Record<string, unknown>;
    rarezaTxt = aplanarValor(rObj.name || rObj.index || "Común");
  } else {
    rarezaTxt = aplanarValor(obj.rareza || obj.rarity || "Común");
  }
  rarezaTxt = rarezaTxt.trim();

  if (["Común", "Poco Común", "Raro", "Muy Raro", "Legendario", "Artefacto"].includes(rarezaTxt)) {
    rarezaSaneada = rarezaTxt as Rareza;
  } else {
    // Intentar mapear inglés
    const rarezaLower = rarezaTxt.toLowerCase();
    if (rarezaLower.includes("common")) {
      rarezaSaneada = rarezaLower.includes("uncommon") ? "Poco Común" : "Común";
    } else if (rarezaLower.includes("rare")) {
      rarezaSaneada = rarezaLower.includes("very rare") ? "Muy Raro" : "Raro";
    } else if (rarezaLower.includes("legend")) {
      rarezaSaneada = "Legendario";
    } else if (rarezaLower.includes("artifact")) {
      rarezaSaneada = "Artefacto";
    }
  }

  // Auto-esMágico si rareza !== 'Común'
  const esMagicoSaneado = rarezaSaneada !== "Común" ? true : !!(obj.esMagico || obj.isMagic);

  // Parsear Peso (Lb)
  let pesoSaneado = 0;
  if (obj.pesoLb !== undefined) {
    pesoSaneado = Number(obj.pesoLb) || 0;
  } else if (obj.weight !== undefined) {
    pesoSaneado = Number(obj.weight) || 0;
  } else if (obj.peso !== undefined) {
    const pesoTxt = aplanarValor(obj.peso);
    const MatchNum = pesoTxt.match(/(\d+(?:\.\d+)?)/);
    pesoSaneado = MatchNum ? parseFloat(MatchNum[1]) : 0;
  }

  // Costo estructurado y conversión automática
  let costoOriginalSaneado: { cantidad: number; unidad: "PC" | "PP" | "PE" | "PO" | "PPT" } | undefined = undefined;
  if (obj.costoOriginal && typeof obj.costoOriginal === "object") {
    const co = obj.costoOriginal as Record<string, unknown>;
    const uStr = typeof co.unidad === "string" ? co.unidad.toUpperCase() : "";
    const unidadValida: "PC" | "PP" | "PE" | "PO" | "PPT" =
      uStr === "PC" || uStr === "PP" || uStr === "PE" || uStr === "PO" || uStr === "PPT"
        ? uStr
        : "PO";
    costoOriginalSaneado = {
      cantidad: Number(co.cantidad) || 0,
      unidad: unidadValida
    };
  }

  // Parsear Costo/Valor (PO)
  let valorSaneado = 0;
  if (costoOriginalSaneado) {
    const cant = costoOriginalSaneado.cantidad;
    const unit = costoOriginalSaneado.unidad;
    if (unit === "PC") valorSaneado = cant / 100;
    else if (unit === "PP") valorSaneado = cant / 10;
    else if (unit === "PE") valorSaneado = cant / 2;
    else if (unit === "PO") valorSaneado = cant;
    else if (unit === "PPT") valorSaneado = cant * 10;
  } else if (obj.cost && typeof obj.cost === "object" && obj.cost !== null) {
    const costObj = obj.cost as Record<string, unknown>;
    const cantidad = Number(costObj.quantity) || 0;
    const unidadIngles = aplanarValor(costObj.unit || "gp").toLowerCase().trim();
    let unidadEsp: "PC" | "PP" | "PE" | "PO" | "PPT" = "PO";

    if (unidadIngles === "cp" || unidadIngles === "pc") {
      valorSaneado = cantidad / 100;
      unidadEsp = "PC";
    } else if (unidadIngles === "sp" || unidadIngles === "pp") {
      valorSaneado = cantidad / 10;
      unidadEsp = "PP";
    } else if (unidadIngles === "ep" || unidadIngles === "pe") {
      valorSaneado = cantidad / 2;
      unidadEsp = "PE";
    } else if (unidadIngles === "gp" || unidadIngles === "po") {
      valorSaneado = cantidad;
      unidadEsp = "PO";
    } else if (unidadIngles === "plat" || unidadIngles === "ppt" || unidadIngles === "pt") {
      valorSaneado = cantidad * 10;
      unidadEsp = "PPT";
    } else {
      valorSaneado = cantidad;
    }

    costoOriginalSaneado = { cantidad, unidad: unidadEsp };
  } else if (obj.valorPO !== undefined) {
    valorSaneado = Number(obj.valorPO) || 0;
    costoOriginalSaneado = { cantidad: valorSaneado, unidad: "PO" };
  } else if (obj.costoValor !== undefined) {
    valorSaneado = Number(obj.costoValor) || 0;
    const costoUnidad = aplanarValor(obj.costoUnidad || "PO").toUpperCase();
    let unidadEsp: "PC" | "PP" | "PE" | "PO" | "PPT" = "PO";
    if (costoUnidad === "PC") {
      valorSaneado = valorSaneado / 100;
      unidadEsp = "PC";
    } else if (costoUnidad === "PP") {
      valorSaneado = valorSaneado / 10;
      unidadEsp = "PP";
    } else if (costoUnidad === "PE") {
      valorSaneado = valorSaneado / 2;
      unidadEsp = "PE";
    } else if (costoUnidad === "PPT") {
      valorSaneado = valorSaneado * 10;
      unidadEsp = "PPT";
    }
    costoOriginalSaneado = { cantidad: Number(obj.costoValor) || 0, unidad: unidadEsp };
  }

  // Extraer efectos pasivos (reemplazando bonosMagicos) y migrar bonosMagicos si es necesario
  let efectosPasivosSaneados: { tipo: string; bono: string; valor?: number | string; descripcion?: string }[] | undefined = undefined;
  if (Array.isArray(obj.efectosPasivos)) {
    efectosPasivosSaneados = obj.efectosPasivos.map((e) => {
      const eObj = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
      return {
        tipo: aplanarValor(eObj.tipo || eObj.categoria || "Otro"),
        bono: aplanarValor(eObj.bono || ""),
        valor: eObj.valor !== undefined && eObj.valor !== "" ? (typeof eObj.valor === "number" ? eObj.valor : aplanarValor(eObj.valor)) : undefined,
        descripcion: eObj.descripcion !== undefined ? aplanarValor(eObj.descripcion) : undefined
      };
    });
  } else if (Array.isArray(obj.bonosMagicos)) {
    // Migración de compatibilidad
    efectosPasivosSaneados = obj.bonosMagicos.map((b) => {
      const bObj = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
      return {
        tipo: aplanarValor(bObj.categoria || bObj.category || "Otro"),
        bono: aplanarValor(bObj.bono || bObj.bonus || ""),
        valor: Number(bObj.valor || bObj.value) || 0
      };
    });
  }

  // Extraer sintonizacionRequerida y cargas
  const sintonizacionRequeridaSaneada = obj.sintonizacionRequerida !== undefined
    ? !!obj.sintonizacionRequerida
    : (obj.attunement !== undefined ? !!obj.attunement : undefined);
  const cargasSaneadas = obj.cargas !== undefined && obj.cargas !== ""
    ? (Number(obj.cargas) || undefined)
    : (obj.charges !== undefined && obj.charges !== "" ? (Number(obj.charges) || undefined) : undefined);

  // Propiedades mágicas y narrativas comunes
  const condicionSintonizacionSaneada = obj.condicionSintonizacion !== undefined ? aplanarValor(obj.condicionSintonizacion) : undefined;
  const formulaRecargaSaneada = obj.formulaRecarga !== undefined ? aplanarValor(obj.formulaRecarga) : undefined;
  const modificadorAtaqueDanoSaneado = obj.modificadorAtaqueDano !== undefined && obj.modificadorAtaqueDano !== ""
    ? (Number(obj.modificadorAtaqueDano) || undefined)
    : undefined;

  // Hechizos vinculados
  let hechizosVinculadosSaneados: {
    nombre: string;
    cd?: number;
    bonoAtaque?: number;
    costeCargas?: number;
    hechizoId?: string;
    nivel?: number;
    tipoAccion?: "accion" | "accionAdicional" | "reaccion";
  }[] | undefined = undefined;
  if (Array.isArray(obj.hechizosVinculados)) {
    hechizosVinculadosSaneados = obj.hechizosVinculados.map((h) => {
      const hObj = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
      const taRaw = aplanarValor(hObj.tipoAccion || "");
      const tipoAccionSaneado = (["accion", "accionAdicional", "reaccion"].includes(taRaw)
        ? taRaw
        : undefined) as "accion" | "accionAdicional" | "reaccion" | undefined;

      return {
        nombre: aplanarValor(hObj.nombre || "Hechizo"),
        cd: hObj.cd !== undefined && hObj.cd !== "" ? Number(hObj.cd) || undefined : undefined,
        bonoAtaque: hObj.bonoAtaque !== undefined && hObj.bonoAtaque !== "" ? Number(hObj.bonoAtaque) || undefined : undefined,
        costeCargas: hObj.costeCargas !== undefined && hObj.costeCargas !== "" ? Number(hObj.costeCargas) || undefined : undefined,
        hechizoId: hObj.hechizoId ? aplanarValor(hObj.hechizoId) : undefined,
        nivel: hObj.nivel !== undefined && hObj.nivel !== "" ? Number(hObj.nivel) || undefined : undefined,
        tipoAccion: tipoAccionSaneado
      };
    });
  }

  // Artesanía
  let artesaniaSaneada: { tallerRequerido: string; componentes: string[] } | undefined = undefined;
  if (obj.artesania && typeof obj.artesania === "object") {
    const artObj = obj.artesania as Record<string, unknown>;
    artesaniaSaneada = {
      tallerRequerido: aplanarValor(artObj.tallerRequerido || ""),
      componentes: Array.isArray(artObj.componentes) ? artObj.componentes.map(aplanarValor).filter(Boolean) : []
    };
  }

  // Determinar categoria canónica y si es consumible (D&D 5.5e)
  const resSRD = resolverCategoriaDesdeSRD(obj as Record<string, unknown>);
  let categoriaSaneada: CategoriaEquipo = resSRD.categoria;
  let esConsumibleSaneado = resSRD.esConsumible;

  if (typeof obj.categoria === "string" && (CATEGORIAS_EQUIPO as readonly string[]).includes(obj.categoria)) {
    categoriaSaneada = obj.categoria as CategoriaEquipo;
  }
  if (obj.esConsumible !== undefined) {
    esConsumibleSaneado = !!obj.esConsumible;
  }

  // Conservar propiedades de string
  const propiedadesSaneadas = obj.propiedades && typeof obj.propiedades === "string" ? aplanarValor(obj.propiedades) : undefined;

  // Equipable y venenos
  const equipableSaneado = obj.equipable !== undefined
    ? !!obj.equipable
    : (categoriaSaneada === "armas" || categoriaSaneada === "armaduras" || categoriaSaneada === "escudos");

  const esVenenoSaneado = obj.esVeneno !== undefined ? !!obj.esVeneno : undefined;
  const tipoVenenoSaneado = obj.tipoVeneno ? (aplanarValor(obj.tipoVeneno) as "Contacto" | "Ingerido" | "Inhalado" | "Lesión") : undefined;
  const efectoVenenoSaneado = obj.efectoVeneno !== undefined ? aplanarValor(obj.efectoVeneno) : undefined;

  // Extraer ammunition relacional
  let ammunitionSaneada: { index: string; name: string } | undefined = undefined;
  if (obj.ammunition && typeof obj.ammunition === "object") {
    const ammoObj = obj.ammunition as Record<string, unknown>;
    ammunitionSaneada = {
      index: aplanarValor(ammoObj.index || ammoObj.id || ""),
      name: aplanarValor(ammoObj.name || "")
    };
  }

  // Extraer storage relacional
  let storageSaneado: { index: string; name: string } | undefined = undefined;
  if (obj.storage && typeof obj.storage === "object") {
    const storeObj = obj.storage as Record<string, unknown>;
    storageSaneado = {
      index: aplanarValor(storeObj.index || storeObj.id || ""),
      name: aplanarValor(storeObj.name || "")
    };
  }

  // Extraer contents relacional
  let contentsSaneado: { item: { index: string; name: string }; quantity: number }[] | undefined = undefined;
  if (Array.isArray(obj.contents)) {
    contentsSaneado = obj.contents.map((c: unknown) => {
      if (c && typeof c === "object") {
        const cObj = c as Record<string, unknown>;
        const itemObj = cObj.item as Record<string, unknown> | undefined;
        return {
          item: {
            index: aplanarValor(itemObj?.index || itemObj?.id || ""),
            name: aplanarValor(itemObj?.name || "")
          },
          quantity: Number(cObj.quantity) || 1
        };
      }
      return null;
    }).filter((c): c is { item: { index: string; name: string }; quantity: number } => c !== null && c.item.index !== "" && c.item.name !== "");
  }

  // Extraer craft relacional
  let craftSaneado: { index: string; name: string }[] | undefined = undefined;
  if (Array.isArray(obj.craft)) {
    craftSaneado = obj.craft.map((c: unknown) => {
      if (c && typeof c === "object") {
        const cObj = c as Record<string, unknown>;
        return {
          index: aplanarValor(cObj.index || cObj.id || ""),
          name: aplanarValor(cObj.name || "")
        };
      }
      return {
        index: normalizarTexto(aplanarValor(c)),
        name: aplanarValor(c)
      };
    }).filter((c): c is { index: string; name: string } => Boolean(c.index && c.name));
  }

  // Extraer quantity (unidades por pack/lote en el compendio)
  const quantitySaneada = obj.quantity !== undefined && obj.quantity !== ""
    ? (Number(obj.quantity) || undefined)
    : undefined;

  const pesoUnitarioSaneado = quantitySaneada && quantitySaneada > 1 && pesoSaneado > 0
    ? Math.round((pesoSaneado / quantitySaneada) * 1000) / 1000
    : (pesoSaneado > 0 ? pesoSaneado : undefined);

  // Inferir subcategoría si no viene especificada directamente
  let subcategoriaSaneada = aplanarValor(obj.subcategoria || "");
  if (!subcategoriaSaneada) {
    let subTxt = aplanarValor(obj.equipment_category || "").toUpperCase();
    if (Array.isArray(obj.equipment_categories)) {
      const catsTxt = obj.equipment_categories
        .map((c: unknown) => {
          if (c && typeof c === "object") {
            const cObj = c as Record<string, unknown>;
            return aplanarValor(cObj.index || cObj.name || "").toUpperCase();
          }
          return aplanarValor(c).toUpperCase();
        })
        .join(" | ");
      subTxt = subTxt ? `${subTxt} | ${catsTxt}` : catsTxt;
    }

    if (categoriaSaneada === "herramientas") {
      if (subTxt.includes("MUSICAL") || subTxt.includes("INSTRUMENT")) {
        subcategoriaSaneada = "Instrumento";
      } else {
        subcategoriaSaneada = "Herramienta";
      }
    } else if (categoriaSaneada === "municion") {
      subcategoriaSaneada = "Munición";
    } else if (categoriaSaneada === "contenedores") {
      subcategoriaSaneada = "Contenedor";
    } else if (categoriaSaneada === "paquetes-equipo") {
      subcategoriaSaneada = "Paquete";
    } else if (categoriaSaneada === "consumibles") {
      subcategoriaSaneada = "Consumible";
    } else if (categoriaSaneada === "objetos-magicos") {
      subcategoriaSaneada = "Maravilloso";
    }
  }

  // Estructura base común
  const baseObjeto = {
    id: idSaneado,
    nombre: nombreSaneado,
    nombreNormalizado: normalizarTexto(nombreSaneado),
    descripcion: descSaneada,
    pesoLb: pesoSaneado,
    pesoUnitario: pesoUnitarioSaneado,
    quantity: quantitySaneada,
    valorPO: valorSaneado,
    rareza: rarezaSaneada,
    esMagico: esMagicoSaneado,
    costoOriginal: costoOriginalSaneado,
    categoria: categoriaSaneada,
    esConsumible: esConsumibleSaneado,
    subcategoria: subcategoriaSaneada,
    esVeneno: esVenenoSaneado,
    tipoVeneno: tipoVenenoSaneado,
    efectoVeneno: efectoVenenoSaneado,
    equipable: equipableSaneado,
    sintonizacionRequerida: sintonizacionRequeridaSaneada,
    cargas: cargasSaneadas,
    condicionSintonizacion: condicionSintonizacionSaneada,
    formulaRecarga: formulaRecargaSaneada,
    modificadorAtaqueDano: modificadorAtaqueDanoSaneado,
    efectosPasivos: efectosPasivosSaneados,
    hechizosVinculados: hechizosVinculadosSaneados,
    artesania: artesaniaSaneada,
    ammunition: ammunitionSaneada,
    storage: storageSaneado,
    contents: contentsSaneado,
    craft: craftSaneado,
    mastery: obj.mastery,
    equipment_categories: obj.equipment_categories
  };

  return despacharSanitizacionPorCategoria(baseObjeto, obj, categoriaSaneada, propiedadesSaneadas);
}
