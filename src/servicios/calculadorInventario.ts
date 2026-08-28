import type {
  ObjetoInventario,
  BolsaMonedas,
  TamanoPersonaje,
  ObjetoJuego,
  Rareza,
  TipoContenedor
} from "@/tipos";
import { generarId } from "@/utiles/generarId";

/**
 * Configuración y metadatos de los contenedores especiales de D&D 5.5e.
 */
export const CONFIG_CONTENEDORES: Record<
  TipoContenedor,
  {
    clave: TipoContenedor;
    nombre: string;
    nombreCorto: string;
    descripcion: string;
    color: string;
    sumaCargaPersonaje: boolean;
  }
> = {
  mochila: {
    clave: "mochila",
    nombre: "Mochila / Encima",
    nombreCorto: "Mochila",
    descripcion: "Objetos transportados directamente por el personaje. Su peso suma a la capacidad de carga.",
    color: "#f59e0b",
    sumaCargaPersonaje: true
  },
  bolsa_contencion: {
    clave: "bolsa_contencion",
    nombre: "Bolsa de Contención (Bag of Holding)",
    nombreCorto: "Bolsa Contención",
    descripcion: "Espacio extradimensional. Los objetos dentro de la bolsa tienen peso 0 lb sobre el personaje.",
    color: "#c084fc",
    sumaCargaPersonaje: false
  },
  montura: {
    clave: "montura",
    nombre: "Montura / Carreta / Alforjas",
    nombreCorto: "Montura/Carreta",
    descripcion: "Transportado por tu montura, mula o carromato. No suma peso a la carga que llevas encima.",
    color: "#38bdf8",
    sumaCargaPersonaje: false
  },
  almacen: {
    clave: "almacen",
    nombre: "Almacén / Base / Fortaleza",
    nombreCorto: "Almacén",
    descripcion: "Guardado en tu base, posada, barco o campamento. No suma peso al personaje.",
    color: "#94a3b8",
    sumaCargaPersonaje: false
  }
};

/**
 * Multiplicadores de capacidad de carga según el tamaño de la criatura (D&D 5.5e):
 * - Diminuto: ×0.5 (la mitad de un mediano)
 * - Pequeño: ×0.75 (tres cuartos)
 * - Mediano: ×1 (estándar)
 * - Grande: ×2 (doble)
 */
export const MULTIPLICADORES_TAMANO: Record<TamanoPersonaje, number> = {
  Diminuto: 0.5,
  Pequeño: 0.75,
  Mediano: 1,
  Grande: 2
};

/**
 * Calcula la capacidad de carga máxima en libras (lb) considerando:
 * Fuerza efectiva (override o base) × 15 lb × Multiplicador de tamaño.
 */
export function calcularCapacidadCarga(
  fuerzaBase: number,
  overrideFuerza: number | null = null,
  tamano: TamanoPersonaje = "Mediano"
): number {
  const fuerzaEfectiva =
    overrideFuerza !== null && overrideFuerza !== undefined ? overrideFuerza : fuerzaBase;
  const mult = MULTIPLICADORES_TAMANO[tamano] ?? 1;
  const capacidad = Math.max(1, fuerzaEfectiva * 15 * mult);
  return Math.round(capacidad * 10) / 10;
}

/**
 * Calcula el peso total en libras de los objetos en el inventario.
 * Si `soloCargaPersonaje` es true (por defecto), omite los objetos en contenedores especiales
 * (Bolsa de Contención, Montura/Carreta, Almacén) a menos que estén explícitamente equipados.
 */
export function calcularPesoInventario(
  inventario: ObjetoInventario[],
  soloCargaPersonaje: boolean = true
): number {
  if (!inventario || inventario.length === 0) return 0;
  const suma = inventario.reduce((acc, obj) => {
    // Si solo contamos lo que lleva el personaje encima:
    if (soloCargaPersonaje && !obj.equipado) {
      const contenedor = obj.contenedor || "mochila";
      if (contenedor !== "mochila") {
        return acc; // Peso 0 lb sobre la carga del personaje
      }
    }

    const peso = Number(obj.pesoLb) || 0;
    const cant = Number(obj.cantidad) || 1;
    return acc + peso * cant;
  }, 0);
  return Math.round(suma * 100) / 100;
}

