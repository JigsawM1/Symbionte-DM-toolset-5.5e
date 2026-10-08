import { EsquemaRasgoPersonaje } from "@/tipos/rasgos";
import type { RasgoPersonaje, OrigenRasgo, TipoAccionRasgo, RecuperacionRasgo, EfectoMecanicoRasgo, SelectorRasgo } from "@/tipos";
export interface BorradorRasgo {
    nombre: string;
    descripcion: string;
    origen: OrigenRasgo;
    fuente: string;
    tipoAccion: TipoAccionRasgo;
    nivelRequerido: number | undefined;
    notas: string;
    esActivable: boolean;
    autoDesactivar: boolean;
    ligadoA: string;
    condicionAlActivar: string;
    duracionEfectoAlActivar: number | undefined;
    tieneRestauracion: boolean;
    idRasgoRestaurar: string;
    tipoCantidadRestaurar: "maximo" | "fijo";
    cantidadRestaurarFija: number;
    tieneUsosLimitados: boolean;
    gastarDePadre: boolean;
    heredarDadosPadre: boolean;
    usosMaximos: number;
    usosRestantes: number;
    recuperacion: RecuperacionRasgo;
    formulaDados: string;
    formulaEscalado: string;
    categoriaMecanica: NonNullable<RasgoPersonaje["categoriaMecanica"]>;
    conjurosOtorgadosTexto: string;
    efectos: EfectoMecanicoRasgo[];
    selectores: SelectorRasgo[];
}
export function crearBorradorRasgo(rasgoInicial?: RasgoPersonaje | null, origenPredeterminado: OrigenRasgo = "personalizado"): BorradorRasgo {
    return {
        nombre: rasgoInicial?.nombre || "",
        descripcion: rasgoInicial?.descripcion || "",
        origen: rasgoInicial?.origen || origenPredeterminado,
        fuente: rasgoInicial?.fuente || (origenPredeterminado === "dote" ? "PHB 2024" : "Homebrew"),
        tipoAccion: rasgoInicial?.tipoAccion || "pasivo",
        nivelRequerido: rasgoInicial?.nivelRequerido,
        notas: rasgoInicial?.notas || "",
        esActivable: rasgoInicial?.esActivable || false,
        autoDesactivar: rasgoInicial?.autoDesactivar || false,
        ligadoA: rasgoInicial?.ligadoA || "",
        condicionAlActivar: rasgoInicial?.condicionAlActivar || "",
        duracionEfectoAlActivar: rasgoInicial?.duracionEfectoAlActivar,
        tieneRestauracion: Boolean(rasgoInicial?.restaurarUsosAlActivar),
        idRasgoRestaurar: rasgoInicial?.restaurarUsosAlActivar?.idRasgoObjetivo || "",
        tipoCantidadRestaurar: rasgoInicial?.restaurarUsosAlActivar?.cantidad === "maximo" ? "maximo" : "fijo",
        cantidadRestaurarFija: typeof rasgoInicial?.restaurarUsosAlActivar?.cantidad === "number" ? rasgoInicial.restaurarUsosAlActivar.cantidad : 1,
        tieneUsosLimitados: rasgoInicial?.tieneUsosLimitados || false,
        gastarDePadre: rasgoInicial?.gastarDePadre || false,
        heredarDadosPadre: rasgoInicial?.heredarDadosPadre || false,
        usosMaximos: rasgoInicial?.usosMaximos ?? 1,
        usosRestantes: rasgoInicial?.usosRestantes ?? 1,
        recuperacion: rasgoInicial?.recuperacion || "descanso_largo",
        formulaDados: rasgoInicial?.formulaDados || "",
        formulaEscalado: rasgoInicial?.formulaEscalado || "",
        categoriaMecanica: rasgoInicial?.categoriaMecanica ||
            (rasgoInicial?.esActivable ? "activable" : rasgoInicial?.tieneUsosLimitados ? "consumible" : "pasivo_permanente"),
        conjurosOtorgadosTexto: (rasgoInicial?.conjurosOtorgados || []).join(", "),
        efectos: structuredClone(rasgoInicial?.efectos || []),
        selectores: structuredClone(rasgoInicial?.selectores || []),
    };
}
export function construirRasgoDesdeBorrador(borrador: BorradorRasgo, rasgoInicial?: RasgoPersonaje | null): RasgoPersonaje {
    const {
      nombre,
      descripcion,
      origen,
      fuente,
      tipoAccion,
      nivelRequerido,
      notas,
      esActivable,
      autoDesactivar,
      ligadoA,
      condicionAlActivar,
      duracionEfectoAlActivar,
      tieneRestauracion,
      idRasgoRestaurar,
      tipoCantidadRestaurar,
      cantidadRestaurarFija,
      tieneUsosLimitados,
      gastarDePadre,
      heredarDadosPadre,
      usosMaximos,
      usosRestantes,
      recuperacion,
      formulaDados,
      formulaEscalado,
      categoriaMecanica,
      conjurosOtorgadosTexto,
      efectos,
      selectores
    } = borrador;
    return {
        ...rasgoInicial,
        id: rasgoInicial?.id || "preview_rasgo",
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        origen,
        fuente: fuente.trim() || "Homebrew",
        tipoAccion,
        nivelRequerido: nivelRequerido,
        tieneUsosLimitados,
        usosMaximos: tieneUsosLimitados ? usosMaximos : undefined,
        usosRestantes: tieneUsosLimitados ? usosRestantes : undefined,
        recuperacion: tieneUsosLimitados ? recuperacion : "ninguno",
        formulaDados: formulaDados.trim() || undefined,
        personalizado: true,
        activo: rasgoInicial?.activo ?? !esActivable,
        esActivable,
        autoDesactivar: esActivable ? autoDesactivar : undefined,
        gastarDePadre: gastarDePadre || undefined,
        heredarDadosPadre: heredarDadosPadre || undefined,
        conjurosOtorgados: conjurosOtorgadosTexto.trim()
            ? conjurosOtorgadosTexto.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        ligadoA: ligadoA.trim() ? ligadoA.trim() : undefined,
        condicionAlActivar: esActivable && condicionAlActivar.trim() ? condicionAlActivar.trim() : undefined,
        duracionEfectoAlActivar: esActivable ? duracionEfectoAlActivar : undefined,
        restaurarUsosAlActivar: (esActivable && tieneRestauracion && idRasgoRestaurar.trim())
            ? {
                ...rasgoInicial?.restaurarUsosAlActivar,
                idRasgoObjetivo: idRasgoRestaurar.trim(),
                cantidad: tipoCantidadRestaurar === "maximo" ? "maximo" : Math.max(1, cantidadRestaurarFija)
            }
            : undefined,
        selectores: selectores.length > 0 ? selectores : undefined,
        categoriaMecanica,
        formulaEscalado: formulaEscalado.trim() ? formulaEscalado.trim() : undefined,
        efectos,
        notas: notas.trim()
    };
}
export type ResultadoValidacionRasgo = {
    valido: true;
    rasgo: RasgoPersonaje;
} | {
    valido: false;
    errores: Record<string, string>;
};
export function validarRasgoParaGuardar(rasgo: RasgoPersonaje): ResultadoValidacionRasgo {
    const candidato = { ...rasgo, nombre: rasgo.nombre.trim() };
    const resultado = EsquemaRasgoPersonaje.safeParse(candidato);
    const errores: Record<string, string> = {};
    if (!resultado.success)
        for (const problema of resultado.error.issues) {
            const campo = problema.path.join(".");
            errores[campo] = problema.code === "too_small" && campo === "nombre" ? "El nombre es obligatorio." : "Revisa el valor de este campo.";
        }
    if (rasgo.tieneUsosLimitados && rasgo.usosMaximos !== undefined && rasgo.usosRestantes !== undefined && rasgo.usosRestantes > rasgo.usosMaximos)
        errores.usosRestantes = "Los usos restantes no pueden superar el máximo.";
    if (Object.keys(errores).length)
        return { valido: false, errores };
    if (!resultado.success)
        return { valido: false, errores };
    return { valido: true, rasgo: resultado.data };
}
