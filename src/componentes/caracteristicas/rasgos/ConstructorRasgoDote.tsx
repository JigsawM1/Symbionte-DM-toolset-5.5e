import React, { useState, useMemo } from "react";
import type {
  RasgoPersonaje,
  OrigenRasgo,
  TipoAccionRasgo,
  RecuperacionRasgo,
  EfectoMecanicoRasgo,
  TipoEfectoMecanico,
  PersonajeJugador,
  SelectorRasgo,
  OpcionSelector
} from "@/tipos";
import { DOTES_CANONICAS_DND55 } from "@/constantes/rasgosDND55";
import { generarId } from "@/utiles/generarId";
import { TarjetaRasgo } from "./TarjetaRasgo";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Zap,
  Eye,
  Settings2,
  Dice5,
  ListFilter
} from "lucide-react";
import estilos from "./ConstructorRasgoDote.module.css";

interface ConstructorRasgoDoteProps {
  personaje: PersonajeJugador;
  rasgoInicial?: RasgoPersonaje | null;
  origenPredeterminado?: OrigenRasgo;
  alGuardar: (rasgo: RasgoPersonaje) => void;
  alVolver: () => void;
}

const OPCIONES_ORIGEN: { valor: OrigenRasgo; etiqueta: string }[] = [
  { valor: "personalizado", etiqueta: "Personalizado (Homebrew)" },
  { valor: "dote", etiqueta: "Dote" },
  { valor: "clase", etiqueta: "Rasgo de Clase" },
  { valor: "subclase", etiqueta: "Rasgo de Subclase" },
  { valor: "especie", etiqueta: "Rasgo de Especie" },
  { valor: "subespecie", etiqueta: "Rasgo de Subraza / Legado" }
];

const OPCIONES_TIPO_ACCION: { valor: TipoAccionRasgo; etiqueta: string }[] = [
  { valor: "pasivo", etiqueta: "Pasivo (Permanente)" },
  { valor: "accion", etiqueta: "Acción Principal" },
  { valor: "accion_adicional", etiqueta: "Acción Adicional" },
  { valor: "reaccion", etiqueta: "Reacción" },
  { valor: "especial", etiqueta: "Especial / Variable" }
];

const OPCIONES_RECUPERACION: { valor: RecuperacionRasgo; etiqueta: string }[] = [
  { valor: "descanso_corto", etiqueta: "Descanso Corto" },
  { valor: "descanso_largo", etiqueta: "Descanso Largo" },
  { valor: "manual", etiqueta: "Manual" },
  { valor: "ninguno", etiqueta: "Ninguno" }
];

const OPCIONES_APLICA_A_ATAQUE = [
  { valor: "arma_fuerza", etiqueta: "Armas con Fuerza" },
  { valor: "arma_cac", etiqueta: "Armas Cuerpo a Cuerpo" },
  { valor: "arma_distancia", etiqueta: "Armas a Distancia" },
  { valor: "desarmado", etiqueta: "Golpe sin Armas (Desarmado)" },
  { valor: "todos_ataques", etiqueta: "Todos los Ataques" }
] as const;

const OPCIONES_ATRIBUTO_CA = [
  { valor: "constitucion", etiqueta: "Constitución (10 + DES + CON - Bárbaro)" },
  { valor: "sabiduria", etiqueta: "Sabiduría (10 + DES + SAB - Monje)" },
  { valor: "inteligencia", etiqueta: "Inteligencia (10 + DES + INT)" },
  { valor: "carisma", etiqueta: "Carisma (10 + DES + CAR)" }
];

const OPCIONES_CARACTERISTICAS = [
  { valor: "fuerza", etiqueta: "Fuerza" },
  { valor: "destreza", etiqueta: "Destreza" },
  { valor: "constitucion", etiqueta: "Constitución" },
  { valor: "inteligencia", etiqueta: "Inteligencia" },
  { valor: "sabiduria", etiqueta: "Sabiduría" },
  { valor: "carisma", etiqueta: "Carisma" }
];

const OPCIONES_VENTAJA = [
  { valor: "salvacion.fuerza", etiqueta: "Tiradas de Salvación de Fuerza" },
  { valor: "salvacion.destreza", etiqueta: "Tiradas de Salvación de Destreza" },
  { valor: "salvacion.constitucion", etiqueta: "Tiradas de Salvación de Constitución" },
  { valor: "ataque_fuerza", etiqueta: "Tiradas de Ataque que usan Fuerza" },
  { valor: "iniciativa", etiqueta: "Tiradas de Iniciativa" },
  { valor: "prueba.fuerza", etiqueta: "Pruebas de Característica de Fuerza" }
];

const OPCIONES_SALVACION_OBJETIVO = [
  { valor: "todas", etiqueta: "Todas las Salvaciones (Universal)" },
  { valor: "salvacion.fuerza", etiqueta: "Fuerza" },
  { valor: "salvacion.destreza", etiqueta: "Destreza" },
  { valor: "salvacion.constitucion", etiqueta: "Constitución" },
  { valor: "salvacion.inteligencia", etiqueta: "Inteligencia" },
  { valor: "salvacion.sabiduria", etiqueta: "Sabiduría" },
  { valor: "salvacion.carisma", etiqueta: "Carisma" }
];