/**
 * Calcula el desglose detallado de pesos por cada contenedor del personaje.
 */
export function calcularDesglosePesosPorContenedor(inventario: ObjetoInventario[]): {
  mochilaYEquipados: number;
  bolsaContencion: number;
  montura: number;
  almacen: number;
  totalRealFisico: number;
} {
  let mochilaYEquipados = 0;
  let bolsaContencion = 0;
  let montura = 0;
  let almacen = 0;

  for (const obj of inventario || []) {
    const peso = (Number(obj.pesoLb) || 0) * (Number(obj.cantidad) || 1);
    if (obj.equipado || !obj.contenedor || obj.contenedor === "mochila") {
      mochilaYEquipados += peso;
    } else if (obj.contenedor === "bolsa_contencion") {
      bolsaContencion += peso;
    } else if (obj.contenedor === "montura") {
      montura += peso;
    } else if (obj.contenedor === "almacen") {
      almacen += peso;
    }
  }

  return {
    mochilaYEquipados: Math.round(mochilaYEquipados * 100) / 100,
    bolsaContencion: Math.round(bolsaContencion * 100) / 100,
    montura: Math.round(montura * 100) / 100,
    almacen: Math.round(almacen * 100) / 100,
    totalRealFisico: Math.round((mochilaYEquipados + bolsaContencion + montura + almacen) * 100) / 100
  };
}

/**
 * Calcula el peso en libras de las monedas transportadas.
 * Regla oficial D&D 5e/5.5e: 50 monedas = 1 libra (0.02 lb por moneda).
 */
export function calcularPesoMonedas(monedas: BolsaMonedas): number {
  if (!monedas) return 0;
  const totalMonedas =
    (monedas.pc || 0) +
    (monedas.pp || 0) +
    (monedas.pe || 0) +
    (monedas.po || 0) +
    (monedas.ppt || 0);
  return Math.round((totalMonedas / 50) * 100) / 100;
}

/**
 * Calcula el peso total que cuenta para la capacidad de carga del personaje (objetos encima + monedas).
 */
export function calcularPesoTotal(
  inventario: ObjetoInventario[],
  monedas: BolsaMonedas
): number {
  const pesoObjs = calcularPesoInventario(inventario, true);
  const pesoMons = calcularPesoMonedas(monedas);
  return Math.round((pesoObjs + pesoMons) * 100) / 100;
}

/**
 * Determina si el personaje ha sobrepasado su capacidad de carga máxima.
 */
export function estaSobrecargado(pesoTotal: number, capacidad: number): boolean {
  return pesoTotal > capacidad;
}

/**
 * Calcula el valor equivalente en Piezas de Oro (PO) de toda la bolsa de monedas:
 * - 1 PC = 0.01 PO
 * - 1 PP = 0.1 PO
 * - 1 PE = 0.5 PO
 * - 1 PO = 1.0 PO
 * - 1 PPT = 10.0 PO
 */
export function calcularEquivalentePO(monedas: BolsaMonedas): number {
  if (!monedas) return 0;
  const totalPO =
    (monedas.pc || 0) / 100 +
    (monedas.pp || 0) / 10 +
    (monedas.pe || 0) / 2 +
    (monedas.po || 0) +
    (monedas.ppt || 0) * 10;
  return Math.round(totalPO * 100) / 100;
}

/**
 * Evalúa operaciones aritméticas en inputs de monedas:
 * - Soporta deltas directos: "+20", "-15", "+ 50"
 * - Soporta sumas y restas: "10 + 5", "100 - 30"
 * - Soporta asignación directa: "45"
 * - Asegura siempre un resultado entero no negativo (>= 0).
 */
