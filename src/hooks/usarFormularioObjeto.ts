import { useState, useCallback } from "react";
import { usarAlmacenDM } from "@/almacen/usarAlmacenDM";
import { sanearObjetoHomebrew } from "@/almacen/sanitizacion";
import { 
  ObjetoHomebrew, 
  ObjetoJuego, 
  Rareza, 
  TipoBonoDestreza, 
  Arma, 
  Armadura, 
  Escudo,
  EquipoAventuras,
  SubcategoriaEquipo,
  EfectoPasivo
} from "@/tipos";
import { type CategoriaEquipo, SUBCATEGORIAS_POR_CATEGORIA } from "@/constantes/categoriasEquipoConstantes";

export interface HechizoVinculadoFormulario {
  nombre: string;
  cd?: number | "";
  bonoAtaque?: number | "";
  costeCargas?: number | "";
  hechizoId?: string;
  nivel?: number;
  tipoAccion?: "accion" | "accionAdicional" | "reaccion";
}

export interface EstadoFormularioObjeto {
  // Comunes
  nombre: string;
  rareza: Rareza;
  propiedades: string;
  descripcion: string;
  pesoLb: number;
  valorPO: number;
  costoCantidad: number;
  costoUnidad: "PC" | "PP" | "PE" | "PO" | "PPT";
  esMagico: boolean;
  efectosPasivos: EfectoPasivo[];

  // Relacionales
  ammunitionIndex: string;
  ammunitionName: string;
  storageIndex: string;
  storageName: string;
  contents: { item: { index: string; name: string }; quantity: number }[];
  craft: { index: string; name: string }[];

  // Mágicas / Narrativas
  sintonizacionRequerida: boolean;
  cargas: number | "";
  condicionSintonizacion: string;
  formulaRecarga: string;
  modificadorAtaqueDano: number | "";
  hechizosVinculados: HechizoVinculadoFormulario[];

  // Artesanía
  artesaniaTaller: string;
  artesaniaComponentes: string[];
  nuevoComponente: string;

  // Veneno
  esVeneno: boolean;
  tipoVeneno: "Contacto" | "Ingerido" | "Inhalado" | "Lesión";
  efectoVeneno: string;

  // Equipable y categoría
  equipable: boolean;
  categoria: CategoriaEquipo;
  esConsumible: boolean;
  subcategoria: string;
  quantity: number | "";
  pesoUnitario: number | "";

  // Arma
  subcategoriaArma: "Sencilla" | "Marcial" | "De Fuego";
  tipoAtaque: "Cuerpo a Cuerpo" | "A Distancia";
  dadoDano: string;
  tipoDano: string;
  propiedadesArma: string[];
  maestria: string;
  alcanceNormal: number | "";
  alcanceLargo: number | "";
  danoVersatil: string;
  municionRequerida: boolean;

  // Armadura
  subcategoriaArmadura: "Ligera" | "Mediana" | "Pesada";
  caBase: number;
  requisitoFuerza: number | "";
  desventajaSigilo: boolean;
  bonoDestreza: TipoBonoDestreza;
  tiempoEquipar: string | number;

  // Escudo
  caEscudo: number;

  // Equipo
  subcategoriaEquipo: SubcategoriaEquipo;
  cantidad: number | "";

  // Editor local bonos pasivos
  nuevoBonoCategoria: string;
  nuevoBonoBono: string;
  nuevoBonoValor: string | number;
  nuevoBonoDesc: string;

  // Editor local hechizos vinculados
  nuevoHechizoNombre: string;
  nuevoHechizoCd: number | "";
  nuevoHechizoBonoAtaque: number | "";
  nuevoHechizoCosteCargas: number | "";
  nuevoHechizoId: string | undefined;
  nuevoHechizoNivel: number | undefined;
  nuevoHechizoTipoAccion: "accion" | "accionAdicional" | "reaccion" | undefined;
}

