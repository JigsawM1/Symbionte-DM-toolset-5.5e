import React from "react";
import type { ObjetoInventario, ObjetoJuego } from "@/tipos";
import { coincideBusquedaTolerante, compararPorRelevanciaTitulo } from "@/utiles/busquedaTolerante";
import { esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { esContenedorFisicoMunicion } from "@/servicios/gestorMunicion";
import { CONFIG_CONTENEDORES } from "@/servicios/calculadorInventario";
import type {
  CriterioOrdenMochila,
  SubseccionMochilaTipo
} from "@/componentes/caracteristicas/personajes/inventarioConstantes";
import {
  Sparkles,
  Package,
  Swords,
  FlaskConical,
  Target,
  Shield,
  Wrench
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
      [obj.nombre, obj.tipoPrincipal, obj.notas, obj.rareza, nombreContenedor],
      busquedaMochila
    );
  });

  return filtrada.sort(
    compararPorRelevanciaTitulo(
      (o) => o.nombre,
      busquedaMochila,
      (a, b) => a.nombre.localeCompare(b.nombre, "es"),
      (o) => [o.tipoPrincipal, o.notas, o.rareza]
    )
  );
}

/**
 * Obtiene el valor monetario en Piezas de Oro (PO) de un objeto buscando en la base de datos de compendio.
 */
export function obtenerValorPO(obj: ObjetoInventario, baseDatosObjetos: ObjetoJuego[]): number {
  const comp = baseDatosObjetos.find(
    (b) => b.id === obj.idObjeto || b.nombre.toLowerCase().trim() === obj.nombre.toLowerCase().trim()
  );
  return Number(comp?.valorPO) || 0;
}

/**
 * Clasifica los objetos de la mochila en 7 categorías semánticas para el modo de visualización "Por Tipo".
 */
export function clasificarMochilaPorTipo(
  objetosMochilaFiltrados: ObjetoInventario[],
  baseDatosObjetos: ObjetoJuego[]
): SubseccionMochilaTipo[] {
  const consumibles: ObjetoInventario[] = [];
  const municion: ObjetoInventario[] = [];
  const armas: ObjetoInventario[] = [];
  const armaduras: ObjetoInventario[] = [];
  const herramientas: ObjetoInventario[] = [];
  const magicos: ObjetoInventario[] = [];
  const equipo: ObjetoInventario[] = [];

  for (const obj of objetosMochilaFiltrados) {
    const comp = baseDatosObjetos.find(
      (b) => b.id === obj.idObjeto || b.nombre.toLowerCase().trim() === obj.nombre.toLowerCase().trim()
    );
    const sub = (comp?.subcategoria || "").toLowerCase();
    const nom = obj.nombre.toLowerCase().trim();

    const esMunicionOContenedor =
      sub.includes("municion") ||
      comp?.storage !== undefined ||
      esContenedorFisicoMunicion(nom) ||
      (obj.idObjeto && esContenedorFisicoMunicion(obj.idObjeto)) ||
      nom.includes("flecha") ||
      nom.includes("virote") ||
      nom.includes("carcaj") ||
      nom.includes("caja de virotes") ||
      nom.includes("bolsa de balas") ||
      nom.includes("cartuchera") ||
      nom.includes("bolsita") ||
      nom.includes("estuche de agujas") ||
      nom.includes("aguja") ||
      nom.includes("quiver");

    if (esMunicionOContenedor && obj.tipoPrincipal !== "Arma") {
      municion.push(obj);
      continue;
    }

    if (esObjetoConsumible(obj.nombre, obj.notas)) {
      consumibles.push(obj);
      continue;
    }

    if (obj.tipoPrincipal === "Arma") {
      armas.push(obj);
      continue;
    }

    if (obj.tipoPrincipal === "Armadura") {
      armaduras.push(obj);
      continue;
    }

    if (sub.includes("consumible") || sub.includes("pocion")) {
      consumibles.push(obj);
    } else if (
      sub.includes("herramienta") ||
      sub.includes("instrumento") ||
      sub.includes("juego") ||
      obj.nombre.toLowerCase().includes("herramientas") ||
      obj.nombre.toLowerCase().includes("kit")
    ) {
      herramientas.push(obj);
    } else if (obj.esMagico || obj.rareza !== "Común" || sub.includes("maravilloso")) {
      magicos.push(obj);
    } else {
      equipo.push(obj);
    }
  }

  const calcPeso = (lista: ObjetoInventario[]) =>
    Math.round(lista.reduce((acc, o) => acc + (o.pesoLb || 0) * (o.cantidad || 1), 0) * 100) / 100;

  return [
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
      titulo: "Munición y Contenedores (Carcaj)",
      icono: React.createElement(Target, { size: 13, color: "#38bdf8" }),
      color: "#38bdf8",
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
      titulo: "Armaduras y Escudos",
      icono: React.createElement(Shield, { size: 13, color: "#60a5fa" }),
      color: "#60a5fa",
      items: armaduras,
      pesoTotal: calcPeso(armaduras),
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
      id: "magicos",
      titulo: "Objetos Mágicos y Maravillosos",
      icono: React.createElement(Sparkles, { size: 13, color: "#c084fc" }),
      color: "#c084fc",
      items: magicos,
      pesoTotal: calcPeso(magicos),
      esContenedorEspecial: false
    },
    {
      id: "equipo",
      titulo: "Equipo de Aventuras y Varios",
      icono: React.createElement(Package, { size: 13, color: "#94a3b8" }),
      color: "#94a3b8",
      items: equipo,
      pesoTotal: calcPeso(equipo),
      esContenedorEspecial: false
    }
  ];
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

  const comparadorDesempate = (a: ObjetoInventario, b: ObjetoInventario): number => {
    switch (criterioOrden) {
      case "reciente":
        return 0;
      case "peso-desc":
        return (b.pesoLb || 0) * (b.cantidad || 1) - (a.pesoLb || 0) * (a.cantidad || 1);
      case "peso-asc":
        return (a.pesoLb || 0) * (a.cantidad || 1) - (b.pesoLb || 0) * (b.cantidad || 1);
      case "valor-desc":
        return obtenerValorPO(b, baseDatosObjetos) - obtenerValorPO(a, baseDatosObjetos);
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
        (o) => [o.tipoPrincipal, o.notas, o.rareza]
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
      return lista.sort((a, b) => obtenerValorPO(b, baseDatosObjetos) - obtenerValorPO(a, baseDatosObjetos));
    default:
      return lista;
  }
}
