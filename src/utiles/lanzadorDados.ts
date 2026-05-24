import React from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";

/**
 * Módulo de Lanzamiento de Dados para TaleSpire (window.TS.dice)
 *
 * Proporciona una interfaz unificada y robusta para enviar tiradas
 * de dados 3D nativas a la bandeja física de TaleSpire.
 *
 * Programado 100% en español con alto nivel de tolerancia a fallos.
 */

// Interfaz para el entorno global con soporte para TaleSpire
interface TSWindow extends Window {
  TS?: {
    dice: {
      isValidRollString: (rollStr: string) => boolean;
      makeRollDescriptors: (rollStr: string) => Promise<any[]>;
      putDiceInTray: (descriptors: any[], silenceDefaultChatCard?: boolean) => Promise<string>;
      evaluateDiceResultsGroup: (group: any) => Promise<number>;
      sendDiceResult: (groups: any[], rollId: string) => Promise<void>;
    };
    chat?: {
      send: (message: string, target?: string) => Promise<boolean>;
    };
    debug?: {
      log: (msg: string) => void;
    };
  };
}

const windowAlias = window as unknown as TSWindow;

export interface MetadataTiradaEspecial {
  tipo: "ventaja" | "desventaja";
  etiquetaOriginal: string;
  nombreGrupoOriginal: string;
  grupoAName: string;
  grupoBName: string;
}

// Registro global de tiradas especiales de ventaja/desventaja en memoria
const tiradasEspecialesActivas: Record<string, MetadataTiradaEspecial> = {};

export interface MetadataIniciativa {
  tipo: "iniciativa";
  criaturaId: string;
}

// Registro global de tiradas de iniciativa activas en memoria
const tiradasIniciativaActivas: Record<string, MetadataIniciativa> = {};

/**
 * Sanitiza una etiqueta para remover acentos, eñes y caracteres no ASCII
 * que no son soportados correctamente por la interfaz 3D o el chat de TaleSpire.
 */
export function sanitizarEtiqueta(etiqueta: string): string {
  if (!etiqueta) return "";
  return etiqueta
    .replace(/[áäâà]/gi, "a")
    .replace(/[éëêè]/gi, "e")
    .replace(/[íïîì]/gi, "i")
    .replace(/[óöôò]/gi, "o")
    .replace(/[úüûù]/gi, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[Ñ]/g, "N")
    .replace(/[^a-zA-Z0-9\s()+-]/g, "") // Remover caracteres especiales, mantener letras, números, espacios y paréntesis
    .trim();
}

/**
 * Normaliza y limpia una fórmula de dados para asegurar la compatibilidad con TaleSpire.
 * Soporta la sintaxis de etiquetas oficial de TaleSpire (ej. "Ataque:1d20+5/Dano:2d6+3").
 * Elimina automáticamente el prefijo "!" obsoleto y sanitiza las eñes y acentos.
 */
export function normalizarFormulaDados(formula: string): string {
  if (!formula) return "1d20";
  
  // Dividimos la fórmula si tiene múltiples subgrupos separados por '/'
  const grupos = formula.split("/");
  const gruposNormalizados = grupos.map((grupo) => {
    const trimmedGrupo = grupo.trim();
    
    // Comprobar si el grupo tiene un prefijo de etiqueta nativo de TaleSpire (ej: "Nombre:" o "!Nombre:")
    const matchEtiqueta = trimmedGrupo.match(/^!?([^:]+):(.*)$/);
    
    if (matchEtiqueta) {
      const etiqueta = matchEtiqueta[1].trim();
      const formulaDados = matchEtiqueta[2].trim();
      const formulaNormalizada = limpiarYNormalizarDadosSimples(formulaDados);
      const etiquetaSaneada = sanitizarEtiqueta(etiqueta);
      return `${etiquetaSaneada}:${formulaNormalizada}`;
    }
    
    return limpiarYNormalizarDadosSimples(trimmedGrupo);
  });
  
  // Para TaleSpire, los múltiples grupos en una tirada física se unen con '/'
  return gruposNormalizados.join("/");
}

