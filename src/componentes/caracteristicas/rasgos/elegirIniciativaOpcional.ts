import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { solicitarResultadoTirada } from "@/utiles/lanzadorDados";
import { resolverIniciativaOpcional } from "@/servicios/rasgos/iniciativaOpcionalRasgos";
import { resolverRasgoRecurso } from "@/servicios/rasgos/utilidadesRasgos";
import { elegirOpcionLanzamiento } from "./elegirVarianteConjuro";

const pendientes = new Set<string>();

export async function elegirIniciativaOpcional(id: string) {
  if (pendientes.has(id)) return;
  const estado = usarAlmacenDM.getState;
  const actual = () => estado().personajes.find(p => p.id === id);
  const opciones = actual()?.rasgos.filter(r => r.iniciativaOpcional) ?? [];
  if (!opciones.length) return { bono: 0, usada: false, confirmar: () => true };
  pendientes.add(id);
  try {
    const decisiones = opciones.flatMap(r => [true, false].map(antes => ({ id: `${r.id}:${antes ? "antes" : "despues"}`, texto: `${r.nombre} · Recuperar ${antes ? "antes" : "después"} de gastar`,
      deshabilitado: !actual() || !resolverIniciativaOpcional(actual()!, r.id, antes) })));
    const eleccion = await elegirOpcionLanzamiento(id, { nombre: "Iniciativa", etiqueta: "Elegir capacidad de iniciativa",
      descripcion: "Puedes gastar Inspiración y elegir el orden respecto a las recuperaciones. El mismo resultado del dado beneficia a los aliados elegibles; su aplicación es manual.",
      opciones: [{ id: "normal", texto: "Tirar sin gastar Inspiración" }, ...decisiones] });
    if (!eleccion) return;
    if (eleccion === "normal") return { bono: 0, usada: false, confirmar: () => true };
    const r = opciones.find(r => eleccion.startsWith(`${r.id}:`));
    const pj = actual();
    if (!r || !pj) return;
    const antes = eleccion.endsWith(":antes");
    if (!resolverIniciativaOpcional(pj, r.id, antes)) return;
    const recurso = resolverRasgoRecurso(r, pj.rasgos, "dados");
    if (!recurso?.formulaDados) return;
    const res = await solicitarResultadoTirada({ etiqueta: r.nombre, grupos: [{ nombre: r.nombre, formula: recurso.formulaDados }] });
    if (!actual() || !resolverIniciativaOpcional(actual()!, r.id, antes)) return;
    estado().agregarNotificacion(`${r.nombre}: +${res.totales[0]} a iniciativa. Usa este mismo resultado para los aliados elegibles.`, "info");
    return { bono: res.totales[0], usada: true, confirmar: () => estado().operarRecursoRasgoPersonaje(id, { tipo: "iniciativaOpcional", idRasgo: r.id, recuperarAntes: antes }) };
  } catch (error) {
    estado().agregarNotificacion(error instanceof Error ? error.message : "No se pudo preparar la iniciativa.", "error");
    return undefined;
  } finally { pendientes.delete(id); }
}