export function evaluarOperacionMoneda(valorActual: number, entrada: string): number {
  const texto = entrada.trim();
  if (!texto) return valorActual;

  // Caso 1: Delta con prefijo + o - (+10, -5)
  if (texto.startsWith("+")) {
    const num = parseFloat(texto.substring(1).trim());
    if (Number.isNaN(num)) return valorActual;
    return Math.max(0, Math.round(valorActual + num));
  }
  if (texto.startsWith("-")) {
    const num = parseFloat(texto.substring(1).trim());
    if (Number.isNaN(num)) return valorActual;
    return Math.max(0, Math.round(valorActual - num));
  }

  // Caso 2: Expresión con sumas y restas intermedias (ej: "50 + 20", "100 - 30 + 5")
  if (texto.includes("+") || texto.includes("-")) {
    const tokens = texto.match(/([+-]?\s*\d+(\.\d+)?)/g);
    if (tokens && tokens.length > 0) {
      let acumulado = 0;
      for (const token of tokens) {
        const num = parseFloat(token.replace(/\s+/g, ""));
        if (!Number.isNaN(num)) {
          acumulado += num;
        }
      }
      return Math.max(0, Math.round(acumulado));
    }
  }

  // Caso 3: Asignación directa de número entero
  const parsed = parseFloat(texto);
  if (Number.isNaN(parsed)) return valorActual;
  return Math.max(0, Math.round(parsed));
}

/**
 * Cuenta cuántos objetos están actualmente sintonizados por el personaje.
 */
export function contarSintonizaciones(inventario: ObjetoInventario[]): number {
  if (!inventario) return 0;
  return inventario.filter((o) => o.sintonizado).length;
}

/**
 * Valida si un objeto puede ser sintonizado (requiere sintonización y hay menos de 3 activas).
 */
export function puedeSintonizar(
  objeto: ObjetoInventario,
  totalSintonizados: number
): boolean {
  if (!objeto.sintonizacionRequerida) return false;
  if (objeto.sintonizado) return true; // Si ya está sintonizado, se puede des-sintonizar
  return totalSintonizados < 3;
}

/**
 * Factory para crear una instancia de inventario a partir de un ObjetoJuego del compendio.
 * Si el objeto en el compendio se adquiere en lote/pack (ej. Flechas ×20, Balas ×20, Agujas ×50),
 * se asigna la cantidad individual total (lotes * unidadesPorLote) y el peso unitario real por ítem.
 */
export function crearObjetoInventarioDesdeCompendio(
  objetoJuego: ObjetoJuego,
  cantidadLotes: number = 1
): ObjetoInventario {
  const rarezaValida: Rareza = (objetoJuego.rareza as Rareza) || "Común";
  const cargas = objetoJuego.cargas !== undefined ? Number(objetoJuego.cargas) : undefined;

  const unidadesPorLote =
    objetoJuego.quantity && objetoJuego.quantity > 1
      ? Number(objetoJuego.quantity)
      : 1;

  const cantidadTotal = Math.max(1, Math.floor(cantidadLotes * unidadesPorLote));

  const pesoUnitarioReal =
    objetoJuego.pesoUnitario !== undefined
      ? objetoJuego.pesoUnitario
      : unidadesPorLote > 1 && (objetoJuego.pesoLb || 0) > 0
      ? Math.round(((objetoJuego.pesoLb || 0) / unidadesPorLote) * 1000) / 1000
      : Number(objetoJuego.pesoLb) || 0;

  return {
    idInstancia: generarId("inv"),
    idObjeto: objetoJuego.id,
    nombre: objetoJuego.nombre,
    cantidad: cantidadTotal,
    equipado: false,
    sintonizado: false,
    notas: "",
    contenedor: "mochila",
    pesoLb: pesoUnitarioReal,
    tipoPrincipal: objetoJuego.tipoPrincipal,
    esMagico: Boolean(objetoJuego.esMagico),
    rareza: rarezaValida,
    equipable: Boolean(objetoJuego.equipable),
    sintonizacionRequerida: Boolean(objetoJuego.sintonizacionRequerida),
    cargasMaximas: cargas,
    cargasActuales: cargas
  };
}

/**
 * Factory para crear un objeto personalizado en el inventario.
 */
