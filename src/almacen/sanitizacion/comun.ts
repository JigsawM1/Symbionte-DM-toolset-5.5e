/**
 * Funciones de sanitización comunes y seguras de texto para evitar errores de renderizado.
 */

// Normaliza el texto eliminando acentos y convirtiendo a minúsculas
export function normalizarTexto(texto: string): string {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Función auxiliar robusta para aplanar de forma segura cualquier estructura a string (previene error #31 de React)
export function aplanarValor(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map(aplanarValor).filter(Boolean).join("\n");
    }
    const valObj = val as Record<string, unknown>;
    if (valObj.nombre !== undefined) return aplanarValor(valObj.nombre);
    if (valObj.name !== undefined) return aplanarValor(valObj.name);
    if (valObj.index !== undefined) return aplanarValor(valObj.index);
    const keys = Object.keys(valObj);
    if (keys.length > 0) {
      for (const k of keys) {
        if (typeof valObj[k] === "string") return (valObj[k] as string).trim();
      }
      return aplanarValor(valObj[keys[0]]);
    }
  }
  return "";
}
