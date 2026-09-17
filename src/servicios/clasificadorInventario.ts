import React from "react";
import type {
  ObjetoInventario,
  ObjetoJuego,
  CriterioOrdenMochila,
  SubseccionMochilaTipo
} from "@/tipos";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import { CONFIG_CONTENEDORES } from "@/servicios/calculadorInventario";
import {
  Sparkles,
  Package,
  Swords,
  FlaskConical,
  Crosshair,
  Shield,
  Wrench,
  PackageOpen,
  Wand2,
  Backpack
} from "lucide-react";

/**
 * Filtra una lista de objetos de inventario mediante búsqueda difusa tolerante
 * priorizando coincidencias en el título del objeto.
 */
export function filtrarListaInventarioTolerante(
  lista: ObjetoInventario[],
  busquedaMochila: string
): ObjetoInventario[] {
  if (!busquedaMochila || !busquedaMochila.trim()) {
    return lista;
  }
  const filtrada = lista.filter((obj) => {
    const nombreContenedor = obj.contenedor ? (CONFIG_CONTENEDORES[obj.contenedor]?.nombre || "") : "";
    return coincideBusquedaTolerante(
      [obj.nombre, obj.categoria, obj.subcategoria, obj.notas, obj.rareza, nombreContenedor],
      busquedaMochila
    );
  });

  return filtrada.sort(
    compararPorRelevanciaTitulo(
      (o) => o.nombre,
      busquedaMochila,
      (a, b) => a.nombre.localeCompare(b.nombre, "es"),
      (o) => [o.categoria, o.subcategoria, o.notas, o.rareza]
    )
  );
}

/**
 * Construye un mapa optimizado O(1) indexando objetos por ID y por nombre normalizado
 * para consultas instantáneas de valor monetario.
 */
export function construirMapaValoresPO(baseDatosObjetos: ObjetoJuego[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const b of baseDatosObjetos) {
    const valor = Number(b.valorPO) || 0;
    if (b.id) {
      mapa.set(b.id, valor);
    }
    if (b.nombre) {
      mapa.set(b.nombre.toLowerCase().trim(), valor);
    }
  }
  return mapa;
}

/**
 * Obtiene el valor monetario en Piezas de Oro (PO) de un objeto buscando en la base de datos de compendio.
 * Si se proporciona un mapaValores precalculado, la consulta se resuelve en tiempo O(1).
 */
export function obtenerValorPO(
  obj: ObjetoInventario,
  baseDatosObjetos: ObjetoJuego[],
  mapaValores?: Map<string, number>
): number {
  if (mapaValores) {
    if (obj.idObjeto && mapaValores.has(obj.idObjeto)) {
      return mapaValores.get(obj.idObjeto) || 0;
    }
    const norm = obj.nombre.toLowerCase().trim();
    if (mapaValores.has(norm)) {
      return mapaValores.get(norm) || 0;
    }
    return 0;
  }

  const comp = baseDatosObjetos.find(
    (b) => b.id === obj.idObjeto || b.nombre.toLowerCase().trim() === obj.nombre.toLowerCase().trim()
  );
  return Number(comp?.valorPO) || 0;
}

/**
 * Clasifica los objetos de la mochila por su categoría oficial de D&D 5.5e
 * y retorna únicamente las subsecciones que contengan al menos un ítem.
 */