/**
 * Limpia y normaliza una fórmula de dados simple (sin etiquetas).
 */
export function limpiarYNormalizarDadosSimples(formulaSimple: string): string {
  // Limpiar espacios en blanco y convertir a minúsculas
  let limpia = formulaSimple.replace(/\s+/g, "").toLowerCase();
  
  if (!limpia) return "1d20";

  // Si comienza directamente con "d", asumir 1d (ej: "d20" -> "1d20")
  if (limpia.startsWith("d")) {
    limpia = "1" + limpia;
  }
  
  // Si es solo un número (ej. "+5" o "3"), no se puede tirar en bandeja sin un dado.
  // Le agregamos un d20 base simulando una tirada estándar.
  if (/^[+-]?\d+$/.test(limpia)) {
    const signo = limpia.startsWith("-") || limpia.startsWith("+") ? "" : "+";
    limpia = `1d20${signo}${limpia}`;
  }

  // Quitar cualquier carácter no válido para una fórmula de dados estándar
  limpia = limpia.replace(/[^d0-9+\-*/()]/g, "");

  return limpia || "1d20";
}

/**
 * Construye descriptores de dados manualmente a partir de una fórmula
 * en caso de que la API de TaleSpire no exponga la función makeRollDescriptors.
 */
export function crearDescriptoresManualmente(formula: string): any[] {
  if (!formula) return [{ name: "Tirada", roll: "1d20" }];
  
  // Limpiamos los prefijos '!' obsoletos
  const formulaLimpia = formula.replace(/!/g, "");
  
  // Separamos primero por '/' que es nuestro separador interno de grupos
  const partes = formulaLimpia.split("/");
  if (partes.length === 1) {
    // Si no tiene '/', puede que esté unida con '+'
    // Pero ojo: el '+' también separa modificadores (ej: "1d20+5").
    // Si no tiene ':' en absoluto, es una tirada simple de un solo grupo
    if (!formulaLimpia.includes(":")) {
      return [{ name: "Tirada", roll: formulaLimpia }];
    }
    
    // Si tiene ':' pero no '/', intentamos separar usando regex para no romper modificadores
    const regexGrupo = /([^:+]+):([0-9d+\-*/()]+)/g;
    const desc: any[] = [];
    let match;
    while ((match = regexGrupo.exec(formulaLimpia)) !== null) {
      desc.push({
        name: match[1].trim(),
        roll: match[2].trim()
      });
    }
    if (desc.length > 0) return desc;
    return [{ name: "Tirada", roll: formulaLimpia }];
  }
  
  return partes.map((p) => {
    const match = p.trim().match(/^([^:]+):(.*)$/);
    if (match) {
      return {
        name: match[1].trim(),
        roll: match[2].trim()
      };
    }
    return {
      name: "Tirada",
      roll: p.trim()
    };
  });
}

/**
 * Envía una tirada de dados física a la bandeja en 3D a través de un comando de chat
 * de TaleSpire. Es sumamente estable, nativa de fábrica y funciona en cualquier versión.
 */
export async function lanzarDadosPorChatTaleSpire(formula: string): Promise<void> {
  if (windowAlias.TS && windowAlias.TS.chat && typeof windowAlias.TS.chat.send === "function") {
    // TaleSpire requiere que los comandos de dados comiencen con el carácter exclamación '!'
    // Eliminamos cualquier '!' intermedio que pueda romper el parser del chat de TaleSpire
    const formulaLimpia = formula.replace(/!/g, "");
    const comandoChat = `!${formulaLimpia}`;
    console.log(`[Lanzador Dados (Chat)] Enviando comando de tirada física al chat: "${comandoChat}"`);
    await windowAlias.TS.chat.send(comandoChat);
  } else {
    throw new Error("La API de chat de TaleSpire tampoco está disponible.");
  }
}

