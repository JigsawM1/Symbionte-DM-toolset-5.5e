import type { PersonajeJugador, RasgoPersonaje } from "@/tipos";
import { resolverExtensionesRasgos } from "./extensionesRasgos";
import { esRasgoHabilitadoPorOpcion } from "./utilidadesRasgos";
import { obtenerNivelEfectivoParaRasgo } from "../clases/catalogoClases";

type ConfiguracionTabla = NonNullable<RasgoPersonaje["tablaAleatoria"]>;
export type FilaTablaRasgo = NonNullable<ConfiguracionTabla["filas"]>[number];

export interface TablaRasgoResuelta {
  rasgoTabla: RasgoPersonaje;
  rasgoAccion: RasgoPersonaje;
  configuracion: ConfiguracionTabla & { filas: FilaTablaRasgo[] };
  filasCompletas: FilaTablaRasgo[];
  disponible: boolean;
  motivoBloqueo?: string;
}

function motivoRasgoNoDisponible(pj: PersonajeJugador, r: RasgoPersonaje) {
  if (obtenerNivelEfectivoParaRasgo(pj, r) < (r.nivelRequerido ?? 1)
    || !esRasgoHabilitadoPorOpcion(r, pj.rasgos) || (r.activo === false && !r.esActivable)) return "El rasgo no está disponible.";
  return undefined;
}

/** Una referencia apunta a una tabla con filas propias; no admite cadenas ni autorreferencias. */
function resolverTablaEfectiva(pj: PersonajeJugador, rasgos: RasgoPersonaje[], idRasgo: string): TablaRasgoResuelta | undefined {
  const solicitado = rasgos.find(r => r.id === idRasgo);
  const cfg = solicitado?.tablaAleatoria;
  if (!solicitado || !cfg) return;
  const rasgoTabla = cfg.idRasgoTabla ? rasgos.find(r => r.id === cfg.idRasgoTabla && r.id !== solicitado.id) : solicitado;
  const base = rasgoTabla?.tablaAleatoria;
  if (!rasgoTabla || !base?.filas?.length || base.idRasgoTabla) return;
  if (new Set(base.filas.map(f => f.id)).size !== base.filas.length) return;
  const consulta = cfg.modo === "consultar";
  if (consulta && !cfg.idRasgoTabla) return;
  const rasgoAccion = consulta ? rasgoTabla : solicitado;
  const configuracion = consulta ? { ...base } : {
    ...base, ...cfg,
    presentacion: cfg.presentacion ?? base.presentacion,
    dado: base.dado,
    tiradas: cfg.idRasgoTabla && cfg.modo !== "elegir" ? base.tiradas : cfg.tiradas
  };
  if (configuracion.presentacion === "magia_salvaje" && configuracion.dado !== 100) return;
  configuracion.filas = configuracion.excluirUltima ? base.filas.slice(0, -1) : base.filas;
  const restantes = rasgoAccion.usosRestantes ?? rasgoAccion.usosMaximos ?? 0;
  const recarga = configuracion.modo === "recargar";
  const sinUsos = recarga
    ? !rasgoAccion.tieneUsosLimitados || rasgoAccion.activo || restantes >= (rasgoAccion.usosMaximos ?? 1)
    : rasgoAccion.tieneUsosLimitados && restantes < 1;
  const motivoBloqueo = motivoRasgoNoDisponible(pj, rasgoTabla) ?? motivoRasgoNoDisponible(pj, rasgoAccion)
    ?? motivoRasgoNoDisponible(pj, solicitado)
    ?? (sinUsos ? recarga ? "El recurso no necesita recarga." : "No quedan usos disponibles." : undefined);
  return { rasgoTabla, rasgoAccion, configuracion: { ...configuracion, filas: configuracion.filas },
    filasCompletas: base.filas, disponible: !motivoBloqueo, motivoBloqueo };
}

export function resolverTablaRasgo(pj: PersonajeJugador, idRasgo: string) {
  return resolverTablaEfectiva(pj, resolverExtensionesRasgos(pj.rasgos, pj.nivel ?? 1), idRasgo);
}

export function obtenerTablaRasgo(pj: PersonajeJugador, r: RasgoPersonaje) {
  return resolverTablaRasgo(pj, r.id)?.configuracion;
}

/** Acciones ejecutables de una misma tabla. Consultar es solo otro acceso a la acción base. */
export function obtenerAccionesTabla(pj: PersonajeJugador, idTabla: string) {
  const rasgos = resolverExtensionesRasgos(pj.rasgos, pj.nivel ?? 1);
  return rasgos.filter(r => r.tablaAleatoria && r.tablaAleatoria.modo !== "consultar")
    .flatMap(r => {
      const tabla = resolverTablaEfectiva(pj, rasgos, r.id);
      return tabla?.rasgoTabla.id === idTabla ? [tabla] : [];
    });
}

/** Conserva el propietario original del estado histórico, incluidos accesos de consulta. */
export function obtenerRasgosVinculadosTabla(pj: PersonajeJugador, idTabla: string) {
  return pj.rasgos.filter(r => r.categoriaMecanica !== "extension"
    && (r.id === idTabla || r.tablaAleatoria?.idRasgoTabla === idTabla));
}

/** Azar inyectable: las subtiradas solo se resuelven después de elegir la fila definitiva. */
export function tirarFilasTabla(cfg: ConfiguracionTabla, azar = Math.random): { tirada: number; fila: FilaTablaRasgo }[] {
  return Array.from({ length: cfg.tiradas }, () => {
    const tirada = 1 + Math.floor(azar() * cfg.dado);
    const fila = cfg.filas?.find(f => tirada >= f.desde && tirada <= f.hasta);
    if (!fila) throw new Error("La tabla no cubre el resultado obtenido.");
    return { tirada, fila };
  });
}

export function resolverFilaTabla(fila: FilaTablaRasgo, azar = Math.random): string {
  let primero: number | undefined;
  const resultados: string[] = [];
  for (const s of fila.subtiradas ?? []) {
    if (s.siResultado !== undefined && s.siResultado !== primero) continue;
    const [cantidad, caras] = s.formula.split("d").map(Number);
    if (cantidad < 1 || cantidad > 100 || caras < 2 || caras > 100) throw new Error("Fórmula de subtirada inválida.");
    const valores = Array.from({ length: cantidad }, () => 1 + Math.floor(azar() * caras));
    const total = valores.reduce((a, b) => a + b, 0);
    primero ??= total;
    resultados.push(`${s.formula}: ${valores.join(" + ")} = ${total}`);
  }
  return `${fila.desde}–${fila.hasta}: ${fila.texto}${resultados.length ? `\nSubtiradas: ${resultados.join("; ")}` : ""}`;
}