export function clasificarMochilaPorTipo(
  objetosMochilaFiltrados: ObjetoInventario[],
  _baseDatosObjetos: ObjetoJuego[]
): SubseccionMochilaTipo[] {
  const consumibles: ObjetoInventario[] = [];
  const municion: ObjetoInventario[] = [];
  const armas: ObjetoInventario[] = [];
  const armaduras: ObjetoInventario[] = [];
  const escudos: ObjetoInventario[] = [];
  const herramientas: ObjetoInventario[] = [];
  const focosMagicos: ObjetoInventario[] = [];
  const contenedores: ObjetoInventario[] = [];
  const paquetes: ObjetoInventario[] = [];
  const magicos: ObjetoInventario[] = [];
  const equipo: ObjetoInventario[] = [];

  for (const obj of objetosMochilaFiltrados) {
    if (obj.categoria === "armas") {
      armas.push(obj);
    } else if (obj.categoria === "armaduras") {
      armaduras.push(obj);
    } else if (obj.categoria === "escudos") {
      escudos.push(obj);
    } else if (obj.categoria === "consumibles" || obj.esConsumible) {
      consumibles.push(obj);
    } else if (obj.categoria === "municion") {
      municion.push(obj);
    } else if (obj.categoria === "herramientas") {
      herramientas.push(obj);
    } else if (obj.categoria === "focos-magicos") {
      focosMagicos.push(obj);
    } else if (obj.categoria === "contenedores") {
      contenedores.push(obj);
    } else if (obj.categoria === "paquetes-equipo") {
      paquetes.push(obj);
    } else if (obj.categoria === "objetos-magicos" || obj.esMagico) {
      magicos.push(obj);
    } else {
      equipo.push(obj);
    }
  }

  const calcPeso = (lista: ObjetoInventario[]) =>
    Math.round(lista.reduce((acc, o) => acc + (o.pesoLb || 0) * (o.cantidad || 1), 0) * 100) / 100;

  const todasSubsecciones: SubseccionMochilaTipo[] = [
    {
      id: "consumibles",
      titulo: "Consumibles y Pociones",
      icono: React.createElement(FlaskConical, { size: 13, color: "#10b981" }),
      color: "#10b981",
      items: consumibles,
      pesoTotal: calcPeso(consumibles),
      esContenedorEspecial: false
    },
    {
      id: "municion",
      titulo: "Munición",
      icono: React.createElement(Crosshair, { size: 13, color: "#06b6d4" }),
      color: "#06b6d4",
      items: municion,
      pesoTotal: calcPeso(municion),
      esContenedorEspecial: false
    },
    {
      id: "armas",
      titulo: "Armas en Reserva",
      icono: React.createElement(Swords, { size: 13, color: "#f87171" }),
      color: "#f87171",
      items: armas,
      pesoTotal: calcPeso(armas),
      esContenedorEspecial: false
    },
    {
      id: "armaduras",
      titulo: "Armaduras",
      icono: React.createElement(Shield, { size: 13, color: "#60a5fa" }),
      color: "#60a5fa",
      items: armaduras,
      pesoTotal: calcPeso(armaduras),
      esContenedorEspecial: false
    },
    {
      id: "escudos",
      titulo: "Escudos",
      icono: React.createElement(Shield, { size: 13, color: "#38bdf8" }),
      color: "#38bdf8",
      items: escudos,
      pesoTotal: calcPeso(escudos),
      esContenedorEspecial: false
    },
    {
      id: "herramientas",
      titulo: "Herramientas e Instrumentos",
      icono: React.createElement(Wrench, { size: 13, color: "#f59e0b" }),
      color: "#f59e0b",
      items: herramientas,
      pesoTotal: calcPeso(herramientas),
      esContenedorEspecial: false
    },
    {
      id: "focos-magicos",
      titulo: "Focos Mágicos y Símbolos Sagrados",
      icono: React.createElement(Sparkles, { size: 13, color: "#c084fc" }),
      color: "#c084fc",
      items: focosMagicos,
      pesoTotal: calcPeso(focosMagicos),
      esContenedorEspecial: false
    },
    {
      id: "contenedores",
      titulo: "Contenedores y Almacenaje",
      icono: React.createElement(Package, { size: 13, color: "#eab308" }),
      color: "#eab308",
      items: contenedores,
      pesoTotal: calcPeso(contenedores),
      esContenedorEspecial: false
    },
    {
      id: "paquetes-equipo",
      titulo: "Paquetes de Equipo",
      icono: React.createElement(PackageOpen, { size: 13, color: "#a855f7" }),
      color: "#a855f7",
      items: paquetes,
      pesoTotal: calcPeso(paquetes),
      esContenedorEspecial: false
    },
    {
      id: "magicos",
      titulo: "Objetos Mágicos y Maravillosos",
      icono: React.createElement(Wand2, { size: 13, color: "#ec4899" }),
      color: "#ec4899",
      items: magicos,
      pesoTotal: calcPeso(magicos),
      esContenedorEspecial: false
    },
    {
      id: "equipo",
      titulo: "Equipo de Aventuras y Varios",
      icono: React.createElement(Backpack, { size: 13, color: "#94a3b8" }),
      color: "#94a3b8",
      items: equipo,
      pesoTotal: calcPeso(equipo),
      esContenedorEspecial: false
    }
  ];

  // Retornar las subsecciones que tengan items
  const activas = todasSubsecciones.filter((s) => s.items.length > 0);
  return activas.length > 0 ? activas : [todasSubsecciones[todasSubsecciones.length - 1]];
}

/**
 * Ordena la lista de objetos de la mochila de manera plana según el criterio seleccionado.
 */
export function ordenarInventarioPlano(
  objetosMochilaFiltrados: ObjetoInventario[],
  criterioOrden: CriterioOrdenMochila,
  busquedaMochila: string,
  baseDatosObjetos: ObjetoJuego[]
): ObjetoInventario[] {
  const lista = [...objetosMochilaFiltrados];
  const mapaValores = criterioOrden === "valor-desc" ? construirMapaValoresPO(baseDatosObjetos) : undefined;

  const comparadorDesempate = (a: ObjetoInventario, b: ObjetoInventario): number => {
    switch (criterioOrden) {
      case "reciente":
        return 0;
      case "peso-desc":
        return (b.pesoLb || 0) * (b.cantidad || 1) - (a.pesoLb || 0) * (a.cantidad || 1);
      case "peso-asc":
        return (a.pesoLb || 0) * (a.cantidad || 1) - (b.pesoLb || 0) * (b.cantidad || 1);
      case "valor-desc":
        return obtenerValorPO(b, baseDatosObjetos, mapaValores) - obtenerValorPO(a, baseDatosObjetos, mapaValores);
      case "nombre-asc":
      default:
        return a.nombre.localeCompare(b.nombre, "es");
    }
  };

  if (busquedaMochila && busquedaMochila.trim()) {
    return lista.sort(
      compararPorRelevanciaTitulo(
        (o) => o.nombre,
        busquedaMochila,
        comparadorDesempate,
        (o) => [o.categoria, o.subcategoria, o.notas, o.rareza]
      )
    );
  }

  switch (criterioOrden) {
    case "personalizado":
      return lista;
    case "reciente":
      return lista.reverse();
    case "peso-desc":
      return lista.sort(
        (a, b) => (b.pesoLb || 0) * (b.cantidad || 1) - (a.pesoLb || 0) * (a.cantidad || 1)
      );
    case "peso-asc":
      return lista.sort(
        (a, b) => (a.pesoLb || 0) * (a.cantidad || 1) - (b.pesoLb || 0) * (b.cantidad || 1)
      );
    case "nombre-asc":
      return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    case "valor-desc":
      return lista.sort((a, b) => obtenerValorPO(b, baseDatosObjetos, mapaValores) - obtenerValorPO(a, baseDatosObjetos, mapaValores));
    default:
      return lista;
  }
}
