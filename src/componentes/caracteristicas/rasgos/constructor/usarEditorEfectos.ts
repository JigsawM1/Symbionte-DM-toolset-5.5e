import { construirEfectoRasgo } from "@/servicios/rasgos/construirEfectoRasgo";
import { useState, useMemo } from "react";
import type { EfectoMecanicoRasgo, TipoEfectoMecanico } from "@/tipos";
import { generarId } from "@/utiles/generarId";
import { OPCIONES_VENTAJA, TIPOS_EFECTO_DISPONIBLES } from "./constantesConstructor";
import type { ActualizarBorradorRasgo } from "./usarConstructorRasgo";
export function usarEditorEfectos(efectos: EfectoMecanicoRasgo[], actualizarBorrador: ActualizarBorradorRasgo) {
    const [modoCreandoEfecto, setModoCreandoEfecto] = useState<boolean>(false);
    const [nuevoTipoEfecto, setNuevoTipoEfecto] = useState<TipoEfectoMecanico>("dado_extra_dano");
    const [nuevoObjetivo, setNuevoObjetivo] = useState<string>("arma_fuerza");
    const [nuevoValor, setNuevoValor] = useState<string>("1d10");
    const [nuevoTipoDano, setNuevoTipoDano] = useState<string>("Radiante o Necrótico");
    const [nuevoAplicaA, setNuevoAplicaA] = useState<string>("arma_fuerza");
    const [nuevoLimiteMaximo, setNuevoLimiteMaximo] = useState<number>(25);
    const [nuevoPermiteEscudo, setNuevoPermiteEscudo] = useState<boolean>(true);
    const [nuevaDescripcionEfecto, setNuevaDescripcionEfecto] = useState<string>("");
    const [nuevoCondicion, setNuevoCondicion] = useState<string>("");
    const opcionesTiposEfecto = useMemo(() => TIPOS_EFECTO_DISPONIBLES.map((t) => ({
        valor: t.tipo,
        etiqueta: t.etiqueta
    })), []);
    const manejarCambioTipoEfecto = (t: TipoEfectoMecanico) => {
        setNuevoTipoEfecto(t);
        if (t === "dado_extra_dano") {
            setNuevoValor("1d10");
            setNuevoObjetivo("arma_fuerza");
            setNuevoAplicaA("arma_fuerza");
        }
        else if (t === "dano_secundario") {
            setNuevoValor("1d6+mitad_nivel");
            setNuevoTipoDano("Radiante o Necrótico");
            setNuevoObjetivo("arma_fuerza");
            setNuevoAplicaA("arma_fuerza");
        }
        else if (t === "bono_dano_ataque") {
            setNuevoValor("bono_competencia");
            setNuevoObjetivo("todos_ataques");
            setNuevoAplicaA("todos_ataques");
        }
        else if (t === "bono_ataque") {
            setNuevoValor("2");
            setNuevoObjetivo("arma_distancia");
            setNuevoAplicaA("arma_distancia");
        }
        else if (t === "bono_dano_conjuro") {
            setNuevoValor("bono_competencia");
            setNuevoObjetivo("todos_conjuros");
            setNuevoAplicaA("todos_conjuros");
        }
        else if (t === "bono_dano_fuerza") {
            setNuevoValor("dano_furia");
            setNuevoObjetivo("fuerza");
            setNuevoAplicaA("arma_fuerza");
        }
        else if (t === "modificador_ca") {
            setNuevoValor("constitucion");
            setNuevoObjetivo("defensa_sin_armadura");
            setNuevoPermiteEscudo(true);
            setNuevoCondicion("");
        }
        else if (t === "modificador_stat") {
            setNuevoObjetivo("fuerza");
            setNuevoValor("4");
            setNuevoLimiteMaximo(25);
        }
        else if (t === "modificador_velocidad") {
            setNuevoValor("10");
            setNuevoObjetivo("velocidad.caminar");
        }
        else if (t === "movimiento_especial") {
            setNuevoObjetivo("velocidad.escalar");
            setNuevoValor("caminar");
        }
        else if (t === "ventaja") {
            setNuevoObjetivo("salvacion.fuerza");
            setNuevoValor("true");
        }
        else if (t === "bono_salvacion") {
            setNuevoObjetivo("todas");
            setNuevoValor("dano_furia");
        }
        else if (t === "habilidad_con_fuerza") {
            setNuevoObjetivo("habilidades");
            setNuevoValor("acrobacias,intimidacion,sigilo,percepcion,supervivencia");
        }
        else if (t === "medio_bono_habilidades") {
            setNuevoObjetivo("habilidades_sin_competencia");
            setNuevoValor("mitad_competencia");
        }
        else if (t === "ataque_desarmado") {
            setNuevoObjetivo("destreza");
            setNuevoValor("dado_inspiracion");
            setNuevoPermiteEscudo(false);
        }
        else if (t === "conjuro_otorgado") {
            setNuevoObjetivo("conjuro");
            setNuevoValor("Palabra de poder: sanar");
        }
        else if (t === "competencia") {
            setNuevoObjetivo("armas_marciales");
            setNuevoValor("marciales");
        }
        else if (t === "hp_temporal") {
            setNuevoObjetivo("propio");
            setNuevoValor("bono_competencia");
            setNuevaDescripcionEfecto("Otorga puntos de golpe temporales iguales al bono de competencia");
        }
        else if (t === "conjuro_gratuito") {
            setNuevoObjetivo("conjuro");
            setNuevoValor("orden_imperiosa");
            setNuevaDescripcionEfecto("Lanzamiento sin consumir espacios");
        }
        else if (t === "restaurar_recurso") {
            setNuevoObjetivo("inspiracion");
            setNuevoValor("1");
            setNuevoCondicion("descanso_largo");
            setNuevaDescripcionEfecto("Recupera Inspiración Heroica tras finalizar un descanso largo");
        }
        else if (t === "modificador_hp_maximo") {
            setNuevoObjetivo("hp_maximo");
            setNuevoValor("1*nivel");
            setNuevaDescripcionEfecto("Aumento de puntos de golpe máximos por nivel");
        }
        else if (t === "modificador_capacidad_carga") {
            setNuevoObjetivo("multiplicador");
            setNuevoValor("2");
            setNuevaDescripcionEfecto("Capacidad de carga de tamaño superior (×2)");
        }
        else if (t === "modificador_tamano") {
            setNuevoObjetivo("tamano");
            setNuevoValor("Grande");
            setNuevaDescripcionEfecto("Transformación a tamaño Grande");
        }
        else if (t === "limite_des_armadura_media") {
            setNuevoObjetivo("limite_des_armadura_media");
            setNuevoValor("3");
            setNuevaDescripcionEfecto("Límite de Destreza en armadura media aumentado a 3");
        }
        else if (t === "dado_extra_critico") {
            setNuevoObjetivo("dano_perforante");
            setNuevoValor("1");
            setNuevoAplicaA("perforante");
            setNuevaDescripcionEfecto("+1 dado de daño adicional en impactos críticos (perforante)");
        }
    };
    const manejarAnadirEfecto = () => {
        const nuevoEfecto = construirEfectoRasgo({ nuevoTipoEfecto, nuevoObjetivo, nuevoValor, nuevoTipoDano, nuevoAplicaA, nuevoLimiteMaximo, nuevoPermiteEscudo, nuevaDescripcionEfecto, nuevoCondicion }, generarId("ef"), OPCIONES_VENTAJA.find((o) => o.valor === nuevoObjetivo)?.etiqueta);
        actualizarBorrador("efectos", (prev) => [...prev, nuevoEfecto]);
        setModoCreandoEfecto(false);
        setNuevaDescripcionEfecto("");
        setNuevoCondicion("");
    };
    const manejarEliminarEfecto = (idEf: string) => {
        actualizarBorrador("efectos", efectos.filter((e) => e.id !== idEf));
    };
    return { modoCreandoEfecto, setModoCreandoEfecto, nuevoTipoEfecto, setNuevoTipoEfecto, nuevoObjetivo, setNuevoObjetivo, nuevoValor, setNuevoValor, nuevoTipoDano, setNuevoTipoDano, nuevoAplicaA, setNuevoAplicaA, nuevoLimiteMaximo, setNuevoLimiteMaximo, nuevoPermiteEscudo, setNuevoPermiteEscudo, nuevaDescripcionEfecto, setNuevaDescripcionEfecto, nuevoCondicion, setNuevoCondicion, opcionesTiposEfecto, manejarCambioTipoEfecto, manejarAnadirEfecto, manejarEliminarEfecto };
}
