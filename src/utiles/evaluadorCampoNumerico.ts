export interface ReglasCampoNumerico {
  tipo?: "entero" | "decimal";
  min?: number;
  max?: number;
}

export type ResultadoCampoNumerico =
  | { estado: "valido"; valor: number; operacion: "asignacion" | "incremento" }
  | { estado: "vacio" }
  | { estado: "invalido"; mensaje: string };

/** Analiza toda la entrada. Las expresiones nunca se ejecutan como código. */
export function evaluarCampoNumerico(
  entrada: string,
  valorActual: number,
  reglas: ReglasCampoNumerico = {}
): ResultadoCampoNumerico {
  const texto = entrada.trim();
  if (!texto) return { estado: "vacio" };
  const asignacion = texto.startsWith("=");
  const expresion = (asignacion ? texto.slice(1) : texto).replace(/,/g, ".");
  const operacion = !asignacion && /^[+-]/.test(texto) ? "incremento" : "asignacion";
  let posicion = 0;
  let profundidad = 0;
  const espacios = () => { while (/\s/.test(expresion[posicion] ?? "") && posicion < expresion.length) posicion++; };
  const tomar = (signo: string) => {
    espacios();
    if (expresion[posicion] !== signo) return false;
    posicion++;
    return true;
  };
  const factor = (): number => {
    if (++profundidad > 64) throw new Error("La expresión es demasiado compleja.");
    let valor: number;
    if (tomar("+")) valor = factor();
    else if (tomar("-")) valor = -factor();
    else if (tomar("(")) {
      valor = suma();
      if (!tomar(")")) throw new Error("Falta cerrar un paréntesis.");
    } else {
      espacios();
      const numero = /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(expresion.slice(posicion));
      if (!numero) throw new Error("Escribe un número o una operación válida.");
      posicion += numero[0].length;
      valor = Number(numero[0]);
    }
    profundidad--;
    if (!Number.isFinite(valor)) throw new Error("El resultado debe ser un número finito.");
    return valor;
  };
  const producto = (): number => {
    let valor = factor();
    while (true) {
      if (tomar("*")) valor *= factor();
      else if (tomar("/")) {
        const divisor = factor();
        if (divisor === 0) throw new Error("No se puede dividir entre cero.");
        valor /= divisor;
      } else return valor;
    }
  };
  const suma = (): number => {
    let valor = producto();
    while (true) {
      if (tomar("+")) valor += producto();
      else if (tomar("-")) valor -= producto();
      else return valor;
    }
  };
  try {
    let valor = suma();
    espacios();
    if (posicion !== expresion.length) throw new Error("La entrada contiene texto u operadores no válidos.");
    if (operacion === "incremento") valor += valorActual;
    if (!Number.isFinite(valor)) throw new Error("El resultado debe ser un número finito.");
    if (reglas.tipo !== "decimal") valor = Math.round(valor);
    if (reglas.min !== undefined) valor = Math.max(reglas.min, valor);
    if (reglas.max !== undefined) valor = Math.min(reglas.max, valor);
    if (!Number.isFinite(valor)) throw new Error("Los límites del campo deben ser finitos.");
    return { estado: "valido", valor: Object.is(valor, -0) ? 0 : valor, operacion };
  } catch (error) {
    return { estado: "invalido", mensaje: error instanceof Error ? error.message : "Operación inválida." };
  }
}