const TIPOS_EFECTO_DISPONIBLES: { tipo: TipoEfectoMecanico; etiqueta: string; desc: string }[] = [
  { tipo: "dado_extra_dano", etiqueta: "Dados Extra de Daño", desc: "Añade dados al arma o ataque (ej. 1d10 de Golpe Brutal o 2d6 de Frenesí)" },
  { tipo: "dano_secundario", etiqueta: "Daño Secundario con Tipo (/)", desc: "Grupo de daño independiente con tipo separado (ej. 1d6+mitad_nivel Radiante/Necrótico)" },
  { tipo: "bono_dano_ataque", etiqueta: "Bono Numérico de Daño a Ataques", desc: "Suma daño plano (+PB, +2, dano_furia, mitad_nivel) a ataques seleccionados" },
  { tipo: "bono_dano_fuerza", etiqueta: "Bono Numérico de Daño (Fuerza)", desc: "Suma daño plano (+2, dano_furia, mitad_nivel) a ataques con Fuerza" },
  { tipo: "modificador_ca", etiqueta: "Defensa sin Armadura / CA", desc: "Calcula CA sumando Constitución, Sabiduría o bono plano" },
  { tipo: "modificador_stat", etiqueta: "Modificador de Característica", desc: "Aumenta un atributo y permite elevar el límite de 20 a 25" },
  { tipo: "modificador_velocidad", etiqueta: "Velocidad de Movimiento", desc: "Aumenta la velocidad base a pie (+10 pies de Movimiento Rápido)" },
  { tipo: "movimiento_especial", etiqueta: "Movimiento Especial", desc: "Otorga velocidad de Vuelo, Nado o Escalada" },
  { tipo: "ventaja", etiqueta: "Ventaja en Tiradas d20", desc: "Otorga ventaja en salvaciones, ataques de Fuerza o iniciativa" },
  { tipo: "desventaja", etiqueta: "Desventaja en Tiradas d20", desc: "Aplica desventaja táctica en tiradas seleccionadas" },
  { tipo: "bono_salvacion", etiqueta: "Bono a Tiradas de Salvación", desc: "Bono a salvaciones de una característica o universales (ej. Enfoque Fanático)" },
  { tipo: "habilidad_con_fuerza", etiqueta: "Uso de Fuerza en Habilidades", desc: "Permite sustituir el atributo base por Fuerza en habilidades seleccionadas" },
  { tipo: "inmunidad_condicion", etiqueta: "Inmunidad a Condición", desc: "Inmunidad frente a estados o condiciones tácticas" },
  { tipo: "medio_bono_habilidades", etiqueta: "Aprendiz de Mucho / Medio Bono", desc: "Suma la mitad de competencia a habilidades no entrenadas" },
  { tipo: "ataque_desarmado", etiqueta: "Ataque Desarmado Especial", desc: "Permite usar Destreza y dados propios (ej. Daño Bárdico)" },
  { tipo: "conjuro_otorgado", etiqueta: "Conjuro Siempre Preparado", desc: "Otorga un conjuro siempre preparado por rasgo" },
  { tipo: "conjuro_gratuito", etiqueta: "Lanzamiento Gratuito de Conjuro", desc: "Permite lanzar un conjuro sin gastar espacios de conjuro (ej. Orden imperiosa)" },
  { tipo: "hp_temporal", etiqueta: "Puntos de Golpe Temporales", desc: "Otorga puntos de golpe temporales calculados o con multiplicador" },
  { tipo: "restaurar_recurso", etiqueta: "Restaurar Recursos Mecánicos", desc: "Restaura usos o cargas de otro rasgo al activarse (ej. Furia persistente)" },
  { tipo: "competencia", etiqueta: "Competencia en Armas o Armaduras", desc: "Otorga competencia en armas marciales, armaduras medias, etc." }
];