/**
 * Envía una tirada de dados 3D física a la bandeja de TaleSpire.
 * Si no está en el entorno de TaleSpire, realiza una simulación matemática básica
 * instantánea e imprime en consola para facilitar el desarrollo.
 * 
 * @param formula Fórmula de dados en formato estándar D&D (ej. "2d6+4", "1d20+5")
 * @param etiqueta Texto identificador de la tirada (ej. "Ataque Espada", "Bola de Fuego")
 */
export async function lanzarDadosTaleSpire(
  formula: string,
  etiqueta: string,
  metaIniciativa?: MetadataIniciativa
): Promise<void> {
  // 1. Obtener tipo de tirada (ventaja, desventaja, plano) del Zustand
  const { tipoTirada, establecerTipoTirada } = usarAlmacenDM.getState();
  
  let formulaProcesada = formula;
  let tiradaEspecial: MetadataTiradaEspecial | null = null;
  
  if (tipoTirada !== "plano") {
    // Si no es tirada plana, procesamos los grupos que tengan d20
    const grupos = formula.split("/");
    let d20Encontrado = false;
    
    const gruposProcesados = grupos.map((grupo) => {
      const matchEtiqueta = grupo.match(/^!?([^:]+):(.*)$/);
      if (matchEtiqueta) {
        const etiquetaGrupo = matchEtiqueta[1].trim();
        const formulaDados = matchEtiqueta[2].trim();
        
        if (/\b1?d20\b/i.test(formulaDados)) {
          d20Encontrado = true;
          const etiquetaGrupoSaneada = sanitizarEtiqueta(etiquetaGrupo);
          const grupoAName = `${etiquetaGrupoSaneada} (A)`;
          const grupoBName = `${etiquetaGrupoSaneada} (B)`;
          
          tiradaEspecial = {
            tipo: tipoTirada as "ventaja" | "desventaja",
            etiquetaOriginal: etiqueta,
            nombreGrupoOriginal: etiquetaGrupoSaneada,
            grupoAName,
            grupoBName
          };
          
          return `${grupoAName}:${formulaDados}/${grupoBName}:${formulaDados}`;
        }
      } else {
        if (/\b1?d20\b/i.test(grupo)) {
          d20Encontrado = true;
          const grupoAName = `Ataque (A)`;
          const grupoBName = `Ataque (B)`;
          
          tiradaEspecial = {
            tipo: tipoTirada as "ventaja" | "desventaja",
            etiquetaOriginal: etiqueta,
            nombreGrupoOriginal: "Ataque",
            grupoAName,
            grupoBName
          };
          
          return `${grupoAName}:${grupo}/${grupoBName}:${grupo}`;
        }
      }
      return grupo;
    });
    
    if (d20Encontrado) {
      formulaProcesada = gruposProcesados.join("/");
    } else {
      tiradaEspecial = null;
    }
    
    // Restablecer el selector a "plano" después de programar la tirada
    establecerTipoTirada("plano");
  }

  const formulaLimpia = normalizarFormulaDados(formulaProcesada);
  const nombreEtiqueta = sanitizarEtiqueta(etiqueta.trim() || "Tirada");

  console.log(`[Lanzador Dados] Preparando tirada: "${nombreEtiqueta}" con fórmula: "${formulaLimpia}" (Tipo original: ${tipoTirada})`);

  // 1. Validamos si la API nativa de TaleSpire y su módulo de dados están disponibles
  if (windowAlias.TS && windowAlias.TS.dice) {
    try {
      const diceApi = windowAlias.TS.dice;

      // Intentamos validar la cadena si el motor lo soporta
      let esValido = true;
      if (typeof diceApi.isValidRollString === "function") {
        esValido = diceApi.isValidRollString(formulaLimpia);
      }

      if (!esValido) {
        console.warn(`[Lanzador Dados] La fórmula "${formulaLimpia}" no es válida según TaleSpire. Intentando de todos modos...`);
      }

      // Convertimos el string en los descriptores físicos requeridos por TaleSpire
      console.log(`[Lanzador Dados] Generando descriptores de tirada para "${formulaLimpia}"`);
      
      let descriptores: any[] = [];
      if (typeof diceApi.makeRollDescriptors === "function") {
        descriptores = await diceApi.makeRollDescriptors(formulaLimpia);
      } else {
        console.warn("[Lanzador Dados] TS.dice.makeRollDescriptors no es una función en este cliente. Construyendo descriptores manualmente...");
        descriptores = crearDescriptoresManualmente(formulaProcesada);
      }
      
      if (!descriptores || descriptores.length === 0) {
        throw new Error("No se generaron descriptores de dados para la fórmula provista.");
      }

      // Colocamos los dados físicos en la bandeja 3D de TaleSpire de forma segura
      console.log(`[Lanzador Dados] Enviando dados a la bandeja 3D. Descriptores:`, descriptores);
      
      let rollId = "";
      if (typeof diceApi.putDiceInTray === "function") {
        const silenceChat = tiradaEspecial !== null;
        rollId = await diceApi.putDiceInTray(descriptores, silenceChat);
        
        if (tiradaEspecial && rollId) {
          tiradasEspecialesActivas[rollId] = tiradaEspecial;
          console.log(`[Lanzador Dados] Registrada tirada especial con rollId: ${rollId}`, tiradaEspecial);
        }

        if (metaIniciativa && rollId) {
          tiradasIniciativaActivas[rollId] = metaIniciativa;
          console.log(`[Lanzador Dados] Registrada tirada de iniciativa nativa con rollId: ${rollId}`, metaIniciativa);
        }
      } else {
        console.warn("[Lanzador Dados] diceApi.putDiceInTray no es una función en este cliente. Intentando canal de chat físico...");
        await lanzarDadosPorChatTaleSpire(formulaProcesada);
      }

      if (windowAlias.TS.debug && typeof windowAlias.TS.debug.log === "function") {
        windowAlias.TS.debug.log(`Tirando dados en bandeja física: ${nombreEtiqueta} (${formulaLimpia})`);
      }
    } catch (error) {
      console.error("[Lanzador Dados] Fallo de API directa de dados. Recurriendo al canal de chat de TaleSpire...", error);
      try {
        await lanzarDadosPorChatTaleSpire(formulaProcesada);
      } catch (errChat) {
        console.error("[Lanzador Dados] Falló también el canal de chat. Ejecutando fallback local matemático...", errChat);
        ejecutarTiradaFallbackLocal(formulaLimpia, nombreEtiqueta);
      }
    }
  } else {
    // 2. Fallback de desarrollo en navegador local (sin simulación pesada, solo log y consola)
    console.warn("[Lanzador Dados] API de TaleSpire no disponible. Ejecutando tirada matemática de desarrollo.");
    ejecutarTiradaFallbackLocal(formulaLimpia, nombreEtiqueta, tiradaEspecial);
  }
}

