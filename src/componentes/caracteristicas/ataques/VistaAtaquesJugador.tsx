import React, { useState, useMemo, useCallback } from "react";
import {
  usarEstadoPersonajes,
  usarAccionesPersonajes,
  calcularEstadisticasPersonaje,
  usarEstadoHomebrew,
  usarEstadoConfiguracion,
  usarAccionesConfiguracion
} from "@/almacen/selectores";
import { OBJETOS_INICIALES } from "@/utiles/datosIniciales";
import {
  TarjetaAtaquePersonaje,
  AtaquePersonajeCalculado,
  TipoAccionConsumida
} from "./TarjetaAtaquePersonaje";
import { TarjetaConsumibleAccion } from "./TarjetaConsumibleAccion";
import type { ConsumibleAccionCalculado } from "./TarjetaConsumibleAccion.tipos";
import { TarjetaConjuroCompacta } from "@/componentes/caracteristicas/personajes/TarjetaConjuroCompacta";
import { TrackerEspaciosConjuro } from "@/componentes/caracteristicas/personajes/TrackerEspaciosConjuro";
import { TrackerEspaciosPacto } from "@/componentes/caracteristicas/personajes/TrackerEspaciosPacto";
import { TrackerPuntosConjuro } from "@/componentes/caracteristicas/personajes/TrackerPuntosConjuro";
import { FichaHechizo } from "@/componentes/caracteristicas/compendio/FichaHechizo";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import { calcularBonoAtaqueConjuro, gastarRecursoLanzamientoConjuro } from "@/servicios/calculadorMagia";
import { detectarInfoConsumible, evaluarFormulaDados, esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { resolverEstadoMunicionArma, esMunicionCompatibleConArma } from "@/servicios/gestorMunicion";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import { COSTE_PUNTOS_POR_NIVEL } from "@/constantes";
import type { Arma, ObjetoJuego, HechizoBase, Caracteristica, HechizoVinculado } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { usarEstadoPersistido } from "@/hooks";
import { Swords, Sparkles, UserCheck, FlaskConical, ChevronDown, ChevronRight, Zap } from "lucide-react";
import estilos from "./VistaAtaquesJugador.module.css";

type FiltroAccion = "todas" | "accion" | "accionAdicional" | "reaccion";

export const VistaAtaquesJugador: React.FC = () => {
  const { personajes, personajeActivo } = usarEstadoPersonajes();
  const { agregarNotificacion } = usarAccionesConfiguracion();
  const {
    seleccionarPersonajeActivo,
    gastarEspacioConjuro,
    recuperarEspacioConjuro,
    recuperarTodosEspaciosConjuro,
    gastarPuntosConjuro,
    recuperarPuntosConjuro,
    recuperarTodosPuntosConjuro,
    gastarEspacioPacto,
    establecerConcentracion,
    modificarCantidadObjeto,
    modificarCargasObjeto,
    aplicarCuracionPersonaje
  } = usarAccionesPersonajes();

  const { objetosHomebrew, baseDatosHechizos } = usarEstadoHomebrew();
  const { sistemaMagia } = usarEstadoConfiguracion();

  // Filtro activo persistente (conserva la selección al cambiar de pestaña)
  const [filtro, setFiltro] = usarEstadoPersistido<FiltroAccion>("ts_acciones_filtro", "todas");

  // Control de secciones colapsables persistente (conserva qué secciones están abiertas o colapsadas)
  const [seccionesAbiertas, setSeccionesAbiertas] = usarEstadoPersistido<Record<string, boolean>>(
    "ts_acciones_secciones",
    {
      recursos: true,
      fisicos: true,
      magicos: true,
      consumibles: true
    }
  );

  const alternarSeccion = (seccion: string) => {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

  // Estado para modal de detalle de conjuro si se pulsa "Ver"
  const [hechizoDetalle, setHechizoDetalle] = useState<HechizoBase | null>(null);

  // Overrides de característica por arma persistente por personaje (ej. Pacto de la Hoja -> CAR, Shillelagh -> SAB, Artífice -> INT)
  const claveArmasPj = `ts_caracteristicas_armas_${personajeActivo?.id || "default"}`;
  const [caracteristicasArmas, setCaracteristicasArmas] = usarEstadoPersistido<Record<string, Caracteristica>>(
    claveArmasPj,
    {}
  );

  const manejarCambiarCaracteristicaArma = useCallback((idInstancia: string, nuevaCarac: Caracteristica) => {
    setCaracteristicasArmas((prev) => ({
      ...prev,
      [idInstancia]: nuevaCarac
    }));
  }, [setCaracteristicasArmas]);

  // Base de datos completa de Objetos sin duplicados (Oficial + Homebrew)
  const baseDatosObjetos = useMemo<ObjetoJuego[]>(() => {
    return desduplicarEntidades(OBJETOS_INICIALES, objetosHomebrew);
  }, [objetosHomebrew]);

  const baseDatosConjuros = baseDatosHechizos || [];

  const statsCalculadas = useMemo(() => {
    if (!personajeActivo) return null;
    return calcularEstadisticasPersonaje(personajeActivo);
  }, [personajeActivo]);

  // Habilidad mágica del personaje
  const habilidadMagica: Caracteristica = useMemo(() => {
    if (personajeActivo?.clasesLanzadoras && personajeActivo.clasesLanzadoras.length > 0) {
      return personajeActivo.clasesLanzadoras[0].habilidadConjuro as Caracteristica;
    }
    const clase = (personajeActivo?.clase || "").toLowerCase();
    if (clase.includes("brujo") || clase.includes("bardo") || clase.includes("hechicero") || clase.includes("paladín") || clase.includes("paladin")) {
      return "carisma";
    }
    if (clase.includes("clérigo") || clase.includes("clerigo") || clase.includes("druida") || clase.includes("explorador")) {
      return "sabiduria";
    }
    return "inteligencia";
  }, [personajeActivo]);

  // Construir la lista dinámica de ataques físicos y desarmados
  const listaAtaquesFisicos = useMemo<AtaquePersonajeCalculado[]>(() => {
    if (!personajeActivo || !statsCalculadas) return [];

    const ataques: AtaquePersonajeCalculado[] = [];
    const inventario = personajeActivo.inventario || [];
    const normalizar = (s: string) => s.toLowerCase().trim();

    const bonoCompetencia = statsCalculadas.bonoCompetencia;
    const modificadores = statsCalculadas.modificadores;

    const clasePrincipal = personajeActivo.clase || "";
    const esMonje = clasePrincipal.toLowerCase().includes("monje");

    // 1. Armas Equipadas
    const armasEquipadas = inventario.filter(
      (obj) => obj.equipado && obj.tipoPrincipal === "Arma"
    );

    for (const armaInst of armasEquipadas) {
      const objetoCompendio = baseDatosObjetos.find(
        (o: ObjetoJuego) => o.id === armaInst.idObjeto || normalizar(o.nombre) === normalizar(armaInst.nombre)
      ) as Arma | undefined;

      const nombreNorm = normalizar(armaInst.nombre);

      // Inferencia de armería si no existe en el compendio
      let propiedadesInferidas: string[] = [];
      let tipoAtaqueInferido: "Cuerpo a Cuerpo" | "A Distancia" = "Cuerpo a Cuerpo";
      let dadoBaseInferido = "1d6";
      let tipoDanoInferido: "Contundente" | "Perforante" | "Cortante" = "Contundente";
      let danoVersatilInferido: string | undefined = undefined;
      let alcanceInferido: string | undefined = "5 ft";

      if (nombreNorm.includes("arco largo") || nombreNorm.includes("longbow")) {
        dadoBaseInferido = "1d8"; tipoDanoInferido = "Perforante"; alcanceInferido = "150/600 ft"; tipoAtaqueInferido = "A Distancia"; propiedadesInferidas = ["A dos manos", "Pesada", "Munición"];
      } else if (nombreNorm.includes("arco corto") || nombreNorm.includes("shortbow")) {
        dadoBaseInferido = "1d6"; tipoDanoInferido = "Perforante"; alcanceInferido = "80/320 ft"; tipoAtaqueInferido = "A Distancia"; propiedadesInferidas = ["A dos manos", "Munición"];
      } else if (nombreNorm.includes("ballesta ligera") || nombreNorm.includes("light crossbow")) {
        dadoBaseInferido = "1d8"; tipoDanoInferido = "Perforante"; alcanceInferido = "80/320 ft"; tipoAtaqueInferido = "A Distancia"; propiedadesInferidas = ["A dos manos", "Carga", "Munición"];
      } else if (nombreNorm.includes("ballesta pesada") || nombreNorm.includes("heavy crossbow")) {
        dadoBaseInferido = "1d10"; tipoDanoInferido = "Perforante"; alcanceInferido = "100/400 ft"; tipoAtaqueInferido = "A Distancia"; propiedadesInferidas = ["A dos manos", "Pesada", "Carga", "Munición"];
      } else if (nombreNorm.includes("ballesta de mano") || nombreNorm.includes("hand crossbow")) {
        dadoBaseInferido = "1d6"; tipoDanoInferido = "Perforante"; alcanceInferido = "30/120 ft"; tipoAtaqueInferido = "A Distancia"; propiedadesInferidas = ["Ligera", "Carga", "Munición"];
      } else if (nombreNorm.includes("daga") || nombreNorm.includes("dagger")) {
        dadoBaseInferido = "1d4"; tipoDanoInferido = "Perforante"; alcanceInferido = "20/60 ft"; propiedadesInferidas = ["Sutil", "Ligera", "Arrojadiza"];
      } else if (nombreNorm.includes("espada corta") || nombreNorm.includes("shortsword")) {
        dadoBaseInferido = "1d6"; tipoDanoInferido = "Perforante"; propiedadesInferidas = ["Sutil", "Ligera"];
      } else if (nombreNorm.includes("espada larga") || nombreNorm.includes("longsword")) {
        dadoBaseInferido = "1d8"; danoVersatilInferido = "1d10"; tipoDanoInferido = "Cortante"; propiedadesInferidas = ["Versátil"];
      } else if (nombreNorm.includes("espadón") || nombreNorm.includes("espadon") || nombreNorm.includes("greatsword")) {
        dadoBaseInferido = "2d6"; tipoDanoInferido = "Cortante"; propiedadesInferidas = ["A dos manos", "Pesada"];
      } else if (nombreNorm.includes("cimitarra") || nombreNorm.includes("scimitar")) {
        dadoBaseInferido = "1d6"; tipoDanoInferido = "Cortante"; propiedadesInferidas = ["Sutil", "Ligera"];
      } else if (nombreNorm.includes("estoque") || nombreNorm.includes("rapier")) {
        dadoBaseInferido = "1d8"; tipoDanoInferido = "Perforante"; propiedadesInferidas = ["Sutil"];
      } else if (nombreNorm.includes("hacha de batalla") || nombreNorm.includes("battleaxe")) {
        dadoBaseInferido = "1d8"; danoVersatilInferido = "1d10"; tipoDanoInferido = "Cortante"; propiedadesInferidas = ["Versátil"];
      } else if (nombreNorm.includes("gran hacha") || nombreNorm.includes("greataxe")) {
        dadoBaseInferido = "1d12"; tipoDanoInferido = "Cortante"; propiedadesInferidas = ["A dos manos", "Pesada"];
      } else if (nombreNorm.includes("lanza") || nombreNorm.includes("spear")) {
        dadoBaseInferido = "1d6"; danoVersatilInferido = "1d8"; tipoDanoInferido = "Perforante"; alcanceInferido = "20/60 ft"; propiedadesInferidas = ["Versátil", "Arrojadiza"];
      } else if (nombreNorm.includes("bastón") || nombreNorm.includes("baston") || nombreNorm.includes("quarterstaff")) {
        dadoBaseInferido = "1d6"; danoVersatilInferido = "1d8"; tipoDanoInferido = "Contundente"; propiedadesInferidas = ["Versátil"];
      } else if (nombreNorm.includes("martillo de guerra") || nombreNorm.includes("warhammer")) {
        dadoBaseInferido = "1d8"; danoVersatilInferido = "1d10"; tipoDanoInferido = "Contundente"; propiedadesInferidas = ["Versátil"];
      } else if (nombreNorm.includes("tridente") || nombreNorm.includes("trident")) {
        dadoBaseInferido = "1d8"; danoVersatilInferido = "1d10"; tipoDanoInferido = "Perforante"; alcanceInferido = "20/60 ft"; propiedadesInferidas = ["Versátil", "Arrojadiza"];
      }

      const propiedades = objetoCompendio?.propiedades || propiedadesInferidas;
      const esSutil = propiedades.some((p) => normalizar(p).includes("sutil") || normalizar(p).includes("finesse"));
      const esDistancia = objetoCompendio?.tipoAtaque === "A Distancia" || tipoAtaqueInferido === "A Distancia" || propiedades.some((p) => normalizar(p).includes("distancia") || normalizar(p).includes("munición"));

      // Característica por defecto
      let caracDefecto: Caracteristica = "fuerza";
      if (esDistancia) {
        caracDefecto = "destreza";
      } else if (esSutil) {
        caracDefecto = (modificadores.destreza || 0) > (modificadores.fuerza || 0) ? "destreza" : "fuerza";
      } else if (esMonje) {
        caracDefecto = (modificadores.destreza || 0) > (modificadores.fuerza || 0) ? "destreza" : "fuerza";
      }

      // Si el usuario configuró override (ej. Pacto de la Hoja)
      const caracUsada = caracteristicasArmas[armaInst.idInstancia] || caracDefecto;
      const modAtributo = modificadores[caracUsada] || 0;

      // Bono mágico (detectado por regex en nombre o propiedades del compendio)
      let bonoMagico = 0;
      const match = armaInst.nombre.match(/\+(\d+)/);
      if (match) {
        bonoMagico = parseInt(match[1], 10);
      } else if (objetoCompendio && (objetoCompendio as Record<string, unknown>).bonoAtaque) {
        bonoMagico = Number((objetoCompendio as Record<string, unknown>).bonoAtaque) || 0;
      } else if (objetoCompendio && (objetoCompendio as Record<string, unknown>).bonoMagico) {
        bonoMagico = Number((objetoCompendio as Record<string, unknown>).bonoMagico) || 0;
      }

      const esMagicoReal = armaInst.esMagico || !!objetoCompendio?.esMagico || bonoMagico > 0;
      const bonoAtaque = bonoCompetencia + modAtributo + bonoMagico;
      const dadoDanoBase = objetoCompendio?.dadoDano || dadoBaseInferido;
      const tipoDano = objetoCompendio?.tipoDano || tipoDanoInferido;
      const modDanoTotal = modAtributo + bonoMagico;
      const signoMod = modDanoTotal >= 0 ? `+${modDanoTotal}` : `${modDanoTotal}`;
      const formulaDano = modDanoTotal !== 0 ? `${dadoDanoBase}${signoMod}` : dadoDanoBase;

      // Daño versátil si aplica (extrayendo únicamente dados limpios para sumar el modificador de atributo)
      let formulaVersatil: string | undefined;
      let dadoVersatilBase: string | undefined;
      const esPropiedadVersatil = propiedades.some((p) => normalizar(p).includes("versat") || normalizar(p).includes("versatile"));
      const rawVersatil = objetoCompendio?.danoVersatil || danoVersatilInferido;

      if (rawVersatil) {
        const matchDadosV = rawVersatil.match(/(\d+d\d+)/i);
        dadoVersatilBase = matchDadosV ? matchDadosV[1] : rawVersatil.trim();
        formulaVersatil = modDanoTotal !== 0 ? `${dadoVersatilBase}${signoMod}` : dadoVersatilBase;
      } else if (esPropiedadVersatil) {
        if (dadoDanoBase.includes("1d6")) dadoVersatilBase = "1d8";
        else if (dadoDanoBase.includes("1d8")) dadoVersatilBase = "1d10";
        else if (dadoDanoBase.includes("1d10")) dadoVersatilBase = "1d12";
        else if (dadoDanoBase.includes("1d4")) dadoVersatilBase = "1d6";

        if (dadoVersatilBase) {
          formulaVersatil = modDanoTotal !== 0 ? `${dadoVersatilBase}${signoMod}` : dadoVersatilBase;
        }
      }

      // Alcance
      let alcanceStr = alcanceInferido;
      if (objetoCompendio?.alcanceNormal) {
        alcanceStr = `${objetoCompendio.alcanceNormal}/${objetoCompendio.alcanceLargo || objetoCompendio.alcanceNormal} ft`;
      }

      // Detección estricta de compatibilidad de munición y contenedor
      const estadoMunicion = resolverEstadoMunicionArma(armaInst.nombre, propiedades, inventario, baseDatosObjetos);
      const requiereMunicion = estadoMunicion.requiereMunicion;
      const municionNombre = estadoMunicion.nombreMunicionEsperada;
      const municionCantidad = estadoMunicion.municionDisponibleCantidad;
      const nombreContenedor = estadoMunicion.tieneContenedorEnInventario ? estadoMunicion.nombreContenedorDetectado : undefined;
      const tieneContenedor = estadoMunicion.tieneContenedorEnInventario;
      const municionEnContenedor = estadoMunicion.municionEnContenedor;
      const municionSueltEnMochila = estadoMunicion.municionSueltEnMochila;
      const municionEnCompartimentosExternos = estadoMunicion.municionEnCompartimentosExternos;
      const puedeDisparar = estadoMunicion.puedeDisparar;
      const motivoBloqueo = estadoMunicion.motivoBloqueo;

      ataques.push({
        id: armaInst.idInstancia,
        nombre: armaInst.nombre,
        tipo: "Arma",
        subtipo: objetoCompendio?.tipoAtaque || (esDistancia ? "A Distancia" : "Cuerpo a Cuerpo"),
        tipoAccion: "accion",
        caracteristicaUsada: caracUsada,
        bonoAtaque,
        dadoDano: formulaDano,
        dadoDanoBase,
        modificadorDano: modDanoTotal,
        esDanoFijo: false,
        danoVersatil: formulaVersatil,
        dadoVersatilBase,
        tipoDano,
        alcance: alcanceStr,
        propiedades,
        maestria: objetoCompendio?.maestria,
        esMagico: esMagicoReal,
        tieneTiradaAtaque: true,
        requiereMunicion,
        municionNombre,
        municionCantidad,
        nombreContenedor,
        tieneContenedor,
        municionEnContenedor,
        municionSueltEnMochila,
        municionEnCompartimentosExternos,
        puedeDisparar,
        motivoBloqueo
      });
    }

    // 2. Ataque Desarmado (Golpe sin Armas)
    const modFue = modificadores.fuerza || 0;
    const modDes = modificadores.destreza || 0;
    const caracDesarmado: Caracteristica = esMonje && modDes > modFue ? "destreza" : "fuerza";
    const modDesarmado = modificadores[caracDesarmado] || 0;
    const bonoAtaqueDesarmado = bonoCompetencia + modDesarmado;

    if (esMonje) {
      // Monje: dado de artes marciales (D&D 5.5e: 1-4: 1d6, 5-10: 1d8, 11-16: 1d10, 17-20: 1d12)
      const nivelPj = personajeActivo.nivel || 1;
      let dadoMonje = "1d6";
      if (nivelPj >= 17) dadoMonje = "1d12";
      else if (nivelPj >= 11) dadoMonje = "1d10";
      else if (nivelPj >= 5) dadoMonje = "1d8";

      const formulaMonje = modDesarmado !== 0 ? `${dadoMonje}${modDesarmado >= 0 ? `+${modDesarmado}` : modDesarmado}` : dadoMonje;
      ataques.push({
        id: "ataque-desarmado",
        nombre: "Golpe sin Armas (Artes Marciales)",
        tipo: "Desarmado",
        subtipo: "Cuerpo a Cuerpo",
        tipoAccion: "accion",
        caracteristicaUsada: caracDesarmado,
        bonoAtaque: bonoAtaqueDesarmado,
        dadoDano: formulaMonje,
        dadoDanoBase: dadoMonje,
        modificadorDano: modDesarmado,
        esDanoFijo: false,
        tipoDano: "Contundente",
        alcance: "5 ft",
        propiedades: ["Artes Marciales"],
        tieneTiradaAtaque: true
      });
    } else {
      // Regla D&D 5.5e estándar: Daño Fijo 1 + FUE (Sin tirar dados de daño)
      const danoFijo = Math.max(1, 1 + modFue);
      ataques.push({
        id: "ataque-desarmado",
        nombre: "Golpe sin Armas",
        tipo: "Desarmado",
        subtipo: "Cuerpo a Cuerpo",
        tipoAccion: "accion",
        caracteristicaUsada: "fuerza",
        bonoAtaque: bonoAtaqueDesarmado,
        dadoDano: `${danoFijo}`,
        dadoDanoBase: "1",
        modificadorDano: modFue,
        esDanoFijo: true,
        tipoDano: "Contundente",
        alcance: "5 ft",
        propiedades: [],
        tieneTiradaAtaque: true
      });
    }

    return ataques;
  }, [personajeActivo, statsCalculadas, baseDatosObjetos, caracteristicasArmas]);

  // Conjuros preparados y conocidos categorizados por acción
  const conjurosAcciones = useMemo(() => {
    if (!personajeActivo) return [];

    const listaIds = [
      ...(personajeActivo.trucosConocidosIds || []),
      ...(personajeActivo.conjurosSiemprePreparadosIds || []),
      ...(personajeActivo.conjurosPreparadosIds || []),
      ...(personajeActivo.conjurosConocidosIds || [])
    ];

    const idsUnicos = Array.from(new Set(listaIds));
    const normalizar = (s: string) => s.toLowerCase().trim();

    const resultado: { hechizo: HechizoBase; tipoAccion: TipoAccionConsumida }[] = [];

    for (const id of idsUnicos) {
      const h = baseDatosConjuros.find(
        (c: HechizoBase) => c.id === id || normalizar(c.nombre) === normalizar(id)
      );
      if (h) {
        const tiempo = (h.tiempoLanzamiento || "").toLowerCase();
        let tipoAccion: TipoAccionConsumida = "accion";
        if (tiempo.includes("adicional") || tiempo.includes("bonus")) {
          tipoAccion = "accionAdicional";
        } else if (tiempo.includes("reacci")) {
          tipoAccion = "reaccion";
        }

        resultado.push({ hechizo: h, tipoAccion });
      }
    }

    resultado.sort((a, b) => a.hechizo.nivel - b.hechizo.nivel || a.hechizo.nombre.localeCompare(b.hechizo.nombre, "es"));
    return resultado;
  }, [personajeActivo, baseDatosConjuros]);

  // Lista dinámica de consumibles y pociones (D&D 5.5e Acción Rápida)
  const listaConsumibles = useMemo<ConsumibleAccionCalculado[]>(() => {
    if (!personajeActivo) return [];
    const inventario = personajeActivo.inventario || [];
    const resultado: ConsumibleAccionCalculado[] = [];

    for (const obj of inventario) {
      const esConsumible = esObjetoConsumible(obj.nombre, obj.notas);

      if (esConsumible && obj.cantidad > 0) {
        const info = detectarInfoConsumible(obj.nombre, obj.notas);
        resultado.push({
          idInstancia: obj.idInstancia,
          nombre: obj.nombre,
          cantidad: obj.cantidad,
          tipoAccion: info.esAccionAdicional ? "accionAdicional" : "accion",
          esPocion: info.esPocion,
          esCurativo: info.esCurativo,
          formulaCuracion: info.formulaCuracion,
          descripcionUso: info.descripcionUso,
          notas: obj.notas
        });
      }
    }

    return resultado;
  }, [personajeActivo]);

  // Hechizos vinculados a Objetos Mágicos equipados y sintonizados
  const hechizosObjetosMagicos = useMemo(() => {
    if (!personajeActivo) return [];
    const inventario = personajeActivo.inventario || [];
    const normalizar = (s: string) => s.toLowerCase().trim();
    const lista: {
      objetoInstanciaId: string;
      objetoNombre: string;
      cargasActuales: number;
      cargasMaximas: number;
      hechizo: HechizoVinculado;
      tipoAccion: TipoAccionConsumida;
    }[] = [];

    for (const obj of inventario) {
      if (!obj.equipado) continue;
      if (obj.sintonizacionRequerida && !obj.sintonizado) continue;

      const objComp =
        objetosHomebrew.find((b) => b.id === obj.idObjeto || normalizar(b.nombre) === normalizar(obj.nombre)) ||
        OBJETOS_INICIALES.find((b) => b.id === obj.idObjeto || normalizar(b.nombre) === normalizar(obj.nombre));

      const hechizos = (obj as Record<string, unknown>).hechizosVinculados || objComp?.hechizosVinculados;
      if (hechizos && Array.isArray(hechizos)) {
        const cMax = obj.cargasMaximas ?? ((objComp as Record<string, unknown>)?.cargasMaximas as number | undefined) ?? 0;
        const cAct = obj.cargasActuales ?? cMax;
        for (const h of hechizos as HechizoVinculado[]) {
          let tipoAccion: TipoAccionConsumida = "accion";
          const hTipoAccion = (h as Record<string, unknown>).tipoAccion as string | undefined;
          const taNorm = normalizar(hTipoAccion || "");
          if (taNorm.includes("adicional") || taNorm.includes("bonus")) tipoAccion = "accionAdicional";
          else if (taNorm.includes("reaccion") || taNorm.includes("reacción")) tipoAccion = "reaccion";

          lista.push({
            objetoInstanciaId: obj.idInstancia,
            objetoNombre: obj.nombre,
            cargasActuales: cAct,
            cargasMaximas: cMax,
            hechizo: h,
            tipoAccion
          });
        }
      }
    }
    return lista;
  }, [personajeActivo, objetosHomebrew]);

  // Manejadores de Tiradas para Armas y Ataques Físicos
  const manejarTirarAtaque = async (ataque: AtaquePersonajeCalculado) => {
    try {
      const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
      const bonoStr = ataque.bonoAtaque >= 0 ? `+${ataque.bonoAtaque}` : `${ataque.bonoAtaque}`;
      const formulaDados = `!Ataque ${sanitizarEtiqueta(ataque.nombre)}:1d20${bonoStr}`;
      const etiquetaLog = `${nombrePj} - Ataque con ${ataque.nombre}`;

      // Descontar munición compatible si el arma la requiere (estrictamente desde contenedor de la mochila)
      if (ataque.requiereMunicion && personajeActivo) {
        const inv = personajeActivo.inventario || [];
        const estadoActual = resolverEstadoMunicionArma(ataque.nombre, ataque.propiedades, inv, baseDatosObjetos);

        if (!estadoActual.puedeDisparar || estadoActual.municionEnContenedor <= 0) {
          agregarNotificacion(
            estadoActual.motivoBloqueo || `¡No puedes disparar! No tienes ${ataque.municionNombre || "munición"} lista en tu contenedor llevado encima.`,
            "advertencia"
          );
          return;
        }

        const municionItemMochila = inv.find((it) => {
          const enMochila = (it.contenedor || "mochila") === "mochila";
          return enMochila && it.cantidad > 0 && esMunicionCompatibleConArma(ataque.nombre, it, ataque.propiedades, baseDatosObjetos);
        });

        if (municionItemMochila) {
          modificarCantidadObjeto(personajeActivo.id, municionItemMochila.idInstancia, -1);
        }
      }

      await lanzarDadosTaleSpire(formulaDados, etiquetaLog);
    } catch (err) {
      console.error("[VistaAtaquesJugador] Error al tirar ataque:", err);
    }
  };

  const manejarTirarDano = async (ataque: AtaquePersonajeCalculado, versatil: boolean = false) => {
    try {
      if (ataque.esDanoFijo) return; // No tirar dados si es daño fijo

      const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
      const formulaDadoUsar = versatil && ataque.danoVersatil ? ataque.danoVersatil : ataque.dadoDano;
      const formulaDados = `!Daño ${sanitizarEtiqueta(ataque.tipoDano)}:${formulaDadoUsar}`;
      const etiquetaLog = `${nombrePj} - Daño ${ataque.nombre}${versatil ? " (2 Manos)" : ""}`;
      await lanzarDadosTaleSpire(formulaDados, etiquetaLog);
    } catch (err) {
      console.error("[VistaAtaquesJugador] Error al tirar daño:", err);
    }
  };

  const manejarTirarCritico = async (ataque: AtaquePersonajeCalculado, versatil: boolean = false) => {
    try {
      if (ataque.esDanoFijo || !ataque.tieneTiradaAtaque) return;

      const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
      const dadoBase = versatil && ataque.dadoVersatilBase ? ataque.dadoVersatilBase : ataque.dadoDanoBase;

      // Duplicar el número de dados (ej. "1d8" -> "2d8", "1d10" -> "2d10", "2d6" -> "4d6")
      let formulaCritico = dadoBase;
      const matchDados = dadoBase.match(/^(\d+)d(\d+)/i);
      if (matchDados) {
        const numDados = parseInt(matchDados[1], 10) * 2;
        const tipoDado = matchDados[2];
        formulaCritico = `${numDados}d${tipoDado}`;
      } else {
        formulaCritico = `2d6`;
      }

      if (ataque.modificadorDano !== 0) {
        const signo = ataque.modificadorDano >= 0 ? `+${ataque.modificadorDano}` : `${ataque.modificadorDano}`;
        formulaCritico = `${formulaCritico}${signo}`;
      }

      const formulaDados = `!Crítico ${sanitizarEtiqueta(ataque.tipoDano)}:${formulaCritico}`;
      const etiquetaLog = `${nombrePj} - ¡Golpe Crítico! con ${ataque.nombre}${versatil ? " (2 Manos)" : ""}`;
      await lanzarDadosTaleSpire(formulaDados, etiquetaLog);
    } catch (err) {
      console.error("[VistaAtaquesJugador] Error al tirar crítico:", err);
    }
  };

  // Manejador de Acción Rápida "Usar" Consumible / Poción
  const manejarUsarConsumible = useCallback(async (cons: ConsumibleAccionCalculado) => {
    if (!personajeActivo) return;

    // 1. Reducir 1 unidad del inventario
    modificarCantidadObjeto(personajeActivo.id, cons.idInstancia, -1);

    // 2. Si es curativo, calcular tirada de sanación, tirar en TaleSpire y curar al personaje
    if (cons.esCurativo && cons.formulaCuracion) {
      const puntosCurados = evaluarFormulaDados(cons.formulaCuracion);
      aplicarCuracionPersonaje(personajeActivo.id, puntosCurados);

      const etiquetaTaleSpire = `!Curación ${sanitizarEtiqueta(cons.nombre)}:${cons.formulaCuracion}`;
      const log = `${personajeActivo.nombre} usa ${cons.nombre} y recupera ${puntosCurados} Puntos de Golpe`;
      try {
        await lanzarDadosTaleSpire(etiquetaTaleSpire, log);
      } catch (err) {
        console.error("[VistaAtaquesJugador] Error al tirar curación a TaleSpire:", err);
      }

      agregarNotificacion(
        `¡${cons.nombre} consumida! Has recuperado +${puntosCurados} PV.`,
        "exito"
      );
    } else {
      // Consumible no curativo
      const log = `${personajeActivo.nombre} usa ${cons.nombre}`;
      try {
        await lanzarDadosTaleSpire(`!Uso ${sanitizarEtiqueta(cons.nombre)}:1d1`, log);
      } catch (err) {
        console.error("[VistaAtaquesJugador] Error al enviar log a TaleSpire:", err);
      }
      agregarNotificacion(`Has usado 1× "${cons.nombre}".`, "info");
    }
  }, [personajeActivo, modificarCantidadObjeto, aplicarCuracionPersonaje, agregarNotificacion]);

  if (!personajeActivo || !statsCalculadas) {
    return (
      <div className={estilos.contenedorGeneral}>
        <div className={estilos.tarjetaVacia}>
          No hay personaje seleccionado. Selecciona o crea uno en la pestaña de Características.
        </div>
      </div>
    );
  }

  // Filtrado de ataques físicos, conjuros y consumibles
  const ataquesFisicosFiltrados = listaAtaquesFisicos.filter(
    (a) => filtro === "todas" || a.tipoAccion === filtro
  );

  const conjurosFiltrados = conjurosAcciones.filter(
    (item) => filtro === "todas" || item.tipoAccion === filtro
  );

  const consumiblesFiltrados = listaConsumibles.filter(
    (c) => filtro === "todas" || c.tipoAccion === filtro
  );

  const hechizosObjetosFiltrados = useMemo(() => {
    if (filtro === "todas") return hechizosObjetosMagicos;
    return hechizosObjetosMagicos.filter((h) => h.tipoAccion === filtro);
  }, [hechizosObjetosMagicos, filtro]);

  // Conteos para los botones de filtro
  const conteoAccion =
    listaAtaquesFisicos.filter((a) => a.tipoAccion === "accion").length +
    conjurosAcciones.filter((c) => c.tipoAccion === "accion").length +
    listaConsumibles.filter((c) => c.tipoAccion === "accion").length +
    hechizosObjetosMagicos.filter((h) => h.tipoAccion === "accion").length;

  const conteoAccionAdicional =
    listaAtaquesFisicos.filter((a) => a.tipoAccion === "accionAdicional").length +
    conjurosAcciones.filter((c) => c.tipoAccion === "accionAdicional").length +
    listaConsumibles.filter((c) => c.tipoAccion === "accionAdicional").length +
    hechizosObjetosMagicos.filter((h) => h.tipoAccion === "accionAdicional").length;

  const conteoReaccion =
    listaAtaquesFisicos.filter((a) => a.tipoAccion === "reaccion").length +
    conjurosAcciones.filter((c) => c.tipoAccion === "reaccion").length +
    listaConsumibles.filter((c) => c.tipoAccion === "reaccion").length +
    hechizosObjetosMagicos.filter((h) => h.tipoAccion === "reaccion").length;

  const conteoTotal =
    listaAtaquesFisicos.length +
    conjurosAcciones.length +
    listaConsumibles.length +
    hechizosObjetosMagicos.length;

  // Parámetros de magia
  const modMagico = statsCalculadas.modificadores[habilidadMagica] || 0;
  const bonoAtaqueMagico = calcularBonoAtaqueConjuro(
    statsCalculadas.bonoCompetencia,
    modMagico
  );

  const tieneEspaciosEstandar = Object.values(personajeActivo.espaciosConjuroMaximos || {}).some((v) => (v || 0) > 0);
  const tienePuntosEstandar = (personajeActivo.puntosConjuroMaximos || 0) > 0;
  const tieneMagiaEstandar = sistemaMagia === "puntos" ? tienePuntosEstandar : tieneEspaciosEstandar;
  const tienePacto = (personajeActivo.espaciosPactoMaximos || 0) > 0 || (personajeActivo.clase || "").toLowerCase().includes("brujo");

  return (
    <div className={estilos.contenedorGeneral}>
      {/* Cabecera Principal */}
      <div className={estilos.cabeceraPrincipal}>
        <div className={estilos.filaTitulo}>
          <div className={estilos.grupoTitulo}>
            <Swords size={18} color="#38bdf8" />
            <h2 className={estilos.tituloTexto}>Acciones de Combate</h2>
            <span className={estilos.contadorBadge}>{conteoTotal}</span>
          </div>

          {personajes.length > 1 && (
            <div className={estilos.selectorPersonaje}>
              <UserCheck size={14} color="#94a3b8" />
              <SelectorDesplegable<string>
                valor={personajeActivo.id}
                alCambiar={(id) => seleccionarPersonajeActivo(id)}
                tamano="compacto"
                opciones={personajes.map((pj) => ({
                  valor: pj.id,
                  etiqueta: `${pj.nombre} (${pj.clase || "PJ"})`
                }))}
              />
            </div>
          )}
        </div>

        {/* Barra de Filtros Tácticos de Acción */}
        <div className={estilos.barraFiltros}>
          <button
            type="button"
            className={`${estilos.botonFiltro} ${filtro === "todas" ? estilos.botonFiltroActivo : ""}`}
            onClick={() => setFiltro("todas")}
          >
            <span>Todas</span>
            <span className={estilos.badgeConteoFiltro}>({conteoTotal})</span>
          </button>

          <button
            type="button"
            className={`${estilos.botonFiltro} ${filtro === "accion" ? estilos.botonFiltroActivo : ""}`}
            onClick={() => setFiltro("accion")}
          >
            <span>Acción</span>
            <span className={estilos.badgeConteoFiltro}>({conteoAccion})</span>
          </button>

          <button
            type="button"
            className={`${estilos.botonFiltro} ${filtro === "accionAdicional" ? estilos.botonFiltroActivo : ""}`}
            onClick={() => setFiltro("accionAdicional")}
          >
            <span>Acción Adicional</span>
            <span className={estilos.badgeConteoFiltro}>({conteoAccionAdicional})</span>
          </button>

          <button
            type="button"
            className={`${estilos.botonFiltro} ${filtro === "reaccion" ? estilos.botonFiltroActivo : ""}`}
            onClick={() => setFiltro("reaccion")}
          >
            <span>Reacción</span>
            <span className={estilos.badgeConteoFiltro}>({conteoReaccion})</span>
          </button>
        </div>
      </div>

      {/* Trackers de Recursos Mágicos (Espacios de Conjuro, Pacto y Puntos) */}
      {(tieneMagiaEstandar || tienePacto) && (
        <div className={estilos.seccionGrupoAtaques}>
          <div
            className={estilos.cabeceraGrupoAtaques}
            onClick={() => alternarSeccion("recursos")}
            role="button"
            tabIndex={0}
            title="Clic para mostrar u ocultar espacios y recursos mágicos"
          >
            <div className={estilos.tituloGrupoAtaques}>
              <Sparkles size={14} color="#c084fc" />
              <span>Espacios y Recursos de Conjuro</span>
            </div>
            <div className={estilos.ladoDerechoCabecera}>
              {seccionesAbiertas.recursos ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          {seccionesAbiertas.recursos && (
            <div className={estilos.listaAtaques}>
              {tieneMagiaEstandar && (
                sistemaMagia === "puntos" ? (
                  <TrackerPuntosConjuro
                    puntosMaximos={personajeActivo.puntosConjuroMaximos || 0}
                    puntosGastados={personajeActivo.puntosConjuroGastados || 0}
                    nivelMaximo={personajeActivo.nivelConjuroMaximo || 0}
                    alGastarPuntos={(cant) => gastarPuntosConjuro(personajeActivo.id, cant)}
                    alRecuperarPuntos={(cant) => recuperarPuntosConjuro(personajeActivo.id, cant)}
                    alRecuperarTodosPuntos={() => recuperarTodosPuntosConjuro(personajeActivo.id)}
                    mostrarBotonRestablecer={false}
                    mostrarGastoManual={false}
                  />
                ) : (
                  <TrackerEspaciosConjuro
                    espaciosMaximos={personajeActivo.espaciosConjuroMaximos || {}}
                    espaciosGastados={personajeActivo.espaciosConjuroGastados || {}}
                    alGastarEspacio={(niv) => gastarEspacioConjuro(personajeActivo.id, niv)}
                    alRecuperarEspacio={(niv) => recuperarEspacioConjuro(personajeActivo.id, niv)}
                    alRecuperarTodosEspacios={() => recuperarTodosEspaciosConjuro(personajeActivo.id)}
                    mostrarBotonRestablecer={false}
                    soloLectura={true}
                  />
                )
              )}

              {tienePacto && (
                <TrackerEspaciosPacto
                  espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
                  espaciosPactoGastados={personajeActivo.espaciosPactoGastados || 0}
                  nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 1}
                  alGastarEspacioPacto={() => gastarEspacioPacto(personajeActivo.id)}
                  alRecuperarEspaciosPacto={() => recuperarTodosEspaciosConjuro(personajeActivo.id)}
                  mostrarBotonRecuperar={false}
                  soloLectura={true}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Sección 1: Ataques con Armas y Desarmado */}
      {ataquesFisicosFiltrados.length > 0 && (
        <div className={estilos.seccionGrupoAtaques}>
          <div
            className={estilos.cabeceraGrupoAtaques}
            onClick={() => alternarSeccion("fisicos")}
            role="button"
            tabIndex={0}
            title="Clic para mostrar u ocultar armas y ataques físicos"
          >
            <div className={estilos.tituloGrupoAtaques}>
              <Swords size={14} color="#38bdf8" />
              <span>Armas y Ataques Físicos</span>
              <span className={estilos.badgeConteoSeccion}>{ataquesFisicosFiltrados.length}</span>
            </div>
            <div className={estilos.ladoDerechoCabecera}>
              {seccionesAbiertas.fisicos ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          {seccionesAbiertas.fisicos && (
            <div className={estilos.listaAtaques}>
              {ataquesFisicosFiltrados.map((ataque) => (
                <TarjetaAtaquePersonaje
                  key={ataque.id}
                  ataque={ataque}
                  alTirarAtaque={manejarTirarAtaque}
                  alTirarDano={manejarTirarDano}
                  alTirarCritico={manejarTirarCritico}
                  alCambiarCaracteristica={manejarCambiarCaracteristicaArma}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sección 2: Conjuros y Trucos de Combate (DRY Completo) */}
      {conjurosFiltrados.length > 0 && (
        <div className={estilos.seccionGrupoAtaques}>
          <div
            className={estilos.cabeceraGrupoAtaques}
            onClick={() => alternarSeccion("magicos")}
            role="button"
            tabIndex={0}
            title="Clic para mostrar u ocultar conjuros y acciones mágicas"
          >
            <div className={estilos.tituloGrupoAtaques}>
              <Sparkles size={14} color="#c084fc" />
              <span>Conjuros y Acciones Mágicas</span>
              <span className={estilos.badgeConteoSeccion}>{conjurosFiltrados.length}</span>
            </div>
            <div className={estilos.ladoDerechoCabecera}>
              {seccionesAbiertas.magicos ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          {seccionesAbiertas.magicos && (
            <div className={estilos.listaAtaques}>
              {conjurosFiltrados.map(({ hechizo }) => (
                <TarjetaConjuroCompacta
                  key={hechizo.id}
                  hechizo={hechizo}
                  nombrePersonaje={personajeActivo.nombre}
                  nivelPersonaje={personajeActivo.nivel || 1}
                  bonoAtaqueMagico={bonoAtaqueMagico}
                  estaPreparado={true}
                  mostrarTogglePreparado={false}
                  esConcentracionActual={personajeActivo.concentracionActiva?.hechizoId === hechizo.id}
                  alAbrirDetalleCompleto={(h) => setHechizoDetalle(h)}
                  alQuitarDeLista={() => {}}
                  alGastarEspacio={(niv) => gastarEspacioConjuro(personajeActivo.id, niv)}
                  alGastarPuntos={(cant) => gastarPuntosConjuro(personajeActivo.id, cant)}
                  alGastarEspacioPacto={() => gastarEspacioPacto(personajeActivo.id)}
                  esLanzadorPacto={tienePacto}
                  nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 0}
                  espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
                  espaciosPactoGastados={personajeActivo.espaciosPactoGastados || 0}
                  espaciosConjuroMaximos={personajeActivo.espaciosConjuroMaximos || {}}
                  nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
                  alEstablecerConcentracion={(id, nombre) => establecerConcentracion(personajeActivo.id, id, nombre)}
                  costePuntosPorNivel={COSTE_PUNTOS_POR_NIVEL}
                  sistemaMagia={sistemaMagia}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sección 3: Consumibles y Pociones (D&D 5.5e Acción Rápida) */}
      {consumiblesFiltrados.length > 0 && (
        <div className={estilos.seccionGrupoAtaques}>
          <div
            className={estilos.cabeceraGrupoAtaques}
            onClick={() => alternarSeccion("consumibles")}
            role="button"
            tabIndex={0}
            title="Clic para mostrar u ocultar consumibles y pociones"
          >
            <div className={estilos.tituloGrupoAtaques}>
              <FlaskConical size={14} color="#10b981" />
              <span>Consumibles y Pociones</span>
              <span className={estilos.badgeConteoSeccion}>{consumiblesFiltrados.length}</span>
            </div>
            <div className={estilos.ladoDerechoCabecera}>
              {seccionesAbiertas.consumibles ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          {seccionesAbiertas.consumibles && (
            <div className={estilos.listaAtaques}>
              {consumiblesFiltrados.map((cons) => (
                <TarjetaConsumibleAccion
                  key={cons.idInstancia}
                  consumible={cons}
                  alUsar={manejarUsarConsumible}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sección 4: Hechizos de Objetos Mágicos */}
      {hechizosObjetosFiltrados.length > 0 && (
        <div className={estilos.seccionGrupoAtaques}>
          <div
            className={estilos.cabeceraGrupoAtaques}
            onClick={() => alternarSeccion("hechizosObjetos")}
            role="button"
            tabIndex={0}
            title="Clic para mostrar u ocultar hechizos de objetos mágicos"
          >
            <div className={estilos.tituloGrupoAtaques}>
              <Sparkles size={14} color="#ec4899" />
              <span>Hechizos de Objetos Mágicos</span>
              <span className={estilos.badgeConteoSeccion}>{hechizosObjetosFiltrados.length}</span>
            </div>
            <div className={estilos.ladoDerechoCabecera}>
              {seccionesAbiertas.hechizosObjetos ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          {seccionesAbiertas.hechizosObjetos && (
            <div className={estilos.listaAtaques}>
              {hechizosObjetosFiltrados.map((item, idx) => {
                const coste = Number(item.hechizo.costeCargas) || 0;
                const tieneCargas = coste === 0 || item.cargasActuales >= coste;
                const lanzarHechizo = async () => {
                  if (coste > 0) {
                    modificarCargasObjeto(personajeActivo.id, item.objetoInstanciaId, -coste);
                  }
                  const etiqueta = sanitizarEtiqueta(`Hechizo ${item.hechizo.nombre} (${item.objetoNombre})`);
                  if (item.hechizo.bonoAtaque !== undefined && !isNaN(Number(item.hechizo.bonoAtaque))) {
                    await lanzarDadosTaleSpire(`1d20+${item.hechizo.bonoAtaque}`, `Ataque Mágico: ${etiqueta}`);
                  } else if (item.hechizo.cd !== undefined && !isNaN(Number(item.hechizo.cd))) {
                    await lanzarDadosTaleSpire("1d20", `Salvación vs CD ${item.hechizo.cd} (${etiqueta})`);
                  } else {
                    await lanzarDadosTaleSpire("1d20", etiqueta);
                  }
                };

                return (
                  <div
                    key={idx}
                    className={`${estilos.tarjetaAtaque} ${estilos.tarjetaHechizoObjeto}`}
                  >
                    <div className={estilos.filaSuperiorAtaque}>
                      <div className={estilos.grupoTitulo}>
                        <Sparkles size={14} color="#ec4899" />
                        <span className={estilos.nombreAtaque}>{item.hechizo.nombre}</span>
                        <span className={estilos.nombreFuenteObjeto}>({item.objetoNombre})</span>
                      </div>
                      <div className={estilos.grupoTitulo}>
                        {item.cargasMaximas > 0 && (
                          <span className={item.cargasActuales > 0 ? estilos.badgeCargasObjeto : estilos.badgeCargasVacias}>
                            <Zap size={10} /> {item.cargasActuales}/{item.cargasMaximas} cargas
                          </span>
                        )}
                        <span className={estilos.badgeAccionTipo}>
                          {item.tipoAccion === "accionAdicional" ? "Acción Adicional" : item.tipoAccion === "reaccion" ? "Reacción" : "Acción"}
                        </span>
                      </div>
                    </div>

                    <div className={estilos.filaMetricasAtaque}>
                      <div className={estilos.bloqueBonoImpacto}>
                        <span className={estilos.etiquetaMicro}>
                          {item.hechizo.bonoAtaque !== undefined ? "Impacto" : item.hechizo.cd !== undefined ? "Salvación" : "Efecto"}
                        </span>
                        <span className={estilos.valorBonoImpacto}>
                          {item.hechizo.bonoAtaque !== undefined
                            ? `+${item.hechizo.bonoAtaque}`
                            : item.hechizo.cd !== undefined
                            ? `CD ${item.hechizo.cd}`
                            : "Especial"}
                        </span>
                      </div>

                      {coste > 0 && (
                        <div className={estilos.bloqueDano}>
                          <span className={estilos.etiquetaMicro}>Coste</span>
                          <span className={`${estilos.valorDano} ${estilos.costeCargasTexto}`}>
                            {coste} {coste === 1 ? "carga" : "cargas"}
                          </span>
                        </div>
                      )}

                      <div className={estilos.filaAccionesTirada}>
                        <button
                          type="button"
                          className={`${estilos.botonTirarAtaque} ${estilos.botonLanzarObjeto}`}
                          onClick={lanzarHechizo}
                          disabled={!tieneCargas}
                        >
                          <Sparkles size={11} />
                          <span>{coste > 0 ? `Lanzar (-${coste})` : "Lanzar"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Estado vacío cuando no hay acciones con el filtro seleccionado */}
      {ataquesFisicosFiltrados.length === 0 &&
        conjurosFiltrados.length === 0 &&
        consumiblesFiltrados.length === 0 &&
        hechizosObjetosFiltrados.length === 0 && (
          <div className={estilos.tarjetaVacia}>
            No se encontraron acciones de tipo <strong>"{filtro.toUpperCase()}"</strong> para este personaje.
          </div>
        )}

      {/* Modal de Detalle Completo de Hechizo (FichaHechizo DRY) */}
      {hechizoDetalle && (
        <div
          className={estilos.backdropModalHechizo}
          onClick={() => setHechizoDetalle(null)}
        >
          <div
            className={estilos.contenedorModalHechizo}
            onClick={(e) => e.stopPropagation()}
          >
            <FichaHechizo
              hechizo={hechizoDetalle}
              nombrePersonaje={personajeActivo.nombre}
              nivelPersonaje={personajeActivo.nivel || 1}
              bonoAtaqueMagico={bonoAtaqueMagico}
              esLanzadorPacto={tienePacto}
              nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 0}
              espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
              espaciosConjuroMaximos={personajeActivo.espaciosConjuroMaximos || {}}
              nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
              sistemaMagia={sistemaMagia}
              onClose={() => setHechizoDetalle(null)}
              onLanzarRitual={() => {
                if (hechizoDetalle.concentracion) {
                  establecerConcentracion(personajeActivo.id, hechizoDetalle.id, hechizoDetalle.nombre);
                }
                setHechizoDetalle(null);
              }}
              onLanzarConjuro={(nivelLanzamiento) => {
                if (hechizoDetalle.nivel > 0) {
                  gastarRecursoLanzamientoConjuro({
                    nivelLanzamiento,
                    esLanzadorPacto: tienePacto,
                    nivelEspacioPacto: personajeActivo.nivelEspacioPacto || 0,
                    espaciosPactoMaximos: personajeActivo.espaciosPactoMaximos || 0,
                    espaciosPactoGastados: personajeActivo.espaciosPactoGastados || 0,
                    espaciosConjuroMaximos: personajeActivo.espaciosConjuroMaximos || {},
                    sistemaMagia,
                    costePuntosPorNivel: COSTE_PUNTOS_POR_NIVEL,
                    alGastarEspacio: (niv) => gastarEspacioConjuro(personajeActivo.id, niv),
                    alGastarPuntos: (cant) => gastarPuntosConjuro(personajeActivo.id, cant),
                    alGastarEspacioPacto: () => gastarEspacioPacto(personajeActivo.id)
                  });
                }
                if (hechizoDetalle.concentracion) {
                  establecerConcentracion(personajeActivo.id, hechizoDetalle.id, hechizoDetalle.nombre);
                }
                setHechizoDetalle(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaAtaquesJugador;