export const ConstructorRasgoDote: React.FC<ConstructorRasgoDoteProps> = ({
  personaje,
  rasgoInicial,
  origenPredeterminado = "personalizado",
  alGuardar,
  alVolver
}) => {
  const esEdicion = !!rasgoInicial;

  // 1. Datos Básicos e Identidad
  const [nombre, setNombre] = useState(rasgoInicial?.nombre || "");
  const [descripcion, setDescripcion] = useState(rasgoInicial?.descripcion || "");
  const [origen, setOrigen] = useState<OrigenRasgo>(rasgoInicial?.origen || origenPredeterminado);
  const [fuente, setFuente] = useState(rasgoInicial?.fuente || (origenPredeterminado === "dote" ? "PHB 2024" : "Homebrew"));
  const [tipoAccion, setTipoAccion] = useState<TipoAccionRasgo>(rasgoInicial?.tipoAccion || "pasivo");
  const [nivelRequerido, setNivelRequerido] = useState<number | undefined>(rasgoInicial?.nivelRequerido);
  const [notas, setNotas] = useState(rasgoInicial?.notas || "");

  // 2. Activación, Conmutador y Vínculos
  const [esActivable, setEsActivable] = useState<boolean>(rasgoInicial?.esActivable || false);
  const [autoDesactivar, setAutoDesactivar] = useState<boolean>(rasgoInicial?.autoDesactivar || false);
  const [ligadoA, setLigadoA] = useState<string>(rasgoInicial?.ligadoA || "");
  const [condicionAlActivar, setCondicionAlActivar] = useState<string>(rasgoInicial?.condicionAlActivar || "");
  const [tieneRestauracion, setTieneRestauracion] = useState<boolean>(Boolean(rasgoInicial?.restaurarUsosAlActivar));
  const [idRasgoRestaurar, setIdRasgoRestaurar] = useState<string>(rasgoInicial?.restaurarUsosAlActivar?.idRasgoObjetivo || "");
  const [tipoCantidadRestaurar, setTipoCantidadRestaurar] = useState<"maximo" | "fijo">(
    rasgoInicial?.restaurarUsosAlActivar?.cantidad === "maximo" ? "maximo" : "fijo"
  );
  const [cantidadRestaurarFija, setCantidadRestaurarFija] = useState<number>(
    typeof rasgoInicial?.restaurarUsosAlActivar?.cantidad === "number" ? rasgoInicial.restaurarUsosAlActivar.cantidad : 1
  );

  // 3. Usos y Recursos
  const [tieneUsosLimitados, setTieneUsosLimitados] = useState(rasgoInicial?.tieneUsosLimitados || false);
  const [gastarDePadre, setGastarDePadre] = useState<boolean>(rasgoInicial?.gastarDePadre || false);
  const [heredarDadosPadre, setHeredarDadosPadre] = useState<boolean>(rasgoInicial?.heredarDadosPadre || false);
  const [usosMaximos, setUsosMaximos] = useState<number>(rasgoInicial?.usosMaximos || 1);
  const [usosRestantes, setUsosRestantes] = useState<number>(rasgoInicial?.usosRestantes ?? 1);
  const [recuperacion, setRecuperacion] = useState<RecuperacionRasgo>(rasgoInicial?.recuperacion || "descanso_largo");
  const [formulaDados, setFormulaDados] = useState(rasgoInicial?.formulaDados || "");
  const [conjurosOtorgadosTexto, setConjurosOtorgadosTexto] = useState<string>(
    (rasgoInicial?.conjurosOtorgados || []).join(", ")
  );

  // 4. Efectos Mecánicos
  const [efectos, setEfectos] = useState<EfectoMecanicoRasgo[]>(rasgoInicial?.efectos || []);
  const [modoCreandoEfecto, setModoCreandoEfecto] = useState<boolean>(false);

  // 5. Selectores de Opciones (Maestrías, Maniobras, Invocaciones)
  const [selectores, setSelectores] = useState<SelectorRasgo[]>(rasgoInicial?.selectores || []);
  const [modoCreandoSelector, setModoCreandoSelector] = useState<boolean>(false);
  const [nuevoSelectorEtiqueta, setNuevoSelectorEtiqueta] = useState<string>("");
  const [nuevoSelectorTipo, setNuevoSelectorTipo] = useState<"unico" | "multiple">("unico");
  const [nuevoSelectorMax, setNuevoSelectorMax] = useState<number>(1);
  const [nuevoOpcionesTexto, setNuevoOpcionesTexto] = useState<string>("");

  // Estado temporal para el nuevo efecto
  const [nuevoTipoEfecto, setNuevoTipoEfecto] = useState<TipoEfectoMecanico>("dado_extra_dano");
  const [nuevoObjetivo, setNuevoObjetivo] = useState<string>("arma_fuerza");
  const [nuevoValor, setNuevoValor] = useState<string>("1d10");
  const [nuevoTipoDano, setNuevoTipoDano] = useState<string>("Radiante o Necrótico");
  const [nuevoAplicaA, setNuevoAplicaA] = useState<"arma_fuerza" | "arma_cac" | "arma_distancia" | "desarmado" | "todos_ataques">("arma_fuerza");
  const [nuevoLimiteMaximo, setNuevoLimiteMaximo] = useState<number>(25);
  const [nuevoPermiteEscudo, setNuevoPermiteEscudo] = useState<boolean>(true);
  const [nuevaDescripcionEfecto, setNuevaDescripcionEfecto] = useState<string>("");

  // Presets de dotes canónicas
  const manejarSeleccionarDotePreset = (idDote: string) => {
    if (!idDote) return;
    const dote = DOTES_CANONICAS_DND55.find((d) => d.id === idDote);
    if (dote) {
      setNombre(dote.nombre);
      setDescripcion(dote.descripcion);
      setOrigen("dote");
      setFuente(dote.fuente || "PHB 2024");
      setTipoAccion("pasivo");
    }
  };

  const opcionesDotesOficiales = useMemo(() => [
    { valor: "", etiqueta: "-- Elegir Dote Oficial --" },
    ...DOTES_CANONICAS_DND55.map((d) => ({
      valor: d.id,
      etiqueta: `${d.nombre} (${d.categoria})`
    }))
  ], []);

  // Otros rasgos del personaje disponibles para vincular como padre (ligadoA)
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

  const opcionesTiposEfecto = useMemo(() =>
    TIPOS_EFECTO_DISPONIBLES.map((t) => ({
      valor: t.tipo,
      etiqueta: t.etiqueta
    })),
  []);

  const manejarCambioTipoEfecto = (t: TipoEfectoMecanico) => {
    setNuevoTipoEfecto(t);
    if (t === "dado_extra_dano") {
      setNuevoValor("1d10");
      setNuevoObjetivo("arma_fuerza");
      setNuevoAplicaA("arma_fuerza");
    } else if (t === "dano_secundario") {
      setNuevoValor("1d6+mitad_nivel");
      setNuevoTipoDano("Radiante o Necrótico");
      setNuevoObjetivo("arma_fuerza");
      setNuevoAplicaA("arma_fuerza");
    } else if (t === "bono_dano_ataque") {
      setNuevoValor("bono_competencia");
      setNuevoObjetivo("todos_ataques");
      setNuevoAplicaA("todos_ataques");
    } else if (t === "bono_dano_fuerza") {
      setNuevoValor("dano_furia");
      setNuevoObjetivo("fuerza");
      setNuevoAplicaA("arma_fuerza");
    } else if (t === "modificador_ca") {
      setNuevoValor("constitucion");
      setNuevoObjetivo("defensa_sin_armadura");
      setNuevoPermiteEscudo(true);
    } else if (t === "modificador_stat") {
      setNuevoObjetivo("fuerza");
      setNuevoValor("4");
      setNuevoLimiteMaximo(25);
    } else if (t === "modificador_velocidad") {
      setNuevoValor("10");
      setNuevoObjetivo("velocidad.caminar");
    } else if (t === "ventaja") {
      setNuevoObjetivo("salvacion.fuerza");
      setNuevoValor("true");
    } else if (t === "bono_salvacion") {
      setNuevoObjetivo("todas");
      setNuevoValor("dano_furia");
    } else if (t === "habilidad_con_fuerza") {
      setNuevoObjetivo("habilidades");
      setNuevoValor("acrobacias,intimidacion,sigilo,percepcion,supervivencia");
    } else if (t === "medio_bono_habilidades") {
      setNuevoObjetivo("habilidades_sin_competencia");
      setNuevoValor("mitad_competencia");
    } else if (t === "ataque_desarmado") {
      setNuevoObjetivo("destreza");
      setNuevoValor("dado_inspiracion");
      setNuevoPermiteEscudo(false);
    } else if (t === "conjuro_otorgado") {
      setNuevoObjetivo("conjuro");
      setNuevoValor("Palabra de poder: sanar");
    } else if (t === "competencia") {
      setNuevoObjetivo("armas_marciales");
      setNuevoValor("marciales");
    } else if (t === "hp_temporal") {
      setNuevoObjetivo("hp_temporal");
      setNuevoValor("2_veces_dado_inspiracion");
      setNuevaDescripcionEfecto("Puntos de golpe temporales calculados");
    } else if (t === "conjuro_gratuito") {
      setNuevoObjetivo("conjuro");
      setNuevoValor("orden_imperiosa");
      setNuevaDescripcionEfecto("Lanzamiento sin consumir espacios");
    } else if (t === "restaurar_recurso") {
      setNuevoObjetivo("furia");
      setNuevoValor("maximo");
      setNuevaDescripcionEfecto("Restaura usos del recurso al activarse");
    }
  };

  // Manejo de adición de un efecto mecánico
  const manejarAnadirEfecto = () => {
    const efId = generarId("ef");
    let descFinal = nuevaDescripcionEfecto.trim();

    if (!descFinal) {
      switch (nuevoTipoEfecto) {
        case "dado_extra_dano":
          descFinal = `+${nuevoValor} al daño (${nuevoAplicaA})`;
          break;
        case "dano_secundario":
          descFinal = `/${nuevoValor} [${nuevoTipoDano}]`;
          break;
        case "bono_dano_ataque":
        case "bono_dano_fuerza":
          descFinal = `+${nuevoValor} al daño físico`;
          break;
        case "modificador_ca":
          descFinal = `Defensa sin armadura (${nuevoValor})`;
          break;
        case "modificador_stat":
          descFinal = `+${nuevoValor} a ${nuevoObjetivo} (Límite ${nuevoLimiteMaximo})`;
          break;
        case "modificador_velocidad":
          descFinal = `+${nuevoValor} pies de velocidad`;
          break;
        case "movimiento_especial":
          descFinal = `Movimiento especial: ${nuevoValor}`;
          break;
        case "ventaja":
          descFinal = `Ventaja en ${nuevoObjetivo}`;
          break;
        case "bono_salvacion":
          descFinal = `+${nuevoValor} a salvación de ${nuevoObjetivo}`;
          break;
        case "habilidad_con_fuerza":
          descFinal = `Usar Fuerza en ${nuevoValor}`;
          break;
        case "medio_bono_habilidades":
          descFinal = "Medio bono de competencia a habilidades sin competencia";
          break;
        case "ataque_desarmado":
          descFinal = `Ataque sin armas con ${nuevoObjetivo} (${nuevoValor})`;
          break;
        case "conjuro_otorgado":
          descFinal = `Conjuro otorgado: ${nuevoValor}`;
          break;
        case "conjuro_gratuito":
          descFinal = `Lanzamiento gratuito: ${nuevoValor}`;
          break;
        case "hp_temporal":
          descFinal = `Puntos de golpe temporales: ${nuevoValor}`;
          break;
        case "restaurar_recurso":
          descFinal = `Restaurar ${nuevoValor} uso(s) de ${nuevoObjetivo}`;
          break;
        case "competencia":
          descFinal = `Competencia con ${nuevoObjetivo}`;
          break;
        default:
          descFinal = `${nuevoTipoEfecto}: ${nuevoValor}`;
          break;
      }
    }

    const nuevoEfecto: EfectoMecanicoRasgo = {
      id: efId,
      tipo: nuevoTipoEfecto,
      objetivo: nuevoObjetivo.trim() || "general",
      valor: nuevoValor.trim(),
      tipoDano: nuevoTipoEfecto === "dano_secundario" ? nuevoTipoDano.trim() : undefined,
      aplicaA: nuevoAplicaA,
      limiteMaximo: nuevoTipoEfecto === "modificador_stat" ? nuevoLimiteMaximo : undefined,
      permiteEscudo: nuevoTipoEfecto === "modificador_ca" ? nuevoPermiteEscudo : undefined,
      descripcion: descFinal,
      activo: true
    };

    setEfectos((prev) => [...prev, nuevoEfecto]);
    setModoCreandoEfecto(false);
    setNuevaDescripcionEfecto("");
  };

  const manejarEliminarEfecto = (idEf: string) => {
    setEfectos(efectos.filter((e) => e.id !== idEf));
  };

  // Manejo de selectores de opciones
  const manejarAgregarSelector = () => {
    if (!nuevoSelectorEtiqueta.trim()) return;
    const nombresOpciones = nuevoOpcionesTexto
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const opciones: OpcionSelector[] = nombresOpciones.map((nom) => ({
      id: generarId("opt"),
      nombre: nom,
      descripcion: ""
    }));
    const nuevoSel: SelectorRasgo = {
      id: generarId("sel"),
      etiqueta: nuevoSelectorEtiqueta.trim(),
      tipo: nuevoSelectorTipo,
      maxSelecciones: nuevoSelectorTipo === "multiple" ? Math.max(1, nuevoSelectorMax) : 1,
      opciones,
      valorActual: []
    };
    setSelectores((prev) => [...prev, nuevoSel]);
    setNuevoSelectorEtiqueta("");
    setNuevoOpcionesTexto("");
    setNuevoSelectorTipo("unico");
    setNuevoSelectorMax(1);
    setModoCreandoSelector(false);
  };

  const manejarEliminarSelector = (idSel: string) => {
    setSelectores((prev) => prev.filter((s) => s.id !== idSel));
  };

  // Previsualización en vivo del rasgo generado
  const rasgoPrevisualizado: RasgoPersonaje = useMemo(() => {
    return {
      id: rasgoInicial?.id || "preview_rasgo",
      nombre: nombre.trim() || "Nombre del Rasgo",
      descripcion: descripcion.trim() || "Descripción del rasgo o dote...",
      origen,
      fuente: fuente.trim() || "Homebrew",
      tipoAccion,
      nivelRequerido: nivelRequerido && nivelRequerido > 0 ? nivelRequerido : undefined,
      tieneUsosLimitados,
      usosMaximos: tieneUsosLimitados ? Math.max(1, usosMaximos) : undefined,
      usosRestantes: tieneUsosLimitados ? Math.min(usosRestantes, usosMaximos) : undefined,
      recuperacion: tieneUsosLimitados ? recuperacion : "ninguno",
      formulaDados: formulaDados.trim() || undefined,
      personalizado: true,
      activo: esActivable ? false : true,
      esActivable,
      autoDesactivar: esActivable ? autoDesactivar : undefined,
      gastarDePadre: gastarDePadre || undefined,
      heredarDadosPadre: heredarDadosPadre || undefined,
      conjurosOtorgados: conjurosOtorgadosTexto.trim()
        ? conjurosOtorgadosTexto.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      ligadoA: esActivable && ligadoA.trim() ? ligadoA.trim() : undefined,
      condicionAlActivar: esActivable && condicionAlActivar.trim() ? condicionAlActivar.trim() : undefined,
      restaurarUsosAlActivar: (esActivable && tieneRestauracion && idRasgoRestaurar.trim())
        ? {
            idRasgoObjetivo: idRasgoRestaurar.trim(),
            cantidad: tipoCantidadRestaurar === "maximo" ? "maximo" : Math.max(1, cantidadRestaurarFija)
          }
        : undefined,
      selectores: selectores.length > 0 ? selectores : undefined,
      efectos,
      notas: notas.trim()
    };
  }, [
    nombre,
    descripcion,
    origen,
    fuente,
    tipoAccion,
    nivelRequerido,
    tieneUsosLimitados,
    usosMaximos,
    usosRestantes,
    recuperacion,
    formulaDados,
    esActivable,
    autoDesactivar,
    gastarDePadre,
    heredarDadosPadre,
    conjurosOtorgadosTexto,
    ligadoA,
    condicionAlActivar,
    tieneRestauracion,
    idRasgoRestaurar,
    tipoCantidadRestaurar,
    cantidadRestaurarFija,
    selectores,
    efectos,
    notas,
    rasgoInicial?.id
  ]);

  // Guardado formal
  const manejarGuardar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nombre.trim()) return;

    const rasgoFinal: RasgoPersonaje = {
      ...rasgoPrevisualizado,
      id: rasgoInicial?.id || generarId("rasgo_hb")
    };

    alGuardar(rasgoFinal);
  };

  return (
    <div className={estilos.panelConstructor}>
      {/* 1. Barra de Herramientas y Navegación Superior */}
      <div className={estilos.barraSuperiorAcciones}>
        <div className={estilos.ladoIzquierdoBarra}>
          <button type="button" className={estilos.botonVolver} onClick={alVolver} title="Volver a la lista de rasgos">
            <ArrowLeft size={14} />
            <span>Volver a Mis Rasgos</span>
          </button>
          <div className={estilos.tituloConstructor}>
            <Settings2 size={16} color="#38bdf8" />
            <span>{esEdicion ? "Editando Rasgo / Dote" : "Constructor de Rasgos y Dotes"}</span>
            {esEdicion && <span className={estilos.subtituloEdicion}>({nombre || "Sin nombre"})</span>}
          </div>
        </div>

        <div className={estilos.ladoDerechoBarra}>
          <button
            type="button"
            className={estilos.botonGuardar}
            onClick={() => manejarGuardar()}
            disabled={!nombre.trim()}
            title="Guardar rasgo en este personaje"
          >
            <Save size={14} />
            <span>Guardar en Personaje</span>
          </button>
        </div>
      </div>

      {/* Selector Rápido de Dotes Oficiales */}
      <div className={estilos.seccionCard} style={{ background: "rgba(30, 41, 59, 0.4)" }}>
        <div className={estilos.filaToggle}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>Cargar Plantilla de Dote Oficial (PHB 2024)</span>
            <span className={estilos.pistaToggle}>Rellena automáticamente el nombre, categoría y descripción oficial</span>
          </div>
          <div style={{ width: "260px" }}>
            <SelectorDesplegable
              valor=""
              opciones={opcionesDotesOficiales}
              alCambiar={(val) => {
                if (val) manejarSeleccionarDotePreset(val);
              }}
              placeholder="-- Elegir Dote Oficial --"
              tamano="compacto"
            />
          </div>
        </div>
      </div>

      {/* 2. Sección de Identidad y Reglas Básicas */}
      <div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <Shield size={14} color="#38bdf8" />
            <span>1. Identidad y Clasificación</span>
          </div>
          <p className={estilos.descripcionSeccion}>Define el nombre, categoría y tiempo de acción del rasgo</p>
        </div>

        <div className={estilos.gridDosColumnas}>
          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Nombre del Rasgo o Dote *</span>
            </label>
            <input
              type="text"
              className={estilos.inputControl}
              placeholder="ej. Furia Divina, Maestro en Armas..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Origen / Categoría</span>
            </label>
            <SelectorDesplegable<OrigenRasgo>
              valor={origen}
              opciones={OPCIONES_ORIGEN}
              alCambiar={(val) => setOrigen(val)}
              tamano="normal"
            />
          </div>
        </div>

        <div className={estilos.gridTresColumnas}>
          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Tipo de Acción</span>
            </label>
            <SelectorDesplegable<TipoAccionRasgo>
              valor={tipoAccion}
              opciones={OPCIONES_TIPO_ACCION}
              alCambiar={(val) => setTipoAccion(val)}
              tamano="normal"
            />
          </div>

          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Fuente o Libro</span>
            </label>
            <input
              type="text"
              className={estilos.inputControl}
              placeholder="ej. Homebrew, PHB 2024..."
              value={fuente}
              onChange={(e) => setFuente(e.target.value)}
            />
          </div>

          <div className={estilos.campoGrupo}>
            <label className={estilos.labelCampo}>
              <span>Nivel Requerido</span>
            </label>
            <input
              type="number"
              min={1}
              max={20}
              className={estilos.inputControl}
              placeholder="Opcional (1-20)"
              value={nivelRequerido ?? ""}
              onChange={(e) => setNivelRequerido(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            />
          </div>
        </div>

        <div className={estilos.campoGrupo}>
          <label className={estilos.labelCampo}>
            <span>Descripción Completa de las Reglas</span>
          </label>
          <textarea
            className={estilos.textareaControl}
            placeholder="Escribe aquí las reglas, condiciones, beneficios y funcionamiento detallado..."
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div className={estilos.campoGrupo}>
          <label className={estilos.labelCampo}>
            <span>Notas Privadas o Referencia</span>
          </label>
          <textarea
            className={estilos.textareaControl}
            placeholder="Anotaciones personales para la mesa de juego..."
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Sección de Activación y Conmutador Táctico (Toggle, Vínculos y Cascada) */}
      <div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <Zap size={14} color="#38bdf8" />
            <span>2. Conmutador Táctico, Dependencias y TaleSpire</span>
          </div>
          <p className={estilos.descripcionSeccion}>Configura si este rasgo se enciende/apaga e interactúa con la barra táctica</p>
        </div>

        <div className={estilos.filaToggle}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>¿Es un rasgo activable con interruptor (ON / OFF)?</span>
            <span className={estilos.pistaToggle}>
              Permite encenderlo o apagarlo en combate con un clic (nace desactivado por defecto).
            </span>
          </div>
          <label className={estilos.interruptor}>
            <input
              type="checkbox"
              checked={esActivable}
              onChange={(e) => setEsActivable(e.target.checked)}
            />
            <span className={estilos.deslizador} />
          </label>
        </div>

        {esActivable && (
          <div className={estilos.gridDosColumnas} style={{ marginTop: "4px" }}>
            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Rasgo Padre Requerido (ligadoA)</span>
              </label>
              <SelectorDesplegable
                valor={ligadoA}
                opciones={opcionesRasgosPadre}
                alCambiar={(val) => setLigadoA(val)}
                placeholder="-- Ninguno (Totalmente Independiente) --"
                tamano="normal"
              />
              <p className={estilos.pistaCampo}>
                Si defines un padre (ej. Furia), este rasgo estará bloqueado hasta que el padre se active, y si el padre se apaga, se apagará automáticamente en cascada.
              </p>
            </div>

            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Condición Táctica en TaleSpire</span>
              </label>
              <input
                type="text"
                className={estilos.inputControl}
                placeholder="ej. Furia (Rage), Bendición, Concentración..."
                value={condicionAlActivar}
                onChange={(e) => setCondicionAlActivar(e.target.value)}
              />
              <p className={estilos.pistaCampo}>
                Al encender el rasgo, se añadirá esta condición a la barra táctica. Al quitar la condición en TaleSpire, el rasgo se apagará automáticamente.
              </p>
            </div>

            <div className={estilos.filaToggle} style={{ gridColumn: "1 / -1", marginTop: "6px" }}>
              <div className={estilos.infoToggle}>
                <span className={estilos.labelToggle}>¿Auto-desactivar inmediatamente tras su uso?</span>
                <span className={estilos.pistaToggle}>
                  Ideal para habilidades instantáneas o de un solo golpe que restablecen recursos (ej. Furia persistente).
                </span>
              </div>
              <label className={estilos.interruptor}>
                <input
                  type="checkbox"
                  checked={autoDesactivar}
                  onChange={(e) => setAutoDesactivar(e.target.checked)}
                />
                <span className={estilos.deslizador} />
              </label>
            </div>

            <div className={estilos.filaToggle} style={{ gridColumn: "1 / -1", marginTop: "6px" }}>
              <div className={estilos.infoToggle}>
                <span className={estilos.labelToggle}>¿Restaurar usos de otro rasgo al activarse?</span>
                <span className={estilos.pistaToggle}>
                  Permite recargar usos de otro recurso al encender este rasgo (ej. Furia Persistente restaura Furia).
                </span>
              </div>
              <label className={estilos.interruptor}>
                <input
                  type="checkbox"
                  checked={tieneRestauracion}
                  onChange={(e) => setTieneRestauracion(e.target.checked)}
                />
                <span className={estilos.deslizador} />
              </label>
            </div>

            {tieneRestauracion && (
              <div className={estilos.gridDosColumnas} style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Rasgo Objetivo a Recargar</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. furia, inspiracion bardica, o ID del rasgo"
                    value={idRasgoRestaurar}
                    onChange={(e) => setIdRasgoRestaurar(e.target.value)}
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Cantidad a Restaurar</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <SelectorDesplegable<"maximo" | "fijo">
                      valor={tipoCantidadRestaurar}
                      opciones={[
                        { valor: "maximo", etiqueta: "Todos (Máximo)" },
                        { valor: "fijo", etiqueta: "Cantidad Fija" }
                      ]}
                      alCambiar={(val) => setTipoCantidadRestaurar(val)}
                    />
                    {tipoCantidadRestaurar === "fijo" && (
                      <input
                        type="number"
                        min={1}
                        className={estilos.inputControl}
                        style={{ width: "80px" }}
                        value={cantidadRestaurarFija}
                        onChange={(e) => setCantidadRestaurarFija(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Sección de Usos, Cargas y Fórmulas */}
      <div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <Dice5 size={14} color="#38bdf8" />
            <span>3. Usos, Cargas y Fórmulas de Dados</span>
          </div>
          <p className={estilos.descripcionSeccion}>Gestiona recursos limitados y tiradas directas a la bandeja 3D</p>
        </div>

        <div className={estilos.filaToggle}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>¿Tiene usos limitados o cargas?</span>
            <span className={estilos.pistaToggle}>Habilita el contador de usos consumibles con recarga</span>
          </div>
          <label className={estilos.interruptor}>
            <input
              type="checkbox"
              checked={tieneUsosLimitados}
              onChange={(e) => setTieneUsosLimitados(e.target.checked)}
            />
            <span className={estilos.deslizador} />
          </label>
        </div>

        {tieneUsosLimitados && (
          <div className={estilos.gridTresColumnas}>
            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Usos Máximos</span>
              </label>
              <input
                type="number"
                min={1}
                className={estilos.inputControl}
                value={usosMaximos}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setUsosMaximos(val);
                  if (usosRestantes > val) setUsosRestantes(val);
                }}
              />
            </div>

            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Usos Restantes Actuales</span>
              </label>
              <input
                type="number"
                min={0}
                max={usosMaximos}
                className={estilos.inputControl}
                value={usosRestantes}
                onChange={(e) => setUsosRestantes(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Tipo de Recuperación</span>
              </label>
              <SelectorDesplegable<RecuperacionRasgo>
                valor={recuperacion}
                opciones={OPCIONES_RECUPERACION}
                alCambiar={(val) => setRecuperacion(val)}
                tamano="normal"
              />
            </div>
          </div>
        )}

        <div className={estilos.campoGrupo}>
          <label className={estilos.labelCampo}>
            <span>Fórmula de Dados Lanzable (TaleSpire)</span>
          </label>
          <input
            type="text"
            className={estilos.inputControl}
            placeholder="ej. 1d12, 1d6 + mitad_nivel, 2d6..."
            value={formulaDados}
            onChange={(e) => setFormulaDados(e.target.value)}
          />
          <p className={estilos.pistaCampo}>
            Muestra un botón de dados en la tarjeta para lanzar esta tirada directamente a la bandeja 3D de TaleSpire.
          </p>
        </div>

        <div className={estilos.filaToggle} style={{ marginTop: "8px" }}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>¿Gastar usos del rasgo padre?</span>
            <span className={estilos.pistaToggle}>
              Consume cargas del rasgo principal al que está vinculado (ej. Inspiración bárdica o Furia) sin requerir usos propios.
            </span>
          </div>
          <label className={estilos.interruptor}>
            <input
              type="checkbox"
              checked={gastarDePadre}
              onChange={(e) => setGastarDePadre(e.target.checked)}
            />
            <span className={estilos.deslizador} />
          </label>
        </div>

        <div className={estilos.filaToggle} style={{ marginTop: "8px" }}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>¿Heredar dados de escala del rasgo padre?</span>
            <span className={estilos.pistaToggle}>
              Hereda dinámicamente el dado del padre (ej. 1d6 - 1d12 de Inspiración bárdica) para tiradas 3D a TaleSpire.
            </span>
          </div>
          <label className={estilos.interruptor}>
            <input
              type="checkbox"
              checked={heredarDadosPadre}
              onChange={(e) => setHeredarDadosPadre(e.target.checked)}
            />
            <span className={estilos.deslizador} />
          </label>
        </div>

        <div className={estilos.campoGrupo} style={{ marginTop: "8px" }}>
          <label className={estilos.labelCampo}>
            <span>Conjuros Otorgados (Siempre preparados, separados por coma)</span>
          </label>
          <input
            type="text"
            className={estilos.inputControl}
            placeholder="ej. Palabra de poder: sanar, Palabra de poder: matar"
            value={conjurosOtorgadosTexto}
            onChange={(e) => setConjurosOtorgadosTexto(e.target.value)}
          />
          <p className={estilos.pistaCampo}>
            Los conjuros especificados aquí se prepararán automáticamente en el libro de conjuros del personaje.
          </p>
        </div>
      </div>

      {/* 5. Sección de Efectos Mecánicos e Interactividad */}
      <div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <Sparkles size={14} color="#38bdf8" />
            <span>4. Efectos Mecánicos e Interactividad en Combate</span>
          </div>
          <p className={estilos.descripcionSeccion}>
            El corazón de las mecánicas: conecta este rasgo directamente al cálculo de daño, ataques, CA, stats y tiradas d20
          </p>
        </div>

        {/* Lista de Efectos Agregados */}
        {efectos.length > 0 ? (
          <div className={estilos.listaEfectos}>
            {efectos.map((ef) => (
              <div key={ef.id || ef.tipo} className={estilos.tarjetaEfectoItem}>
                <div className={estilos.cuerpoEfectoItem}>
                  <div className={estilos.filaBadgeEfecto}>
                    <span className={estilos.badgeEfectoTipo}>{ef.tipo.replace(/_/g, " ")}</span>
                    <span className={estilos.badgeEfectoValor}>{String(ef.valor)}</span>
                    {ef.tipoDano && <span className={estilos.badgeEfectoValor}>{ef.tipoDano}</span>}
                    {ef.aplicaA && <span className={estilos.badgeEfectoTipo}>{ef.aplicaA.replace(/_/g, " ")}</span>}
                    {ef.limiteMaximo && <span className={estilos.badgeEfectoTipo}>Límite: {ef.limiteMaximo}</span>}
                  </div>
                  <span className={estilos.descripcionEfectoItem}>{ef.descripcion || ef.objetivo}</span>
                </div>
                <button
                  type="button"
                  className={estilos.botonEliminarEfecto}
                  onClick={() => manejarEliminarEfecto(ef.id || "")}
                  title="Eliminar este efecto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={estilos.pistaCampo} style={{ fontStyle: "italic" }}>
            No hay efectos mecánicos añadidos aún. Este rasgo será solo informativo a menos que agregues efectos interactivos.
          </p>
        )}

        {/* Formulario de Añadir Efecto */}
        {modoCreandoEfecto ? (
          <div className={estilos.cajaNuevoEfecto}>
            <div className={estilos.cabeceraNuevoEfecto}>
              <span className={estilos.tituloNuevoEfecto}>Configurar Nuevo Efecto Mecánico</span>
            </div>

            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Tipo de Efecto</span>
              </label>
              <SelectorDesplegable<TipoEfectoMecanico>
                valor={nuevoTipoEfecto}
                opciones={opcionesTiposEfecto}
                alCambiar={manejarCambioTipoEfecto}
                tamano="normal"
              />
            </div>

            {/* Campos condicionales según el tipo de efecto */}
            {nuevoTipoEfecto === "dado_extra_dano" && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Fórmula de Dados Extra</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. 1d10, 2d6, 1d8..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Aplica a Tipo de Ataque</span>
                  </label>
                  <SelectorDesplegable<"arma_fuerza" | "arma_cac" | "arma_distancia" | "desarmado" | "todos_ataques">
                    valor={nuevoAplicaA}
                    opciones={OPCIONES_APLICA_A_ATAQUE}
                    alCambiar={(val) => setNuevoAplicaA(val)}
                    tamano="normal"
                  />
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "dano_secundario" && (
              <div className={estilos.gridTresColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Fórmula de Daño Secundario</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. 1d6 + mitad_nivel, 1d8..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>Soporta "mitad_nivel", "nivel", "dano_furia".</p>
                </div>

                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Tipo de Daño</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. Radiante o Necrótico, Fuego..."
                    value={nuevoTipoDano}
                    onChange={(e) => setNuevoTipoDano(e.target.value)}
                  />
                </div>

                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Aplica a</span>
                  </label>
                  <SelectorDesplegable<"arma_fuerza" | "arma_cac" | "arma_distancia" | "desarmado" | "todos_ataques">
                    valor={nuevoAplicaA}
                    opciones={OPCIONES_APLICA_A_ATAQUE}
                    alCambiar={(val) => setNuevoAplicaA(val)}
                    tamano="normal"
                  />
                </div>
              </div>
            )}

            {(nuevoTipoEfecto === "bono_dano_fuerza" || nuevoTipoEfecto === "bono_dano_ataque") && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Valor del Bono</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. +2, bono_competencia, dano_furia, mitad_nivel..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Aplica a</span>
                  </label>
                  <SelectorDesplegable<"arma_fuerza" | "arma_cac" | "arma_distancia" | "desarmado" | "todos_ataques">
                    valor={nuevoAplicaA}
                    opciones={OPCIONES_APLICA_A_ATAQUE}
                    alCambiar={(val) => setNuevoAplicaA(val)}
                    tamano="normal"
                  />
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "modificador_ca" && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Atributo para Defensa sin Armadura</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoValor}
                    opciones={OPCIONES_ATRIBUTO_CA}
                    alCambiar={(val) => setNuevoValor(val)}
                    tamano="normal"
                  />
                </div>

                <div className={estilos.campoGrupo} style={{ justifyContent: "center" }}>
                  <label className={estilos.labelCampo}>
                    <input
                      type="checkbox"
                      checked={nuevoPermiteEscudo}
                      onChange={(e) => setNuevoPermiteEscudo(e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    <span>Permite usar Escudo (ej. Bárbaro sí, Monje no)</span>
                  </label>
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "modificador_stat" && (
              <div className={estilos.gridTresColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Característica</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={OPCIONES_CARACTERISTICAS}
                    alCambiar={(val) => setNuevoObjetivo(val)}
                    tamano="normal"
                  />
                </div>

                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Incremento</span>
                  </label>
                  <input
                    type="number"
                    className={estilos.inputControl}
                    placeholder="ej. 2 o 4"
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>

                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Nuevo Límite Máximo</span>
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={30}
                    className={estilos.inputControl}
                    value={nuevoLimiteMaximo}
                    onChange={(e) => setNuevoLimiteMaximo(parseInt(e.target.value, 10) || 20)}
                  />
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "ventaja" && (
              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Tirada d20 con Ventaja</span>
                </label>
                <SelectorDesplegable
                  valor={nuevoObjetivo}
                  opciones={OPCIONES_VENTAJA}
                  alCambiar={(val) => setNuevoObjetivo(val)}
                  tamano="normal"
                />
              </div>
            )}

            {nuevoTipoEfecto === "bono_salvacion" && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Salvación Objetivo</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={OPCIONES_SALVACION_OBJETIVO}
                    alCambiar={(val) => setNuevoObjetivo(val)}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Valor del Bono</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. dano_furia, mitad_nivel, +2..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "habilidad_con_fuerza" && (
              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Habilidades permitidas con Fuerza (separadas por coma)</span>
                </label>
                <input
                  type="text"
                  className={estilos.inputControl}
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                />
                <p className={estilos.pistaCampo}>
                  ej. acrobacias, intimidacion, sigilo, percepcion, supervivencia (Conocimiento Primigenio)
                </p>
              </div>
            )}

            {nuevoTipoEfecto === "medio_bono_habilidades" && (
              <div className={estilos.campoGrupo}>
                <p className={estilos.pistaCampo} style={{ color: "#38bdf8" }}>
                  Aplica la regla canónica de Aprendiz de mucho: suma la mitad de la competencia (redondeada hacia abajo) a cualquier habilidad en la que el personaje no sea competente.
                </p>
              </div>
            )}

            {nuevoTipoEfecto === "ataque_desarmado" && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Característica de Ataque</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={[
                      { valor: "destreza", etiqueta: "Destreza" },
                      { valor: "fuerza", etiqueta: "Fuerza" },
                      { valor: "carisma", etiqueta: "Carisma" }
                    ]}
                    alCambiar={(val) => setNuevoObjetivo(val)}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Dado de Daño Base</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="dado_inspiracion o ej. 1d6, 1d8..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>
                    Usa "dado_inspiracion" para escalar automáticamente con la tabla de Inspiración del bardo.
                  </p>
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "conjuro_otorgado" && (
              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Nombre del Conjuro Otorgado</span>
                </label>
                <input
                  type="text"
                  className={estilos.inputControl}
                  placeholder="ej. Palabra de poder: sanar"
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                />
              </div>
            )}

            {nuevoTipoEfecto === "competencia" && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Categoría o Grupo</span>
                  </label>
                  <SelectorDesplegable
                    valor={nuevoObjetivo}
                    opciones={[
                      { valor: "armas_marciales", etiqueta: "Armas Marciales" },
                      { valor: "armas_sencillas", etiqueta: "Armas Sencillas" },
                      { valor: "armaduras_medias", etiqueta: "Armaduras Medias" },
                      { valor: "armaduras_pesadas", etiqueta: "Armaduras Pesadas" },
                      { valor: "armaduras_ligeras", etiqueta: "Armaduras Ligeras" },
                      { valor: "escudos", etiqueta: "Escudos" }
                    ]}
                    alCambiar={(val) => {
                      setNuevoObjetivo(val);
                      setNuevoValor(val.replace("armas_", "").replace("armaduras_", ""));
                    }}
                    tamano="normal"
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Descripción de la Competencia</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "hp_temporal" && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Fórmula o Multiplicador de HP Temporal</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. 2_veces_dado_inspiracion, 5, 1d8+carisma..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>
                    Soporta multiplicadores ("2_veces_dado_inspiracion"), fórmulas o números planos.
                  </p>
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Descripción del Efecto</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. Puntos de golpe temporales a aliados"
                    value={nuevaDescripcionEfecto}
                    onChange={(e) => setNuevaDescripcionEfecto(e.target.value)}
                  />
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "conjuro_gratuito" && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Conjuro Otorgado Gratis</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. orden_imperiosa, detectar_magia..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                  <p className={estilos.pistaCampo}>
                    ID o nombre del conjuro que se podrá lanzar sin gastar espacios de conjuro.
                  </p>
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Descripción del Efecto</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. Lanzamiento gratuito sin gastar espacios"
                    value={nuevaDescripcionEfecto}
                    onChange={(e) => setNuevaDescripcionEfecto(e.target.value)}
                  />
                </div>
              </div>
            )}

            {nuevoTipoEfecto === "restaurar_recurso" && (
              <div className={estilos.gridDosColumnas}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Rasgo o Recurso a Restaurar</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. furia, inspiracion bardica..."
                    value={nuevoObjetivo}
                    onChange={(e) => setNuevoObjetivo(e.target.value)}
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Cantidad Restaurada</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. maximo, 1, 2..."
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className={estilos.botonesNuevoEfecto}>
              <button
                type="button"
                className={estilos.botonCancelarEfecto}
                onClick={() => setModoCreandoEfecto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={estilos.botonConfirmarEfecto}
                onClick={manejarAnadirEfecto}
              >
                Confirmar Efecto
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={estilos.botonAnadirEfecto}
            onClick={() => setModoCreandoEfecto(true)}
          >
            <Plus size={14} />
            <span>Añadir Efecto Mecánico</span>
          </button>
        )}
      </div>

      {/* 5. Sección de Opciones y Selectores Configurables */}
      <div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <ListFilter size={14} color="#38bdf8" />
            <span>5. Opciones y Selectores Configurables (Homebrew)</span>
          </div>
          <p className={estilos.descripcionSeccion}>
            Permite al jugador elegir opciones tácticas para este rasgo (ej. Armas con Maestría, Maniobras de Batalla, Invocaciones)
          </p>
        </div>

        {/* Lista de Selectores Agregados */}
        {selectores.length > 0 ? (
          <div className={estilos.listaEfectos}>
            {selectores.map((sel) => (
              <div key={sel.id} className={estilos.tarjetaEfectoItem}>
                <div className={estilos.cuerpoEfectoItem}>
                  <div className={estilos.filaBadgeEfecto}>
                    <span className={estilos.badgeEfectoTipo}>Selector {sel.tipo === "multiple" ? `Múltiple (Hasta ${sel.maxSelecciones})` : "Único"}</span>
                    <span className={estilos.badgeEfectoValor}>{sel.opciones.length} opciones</span>
                  </div>
                  <span className={estilos.descripcionEfectoItem}>
                    <strong>{sel.etiqueta}:</strong> {sel.opciones.map((o) => o.nombre).join(", ")}
                  </span>
                </div>
                <button
                  type="button"
                  className={estilos.botonEliminarEfecto}
                  onClick={() => manejarEliminarSelector(sel.id)}
                  title="Eliminar este selector"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={estilos.pistaCampo} style={{ fontStyle: "italic" }}>
            No hay selectores de opciones configurados para este rasgo.
          </p>
        )}

        {/* Formulario para Crear Nuevo Selector */}
        {modoCreandoSelector ? (
          <div className={estilos.cajaNuevoEfecto}>
            <div className={estilos.cabeceraNuevoEfecto}>
              <span className={estilos.tituloNuevoEfecto}>Nuevo Selector de Opciones</span>
            </div>

            <div className={estilos.gridDosColumnas}>
              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Etiqueta del Selector</span>
                </label>
                <input
                  type="text"
                  className={estilos.inputControl}
                  placeholder="ej. Armas con Maestría, Maniobras de Batalla..."
                  value={nuevoSelectorEtiqueta}
                  onChange={(e) => setNuevoSelectorEtiqueta(e.target.value)}
                />
              </div>

              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Tipo de Selección</span>
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <SelectorDesplegable<"unico" | "multiple">
                    valor={nuevoSelectorTipo}
                    opciones={[
                      { valor: "unico", etiqueta: "Opción Única (1)" },
                      { valor: "multiple", etiqueta: "Selección Múltiple" }
                    ]}
                    alCambiar={(val) => setNuevoSelectorTipo(val)}
                  />
                  {nuevoSelectorTipo === "multiple" && (
                    <input
                      type="number"
                      min={1}
                      className={estilos.inputControl}
                      style={{ width: "80px" }}
                      title="Máximo de selecciones"
                      placeholder="Máx."
                      value={nuevoSelectorMax}
                      onChange={(e) => setNuevoSelectorMax(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className={estilos.campoGrupo} style={{ marginTop: "8px" }}>
              <label className={estilos.labelCampo}>
                <span>Opciones disponibles (separadas por comas o saltos de línea)</span>
              </label>
              <textarea
                className={estilos.inputControl}
                rows={3}
                placeholder="ej. Espada larga, Hacha de batalla, Daga, Alabarda..."
                value={nuevoOpcionesTexto}
                onChange={(e) => setNuevoOpcionesTexto(e.target.value)}
              />
              <p className={estilos.pistaCampo}>
                Ingresa los nombres de las opciones entre las que el jugador podrá escoger en su hoja.
              </p>
            </div>

            <div className={estilos.botonesNuevoEfecto}>
              <button
                type="button"
                className={estilos.botonCancelarEfecto}
                onClick={() => setModoCreandoSelector(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={estilos.botonConfirmarEfecto}
                onClick={manejarAgregarSelector}
              >
                Confirmar Selector
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={estilos.botonAnadirEfecto}
            onClick={() => setModoCreandoSelector(true)}
          >
            <Plus size={14} />
            <span>Añadir Selector de Opciones</span>
          </button>
        )}
      </div>

      {/* 6. Previsualización en Vivo de la Tarjeta del Jugador */}
      <div className={estilos.seccionCard}>
        <div className={estilos.tituloPrevisualizacion}>
          <Eye size={13} />
          <span>Vista Previa en Vivo (Cómo se verá en tu lista de juego)</span>
        </div>

        <div style={{ maxWidth: "420px", margin: "0 auto", width: "100%" }}>
          <TarjetaRasgo
            rasgo={rasgoPrevisualizado}
            nombrePersonaje={personaje.nombre || "Personaje"}
            alGastarUso={() => {}}
            alRecuperarUso={() => {}}
            alAlternarActivo={() => {}}
            alEditar={() => {}}
            alEliminar={() => {}}
            alVerDetalle={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
