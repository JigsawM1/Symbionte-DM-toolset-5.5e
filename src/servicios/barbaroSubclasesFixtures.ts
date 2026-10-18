import type { AtaquePersonajeCalculado, Caracteristica } from "@/tipos";

export function ataqueMock(caracteristica: Caracteristica): AtaquePersonajeCalculado {
  return { id:"prueba", nombre:"Ataque de prueba", tipo:"Desarmado", tipoAccion:"accion", caracteristicaUsada:caracteristica,
    bonoAtaque:5, dadoDano:"1", dadoDanoBase:"1", modificadorDano:3, esDanoFijo:true, tipoDano:"Contundente", propiedades:[], tieneTiradaAtaque:true };
}
