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
import { calcularBonoAtaqueConjuro } from "@/servicios/calculadorMagia";
import { detectarInfoConsumible, evaluarFormulaDados, esObjetoConsumible } from "@/servicios/procesadorConsumibles";
import { resolverEstadoMunicionArma, esMunicionCompatibleConArma } from "@/servicios/gestorMunicion";
import { desduplicarEntidades } from "@/utiles/busquedaTolerante";
import { esCompetenteConArma } from "@/constantes/competenciasConstantes";
import { evaluarEfectosCondicionesEnTirada } from "@/servicios/procesadorCondiciones";
import {
  obtenerDadosExtraAtaque,
  obtenerDanosSecundariosAtaque,
  obtenerBonoDanoFuerzaExtra,
  ContextoAtaquePersonaje
} from "@/servicios/evaluadorEfectosRasgos";
import type { Arma, ObjetoJuego, HechizoBase, Caracteristica, HechizoVinculado } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes";
import { usarEstadoPersistido, usarLanzadorConjuros } from "@/hooks";
import { Swords, Sparkles, UserCheck, FlaskConical, ChevronDown, ChevronRight, Zap, AlertTriangle } from "lucide-react";
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
    recuperarEspaciosPacto,
    modificarCantidadObjeto,
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

  // Parámetros de magia
  const modMagico = statsCalculadas ? statsCalculadas.modificadores[habilidadMagica] || 0 : 0;
  const bonoAtaqueMagico = statsCalculadas
    ? calcularBonoAtaqueConjuro(statsCalculadas.bonoCompetencia, modMagico)
    : 0;

  // Hook centralizado de lanzamiento de magia (Facade + Strategy)
  const { puedeLanzar, motivoBloqueo, lanzar } = usarLanzadorConjuros({
    personaje: personajeActivo,
    penalizacionArmadura: statsCalculadas?.penalizacionArmadura,
    bonoAtaqueMagico,
    sistemaMagia
  });

  const estaBloqueadoPorArmadura = !puedeLanzar;
  const motivoBloqueoArmadura = motivoBloqueo;

  // Construir la lista dinámica de ataques físicos y desarmados
  const listaAtaquesFisicos = useMemo<AtaquePersonajeCalculado[]>(() => {
    if (!personajeActivo || !statsCalculadas) return [];

    const ataques: AtaquePersonajeCalculado[] = [];
    const inventario = personajeActivo.inventario || [];
    const normalizar = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const bonoCompetencia = statsCalculadas.bonoCompetencia;
    const modificadores = statsCalculadas.modificadores;

    const clasePrincipal = personajeActivo.clase || "";
    const esMonje = clasePrincipal.toLowerCase().includes("monje");

    const furiaEstaActiva = Boolean(
      (personajeActivo.rasgos || []).some(
        (r) => (r.nombre.toLowerCase().trim() === "furia" || r.id.toLowerCase().trim() === "rasgo_cls_barbaro_furia") && r.activo
      ) ||
      (personajeActivo.condicionesActivas || []).some(
        (c) => c.toLowerCase().includes("furia (rage)") || (c.toLowerCase().includes("furia") && !c.toLowerCase().includes("furia de los dioses"))
      )
    );

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
      let subcategoriaInferida: "Sencilla" | "Marcial" | "De Fuego" = "Sencilla";
      let dadoBaseInferido = "1d6";
      let tipoDanoInferido: "Contundente" | "Perforante" | "Cortante" = "Contundente";
      let danoVersatilInferido: string | undefined = undefined;
      let alcanceInferido: string | undefined = "5 ft";

      if (nombreNorm.includes("arco largo") || nombreNorm.includes("longbow")) {
        dadoBaseInferido = "1d8"; tipoDanoInferido = "Perforante"; alcanceInferido = "150/600 ft"; tipoAtaqueInferido = "A Distancia"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["A dos manos", "Pesada", "Munición"];
      } else if (nombreNorm.includes("arco corto") || nombreNorm.includes("shortbow")) {
        dadoBaseInferido = "1d6"; tipoDanoInferido = "Perforante"; alcanceInferido = "80/320 ft"; tipoAtaqueInferido = "A Distancia"; subcategoriaInferida = "Sencilla"; propiedadesInferidas = ["A dos manos", "Munición"];
      } else if (nombreNorm.includes("ballesta ligera") || nombreNorm.includes("light crossbow")) {
        dadoBaseInferido = "1d8"; tipoDanoInferido = "Perforante"; alcanceInferido = "80/320 ft"; tipoAtaqueInferido = "A Distancia"; subcategoriaInferida = "Sencilla"; propiedadesInferidas = ["A dos manos", "Carga", "Munición"];
      } else if (nombreNorm.includes("ballesta pesada") || nombreNorm.includes("heavy crossbow")) {
        dadoBaseInferido = "1d10"; tipoDanoInferido = "Perforante"; alcanceInferido = "100/400 ft"; tipoAtaqueInferido = "A Distancia"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["A dos manos", "Pesada", "Carga", "Munición"];
      } else if (nombreNorm.includes("ballesta de mano") || nombreNorm.includes("hand crossbow")) {
        dadoBaseInferido = "1d6"; tipoDanoInferido = "Perforante"; alcanceInferido = "30/120 ft"; tipoAtaqueInferido = "A Distancia"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["Ligera", "Carga", "Munición"];
      } else if (nombreNorm.includes("daga") || nombreNorm.includes("dagger")) {
        dadoBaseInferido = "1d4"; tipoDanoInferido = "Perforante"; alcanceInferido = "20/60 ft"; subcategoriaInferida = "Sencilla"; propiedadesInferidas = ["Sutil", "Ligera", "Arrojadiza"];
      } else if (nombreNorm.includes("espada corta") || nombreNorm.includes("shortsword")) {
        dadoBaseInferido = "1d6"; tipoDanoInferido = "Perforante"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["Sutil", "Ligera"];
      } else if (nombreNorm.includes("espada larga") || nombreNorm.includes("longsword")) {
        dadoBaseInferido = "1d8"; danoVersatilInferido = "1d10"; tipoDanoInferido = "Cortante"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["Versátil"];
      } else if (nombreNorm.includes("espadón") || nombreNorm.includes("espadon") || nombreNorm.includes("greatsword")) {
        dadoBaseInferido = "2d6"; tipoDanoInferido = "Cortante"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["A dos manos", "Pesada"];
      } else if (nombreNorm.includes("cimitarra") || nombreNorm.includes("scimitar")) {
        dadoBaseInferido = "1d6"; tipoDanoInferido = "Cortante"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["Sutil", "Ligera"];
      } else if (nombreNorm.includes("estoque") || nombreNorm.includes("rapier")) {
        dadoBaseInferido = "1d8"; tipoDanoInferido = "Perforante"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["Sutil"];
      } else if (nombreNorm.includes("hacha de batalla") || nombreNorm.includes("battleaxe")) {
        dadoBaseInferido = "1d8"; danoVersatilInferido = "1d10"; tipoDanoInferido = "Cortante"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["Versátil"];
      } else if (nombreNorm.includes("gran hacha") || nombreNorm.includes("greataxe")) {
        dadoBaseInferido = "1d12"; tipoDanoInferido = "Cortante"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["A dos manos", "Pesada"];
      } else if (nombreNorm.includes("lanza") || nombreNorm.includes("spear")) {
        dadoBaseInferido = "1d6"; danoVersatilInferido = "1d8"; tipoDanoInferido = "Perforante"; alcanceInferido = "20/60 ft"; subcategoriaInferida = "Sencilla"; propiedadesInferidas = ["Versátil", "Arrojadiza"];
      } else if (nombreNorm.includes("bastón") || nombreNorm.includes("baston") || nombreNorm.includes("quarterstaff")) {
        dadoBaseInferido = "1d6"; danoVersatilInferido = "1d8"; tipoDanoInferido = "Contundente"; subcategoriaInferida = "Sencilla"; propiedadesInferidas = ["Versátil"];
      } else if (nombreNorm.includes("martillo de guerra") || nombreNorm.includes("warhammer")) {
        dadoBaseInferido = "1d8"; danoVersatilInferido = "1d10"; tipoDanoInferido = "Contundente"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["Versátil"];
      } else if (nombreNorm.includes("tridente") || nombreNorm.includes("trident")) {
        dadoBaseInferido = "1d8"; danoVersatilInferido = "1d10"; tipoDanoInferido = "Perforante"; alcanceInferido = "20/60 ft"; subcategoriaInferida = "Marcial"; propiedadesInferidas = ["Versátil", "Arrojadiza"];
      }

      const propiedades = objetoCompendio?.propiedades || propiedadesInferidas;
      const esSutil = propiedades.some((p) => normalizar(p).includes("sutil") || normalizar(p).includes("finesse"));
      const esDistancia = objetoCompendio?.tipoAtaque === "A Distancia" || tipoAtaqueInferido === "A Distancia" || propiedades.some((p) => normalizar(p).includes("distancia") || normalizar(p).includes("munición"));
      const esCuerpoACuerpo = !esDistancia;

      // Característica por defecto
      let caracDefecto: Caracteristica = "fuerza";
      if (esDistancia) {
        caracDefecto = "destreza";
      } else if (esSutil) {
        // Arma sutil: escoge automáticamente el mayor modificador entre Fuerza y Destreza
        caracDefecto = (modificadores.destreza || 0) >= (modificadores.fuerza || 0) ? "destreza" : "fuerza";
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

      // Validación estricta de competencia con el arma (D&D 5.5e)
      const subcategoriaArma = objetoCompendio?.subcategoria || subcategoriaInferida;
      const esCompetenteArma = esCompetenteConArma(
        armaInst.nombre,
        subcategoriaArma,
        personajeActivo.competenciasArmasGrupos || [],
        personajeActivo.competenciasArmasLista || []
      );

      const bonoAtaque = (esCompetenteArma ? bonoCompetencia : 0) + modAtributo + bonoMagico;
      const dadoDanoBase = objetoCompendio?.dadoDano || dadoBaseInferido;
      const tipoDano = objetoCompendio?.tipoDano || tipoDanoInferido;

      const contextoAtaqueArma: ContextoAtaquePersonaje = {
        tipo: "arma",
        caracteristica: caracUsada,
        esCuerpoACuerpo,
        esDistancia
      };

      const bonoDanoExtraRasgos = obtenerBonoDanoFuerzaExtra(personajeActivo, contextoAtaqueArma);
      const bonoFuriaArma = (caracUsada === "fuerza" && statsCalculadas.bonoDanoFuria > 0) ? statsCalculadas.bonoDanoFuria : 0;
      const modDanoTotal = modAtributo + bonoMagico + bonoFuriaArma + bonoDanoExtraRasgos;
      const signoMod = modDanoTotal >= 0 ? `+${modDanoTotal}` : `${modDanoTotal}`;

      // Dados adicionales de daño (Frenesí, Golpe Brutal o rasgos homebrew con dado_extra_dano)
      const dadosExtraFuerza: string[] = [];
      const dadosExtraEfectos = obtenerDadosExtraAtaque(personajeActivo, contextoAtaqueArma);
      for (const d of dadosExtraEfectos) {
        dadosExtraFuerza.push(d.dados);
      }

      if (caracUsada === "fuerza") {
        const rasgoFrenesi = (personajeActivo.rasgos || []).find(
          (r) => (r.id.includes("frenesi") || r.nombre.toLowerCase().includes("frenesí") || r.nombre.toLowerCase().includes("frenesi")) && r.activo
        );
        if (rasgoFrenesi && !dadosExtraEfectos.some((d) => d.origen.toLowerCase().includes("frenes"))) {
          const dadosF = rasgoFrenesi.formulaDados || `${statsCalculadas.bonoDanoFuria || 2}d6`;
          dadosExtraFuerza.push(dadosF);
        }

        const rasgoGolpeBrutal = furiaEstaActiva ? (personajeActivo.rasgos || []).find(
          (r) => (r.id.includes("golpe_brutal") || r.nombre.toLowerCase().includes("golpe brutal")) && r.activo
        ) : undefined;
        if (rasgoGolpeBrutal && !dadosExtraEfectos.some((d) => d.origen.toLowerCase().includes("golpe brutal"))) {
          const dadosGb = rasgoGolpeBrutal.formulaDados || "1d10";
          dadosExtraFuerza.push(dadosGb);
        }
      }

      // Grupos de daño secundario independiente (ej. Furia Divina o efectos dano_secundario)
      const gruposDanoSecundario: string[] = [];
      const danosSecEfectos = obtenerDanosSecundariosAtaque(personajeActivo, contextoAtaqueArma);
      for (const ds of danosSecEfectos) {
        gruposDanoSecundario.push(ds.formula);
      }

      if (caracUsada === "fuerza" && furiaEstaActiva) {
        const rasgoFuriaDivina = (personajeActivo.rasgos || []).find(
          (r) => (r.id.includes("furia_divina") || normalizar(r.nombre).includes("furia divina")) && r.activo
        );
        if (rasgoFuriaDivina && !danosSecEfectos.some((d) => d.origen.toLowerCase().includes("furia divina"))) {
          const claseBarbaro = (personajeActivo.clases || []).find((c) => normalizar(c.nombre).includes("barbaro"));
          const nivelBarbaro = claseBarbaro?.nivel || (normalizar(personajeActivo.clase || "").includes("barbaro") ? personajeActivo.nivel : personajeActivo.nivel || 1);
          const bonoMitadNivel = Math.floor(nivelBarbaro / 2);
          const formulaExtraFuriaDivina = bonoMitadNivel > 0 ? `1d6+${bonoMitadNivel}` : "1d6";
          gruposDanoSecundario.push(formulaExtraFuriaDivina);
        }
      }

      const strExtraFuerza = dadosExtraFuerza.length > 0 ? `+${dadosExtraFuerza.join("+")}` : "";
      let dadoDanoTotalBase = `${dadoDanoBase}${strExtraFuerza}`;
      let formulaDano = modDanoTotal !== 0 ? `${dadoDanoTotalBase}${signoMod}` : dadoDanoTotalBase;

      // Si hay daño secundario activo, se agrega con '/' como grupo independiente
      for (const formulaSec of gruposDanoSecundario) {
        dadoDanoTotalBase = `${dadoDanoTotalBase}/${formulaSec}`;
        formulaDano = `${formulaDano}/${formulaSec}`;
      }

      // Daño versátil si aplica (extrayendo únicamente dados limpios para sumar el modificador de atributo)
      let formulaVersatil: string | undefined;
      let dadoVersatilBase: string | undefined;
      const esPropiedadVersatil = propiedades.some((p) => normalizar(p).includes("versat") || normalizar(p).includes("versatile"));
      const rawVersatil = objetoCompendio?.danoVersatil || danoVersatilInferido;

      if (rawVersatil) {
        const matchDadosV = rawVersatil.match(/(\d+d\d+)/i);
        const dadoV = matchDadosV ? matchDadosV[1] : rawVersatil.trim();
        dadoVersatilBase = `${dadoV}${strExtraFuerza}`;
        formulaVersatil = modDanoTotal !== 0 ? `${dadoVersatilBase}${signoMod}` : dadoVersatilBase;
        for (const formulaSec of gruposDanoSecundario) {
          dadoVersatilBase = `${dadoVersatilBase}/${formulaSec}`;
          formulaVersatil = `${formulaVersatil}/${formulaSec}`;
        }
      } else if (esPropiedadVersatil) {
        let dadoV: string | undefined;
        if (dadoDanoBase.includes("1d6")) dadoV = "1d8";
        else if (dadoDanoBase.includes("1d8")) dadoV = "1d10";
        else if (dadoDanoBase.includes("1d10")) dadoV = "1d12";
        else if (dadoDanoBase.includes("1d4")) dadoV = "1d6";

        if (dadoV) {
          dadoVersatilBase = `${dadoV}${strExtraFuerza}`;
          formulaVersatil = modDanoTotal !== 0 ? `${dadoVersatilBase}${signoMod}` : dadoVersatilBase;
          for (const formulaSec of gruposDanoSecundario) {
            dadoVersatilBase = `${dadoVersatilBase}/${formulaSec}`;
            formulaVersatil = `${formulaVersatil}/${formulaSec}`;
          }
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
        dadoDanoBase: dadoDanoTotalBase,
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
        motivoBloqueo,
        esCompetenteConArma: esCompetenteArma,
        esSutil,
        esDistancia
      });
    }

    // 2. Ataque Desarmado (Golpe sin Armas - D&D 5.5e)
    const esCompetenteDesarmado =
      esCompetenteConArma(
        "Ataque desarmado",
        "Sencilla",
        personajeActivo.competenciasArmasGrupos || [],
        personajeActivo.competenciasArmasLista || []
      ) ||
      (!personajeActivo.competenciasArmas && (personajeActivo.competenciasArmasLista || []).length === 0);

    const modFue = modificadores.fuerza || 0;
    const modDes = modificadores.destreza || 0;

    // Regla D&D 5.5e: El golpe desarmado siempre usa Fuerza salvo clase Monje o efecto especial configurado
    let caracDefectoDesarmado: Caracteristica = "fuerza";
    if (esMonje) {
      caracDefectoDesarmado = modDes > modFue ? "destreza" : "fuerza";
    }

    const caracDesarmado: Caracteristica = caracteristicasArmas["ataque-desarmado"] || caracDefectoDesarmado;
    const modDesarmado = modificadores[caracDesarmado] || 0;
    const bonoAtaqueDesarmado = (esCompetenteDesarmado ? bonoCompetencia : 0) + modDesarmado;

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
        propiedades: ["Artes Marciales", "Sutil"],
        tieneTiradaAtaque: true,
        esCompetenteConArma: esCompetenteDesarmado,
        esSutil: true,
        esDistancia: false
      });
    } else {
      // Regla D&D 5.5e estándar: Daño Fijo 1 + FUE (+ bono Furia si aplica)
      const contextoDesarmado: ContextoAtaquePersonaje = {
        tipo: "desarmado",
        caracteristica: caracDesarmado,
        esCuerpoACuerpo: true,
        esDistancia: false
      };
      const bonoDanoExtraDesarmado = obtenerBonoDanoFuerzaExtra(personajeActivo, contextoDesarmado);
      const bonoFuriaDesarmado = (caracDesarmado === "fuerza" && statsCalculadas.bonoDanoFuria > 0) ? statsCalculadas.bonoDanoFuria : 0;
      const modDesarmadoTotal = modDesarmado + bonoFuriaDesarmado + bonoDanoExtraDesarmado;
      const danoFijo = Math.max(1, 1 + modDesarmadoTotal);

      let formulaDesarmado = `${danoFijo}`;
      let dadoBaseDesarmado = "1";
      let esDanoFijoDesarmado = true;
      let tipoDanoDesarmado = "Contundente";
      let modDanoDesarmadoFinal = modDesarmadoTotal;

      const dadosExtraDesarmado = obtenerDadosExtraAtaque(personajeActivo, contextoDesarmado);
      const danosSecDesarmado = obtenerDanosSecundariosAtaque(personajeActivo, contextoDesarmado);

      const rasgoFuriaDivina = furiaEstaActiva ? (personajeActivo.rasgos || []).find(
        (r) => (r.id.includes("furia_divina") || normalizar(r.nombre).includes("furia divina")) && r.activo
      ) : undefined;

      const hayDanoSec = danosSecDesarmado.length > 0 || (caracDesarmado === "fuerza" && !!rasgoFuriaDivina);
      if (hayDanoSec) {
        let formulaSec = "";
        let tipoSec = "";
        if (danosSecDesarmado.length > 0) {
          formulaSec = danosSecDesarmado[0].formula;
          tipoSec = danosSecDesarmado[0].tipoDano;
        } else if (caracDesarmado === "fuerza" && rasgoFuriaDivina) {
          const claseBarbaro = (personajeActivo.clases || []).find((c) => normalizar(c.nombre).includes("barbaro"));
          const nivelBarbaro = claseBarbaro?.nivel || (normalizar(personajeActivo.clase || "").includes("barbaro") ? personajeActivo.nivel : personajeActivo.nivel || 1);
          const bonoMitadNivel = Math.floor(nivelBarbaro / 2);
          formulaSec = bonoMitadNivel > 0 ? `1d6+${bonoMitadNivel}` : "1d6";
          tipoSec = "Radiante o Necrótico";
        }

        // Se compone directamente como dado + Fuerza (+ bono furia si aplica)
        // Para golpe desarmado con daño secundario, evitamos el número solo para que TaleSpire no haga fallback a 1d20
        const matchSec = formulaSec.match(/^(\d+d\d+)(.*)$/i);
        const dadoPrincipalSec = matchSec ? matchSec[1] : "1d6";
        const extraNumSec = matchSec && matchSec[2] ? parseInt(matchSec[2], 10) || 0 : 0;

        modDanoDesarmadoFinal = modDesarmadoTotal + extraNumSec;
        const signoFd = modDanoDesarmadoFinal !== 0 ? (modDanoDesarmadoFinal > 0 ? `+${modDanoDesarmadoFinal}` : `${modDanoDesarmadoFinal}`) : "";
        formulaDesarmado = `${dadoPrincipalSec}${signoFd}`;
        dadoBaseDesarmado = dadoPrincipalSec;
        esDanoFijoDesarmado = false;
        tipoDanoDesarmado = `Contundente (${tipoSec})`;
      } else if (dadosExtraDesarmado.length > 0) {
        const dadosStr = dadosExtraDesarmado.map((d) => d.dados).join("+");
        const signoFd = modDanoDesarmadoFinal !== 0 ? (modDanoDesarmadoFinal > 0 ? `+${modDanoDesarmadoFinal}` : `${modDanoDesarmadoFinal}`) : "";
        formulaDesarmado = `${dadosStr}${signoFd}`;
        dadoBaseDesarmado = dadosStr;
        esDanoFijoDesarmado = false;
      }

      ataques.push({
        id: "ataque-desarmado",
        nombre: "Golpe sin Armas",
        tipo: "Desarmado",
        subtipo: "Cuerpo a Cuerpo",
        tipoAccion: "accion",
        caracteristicaUsada: caracDesarmado,
        bonoAtaque: bonoAtaqueDesarmado,
        dadoDano: formulaDesarmado,
        dadoDanoBase: dadoBaseDesarmado,
        modificadorDano: modDanoDesarmadoFinal,
        esDanoFijo: esDanoFijoDesarmado,
        tipoDano: tipoDanoDesarmado,
        alcance: "5 ft",
        propiedades: [],
        tieneTiradaAtaque: true,
        esCompetenteConArma: esCompetenteDesarmado,
        esSutil: false,
        esDistancia: false
      });
    }

    // 3. Golpe con Arma Improvisada (D&D 5.5e: 1d4 + Fuerza, alcance 5 ft / 20/60 ft arrojadiza)
    const esCompetenteImprovisada = esCompetenteConArma(
      "Armas improvisadas",
      "Improvisada",
      personajeActivo.competenciasArmasGrupos || [],
      personajeActivo.competenciasArmasLista || []
    );

    const caracImprovisada: Caracteristica = caracteristicasArmas["ataque-arma-improvisada"] || "fuerza";
    const modImprovisada = modificadores[caracImprovisada] || 0;
    const bonoFuriaImprovisada = (caracImprovisada === "fuerza" && statsCalculadas.bonoDanoFuria > 0) ? statsCalculadas.bonoDanoFuria : 0;
    const modImprovisadaTotal = modImprovisada + bonoFuriaImprovisada;
    const bonoAtaqueImprovisada = (esCompetenteImprovisada ? bonoCompetencia : 0) + modImprovisada;

    const dadosExtraImprovisada: string[] = [];

    const contextoImprovisada: ContextoAtaquePersonaje = {
      tipo: "improvisada",
      caracteristica: caracImprovisada,
      esCuerpoACuerpo: true,
      esDistancia: false
    };

    const dadosExtraEfectosImp = obtenerDadosExtraAtaque(personajeActivo, contextoImprovisada);
    for (const d of dadosExtraEfectosImp) {
      dadosExtraImprovisada.push(d.dados);
    }

    if (caracImprovisada === "fuerza") {
      const rasgoFrenesi = (personajeActivo.rasgos || []).find(
        (r) => (r.id.includes("frenesi") || r.nombre.toLowerCase().includes("frenesí") || r.nombre.toLowerCase().includes("frenesi")) && r.activo
      );
      if (rasgoFrenesi && !dadosExtraEfectosImp.some((d) => d.origen.toLowerCase().includes("frenes"))) {
        dadosExtraImprovisada.push(rasgoFrenesi.formulaDados || `${statsCalculadas.bonoDanoFuria || 2}d6`);
      }
      const rasgoGolpeBrutal = furiaEstaActiva ? (personajeActivo.rasgos || []).find(
        (r) => (r.id.includes("golpe_brutal") || r.nombre.toLowerCase().includes("golpe brutal")) && r.activo
      ) : undefined;
      if (rasgoGolpeBrutal && !dadosExtraEfectosImp.some((d) => d.origen.toLowerCase().includes("golpe brutal"))) {
        dadosExtraImprovisada.push(rasgoGolpeBrutal.formulaDados || "1d10");
      }
    }

    const gruposSecundariosImp: string[] = [];
    const danosSecImp = obtenerDanosSecundariosAtaque(personajeActivo, contextoImprovisada);
    for (const ds of danosSecImp) {
      gruposSecundariosImp.push(ds.formula);
    }

    if (caracImprovisada === "fuerza" && furiaEstaActiva) {
      const rasgoFuriaDivina = (personajeActivo.rasgos || []).find(
        (r) => (r.id.includes("furia_divina") || normalizar(r.nombre).includes("furia divina")) && r.activo
      );
      if (rasgoFuriaDivina && !danosSecImp.some((d) => d.origen.toLowerCase().includes("furia divina"))) {
        const claseBarbaro = (personajeActivo.clases || []).find((c) => normalizar(c.nombre).includes("barbaro"));
        const nivelBarbaro = claseBarbaro?.nivel || (normalizar(personajeActivo.clase || "").includes("barbaro") ? personajeActivo.nivel : personajeActivo.nivel || 1);
        const bonoMitadNivel = Math.floor(nivelBarbaro / 2);
        const formulaExtraFuriaImprovisada = bonoMitadNivel > 0 ? `1d6+${bonoMitadNivel}` : "1d6";
        gruposSecundariosImp.push(formulaExtraFuriaImprovisada);
      }
    }

    const strExtraImprovisada = dadosExtraImprovisada.length > 0 ? `+${dadosExtraImprovisada.join("+")}` : "";
    let dadoDanoImprovisadaBase = `1d4${strExtraImprovisada}`;
    let formulaImprovisada =
      modImprovisadaTotal !== 0
        ? `${dadoDanoImprovisadaBase}${modImprovisadaTotal >= 0 ? `+${modImprovisadaTotal}` : `${modImprovisadaTotal}`}`
        : dadoDanoImprovisadaBase;

    for (const fSec of gruposSecundariosImp) {
      dadoDanoImprovisadaBase = `${dadoDanoImprovisadaBase}/${fSec}`;
      formulaImprovisada = `${formulaImprovisada}/${fSec}`;
    }

    ataques.push({
      id: "ataque-arma-improvisada",
      nombre: "Golpe con Arma Improvisada",
      tipo: "Arma",
      subtipo: "Cuerpo a Cuerpo / Arrojadiza",
      tipoAccion: "accion",
      caracteristicaUsada: caracImprovisada,
      bonoAtaque: bonoAtaqueImprovisada,
      dadoDano: formulaImprovisada,
      dadoDanoBase: dadoDanoImprovisadaBase,
      modificadorDano: modImprovisadaTotal,
      esDanoFijo: false,
      tipoDano: "Contundente",
      alcance: "5 ft (20/60 ft arrojadiza)",
      propiedades: ["Improvisada", "Arrojadiza (20/60 ft)"],
      tieneTiradaAtaque: true,
      esCompetenteConArma: esCompetenteImprovisada,
      esSutil: false,
      esDistancia: false
    });

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
      
      // Evaluación integral de condiciones activas, penalizaciones de equipo y rasgos mecánicos (D&D 5.5e)
      const evaluacionCondiciones = evaluarEfectosCondicionesEnTirada({
        tipo: "ataque",
        caracteristica: ataque.caracteristicaUsada as Caracteristica,
        penalizacionArmadura: !!statsCalculadas?.penalizacionArmadura?.sinCompetencia,
        desventajaSigiloArmadura: !!statsCalculadas?.desventajaSigiloArmadura,
        condicionesActivas: personajeActivo?.condicionesActivas,
        personaje: personajeActivo
      });

      const bonoFinal = ataque.bonoAtaque + evaluacionCondiciones.penalizadorD20;
      const bonoStr = bonoFinal >= 0 ? `+${bonoFinal}` : `${bonoFinal}`;

      // Si Golpe Brutal está activo y el ataque usa Fuerza, se renuncia a la ventaja (D&D 5.5e)
      if (ataque.caracteristicaUsada === "fuerza") {
        const rasgoGolpeBrutal = (personajeActivo?.rasgos || []).find(
          (r) => (r.id.includes("golpe_brutal") || r.nombre.toLowerCase().includes("golpe brutal")) && r.activo
        );
        if (rasgoGolpeBrutal && evaluacionCondiciones.modoEfectivo === "ventaja") {
          evaluacionCondiciones.modoEfectivo = "plano";
          evaluacionCondiciones.motivosModificadores.push("Golpe Brutal (Renuncia a ventaja)");
        }
      }

      const motivos = [
        ...evaluacionCondiciones.motivosDesventaja,
        ...evaluacionCondiciones.motivosVentaja,
        ...evaluacionCondiciones.motivosModificadores
      ].join(", ");

      const sufijoMotivo = motivos ? ` (${motivos})` : "";
      const formulaDados = `!Ataque ${sanitizarEtiqueta(ataque.nombre)}:1d20${bonoStr}`;
      const etiquetaLog = `${nombrePj} - Ataque con ${ataque.nombre}${sufijoMotivo}`;

      // Descontar munición compatible si el arma la requiere (estrictamente desde contenedor de la mochila)
      if (ataque.requiereMunicion && personajeActivo) {
        const inv = personajeActivo.inventario || [];
        const estadoActual = resolverEstadoMunicionArma(ataque.nombre, ataque.propiedades, inv, baseDatosObjetos);

        if (!estadoActual.puedeDisparar || estadoActual.municionEnContenedor <= 0) {
          const mensajeAviso =
            estadoActual.motivoBloqueo ||
            `Aviso: No tienes ${ataque.municionNombre || "munición"} lista en tu contenedor llevado encima.`;
          agregarNotificacion(mensajeAviso, "advertencia");
        } else {
          const municionItemMochila = inv.find((it) => {
            const enMochila = (it.contenedor || "mochila") === "mochila";
            return enMochila && it.cantidad > 0 && esMunicionCompatibleConArma(ataque.nombre, it, ataque.propiedades, baseDatosObjetos);
          });

          if (municionItemMochila) {
            modificarCantidadObjeto(personajeActivo.id, municionItemMochila.idInstancia, -1);
          }
        }
      }

      await lanzarDadosTaleSpire(
        formulaDados,
        etiquetaLog,
        undefined,
        undefined,
        evaluacionCondiciones.modoEfectivo !== "plano" ? evaluacionCondiciones.modoEfectivo : undefined
      );
    } catch (err) {
      console.error("[VistaAtaquesJugador] Error al tirar ataque:", err);
    }
  };

  const manejarTirarDano = async (ataque: AtaquePersonajeCalculado, versatil: boolean = false) => {
    try {
      if (ataque.esDanoFijo) return; // No tirar dados si es daño fijo

      const nombrePj = personajeActivo?.nombre?.trim() || "Personaje";
      const formulaDadoUsar = versatil && ataque.danoVersatil ? ataque.danoVersatil : ataque.dadoDano;

      let formulaDados: string;
      if (formulaDadoUsar.includes("/")) {
        const partes = formulaDadoUsar.split("/");
        const parteArma = partes[0].trim();
        const parteExtra = partes.slice(1).join("/").trim();
        formulaDados = `!Daño ${sanitizarEtiqueta(ataque.tipoDano)}:${parteArma}/Furia Divina (Radiante o Necrótico):${parteExtra}`;
      } else {
        formulaDados = `!Daño ${sanitizarEtiqueta(ataque.tipoDano)}:${formulaDadoUsar}`;
      }

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

      let formulaDados: string;
      if (dadoBase.includes("/")) {
        const partesBase = dadoBase.split("/");
        const baseArma = partesBase[0].trim();
        const baseExtra = partesBase.slice(1).join("/").trim();

        // Duplicar dados de arma física
        const criticoArma = baseArma.replace(/(\d+)d(\d+)/gi, (_, n, d) => `${parseInt(n, 10) * 2}d${d}`);
        const signoArma = ataque.modificadorDano !== 0 ? (ataque.modificadorDano >= 0 ? `+${ataque.modificadorDano}` : `${ataque.modificadorDano}`) : "";

        // Duplicar dados de Furia Divina (1d6 -> 2d6) conservando el bono de mitad de nivel (+X)
        const criticoExtra = baseExtra.replace(/(\d+)d(\d+)/gi, (_, n, d) => `${parseInt(n, 10) * 2}d${d}`);

        formulaDados = `!Crítico ${sanitizarEtiqueta(ataque.tipoDano)}:${criticoArma}${signoArma}/Furia Divina (Radiante o Necrótico):${criticoExtra}`;
      } else {
        // Duplicar el número de dados de cada grupo (ej. "1d12+2d6+1d10" -> "2d12+4d6+2d10")
        const formulaCriticoDados = dadoBase.replace(/(\d+)d(\d+)/gi, (_, n, d) => `${parseInt(n, 10) * 2}d${d}`);
        let formulaCritico = formulaCriticoDados || "2d6";

        if (ataque.modificadorDano !== 0) {
          const signo = ataque.modificadorDano >= 0 ? `+${ataque.modificadorDano}` : `${ataque.modificadorDano}`;
          formulaCritico = `${formulaCritico}${signo}`;
        }

        formulaDados = `!Crítico ${sanitizarEtiqueta(ataque.tipoDano)}:${formulaCritico}`;
      }

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

  const esHechizoDeSubclase = useCallback(
    (hechizo: HechizoBase | null | undefined): boolean => {
      if (!hechizo || !personajeActivo) return false;
      const siemprePrep = personajeActivo.conjurosSiemprePreparadosIds || [];
      const normalizar = (s: string) => s.toLowerCase().trim();
      return (
        siemprePrep.includes(hechizo.id) ||
        siemprePrep.some((id) => normalizar(id) === normalizar(hechizo.nombre))
      );
    },
    [personajeActivo]
  );

  // Agrupación de conjuros filtrados por nivel (0 para Trucos, 1-9 para niveles)
  const conjurosPorNivel = useMemo(() => {
    const mapa: Record<number, { hechizo: HechizoBase; tipoAccion: TipoAccionConsumida }[]> = {};
    for (let i = 0; i <= 9; i++) {
      mapa[i] = [];
    }

    for (const item of conjurosFiltrados) {
      const niv = item.hechizo.nivel ?? 0;
      if (mapa[niv]) {
        mapa[niv].push(item);
      } else {
        mapa[niv] = [item];
      }
    }

    return mapa;
  }, [conjurosFiltrados]);

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

        {/* Banner de Advertencia: Penalización por Armadura sin Competencia (D&D 5.5e) */}
        {statsCalculadas.penalizacionArmadura?.sinCompetencia && (
          <div className={estilos.bannerPenalizacionArmadura}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Penalización por Armadura sin Competencia:</strong>
              {statsCalculadas.penalizacionArmadura.armaduraNoCompetente && (
                <span> No eres competente con <em>{statsCalculadas.penalizacionArmadura.armaduraNoCompetente}</em>.</span>
              )}
              {statsCalculadas.penalizacionArmadura.escudoNoCompetente && (
                <span> No eres competente con <em>{statsCalculadas.penalizacionArmadura.escudoNoCompetente}</em>.</span>
              )}
              <div>Tienes <strong>Desventaja</strong> en tiradas de ataque y pruebas/salvaciones de Fuerza y Destreza. <strong>No puedes lanzar conjuros</strong>.</div>
            </div>
          </div>
        )}
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
                  alRecuperarEspaciosPacto={() => recuperarEspaciosPacto(personajeActivo.id)}
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
              {ataquesFisicosFiltrados.map((ataque) => {
                const evalCond = evaluarEfectosCondicionesEnTirada({
                  tipo: "ataque",
                  caracteristica: ataque.caracteristicaUsada as Caracteristica,
                  penalizacionArmadura: !!statsCalculadas?.penalizacionArmadura?.sinCompetencia,
                  desventajaSigiloArmadura: !!statsCalculadas?.desventajaSigiloArmadura,
                  condicionesActivas: personajeActivo?.condicionesActivas,
                  personaje: personajeActivo
                });

                return (
                  <TarjetaAtaquePersonaje
                    key={ataque.id}
                    ataque={ataque}
                    evaluacionCondiciones={evalCond}
                    alTirarAtaque={manejarTirarAtaque}
                    alTirarDano={manejarTirarDano}
                    alTirarCritico={manejarTirarCritico}
                    alCambiarCaracteristica={manejarCambiarCaracteristicaArma}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sección 2: Conjuros y Trucos de Combate Separados por Nivel */}
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
            <div className={estilos.listaSeccionesNivelMagico}>
              {Array.from({ length: 10 }).map((_, nivel) => {
                const itemsNivel = conjurosPorNivel[nivel] || [];
                if (itemsNivel.length === 0) return null;
                const abierta = seccionesAbiertas[`magicos_nv_${nivel}`] !== false;

                return (
                  <div key={`magicos-nv-${nivel}`} className={estilos.seccionNivelMagico}>
                    <div
                      className={estilos.cabeceraNivelMagico}
                      onClick={() => alternarSeccion(`magicos_nv_${nivel}`)}
                      role="button"
                      tabIndex={0}
                      title={`Clic para ${abierta ? "colapsar" : "expandir"} ${nivel === 0 ? "trucos" : `conjuros de nivel ${nivel}`}`}
                    >
                      <div className={estilos.tituloNivelMagico}>
                        {nivel === 0 ? (
                          <>
                            <Sparkles size={13} color="#a78bfa" />
                            <span>Trucos Listos</span>
                          </>
                        ) : (
                          <span>Nivel {nivel}</span>
                        )}
                        <span className={estilos.badgeConteoNivelMagico}>{itemsNivel.length}</span>
                      </div>
                      <div className={estilos.ladoDerechoCabeceraNivel}>
                        {abierta ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </div>
                    </div>

                    {abierta && (
                      <div className={estilos.listaTarjetasNivelMagico}>
                        {itemsNivel.map(({ hechizo }) => (
                          <TarjetaConjuroCompacta
                            key={hechizo.id}
                            hechizo={hechizo}
                            nombrePersonaje={personajeActivo.nombre}
                            nivelPersonaje={personajeActivo.nivel || 1}
                            bonoAtaqueMagico={bonoAtaqueMagico}
                            estaPreparado={true}
                            mostrarTogglePreparado={false}
                            esDeSubclase={esHechizoDeSubclase(hechizo)}
                            esConcentracionActual={personajeActivo.concentracionActiva?.hechizoId === hechizo.id}
                            bloqueadoPorArmadura={estaBloqueadoPorArmadura}
                            motivoBloqueoArmadura={motivoBloqueoArmadura}
                            alAbrirDetalleCompleto={(h) => setHechizoDetalle(h)}
                            alQuitarDeLista={() => {}}
                            alLanzar={(modo, niv) => lanzar({ modo, hechizo, nivelLanzamiento: niv })}
                            esLanzadorPacto={tienePacto}
                            nivelEspacioPacto={personajeActivo.nivelEspacioPacto || 0}
                            espaciosPactoMaximos={personajeActivo.espaciosPactoMaximos || 0}
                            espaciosPactoGastados={personajeActivo.espaciosPactoGastados || 0}
                            espaciosConjuroMaximos={personajeActivo.espaciosConjuroMaximos || {}}
                            nivelConjuroMaximo={personajeActivo.nivelConjuroMaximo || 0}
                            sistemaMagia={sistemaMagia}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
                  await lanzar({
                    modo: "objetoMagico",
                    hechizo: {
                      id: item.hechizo.nombre.toLowerCase().replace(/\s+/g, "-"),
                      nombre: item.hechizo.nombre,
                      nivel: 1,
                      escuela: "Universal",
                      tiempoLanzamiento: "1 Accion",
                      alcance: "60 pies",
                      componentes: "V, S",
                      duracion: "Instantaneo",
                      concentracion: false,
                      ritual: false,
                      descripcion: ""
                    },
                    objetoNombre: item.objetoNombre,
                    objetoInstanciaId: item.objetoInstanciaId,
                    bonoAtaqueObjeto: item.hechizo.bonoAtaque,
                    cdObjeto: item.hechizo.cd,
                    costeCargasObjeto: coste
                  });
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
                          disabled={!tieneCargas || estaBloqueadoPorArmadura}
                          title={
                            estaBloqueadoPorArmadura
                              ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia")
                              : !tieneCargas
                              ? "Cargas insuficientes para lanzar este conjuro"
                              : "Lanzar conjuro desde el objeto"
                          }
                          style={estaBloqueadoPorArmadura ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
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
              bloqueadoPorArmadura={estaBloqueadoPorArmadura}
              motivoBloqueoArmadura={motivoBloqueoArmadura}
              onClose={() => setHechizoDetalle(null)}
              alLanzar={async (modo, nivelLanzamiento) => {
                const exito = await lanzar({
                  modo,
                  hechizo: hechizoDetalle,
                  nivelLanzamiento
                });
                if (exito) {
                  setHechizoDetalle(null);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaAtaquesJugador;