export const ESTADO_INICIAL_FORMULARIO: EstadoFormularioObjeto = {
  nombre: "",
  rareza: "Común",
  propiedades: "",
  descripcion: "",
  pesoLb: 0,
  valorPO: 0,
  costoCantidad: 0,
  costoUnidad: "PO",
  esMagico: false,
  efectosPasivos: [],

  ammunitionIndex: "",
  ammunitionName: "",
  storageIndex: "",
  storageName: "",
  contents: [],
  craft: [],

  sintonizacionRequerida: false,
  cargas: "",
  condicionSintonizacion: "",
  formulaRecarga: "",
  modificadorAtaqueDano: "",
  hechizosVinculados: [],

  artesaniaTaller: "",
  artesaniaComponentes: [],
  nuevoComponente: "",

  esVeneno: false,
  tipoVeneno: "Contacto",
  efectoVeneno: "",

  equipable: true,
  categoria: "armas",
  esConsumible: false,
  subcategoria: "Sencilla",
  quantity: "",
  pesoUnitario: "",

  subcategoriaArma: "Sencilla",
  tipoAtaque: "Cuerpo a Cuerpo",
  dadoDano: "1d6",
  tipoDano: "Fuerza",
  propiedadesArma: [],
  maestria: "Ninguna",
  alcanceNormal: "",
  alcanceLargo: "",
  danoVersatil: "",
  municionRequerida: false,

  subcategoriaArmadura: "Ligera",
  caBase: 10,
  requisitoFuerza: "",
  desventajaSigilo: false,
  bonoDestreza: "Completo",
  tiempoEquipar: "",

  caEscudo: 2,

  subcategoriaEquipo: "Maravilloso",
  cantidad: "",

  nuevoBonoCategoria: "CA",
  nuevoBonoBono: "CA",
  nuevoBonoValor: "",
  nuevoBonoDesc: "",

  nuevoHechizoNombre: "",
  nuevoHechizoCd: "",
  nuevoHechizoBonoAtaque: "",
  nuevoHechizoCosteCargas: "",
  nuevoHechizoId: undefined,
  nuevoHechizoNivel: undefined,
  nuevoHechizoTipoAccion: undefined
};