/**
 * Intercepta y procesa los resultados de dados recibidos desde TaleSpire.
 * Si corresponde a una tirada especial (ventaja/desventaja) registrada, selecciona
 * la tirada de d20 correspondiente (mayor o menor), descarta la otra y envía el resultado
 * filtrado al chat del juego de forma elegante.
 * 
 * @param evento El evento rollResults nativo de TaleSpire.
 * @returns Promesa que se resuelve a true si el evento fue procesado por nosotros, o false si no nos corresponde.
 */
export async function procesarResultadosDadosTaleSpire(evento: any): Promise<boolean> {
  if (!evento || evento.kind !== "rollResults" || !evento.payload) {
    return false;
  }
  
  const rollId = evento.payload.rollId;
  const infoIniciativaPlana = tiradasIniciativaActivas[rollId];
  const infoTirada = tiradasEspecialesActivas[rollId];
  
  // Caso 1: Tirada de iniciativa plana nativa (sin ventaja ni desventaja)
  if (!infoTirada && infoIniciativaPlana) {
    console.log(`[Lanzador Dados] Procesando resultado de iniciativa plana para rollId: ${rollId}`);
    const resultGroups = evento.payload.resultsGroups;
    if (resultGroups && Array.isArray(resultGroups) && resultGroups.length > 0) {
      try {
        const diceApi = windowAlias.TS?.dice;
        const grupoInic = resultGroups[0];
        let total = 0;
        if (diceApi && typeof diceApi.evaluateDiceResultsGroup === "function") {
          total = await diceApi.evaluateDiceResultsGroup(grupoInic);
        } else {
          total = obtenerTotalGrupoFallback(grupoInic);
        }
        console.log(`[Lanzador Dados] Iniciativa plana obtenida: ${total} para la criatura ${infoIniciativaPlana.criaturaId}`);
        // Usar la acción de actualizar en combat tracker si existiera
        const state = usarAlmacenDM.getState();
        const nuevaCola = state.colaIniciativa.map((c) => {
          if (c.id === infoIniciativaPlana.criaturaId) {
            return { ...c, iniciativa: total };
          }
          return c;
        });
        nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
        usarAlmacenDM.setState({ colaIniciativa: nuevaCola });
      } catch (error) {
        console.error("[Lanzador Dados] Error al evaluar iniciativa plana:", error);
      }
    }
    delete tiradasIniciativaActivas[rollId];
    return false; // Permitir que TaleSpire muestre su tarjeta nativa de chat
  }
  
  if (!infoTirada) {
    return false;
  }
  
  console.log(`[Lanzador Dados] Interceptada tirada especial ${rollId} de tipo ${infoTirada.tipo}`);
  const resultGroups = evento.payload.resultsGroups;
  
  if (!resultGroups || !Array.isArray(resultGroups)) {
    delete tiradasEspecialesActivas[rollId];
    return false;
  }
  
  try {
    const diceApi = windowAlias.TS?.dice;
    
    // Buscar los grupos A y B
    const grupoA = resultGroups.find((g: any) => g.name === infoTirada.grupoAName);
    const grupoB = resultGroups.find((g: any) => g.name === infoTirada.grupoBName);
    
    if (!grupoA || !grupoB) {
      console.warn("[Lanzador Dados] No se encontraron los grupos A o B en los resultados de la tirada.");
      delete tiradasEspecialesActivas[rollId];
      return false;
    }
    
    // Evaluar los totales de los d20 de forma asíncrona
    let totalA = 0;
    let totalB = 0;
    
    if (diceApi && typeof diceApi.evaluateDiceResultsGroup === "function") {
      totalA = await diceApi.evaluateDiceResultsGroup(grupoA);
      totalB = await diceApi.evaluateDiceResultsGroup(grupoB);
    } else {
      // Fallback robusto para desarrollo o en caso de fallo de API
      totalA = obtenerTotalGrupoFallback(grupoA);
      totalB = obtenerTotalGrupoFallback(grupoB);
    }
    
    console.log(`[Lanzador Dados] Evaluación: ${infoTirada.grupoAName} = ${totalA} | ${infoTirada.grupoBName} = ${totalB}`);
    
    // Determinar cuál d20 elegir
    const esVentaja = infoTirada.tipo === "ventaja";
    const elegirA = esVentaja ? (totalA >= totalB) : (totalA <= totalB);
    
    const grupoElegido = elegirA ? grupoA : grupoB;
    const totalElegido = elegirA ? totalA : totalB;
    const totalDescartado = elegirA ? totalB : totalA;
    
    console.log(`[Lanzador Dados] Elegido ${grupoElegido.name} (${totalElegido}) - Descartado (${totalDescartado})`);
    
    // Crear el grupo d20 final clonando el elegido pero con un nombre limpio y descriptivo
    const sufijoChat = esVentaja ? " (Ventaja)" : " (Desventaja)";
    const grupoGanadorSaneado = {
      ...grupoElegido,
      name: `${infoTirada.nombreGrupoOriginal}${sufijoChat}`,
      description: grupoElegido.description || `${esVentaja ? "Mayor" : "Menor"} de [${totalA}, ${totalB}]`
    };
    
    // Construir la lista final de grupos a mostrar en el chat
    const gruposParaChat = resultGroups
      .filter((g: any) => g.name !== infoTirada.grupoAName && g.name !== infoTirada.grupoBName)
      .map((g: any) => ({
        ...g,
        description: g.description || ""
      }));
      
    // Colocamos el d20 ganador en primera posición
    gruposParaChat.unshift(grupoGanadorSaneado);
    
    console.log("[Lanzador Dados] Enviando resultado filtrado al chat de TaleSpire:", gruposParaChat);
    
    if (diceApi && typeof diceApi.sendDiceResult === "function") {
      await diceApi.sendDiceResult(gruposParaChat, rollId);
    } else {
      console.log(`%c[MOCK CHAT RESULT] ${infoTirada.etiquetaOriginal} - ${grupoGanadorSaneado.name}: ${totalElegido}`, "color: #a6e3a1; font-weight: bold;");
    }
    
    // Si esta tirada especial también era para iniciativa, actualizamos la criatura
    const infoIniciativaEspecial = tiradasIniciativaActivas[rollId];
    if (infoIniciativaEspecial) {
      console.log(`[Lanzador Dados] Iniciativa especial obtenida: ${totalElegido} para la criatura ${infoIniciativaEspecial.criaturaId}`);
      const state = usarAlmacenDM.getState();
      const nuevaCola = state.colaIniciativa.map((c) => {
        if (c.id === infoIniciativaEspecial.criaturaId) {
          return { ...c, iniciativa: totalElegido };
        }
        return c;
      });
      nuevaCola.sort((a, b) => b.iniciativa - a.iniciativa);
      usarAlmacenDM.setState({ colaIniciativa: nuevaCola });
      delete tiradasIniciativaActivas[rollId];
    }
    
    delete tiradasEspecialesActivas[rollId];
    return true;
  } catch (error) {
    console.error("[Lanzador Dados] Error al procesar tirada especial:", error);
    delete tiradasEspecialesActivas[rollId];
    return false;
  }
}

