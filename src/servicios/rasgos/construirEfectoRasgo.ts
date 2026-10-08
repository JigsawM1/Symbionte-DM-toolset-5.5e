import type { EfectoMecanicoRasgo, TipoEfectoMecanico } from "@/tipos";
export interface BorradorEfectoRasgo {
    nuevoTipoEfecto: TipoEfectoMecanico;
    nuevoObjetivo: string;
    nuevoValor: string;
    nuevoTipoDano: string;
    nuevoAplicaA: string;
    nuevoLimiteMaximo: number;
    nuevoPermiteEscudo: boolean;
    nuevaDescripcionEfecto: string;
    nuevoCondicion: string;
}
export function construirEfectoRasgo(datos: BorradorEfectoRasgo, id: string, etiquetaObjetivo?: string): EfectoMecanicoRasgo {
    const {
      nuevoTipoEfecto,
      nuevoObjetivo,
      nuevoValor,
      nuevoTipoDano,
      nuevoAplicaA,
      nuevoLimiteMaximo,
      nuevoPermiteEscudo,
      nuevaDescripcionEfecto,
      nuevoCondicion
    } = datos;
    const efId = id;
    let descFinal = nuevaDescripcionEfecto.trim();
    if (!descFinal) {
        switch (nuevoTipoEfecto) {
            case "dado_extra_dano":
                descFinal = `+${nuevoValor} al daño (${nuevoAplicaA})`;
                break;
            case "dano_secundario":
                descFinal = `/${nuevoValor} [${nuevoTipoDano}]`;
                break;
            case "bono_ataque":
                descFinal = `+${nuevoValor} a tiradas de ataque (${nuevoAplicaA})`;
                break;
            case "bono_dano_ataque":
            case "bono_dano_fuerza":
                descFinal = nuevoAplicaA === "arma_pesada"
                    ? `+${nuevoValor} al daño (Armas Pesadas)`
                    : nuevoAplicaA === "arma_arrojadiza"
                        ? `+${nuevoValor} al daño (Armas Arrojadizas)`
                        : nuevoAplicaA === "arma_duelo"
                            ? `+${nuevoValor} al daño (Armas a Una Mano)`
                            : `+${nuevoValor} al daño físico`;
                break;
            case "bono_dano_conjuro":
                descFinal = `+${nuevoValor} al daño mágico (${nuevoAplicaA})`;
                break;
            case "modificador_ca":
                if (nuevoObjetivo === "defensa_sin_armadura") {
                    descFinal = `Defensa sin armadura (${nuevoValor})`;
                }
                else {
                    const condTexto = nuevoCondicion === "con_armadura" ? "con armadura" : nuevoCondicion || "incondicional";
                    descFinal = `+${nuevoValor} a la CA (${condTexto})`;
                }
                break;
            case "modificador_stat":
                descFinal = `+${nuevoValor} a ${nuevoObjetivo} (Límite ${nuevoLimiteMaximo})`;
                break;
            case "modificador_velocidad":
                descFinal = `+${nuevoValor} pies de velocidad`;
                break;
            case "movimiento_especial": {
                const esIgualVelocidad = nuevoValor === "caminar" || nuevoValor === "velocidad_caminar";
                const tipoMov = nuevoObjetivo.includes("escalar") || nuevoObjetivo.includes("trepar")
                    ? "trepando"
                    : nuevoObjetivo.includes("nadar")
                        ? "de nado"
                        : "volando";
                descFinal = esIgualVelocidad
                    ? `Velocidad ${tipoMov} igual a tu velocidad`
                    : `Velocidad ${tipoMov}: ${nuevoValor} pies`;
                break;
            }
            case "ventaja": {
                const optEncontrada = etiquetaObjetivo ? { etiqueta: etiquetaObjetivo } : undefined;
                descFinal = optEncontrada ? `Ventaja: ${optEncontrada.etiqueta}` : `Ventaja en ${nuevoObjetivo}`;
                break;
            }
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
            case "modificador_capacidad_carga":
                descFinal = `Capacidad de carga ×${nuevoValor}`;
                break;
            case "modificador_tamano":
                descFinal = `Tamaño modificado a ${nuevoValor}`;
                break;
            case "hp_temporal": {
                const vNorm = nuevoValor.trim().toLowerCase();
                if (vNorm === "bono_competencia" || vNorm === "pb" || vNorm === "bc") {
                    descFinal = "Otorga puntos de golpe temporales iguales al bono de competencia";
                }
                else if (vNorm === "nivel") {
                    descFinal = "Otorga puntos de golpe temporales iguales al nivel del personaje";
                }
                else if (vNorm === "constitucion" || vNorm === "con") {
                    descFinal = "Otorga puntos de golpe temporales iguales al modificador de Constitución";
                }
                else if (vNorm === "2_veces_dado_inspiracion") {
                    descFinal = "Puntos de golpe temporales iguales al doble del dado de inspiración";
                }
                else {
                    descFinal = `Puntos de golpe temporales: ${nuevoValor}`;
                }
                break;
            }
            case "modificador_hp_maximo":
                descFinal = `Modificador de HP Máximo: ${nuevoValor}`;
                break;
            case "restaurar_recurso": {
                const objNorm = nuevoObjetivo.trim().toLowerCase();
                if (objNorm === "inspiracion" || objNorm === "inspiracion_heroica" || objNorm.includes("inspiracion")) {
                    const condTexto = nuevoCondicion.includes("corto") ? "un descanso corto" : "un descanso largo";
                    descFinal = `Recupera Inspiración Heroica tras finalizar ${condTexto}`;
                }
                else {
                    descFinal = `Restaurar ${nuevoValor} uso(s) de ${nuevoObjetivo}${nuevoCondicion ? ` (${nuevoCondicion})` : ""}`;
                }
                break;
            }
            case "competencia":
                descFinal = `Competencia con ${nuevoObjetivo}`;
                break;
            case "limite_des_armadura_media":
                descFinal = `Límite de Destreza en armadura media: ${nuevoValor}`;
                break;
            case "dado_extra_critico":
                descFinal = `+${nuevoValor} dado extra en crítico (${nuevoAplicaA || nuevoObjetivo})`;
                break;
            default:
                descFinal = `${nuevoTipoEfecto}: ${nuevoValor}`;
                break;
        }
    }
    const nuevoEfecto: EfectoMecanicoRasgo = {
        id: efId,
        tipo: nuevoTipoEfecto,
        objetivo: nuevoTipoEfecto === "conjuro_gratuito" ? nuevoValor.trim() : nuevoObjetivo.trim() || "general",
        valor: nuevoValor.trim(),
        condicion: nuevoCondicion.trim() || undefined,
        tipoDano: nuevoTipoEfecto === "dano_secundario" ? (nuevoTipoDano.trim() || "Radiante") : undefined,
        aplicaA: nuevoAplicaA,
        limiteMaximo: nuevoTipoEfecto === "modificador_stat" ? nuevoLimiteMaximo : undefined,
        permiteEscudo: nuevoTipoEfecto === "modificador_ca" ? nuevoPermiteEscudo : undefined,
        descripcion: descFinal,
        activo: true
    };
    return nuevoEfecto;
}
