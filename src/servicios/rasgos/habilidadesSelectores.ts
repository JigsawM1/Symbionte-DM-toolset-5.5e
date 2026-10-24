import type { PersonajeJugador, SelectorRasgo, Habilidad } from "@/tipos";
import { obtenerCompetenciasExtraRasgos } from "./evaluadorSalvacionesRasgos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";
import { esRasgoHabilitadoPorOpcion, estaRasgoActivo } from "./utilidadesRasgos";

/** Excluye las aportaciones del propio selector al comprobar su competencia previa. */
export function habilidadElegible(selector: SelectorRasgo, id: string, pj?: PersonajeJugador): boolean {
  const filtro = selector.filtroHabilidades;
  if (!filtro) return true;
  if (!pj) return false;
  const contexto = { ...pj, rasgos: pj.rasgos.map(r => ({ ...r,
    selectores: r.selectores?.filter(s => !s.filtroHabilidades)
  })) };
  const extras = obtenerCompetenciasExtraRasgos(contexto);
  const habilidad = id as Habilidad;
  const grado = pj.gradosHabilidades[habilidad] ?? "ninguna";
  if (filtro.soloCompetentes && grado !== "competente" && grado !== "pericia" && !extras.habilidades.includes(habilidad)) return false;
  if (!filtro.excluirPericia) return true;
  if (grado === "pericia" || extras.pericias.includes(habilidad)) return false;
  return !pj.rasgos.some(r => r.activo !== false && obtenerNivelEfectivoParaRasgo(pj, r) >= (r.nivelRequerido ?? 1)
    && esRasgoHabilitadoPorOpcion(r, pj.rasgos) && (!r.ligadoA || r.gastarDePadre || estaRasgoActivo(pj, r.ligadoA))
    && r.selectores?.some(s => s.id !== selector.id && s.filtroHabilidades?.excluirPericia && s.valorActual.includes(id)));
}