/**
 * Función fallback para obtener el total de un grupo de resultados si la API nativa de evaluación no está disponible.
 */
function obtenerTotalGrupoFallback(grupo: any): number {
  if (!grupo || !grupo.result) return 0;
  if (typeof grupo.result.total === "number") {
    return grupo.result.total;
  }
  
  function evaluarNodo(nodo: any): number {
    if (!nodo) return 0;
    if (typeof nodo.value === "number") return nodo.value;
    if (Array.isArray(nodo.results)) {
      return nodo.results.reduce((sum: number, r: any) => sum + (typeof r === "number" ? r : (r.value || 0)), 0);
    }
    if (nodo.operator === "+" && Array.isArray(nodo.operands)) {
      return nodo.operands.reduce((sum: number, op: any) => sum + evaluarNodo(op), 0);
    }
    if (nodo.operator === "-" && Array.isArray(nodo.operands)) {
      if (nodo.operands.length === 0) return 0;
      const primerOp = evaluarNodo(nodo.operands[0]);
      const restOp = nodo.operands.slice(1).reduce((sum: number, op: any) => sum + evaluarNodo(op), 0);
      return primerOp - restOp;
    }
    return 0;
  }
  
  return evaluarNodo(grupo.result);
}

/**
 * Realiza un cálculo matemático rápido en Javascript para propósitos de prueba en navegador
 */