export function usarFormularioObjeto(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const { agregarObjetoHomebrew, actualizarObjetoHomebrew, agregarNotificacion } = usarAlmacenDM();

  // Estado consolidado para batching de re-renders
  const [estado, setEstado] = useState<EstadoFormularioObjeto>(ESTADO_INICIAL_FORMULARIO);

  // Helper generador de setters individuales con tipado estricto
  const crearSetter = useCallback(<K extends keyof EstadoFormularioObjeto>(campo: K) => {
    return (val: EstadoFormularioObjeto[K] | ((prev: EstadoFormularioObjeto[K]) => EstadoFormularioObjeto[K])) => {
      setEstado((prev) => ({
        ...prev,
        [campo]: typeof val === "function" ? (val as (p: EstadoFormularioObjeto[K]) => EstadoFormularioObjeto[K])(prev[campo]) : val
      }));
    };
  }, []);

  // Setters individuales memoizados para compatibilidad transparente de props
  const setONombre = crearSetter("nombre");
  const setOPropiedades = crearSetter("propiedades");
  const setODescripcion = crearSetter("descripcion");
  const setOPesoLb = crearSetter("pesoLb");
  const setOValorPO = crearSetter("valorPO");
  const setOCostoCantidad = crearSetter("costoCantidad");
  const setOCostoUnidad = crearSetter("costoUnidad");
  const setOEsMagico = crearSetter("esMagico");
  const setOEfectosPasivos = crearSetter("efectosPasivos");
  const setOCategoria = crearSetter("categoria");
  const setOEsConsumible = crearSetter("esConsumible");
  const setOSubcategoria = crearSetter("subcategoria");
  const setOQuantity = crearSetter("quantity");
  const setOPesoUnitario = crearSetter("pesoUnitario");
  const setOCaEscudo = crearSetter("caEscudo");
  const setOSubcategoriaArma = crearSetter("subcategoriaArma");
  const setOTipoAtaque = crearSetter("tipoAtaque");
  const setODadoDano = crearSetter("dadoDano");
  const setOTipoDano = crearSetter("tipoDano");
  const setOPropiedadesArma = crearSetter("propiedadesArma");
  const setOMaestria = crearSetter("maestria");
  const setOAlcanceNormal = crearSetter("alcanceNormal");
  const setOAlcanceLargo = crearSetter("alcanceLargo");
  const setODanoVersatil = crearSetter("danoVersatil");
  const setOMunicionRequerida = crearSetter("municionRequerida");
  const setOCaBase = crearSetter("caBase");
  const setORequisitoFuerza = crearSetter("requisitoFuerza");
  const setODesventajaSigilo = crearSetter("desventajaSigilo");
  const setOBonoDestreza = crearSetter("bonoDestreza");
  const setOTiempoEquipar = crearSetter("tiempoEquipar");
  const setOSubcategoriaEquipo = crearSetter("subcategoriaEquipo");
  const setOCantidad = crearSetter("cantidad");
  const setOSintonizacionRequerida = crearSetter("sintonizacionRequerida");
  const setOCargas = crearSetter("cargas");
  const setOEsVeneno = crearSetter("esVeneno");
  const setOTipoVeneno = crearSetter("tipoVeneno");
  const setOEfectoVeneno = crearSetter("efectoVeneno");
  const setOEquipable = crearSetter("equipable");
  const setOCondicionSintonizacion = crearSetter("condicionSintonizacion");
  const setOFormulaRecarga = crearSetter("formulaRecarga");
  const setOModificadorAtaqueDano = crearSetter("modificadorAtaqueDano");
  const setOHechizosVinculados = crearSetter("hechizosVinculados");
  const setOArtesaniaTaller = crearSetter("artesaniaTaller");
  const setOArtesaniaComponentes = crearSetter("artesaniaComponentes");
  const setONuevoComponente = crearSetter("nuevoComponente");
  const setONuevoBonoCategoria = crearSetter("nuevoBonoCategoria");
  const setONuevoBonoBono = crearSetter("nuevoBonoBono");
  const setONuevoBonoValor = crearSetter("nuevoBonoValor");
  const setONuevoBonoDesc = crearSetter("nuevoBonoDesc");
  const setONuevoHechizoNombre = crearSetter("nuevoHechizoNombre");
  const setONuevoHechizoCd = crearSetter("nuevoHechizoCd");
  const setONuevoHechizoBonoAtaque = crearSetter("nuevoHechizoBonoAtaque");
  const setONuevoHechizoCosteCargas = crearSetter("nuevoHechizoCosteCargas");
  const setONuevoHechizoId = crearSetter("nuevoHechizoId");
  const setONuevoHechizoNivel = crearSetter("nuevoHechizoNivel");
  const setONuevoHechizoTipoAccion = crearSetter("nuevoHechizoTipoAccion");
  const setOAmmunitionIndex = crearSetter("ammunitionIndex");
  const setOAmmunitionName = crearSetter("ammunitionName");
  const setOStorageIndex = crearSetter("storageIndex");
  const setOStorageName = crearSetter("storageName");
  const setOContents = crearSetter("contents");
  const setOCraft = crearSetter("craft");

  // Manejar el cambio reactivo de categoría canónica en lote atómico (Batch update)
  const alCambiarCategoria = useCallback((nuevaCat: CategoriaEquipo) => {
    setEstado((prev) => {
      const esCons = nuevaCat === "consumibles" || nuevaCat === "municion";
      const opcionesSubcat = SUBCATEGORIAS_POR_CATEGORIA[nuevaCat];
      const primeraSubcat = opcionesSubcat && opcionesSubcat[0] ? opcionesSubcat[0].valor : "";

      let equipable = prev.equipable;
      let subcategoriaArma = prev.subcategoriaArma;
      let subcategoriaArmadura = prev.subcategoriaArmadura;
      let caBase = prev.caBase;
      let bonoDestreza = prev.bonoDestreza;
      let caEscudo = prev.caEscudo;
      let subcategoria = primeraSubcat;
      let subcategoriaEquipo = prev.subcategoriaEquipo;

      if (nuevaCat === "armas") {
        equipable = true;
        subcategoriaArma = primeraSubcat === "Marcial" || primeraSubcat === "De Fuego" ? primeraSubcat : "Sencilla";
      } else if (nuevaCat === "armaduras") {
        equipable = true;
        subcategoriaArmadura = primeraSubcat === "Mediana" || primeraSubcat === "Pesada" ? primeraSubcat : "Ligera";
        caBase = primeraSubcat === "Pesada" ? 16 : primeraSubcat === "Mediana" ? 14 : 11;
        bonoDestreza = primeraSubcat === "Pesada" ? "Sin Bono" : primeraSubcat === "Mediana" ? "Máximo 2" : "Completo";
      } else if (nuevaCat === "escudos") {
        equipable = true;
        caEscudo = 2;
        subcategoria = "Escudo";
      } else {
        equipable = false;
        subcategoriaEquipo = primeraSubcat as SubcategoriaEquipo;
      }

      return {
        ...prev,
        categoria: nuevaCat,
        esConsumible: esCons,
        subcategoria,
        equipable,
        subcategoriaArma,
        subcategoriaArmadura,
        caBase,
        bonoDestreza,
        caEscudo,
        subcategoriaEquipo
      };
    });
  }, []);

  // Manejar el cambio reactivo de rareza en lote atómico
  const alCambiarRareza = useCallback((rareza: Rareza) => {
    setEstado((prev) => ({
      ...prev,
      rareza,
      esMagico: rareza !== "Común" ? true : prev.esMagico
    }));
  }, []);

  // Manejar cambio reactivo de subcategoría de armadura para sugerir Destreza en lote atómico
  const alCambiarSubcategoriaArmadura = useCallback((sub: "Ligera" | "Mediana" | "Pesada") => {
    setEstado((prev) => ({
      ...prev,
      subcategoriaArmadura: sub,
      subcategoria: sub,
      bonoDestreza: sub === "Ligera" ? "Completo" : sub === "Mediana" ? "Máximo 2" : "Sin Bono",
      caBase: sub === "Pesada" ? 16 : sub === "Mediana" ? 14 : 11
    }));
  }, []);

  // Reseteo atómico instantáneo del formulario completo (1 solo re-render)
  const limpiarFormulario = useCallback(() => {
    setEstado(ESTADO_INICIAL_FORMULARIO);
  }, []);

  // Carga atómica de un objeto completo en el formulario (1 solo re-render)
  const cargarObjeto = useCallback((o: ObjetoHomebrew) => {
    const oLegacy = o as { bonosMagicos?: Array<{ categoria: string; bono: string; valor: number }> };
    let efectosPasivosCargados: EfectoPasivo[] = [];
    if (o.efectosPasivos) {
      efectosPasivosCargados = o.efectosPasivos;
    } else if (oLegacy.bonosMagicos) {
      efectosPasivosCargados = oLegacy.bonosMagicos.map((b) => ({
        tipo: b.categoria,
        bono: b.bono,
        valor: b.valor
      }));
    }

    const cat = o.categoria || "equipo-aventurero";
    const esCons = Boolean(o.esConsumible || cat === "consumibles");

    let subArma: "Sencilla" | "Marcial" | "De Fuego" = "Sencilla";
    let tipoAtq: "Cuerpo a Cuerpo" | "A Distancia" = "Cuerpo a Cuerpo";
    let dadoDano = "1d6";
    let tipoDano = "fuerza";
    let propsArma: string[] = [];
    let maestria = "Ninguna";
    let alcNorm: number | "" = "";
    let alcLarg: number | "" = "";
    let danoVers = "";
    let municionReq = false;

    let subArmadura: "Ligera" | "Mediana" | "Pesada" = "Ligera";
    let caBase = 10;
    let reqFue: number | "" = "";
    let desSigilo = false;
    let bonoDes: TipoBonoDestreza = "Completo";
    let tiempoEq: string | number = "";

    let caEscudo = 2;
    let subEquipo: SubcategoriaEquipo = "Maravilloso";
    let cantidad: number | "" = "";

    let equipable = Boolean(o.equipable);

    if (cat === "armas") {
      const arma = o as Arma;
      const reSaneado = sanearObjetoHomebrew(arma) as Arma;
      subArma = (reSaneado.subcategoria as "Sencilla" | "Marcial" | "De Fuego") || "Sencilla";
      tipoAtq = reSaneado.tipoAtaque || "Cuerpo a Cuerpo";
      dadoDano = reSaneado.dadoDano || "1d6";
      tipoDano = (reSaneado.tipoDano || "fuerza").toLowerCase();
      propsArma = reSaneado.propiedades || [];
      maestria = reSaneado.maestria || "Ninguna";
      alcNorm = reSaneado.alcanceNormal !== undefined ? reSaneado.alcanceNormal : "";
      alcLarg = reSaneado.alcanceLargo !== undefined ? reSaneado.alcanceLargo : "";
      danoVers = reSaneado.danoVersatil || "";
      municionReq = reSaneado.municionRequerida || false;
      equipable = true;
    } else if (cat === "armaduras") {
      const armadura = o as Armadura;
      subArmadura = (armadura.subcategoria as "Ligera" | "Mediana" | "Pesada") || "Ligera";
      caBase = armadura.caBase || 10;
      reqFue = armadura.requisitoFuerza !== undefined ? armadura.requisitoFuerza : "";
      desSigilo = armadura.desventajaSigilo || false;
      bonoDes = armadura.bonoDestreza || "Completo";
      tiempoEq = armadura.tiempoEquipar !== undefined ? armadura.tiempoEquipar : "";
      equipable = true;
    } else if (cat === "escudos") {
      const escudo = o as Escudo;
      caEscudo = escudo.caBase || 2;
      desSigilo = escudo.desventajaSigilo || false;
      equipable = true;
    } else {
      const equipo = o as EquipoAventuras;
      subEquipo = (equipo.subcategoria as SubcategoriaEquipo) || "Maravilloso";
      cantidad = equipo.cantidad !== undefined ? equipo.cantidad : "";
    }

    setEstado({
      ...ESTADO_INICIAL_FORMULARIO,
      nombre: o.nombre,
      rareza: o.rareza,
      propiedades: Array.isArray(o.propiedades) ? o.propiedades.join(", ") : (o.propiedades || ""),
      descripcion: o.descripcion,
      pesoLb: o.pesoLb || 0,
      valorPO: o.valorPO || 0,
      costoCantidad: o.costoOriginal ? o.costoOriginal.cantidad : (o.valorPO || 0),
      costoUnidad: o.costoOriginal ? o.costoOriginal.unidad : "PO",
      esMagico: o.esMagico,
      efectosPasivos: efectosPasivosCargados,

      sintonizacionRequerida: o.sintonizacionRequerida || false,
      cargas: o.cargas !== undefined ? o.cargas : "",
      condicionSintonizacion: o.condicionSintonizacion || "",
      formulaRecarga: o.formulaRecarga || "",
      modificadorAtaqueDano: o.modificadorAtaqueDano !== undefined ? o.modificadorAtaqueDano : "",

      hechizosVinculados: o.hechizosVinculados ? o.hechizosVinculados.map((h) => ({
        nombre: h.nombre,
        cd: h.cd !== undefined ? h.cd : "",
        bonoAtaque: h.bonoAtaque !== undefined ? h.bonoAtaque : "",
        costeCargas: h.costeCargas !== undefined ? h.costeCargas : "",
        hechizoId: h.hechizoId,
        nivel: h.nivel,
        tipoAccion: h.tipoAccion
      })) : [],

      artesaniaTaller: o.artesania?.tallerRequerido || "",
      artesaniaComponentes: o.artesania?.componentes || [],

      ammunitionIndex: o.ammunition?.index || "",
      ammunitionName: o.ammunition?.name || "",
      storageIndex: o.storage?.index || "",
      storageName: o.storage?.name || "",
      contents: o.contents ? o.contents.map((c) => ({
        item: { index: c.item.index, name: c.item.name },
        quantity: c.quantity
      })) : [],
      craft: o.craft ? o.craft.map((cr) => ({
        index: cr.index,
        name: cr.name
      })) : [],

      esVeneno: o.esVeneno || false,
      tipoVeneno: o.tipoVeneno || "Contacto",
      efectoVeneno: o.efectoVeneno || "",
      equipable,

      categoria: cat,
      esConsumible: esCons,
      subcategoria: o.subcategoria || "",
      quantity: o.quantity !== undefined ? o.quantity : "",
      pesoUnitario: o.pesoUnitario !== undefined ? o.pesoUnitario : "",

      subcategoriaArma: subArma,
      tipoAtaque: tipoAtq,
      dadoDano,
      tipoDano,
      propiedadesArma: propsArma,
      maestria,
      alcanceNormal: alcNorm,
      alcanceLargo: alcLarg,
      danoVersatil: danoVers,
      municionRequerida: municionReq,

      subcategoriaArmadura: subArmadura,
      caBase,
      requisitoFuerza: reqFue,
      desventajaSigilo: desSigilo,
      bonoDestreza: bonoDes,
      tiempoEquipar: tiempoEq,

      caEscudo,
      subcategoriaEquipo: subEquipo,
      cantidad
    });
  }, []);

  const agregarEfectoPasivo = useCallback(() => {
    setEstado((prev) => {
      if (!prev.nuevoBonoBono.trim() && !prev.nuevoBonoDesc.trim()) return prev;
      return {
        ...prev,
        efectosPasivos: [
          ...prev.efectosPasivos,
          {
            tipo: prev.nuevoBonoCategoria,
            bono: prev.nuevoBonoBono.trim(),
            valor: prev.nuevoBonoValor !== "" ? (isNaN(Number(prev.nuevoBonoValor)) ? String(prev.nuevoBonoValor) : Number(prev.nuevoBonoValor)) : undefined,
            descripcion: prev.nuevoBonoDesc.trim() || undefined
          }
        ],
        nuevoBonoValor: "",
        nuevoBonoDesc: ""
      };
    });
  }, []);

  const eliminarEfectoPasivoIdx = useCallback((idx: number) => {
    setEstado((prev) => ({
      ...prev,
      efectosPasivos: prev.efectosPasivos.filter((_, i) => i !== idx)
    }));
  }, []);

  const agregarHechizoVinculado = useCallback(() => {
    setEstado((prev) => {
      if (!prev.nuevoHechizoNombre.trim()) return prev;
      return {
        ...prev,
        hechizosVinculados: [
          ...prev.hechizosVinculados,
          {
            nombre: prev.nuevoHechizoNombre.trim(),
            cd: prev.nuevoHechizoCd !== "" ? Number(prev.nuevoHechizoCd) : undefined,
            bonoAtaque: prev.nuevoHechizoBonoAtaque !== "" ? Number(prev.nuevoHechizoBonoAtaque) : undefined,
            costeCargas: prev.nuevoHechizoCosteCargas !== "" ? Number(prev.nuevoHechizoCosteCargas) : undefined,
            hechizoId: prev.nuevoHechizoId,
            nivel: prev.nuevoHechizoNivel,
            tipoAccion: prev.nuevoHechizoTipoAccion
          }
        ],
        nuevoHechizoNombre: "",
        nuevoHechizoCd: "",
        nuevoHechizoBonoAtaque: "",
        nuevoHechizoCosteCargas: "",
        nuevoHechizoId: undefined,
        nuevoHechizoNivel: undefined,
        nuevoHechizoTipoAccion: undefined
      };
    });
  }, []);

  const eliminarHechizoVinculadoIdx = useCallback((idx: number) => {
    setEstado((prev) => ({
      ...prev,
      hechizosVinculados: prev.hechizosVinculados.filter((_, i) => i !== idx)
    }));
  }, []);

  const agregarComponenteArtesania = useCallback(() => {
    setEstado((prev) => {
      if (!prev.nuevoComponente.trim()) return prev;
      return {
        ...prev,
        artesaniaComponentes: [...prev.artesaniaComponentes, prev.nuevoComponente.trim()],
        nuevoComponente: ""
      };
    });
  }, []);

  const eliminarComponenteArtesaniaIdx = useCallback((idx: number) => {
    setEstado((prev) => ({
      ...prev,
      artesaniaComponentes: prev.artesaniaComponentes.filter((_, i) => i !== idx)
    }));
  }, []);

  const manejarGuardarObjeto = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!estado.nombre.trim()) {
      agregarNotificacion("El nombre del objeto es requerido", "advertencia");
      return;
    }

    // Autogenerar texto de propiedades para compatibilidad de render
    let propTxt = estado.propiedades.trim();
    if (!propTxt) {
      const parts: string[] = [];
      if (estado.categoria === "armas") {
        parts.push("Arma");
        parts.push(estado.subcategoriaArma);
        parts.push(estado.tipoAtaque);
        if (estado.dadoDano) parts.push(`${estado.dadoDano} ${estado.tipoDano}`);
        if (estado.alcanceNormal) parts.push(`Alcance ${estado.alcanceNormal}/${estado.alcanceLargo || estado.alcanceNormal}`);
      } else if (estado.categoria === "armaduras") {
        parts.push("Armadura");
        parts.push(estado.subcategoriaArmadura);
        parts.push(`CA ${estado.caBase}`);
      } else if (estado.categoria === "escudos") {
        parts.push("Escudo");
        parts.push(`CA +${estado.caEscudo}`);
      } else if (estado.subcategoria) {
        parts.push(estado.subcategoria);
      }
      propTxt = parts.join(", ");
    }

    // Calcular automáticamente el valor normalizado en PO
    let calculadoValorPO = Number(estado.costoCantidad) || 0;
    if (estado.costoUnidad === "PC") calculadoValorPO = calculadoValorPO / 100;
    else if (estado.costoUnidad === "PP") calculadoValorPO = calculadoValorPO / 10;
    else if (estado.costoUnidad === "PE") calculadoValorPO = calculadoValorPO / 2;
    else if (estado.costoUnidad === "PPT") calculadoValorPO = calculadoValorPO * 10;

    let payload: Omit<ObjetoJuego, "id">;

    // Estructurar artesanía si tiene datos
    const artesaniaPayload = estado.artesaniaTaller.trim() || estado.artesaniaComponentes.length > 0 ? {
      tallerRequerido: estado.artesaniaTaller.trim(),
      componentes: estado.artesaniaComponentes
    } : undefined;

    // Estructurar hechizos vinculados
    const hechizosPayload = estado.hechizosVinculados.length > 0 ? estado.hechizosVinculados.map((h) => ({
      nombre: h.nombre,
      cd: h.cd !== "" ? Number(h.cd) : undefined,
      bonoAtaque: h.bonoAtaque !== "" ? Number(h.bonoAtaque) : undefined,
      costeCargas: h.costeCargas !== "" ? Number(h.costeCargas) : undefined,
      hechizoId: h.hechizoId,
      nivel: h.nivel,
      tipoAccion: h.tipoAccion
    })) : undefined;

    const cantLote = Number(estado.quantity) || 1;
    const pesoTotal = Number(estado.pesoLb) || 0;
    const pesoUnitarioCalculado = estado.pesoUnitario !== ""
      ? Number(estado.pesoUnitario)
      : (cantLote > 1 && pesoTotal > 0 ? Math.round((pesoTotal / cantLote) * 1000) / 1000 : (pesoTotal > 0 ? pesoTotal : undefined));

    const subcategoriaFinal = estado.subcategoria.trim() || (
      estado.categoria === "armas" ? estado.subcategoriaArma :
      estado.categoria === "armaduras" ? estado.subcategoriaArmadura :
      estado.categoria === "escudos" ? "Escudo" :
      estado.subcategoriaEquipo
    );

    const basePayload = {
      nombre: estado.nombre.trim(),
      rareza: estado.rareza,
      propiedades: propTxt,
      descripcion: estado.descripcion.trim(),
      pesoLb: pesoTotal,
      pesoUnitario: pesoUnitarioCalculado,
      quantity: estado.quantity !== "" ? Number(estado.quantity) : undefined,
      valorPO: calculadoValorPO,
      costoOriginal: {
        cantidad: Number(estado.costoCantidad) || 0,
        unidad: estado.costoUnidad
      },
      categoria: estado.categoria,
      esConsumible: estado.esConsumible,
      subcategoria: subcategoriaFinal,
      esMagico: estado.esMagico,
      efectosPasivos: estado.efectosPasivos.length > 0 ? estado.efectosPasivos : undefined,
      sintonizacionRequerida: estado.sintonizacionRequerida,
      cargas: estado.cargas !== "" ? Number(estado.cargas) : undefined,
      condicionSintonizacion: estado.condicionSintonizacion.trim() || undefined,
      formulaRecarga: estado.formulaRecarga.trim() || undefined,
      modificadorAtaqueDano: estado.modificadorAtaqueDano !== "" ? Number(estado.modificadorAtaqueDano) : undefined,
      hechizosVinculados: hechizosPayload,
      artesania: artesaniaPayload,
      ammunition: estado.ammunitionIndex ? { index: estado.ammunitionIndex, name: estado.ammunitionName } : undefined,
      storage: estado.storageIndex ? { index: estado.storageIndex, name: estado.storageName } : undefined,
      contents: estado.contents.length > 0 ? estado.contents : undefined,
      craft: estado.craft.length > 0 ? estado.craft : undefined
    };

    if (estado.categoria === "armas") {
      payload = {
        ...basePayload,
        categoria: "armas",
        subcategoria: estado.subcategoriaArma,
        tipoAtaque: estado.tipoAtaque,
        dadoDano: estado.dadoDano,
        tipoDano: estado.tipoDano,
        propiedades: estado.propiedadesArma,
        maestria: estado.maestria,
        alcanceNormal: estado.alcanceNormal !== "" ? Number(estado.alcanceNormal) : undefined,
        alcanceLargo: estado.alcanceLargo !== "" ? Number(estado.alcanceLargo) : undefined,
        danoVersatil: estado.danoVersatil.trim() || undefined,
        municionRequerida: estado.municionRequerida,
        equipable: true,
        esVeneno: false
      } as Omit<Arma, "id">;
    } else if (estado.categoria === "armaduras") {
      payload = {
        ...basePayload,
        categoria: "armaduras",
        subcategoria: estado.subcategoriaArmadura,
        caBase: Number(estado.caBase) || 10,
        requisitoFuerza: estado.requisitoFuerza !== "" ? Number(estado.requisitoFuerza) : undefined,
        desventajaSigilo: estado.desventajaSigilo,
        bonoDestreza: estado.bonoDestreza,
        tiempoEquipar: estado.tiempoEquipar !== "" ? estado.tiempoEquipar : undefined,
        equipable: true,
        esVeneno: false
      } as Omit<Armadura, "id">;
    } else if (estado.categoria === "escudos") {
      payload = {
        ...basePayload,
        categoria: "escudos",
        subcategoria: "Escudo",
        caBase: Number(estado.caEscudo) || 2,
        desventajaSigilo: estado.desventajaSigilo,
        equipable: true,
        esVeneno: false
      } as Omit<Escudo, "id">;
    } else {
      payload = {
        ...basePayload,
        categoria: estado.categoria,
        subcategoria: estado.subcategoria.trim() || estado.subcategoriaEquipo,
        cantidad: estado.cantidad !== "" ? Number(estado.cantidad) : undefined,
        equipable: estado.equipable,
        ...(estado.esVeneno ? {
          esVeneno: true,
          tipoVeneno: estado.tipoVeneno,
          efectoVeneno: estado.efectoVeneno.trim() || undefined
        } : {
          esVeneno: false
        })
      } as Omit<EquipoAventuras, "id">;
    }

    if (idEnEdicion) {
      actualizarObjetoHomebrew(idEnEdicion, payload);
      agregarNotificacion("¡Objeto Homebrew actualizado con éxito!", "exito");
    } else {
      agregarObjetoHomebrew(payload);
      agregarNotificacion("¡Objeto Homebrew guardado con éxito!", "exito");
    }

    limpiarFormulario();
    alGuardarExitoso();
  }, [
    estado,
    idEnEdicion,
    agregarObjetoHomebrew,
    actualizarObjetoHomebrew,
    agregarNotificacion,
    limpiarFormulario,
    alGuardarExitoso
  ]);

  return {
    oNombre: estado.nombre, setONombre,
    oRareza: estado.rareza, alCambiarRareza,
    oPropiedades: estado.propiedades, setOPropiedades,
    oDescripcion: estado.descripcion, setODescripcion,
    oPesoLb: estado.pesoLb, setOPesoLb,
    oValorPO: estado.valorPO, setOValorPO,
    oCostoCantidad: estado.costoCantidad, setOCostoCantidad,
    oCostoUnidad: estado.costoUnidad, setOCostoUnidad,
    oEsMagico: estado.esMagico, setOEsMagico,
    oEfectosPasivos: estado.efectosPasivos, setOEfectosPasivos,
    oCategoria: estado.categoria, setOCategoria, alCambiarCategoria,
    oEsConsumible: estado.esConsumible, setOEsConsumible,
    oSubcategoria: estado.subcategoria, setOSubcategoria,
    oQuantity: estado.quantity, setOQuantity,
    oPesoUnitario: estado.pesoUnitario, setOPesoUnitario,
    oCaEscudo: estado.caEscudo, setOCaEscudo,

    oSubcategoriaArma: estado.subcategoriaArma, setOSubcategoriaArma,
    oTipoAtaque: estado.tipoAtaque, setOTipoAtaque,
    oDadoDano: estado.dadoDano, setODadoDano,
    oTipoDano: estado.tipoDano, setOTipoDano,
    oPropiedadesArma: estado.propiedadesArma, setOPropiedadesArma,
    oMaestria: estado.maestria, setOMaestria,
    oAlcanceNormal: estado.alcanceNormal, setOAlcanceNormal,
    oAlcanceLargo: estado.alcanceLargo, setOAlcanceLargo,
    oDanoVersatil: estado.danoVersatil, setODanoVersatil,
    oMunicionRequerida: estado.municionRequerida, setOMunicionRequerida,

    oSubcategoriaArmadura: estado.subcategoriaArmadura, alCambiarSubcategoriaArmadura,
    oCaBase: estado.caBase, setOCaBase,
    oRequisitoFuerza: estado.requisitoFuerza, setORequisitoFuerza,
    oDesventajaSigilo: estado.desventajaSigilo, setODesventajaSigilo,
    oBonoDestreza: estado.bonoDestreza, setOBonoDestreza,
    oTiempoEquipar: estado.tiempoEquipar, setOTiempoEquipar,

    oSubcategoriaEquipo: estado.subcategoriaEquipo, setOSubcategoriaEquipo,
    oCantidad: estado.cantidad, setOCantidad,
    oSintonizacionRequerida: estado.sintonizacionRequerida, setOSintonizacionRequerida,
    oCargas: estado.cargas, setOCargas,

    oEsVeneno: estado.esVeneno, setOEsVeneno,
    oTipoVeneno: estado.tipoVeneno, setOTipoVeneno,
    oEfectoVeneno: estado.efectoVeneno, setOEfectoVeneno,
    oEquipable: estado.equipable, setOEquipable,

    // Nuevos estados mágicos/narrativos y artesanía
    oCondicionSintonizacion: estado.condicionSintonizacion, setOCondicionSintonizacion,
    oFormulaRecarga: estado.formulaRecarga, setOFormulaRecarga,
    oModificadorAtaqueDano: estado.modificadorAtaqueDano, setOModificadorAtaqueDano,
    oHechizosVinculados: estado.hechizosVinculados, setOHechizosVinculados,
    oArtesaniaTaller: estado.artesaniaTaller, setOArtesaniaTaller,
    oArtesaniaComponentes: estado.artesaniaComponentes, setOArtesaniaComponentes,
    oNuevoComponente: estado.nuevoComponente, setONuevoComponente,

    // Nuevos estados del editor de efectos/hechizos
    oNuevoBonoCategoria: estado.nuevoBonoCategoria, setONuevoBonoCategoria,
    oNuevoBonoBono: estado.nuevoBonoBono, setONuevoBonoBono,
    oNuevoBonoValor: estado.nuevoBonoValor, setONuevoBonoValor,
    oNuevoBonoDesc: estado.nuevoBonoDesc, setONuevoBonoDesc,
    oNuevoHechizoNombre: estado.nuevoHechizoNombre, setONuevoHechizoNombre,
    oNuevoHechizoCd: estado.nuevoHechizoCd, setONuevoHechizoCd,
    oNuevoHechizoBonoAtaque: estado.nuevoHechizoBonoAtaque, setONuevoHechizoBonoAtaque,
    oNuevoHechizoCosteCargas: estado.nuevoHechizoCosteCargas, setONuevoHechizoCosteCargas,
    oNuevoHechizoId: estado.nuevoHechizoId, setONuevoHechizoId,
    oNuevoHechizoNivel: estado.nuevoHechizoNivel, setONuevoHechizoNivel,
    oNuevoHechizoTipoAccion: estado.nuevoHechizoTipoAccion, setONuevoHechizoTipoAccion,

    // Nuevos campos relacionales
    oAmmunitionIndex: estado.ammunitionIndex, setOAmmunitionIndex,
    oAmmunitionName: estado.ammunitionName, setOAmmunitionName,
    oStorageIndex: estado.storageIndex, setOStorageIndex,
    oStorageName: estado.storageName, setOStorageName,
    oContents: estado.contents, setOContents,
    oCraft: estado.craft, setOCraft,

    limpiarFormulario,
    cargarObjeto,
    agregarEfectoPasivo,
    eliminarEfectoPasivoIdx,
    agregarHechizoVinculado,
    eliminarHechizoVinculadoIdx,
    agregarComponenteArtesania,
    eliminarComponenteArtesaniaIdx,
    manejarGuardarObjeto
  };
}
