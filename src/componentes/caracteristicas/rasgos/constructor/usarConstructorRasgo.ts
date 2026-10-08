import { useState, useMemo } from "react";
import type { RasgoPersonaje } from "@/tipos";
import { DOTES_CANONICAS_DND55 } from "@/constantes/rasgosDND55";
import { generarId } from "@/utiles/generarId";
import { crearBorradorRasgo, construirRasgoDesdeBorrador, validarRasgoParaGuardar, type BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ConstructorRasgoDoteProps } from "./tiposConstructor";
export type ActualizarBorradorRasgo = <K extends keyof BorradorRasgo>(campo: K, valor: BorradorRasgo[K] | ((anterior: BorradorRasgo[K]) => BorradorRasgo[K])) => void;
export function usarConstructorRasgo({ personaje, rasgoInicial, origenPredeterminado = "personalizado", alGuardar }: ConstructorRasgoDoteProps) {
    const [borrador, setBorrador] = useState(() => crearBorradorRasgo(rasgoInicial, origenPredeterminado));
    const [rasgoBase, setRasgoBase] = useState(rasgoInicial);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const actualizarBorrador: ActualizarBorradorRasgo = (campo, valor) => setBorrador(anterior => ({ ...anterior, [campo]: typeof valor === "function" ? valor(anterior[campo]) : valor }));
    const [rasgosAdicionales, setRasgosAdicionales] = useState<RasgoPersonaje[]>([]);
    const manejarSeleccionarDotePreset = (idDote: string) => {
        if (!idDote)
            return;
        const dote = DOTES_CANONICAS_DND55.find((d) => d.id === idDote);
        if (dote) {
            const pbPersonaje = Math.floor((Math.max(1, personaje.nivel || 1) - 1) / 4) + 2;
            const formulaEsc = dote.formulaEscalado || dote.formulaUsos || "";
            const maxCalculado = formulaEsc === "bono_competencia" ? pbPersonaje : (dote.usosMaximos || 1);
            const plantilla: RasgoPersonaje = {
                ...structuredClone(dote), id: rasgoInicial?.id || "preview_rasgo", origen: "dote",
                fuente: dote.fuente || "PHB 2024", tipoAccion: dote.tipoAccion || "pasivo",
                personalizado: true, activo: !dote.esActivable, usosMaximos: maxCalculado,
                usosRestantes: maxCalculado, tieneUsosLimitados: Boolean(dote.tieneUsosLimitados),
                recuperacion: dote.recuperacion || "ninguno", notas: "",
                conjurosOtorgados: dote.conjurosOtorgados || [], formulaEscalado: formulaEsc
            };
            setRasgoBase(plantilla);
            setBorrador(crearBorradorRasgo(plantilla, "dote"));
            if (dote.rasgosAdicionales && dote.rasgosAdicionales.length > 0) {
                const adicionales: RasgoPersonaje[] = dote.rasgosAdicionales.map((rad) => ({
                    ...structuredClone(rad),
                    id: rad.id || generarId("rasgo_hb"),
                    nombre: rad.nombre,
                    descripcion: rad.descripcion,
                    origen: "dote",
                    fuente: rad.fuente || "PHB 2024",
                    tipoAccion: rad.tipoAccion || "accion_adicional",
                    tieneUsosLimitados: Boolean(rad.tieneUsosLimitados),
                    usosMaximos: rad.usosMaximos || 1,
                    usosRestantes: rad.usosMaximos || 1,
                    recuperacion: rad.recuperacion || "descanso_largo",
                    formulaDados: rad.formulaDados,
                    categoriaMecanica: rad.categoriaMecanica,
                    personalizado: true,
                    activo: !rad.esActivable,
                    notas: ""
                }));
                setRasgosAdicionales(adicionales);
            }
            else {
                setRasgosAdicionales([]);
            }
        }
    };
    const formatearCategoriaDote = (cat: string): string => {
        switch (cat) {
            case "estilo_combate": return "Estilo de combate";
            case "origen": return "Origen";
            case "general": return "General";
            case "don_epico": return "Don épico";
            default: return cat;
        }
    };
    const opcionesDotesOficiales = useMemo(() => [
        { valor: "", etiqueta: "-- Elegir Dote Oficial --" },
        ...DOTES_CANONICAS_DND55.map((d) => ({
            valor: d.id,
            etiqueta: `${d.nombre} (${formatearCategoriaDote(d.categoria)})`
        }))
    ], []);
    const rasgosPadreDisponibles = useMemo(() => {
        return (personaje.rasgos || []).filter((r) => r.id !== rasgoInicial?.id);
    }, [personaje.rasgos, rasgoInicial?.id]);
    const opcionesRasgosPadre = useMemo(() => [
        { valor: "", etiqueta: "-- Ninguno (Totalmente Independiente) --" },
        ...rasgosPadreDisponibles.map((rp) => ({
            valor: rp.id,
            etiqueta: `${rp.nombre} (${rp.origen})`
        }))
    ], [rasgosPadreDisponibles]);
    const rasgoPrevisualizado = useMemo(() => construirRasgoDesdeBorrador(borrador, rasgoBase), [borrador, rasgoBase]);
    const manejarGuardar = () => {
        const resultado = validarRasgoParaGuardar(rasgoPrevisualizado);
        if (!resultado.valido) {
            setErrores(resultado.errores);
            return;
        }
        setErrores({});
        alGuardar({ ...resultado.rasgo, id: rasgoInicial?.id || generarId("rasgo_hb") }, rasgosAdicionales.length ? rasgosAdicionales : undefined);
    };
    return { borrador, actualizarBorrador, errores, rasgoPrevisualizado, manejarGuardar, rasgosAdicionales, manejarSeleccionarDotePreset, opcionesDotesOficiales, opcionesRasgosPadre };
}