function ejecutarTiradaFallbackLocal(
  formula: string,
  etiquetaGlobal: string,
  _tiradaEspecial: MetadataTiradaEspecial | null = null
): void {
  try {
    const grupos = formula.split("/");
    
    console.log(
      `%c🎲 [TIRADA LOCAL MOCK] %c${etiquetaGlobal.toUpperCase()}`,
      "background: #1e1e2e; color: #89b4fa; font-weight: bold; padding: 4px; border-radius: 4px;",
      "color: #cdd6f4; font-weight: bold;"
    );

    grupos.forEach((grupo, idx) => {
      let formulaDados = grupo;
      let etiquetaGrupo = `Grupo ${idx + 1}`;

      const matchEtiqueta = grupo.match(/^!([^:]+):(.*)$/);
      if (matchEtiqueta) {
        etiquetaGrupo = matchEtiqueta[1];
        formulaDados = matchEtiqueta[2];
      }

      const match = formulaDados.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/);
      
      if (match) {
        const cantidad = parseInt(match[1], 10);
        const caras = parseInt(match[2], 10);
        const signo = match[3] || "+";
        const modificador = match[4] ? parseInt(match[4], 10) : 0;
        
        const tiradas: number[] = [];
        let valorDadosFinal = 0;
        
        if (caras === 20 && cantidad === 2) {
          const d1 = Math.floor(Math.random() * 20) + 1;
          const d2 = Math.floor(Math.random() * 20) + 1;
          tiradas.push(d1, d2);
          
          if (etiquetaGrupo.toLowerCase().includes("ventaja")) {
            valorDadosFinal = Math.max(d1, d2);
          } else if (etiquetaGrupo.toLowerCase().includes("desventaja")) {
            valorDadosFinal = Math.min(d1, d2);
          } else {
            valorDadosFinal = d1;
          }
        } else {
          let sumaDados = 0;
          for (let i = 0; i < cantidad; i++) {
            const resultadoDado = Math.floor(Math.random() * caras) + 1;
            tiradas.push(resultadoDado);
            sumaDados += resultadoDado;
          }
          valorDadosFinal = sumaDados;
        }
        
        const modFinal = signo === "-" ? -modificador : modificador;
        const total = valorDadosFinal + modFinal;
        
        let desglose = "";
        if (caras === 20 && cantidad === 2) {
          const elegido = valorDadosFinal;
          const noElegido = tiradas[0] === elegido ? tiradas[1] : tiradas[0];
          desglose = `Elegido ${elegido} (Descartado ${noElegido})${modificador !== 0 ? ` ${signo} ${modificador}` : ""}`;
        } else {
          desglose = `[${tiradas.join(" + ")}]${modificador !== 0 ? ` ${signo} ${modificador}` : ""}`;
        }
        
        console.log(
          `  %c↳ %c${etiquetaGrupo}: %c${total} %c(${desglose})`,
          "color: #89b4fa; font-weight: bold;",
          "color: #cdd6f4; font-weight: bold;",
          "color: #a6e3a1; font-weight: bold; font-size: 1.05em;",
          "color: #a6adc8;"
        );
      } else {
        console.log(
          `  %c↳ %c${etiquetaGrupo}: %cTirada simulada (Fórmula: ${formulaDados})`,
          "color: #89b4fa; font-weight: bold;",
          "color: #cdd6f4; font-weight: bold;",
          "color: #f9e2af;"
        );
      }
    });
  } catch (err) {
    console.error("[Lanzador Dados] Fallo al calcular tirada local:", err);
  }
}