export function crearObjetoInventarioCustom(datos: {
  nombre: string;
  pesoLb?: number;
  cantidad?: number;
  tipoPrincipal?: "Arma" | "Armadura" | "Equipo de Aventuras";
  equipable?: boolean;
  sintonizacionRequerida?: boolean;
  esMagico?: boolean;
  rareza?: Rareza;
  cargasMaximas?: number;
  notas?: string;
  contenedor?: TipoContenedor;
}): ObjetoInventario {
  const nombreLimpio = datos.nombre.trim() || "Objeto Personalizado";
  const cargas = datos.cargasMaximas !== undefined ? Math.max(0, datos.cargasMaximas) : undefined;

  return {
    idInstancia: generarId("inv"),
    idObjeto: generarId("obj_custom"),
    nombre: nombreLimpio,
    cantidad: Math.max(1, Math.floor(datos.cantidad || 1)),
    equipado: false,
    sintonizado: false,
    notas: datos.notas || "",
    contenedor: datos.contenedor || "mochila",
    pesoLb: Math.max(0, Number(datos.pesoLb) || 0),
    tipoPrincipal: datos.tipoPrincipal || "Equipo de Aventuras",
    esMagico: Boolean(datos.esMagico),
    rareza: datos.rareza || "Común",
    equipable: Boolean(datos.equipable),
    sintonizacionRequerida: Boolean(datos.sintonizacionRequerida),
    cargasMaximas: cargas,
    cargasActuales: cargas
  };
}

/**
 * Desempaqueta un paquete de equipo (ej. Paquete de Explorador, Carcaj) extrayendo
 * todos sus contenidos (`contents`) hacia la mochila y eliminando el paquete abstracto
 * original para no duplicar peso ni generar ítems residuales.
 */
export function desempaquetarPaqueteInventario(
  inventarioActual: ObjetoInventario[],
  idInstancia: string,
  baseDatosObjetos: ObjetoJuego[]
): ObjetoInventario[] {
  const objTarget = inventarioActual.find((o) => o.idInstancia === idInstancia);
  if (!objTarget) return inventarioActual;

  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Buscar objeto en la base de datos compendio
  const objetoCompendio = baseDatosObjetos.find(
    (b) =>
      b.id === objTarget.idObjeto ||
      normalizar(b.nombre) === normalizar(objTarget.nombre)
  );

  const contents = objetoCompendio?.contents || (objTarget as any).contents;
  if (!Array.isArray(contents) || contents.length === 0) {
    return inventarioActual;
  }

  const cantidadPaquetes = Math.max(1, objTarget.cantidad || 1);
  let nuevoInventario = inventarioActual.filter((o) => o.idInstancia !== idInstancia);

  for (const c of contents) {
    if (!c || !c.item) continue;
    const itemIndex = c.item.index || "";
    const itemName = c.item.name || "";
    const itemQty = (Number(c.quantity) || 1) * cantidadPaquetes;

    // Buscar si existe el ítem en la base de datos de objetos
    const itemComp = baseDatosObjetos.find(
      (b) =>
        (itemIndex && b.id === itemIndex) ||
        normalizar(b.nombre) === normalizar(itemName)
    );

    let nuevoObj: ObjetoInventario;
    if (itemComp) {
      nuevoObj = crearObjetoInventarioDesdeCompendio(itemComp, itemQty);
    } else {
      nuevoObj = crearObjetoInventarioCustom({
        nombre: itemName,
        cantidad: itemQty
      });
    }

    // Fusionar con stack existente en mochila si coincide
    const indiceExistente = nuevoInventario.findIndex(
      (o) =>
        !o.equipado &&
        (o.contenedor || "mochila") === "mochila" &&
        ((o.idObjeto &&
          nuevoObj.idObjeto &&
          !o.idObjeto.startsWith("obj_custom") &&
          !nuevoObj.idObjeto.startsWith("obj_custom") &&
          o.idObjeto === nuevoObj.idObjeto) ||
          (normalizar(o.nombre) === normalizar(nuevoObj.nombre) &&
            o.tipoPrincipal === nuevoObj.tipoPrincipal))
    );

    if (indiceExistente !== -1) {
      nuevoInventario = nuevoInventario.map((o, idx) =>
        idx === indiceExistente
          ? { ...o, cantidad: (o.cantidad || 1) + itemQty }
          : o
      );
    } else {
      nuevoInventario.push(nuevoObj);
    }
  }

  return nuevoInventario;
}