/**
 * Detecta el tipo de daño en base a un texto descriptivo.
 */
export function detectarTipoDaño(descripcion: string, valorPredeterminado: string = "Daño"): string {
  if (!descripcion) return valorPredeterminado;
  const desc = descripcion.toLowerCase();
  
  if (desc.includes("cortante")) return "Cortante";
  if (desc.includes("perforante")) return "Perforante";
  if (desc.includes("contundente")) return "Contundente";
  if (desc.includes("fuego")) return "Fuego";
  if (desc.includes("frío") || desc.includes("frio")) return "Frío";
  if (desc.includes("veneno")) return "Veneno";
  if (desc.includes("ácido") || desc.includes("acido")) return "Ácido";
  if (desc.includes("psíquico") || desc.includes("psiquico")) return "Psíquico";
  if (desc.includes("necrótico") || desc.includes("necrotico")) return "Necrótico";
  if (desc.includes("radiante")) return "Radiante";
  if (desc.includes("relámpago") || desc.includes("relampago") || desc.includes("rayo")) return "Relámpago";
  if (desc.includes("trueno")) return "Trueno";
  if (desc.includes("fuerza")) return "Fuerza";
  
  if (desc.includes("slashing")) return "Cortante";
  if (desc.includes("piercing")) return "Perforante";
  if (desc.includes("bludgeoning")) return "Contundente";
  if (desc.includes("fire")) return "Fuego";
  if (desc.includes("cold")) return "Frío";
  if (desc.includes("poison")) return "Veneno";
  if (desc.includes("acid")) return "Ácido";
  if (desc.includes("psychic")) return "Psíquico";
  if (desc.includes("necrotic")) return "Necrótico";
  if (desc.includes("radiant")) return "Radiante";
  if (desc.includes("lightning")) return "Relámpago";
  if (desc.includes("thunder")) return "Trueno";
  if (desc.includes("force")) return "Fuerza";

  return valorPredeterminado;
}

/**
 * Escanea un texto descriptivo, identifica fórmulas de dados comunes de D&D
 * (ej: 1d20, 2d6+4, d100) y las convierte en botones interactivos en React
 * que envían tiradas físicas a TaleSpire al hacer click.
 */
export function renderizarTextoConDadosInteractivos(
  texto: string,
  etiquetaTirada: string
): React.ReactNode[] {
  if (!texto) return [];

  const regexDadosYModificadores = /(\b(?:[1-9]\d*)?d(?:4|6|8|10|12|20|100)(?:\s*[+-]\s*\d+)?\b)|([+-]\s*\d+)\b/gi;

  const partes: React.ReactNode[] = [];
  let ultimoIndice = 0;
  let match;

  while ((match = regexDadosYModificadores.exec(texto)) !== null) {
    const indiceCoincidencia = match.index;
    const textoCoincidente = match[0];
    const esDado = match[1] !== undefined;

    if (indiceCoincidencia > ultimoIndice) {
      partes.push(texto.substring(ultimoIndice, indiceCoincidencia));
    }

    partes.push(
      React.createElement(
        "strong",
        {
          key: `dado-${indiceCoincidencia}`,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            
            let formulaConEtiqueta = "";
            const matchNombreLimpio = etiquetaTirada.match(/^([^(]+)/);
            const nombreLimpio = matchNombreLimpio ? matchNombreLimpio[1].trim() : etiquetaTirada;
            
            if (esDado) {
              const esD20 = textoCoincidente.toLowerCase().includes("d20");
              if (esD20) {
                formulaConEtiqueta = `!${nombreLimpio}:${textoCoincidente}`;
              } else {
                const tipoDañoEncontrado = detectarTipoDaño(texto, "Daño");
                const etiquetaDaño = tipoDañoEncontrado === "Daño" ? "Daño" : `Daño ${tipoDañoEncontrado}`;
                formulaConEtiqueta = `!${etiquetaDaño}:${textoCoincidente}`;
              }
            } else {
              const formulaDados = `1d20${textoCoincidente.replace(/\s/g, "")}`;
              formulaConEtiqueta = `!Ataque ${nombreLimpio}:${formulaDados}`;
            }
            
            lanzarDadosTaleSpire(formulaConEtiqueta, etiquetaTirada);
          },
          style: {
            color: esDado ? "#ff7675" : "#ffcc00",
            cursor: "pointer",
            textDecoration: "underline dashed",
            fontWeight: "bold",
            padding: "0 4px",
            backgroundColor: esDado ? "rgba(255, 118, 117, 0.1)" : "rgba(255, 204, 0, 0.1)",
            borderRadius: "4px",
            transition: "all 0.15s ease",
            display: "inline-block",
            fontFamily: "monospace"
          },
          title: esDado 
            ? `Hacer tirada de d20 para ${textoCoincidente} en TaleSpire` 
            : `Tirar ataque d20${textoCoincidente.replace(/\s/g, "")} en TaleSpire`,
          className: "dado-interactivo-inline"
        },
        esDado ? `🎲 ${textoCoincidente}` : `⚔️ ${textoCoincidente}`
      )
    );

    ultimoIndice = regexDadosYModificadores.lastIndex;
  }

  if (ultimoIndice < texto.length) {
    partes.push(texto.substring(ultimoIndice));
  }

  return partes.length > 0 ? partes : [texto];
}
