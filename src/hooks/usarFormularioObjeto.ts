import { useState, useCallback } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { 
  ObjetoHomebrew, 
  ObjetoJuego, 
  Rareza, 
  TipoBonoDestreza, 
  SubcategoriaEquipo, 
  Arma, 
  Armadura, 
  EquipoAventuras 
} from "../tipos";

export function usarFormularioObjeto(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const { agregarObjetoHomebrew, actualizarObjetoHomebrew, agregarNotificacion } = usarAlmacenDM();

  // --- ESTADOS COMUNES ---
  const [oNombre, setONombre] = useState("");
  const [oRareza, setORareza] = useState<Rareza>("Común");
  const [oPropiedades, setOPropiedades] = useState(""); // Custom o autogenerada
  const [oDescripcion, setODescripcion] = useState("");
  const [oPesoLb, setOPesoLb] = useState<number>(0);
  const [oValorPO, setOValorPO] = useState<number>(0);
  const [oCostoCantidad, setOCostoCantidad] = useState<number>(0);
  const [oCostoUnidad, setOCostoUnidad] = useState<"PC" | "PP" | "PE" | "PO" | "PPT">("PO");
  const [oEsMagico, setOEsMagico] = useState(false);
  const [oEfectosPasivos, setOEfectosPasivos] = useState<{ tipo: string; bono: string; valor?: number | string; descripcion?: string }[]>([]);

  // --- NUEVOS ESTADOS COMUNES (Mágicas y Narrativas) ---
  const [oSintonizacionRequerida, setOSintonizacionRequerida] = useState(false);
  const [oCargas, setOCargas] = useState<number | "">("");
  const [oCondicionSintonizacion, setOCondicionSintonizacion] = useState("");
  const [oFormulaRecarga, setOFormulaRecarga] = useState("");
  const [oEstaMaldito, setOEstaMaldito] = useState(false);
  const [oEsConsciente, setOEsConsciente] = useState(false);
  const [oModificadorAtaqueDano, setOModificadorAtaqueDano] = useState<number | "">("");
  const [oHechizosVinculados, setOHechizosVinculados] = useState<{ nombre: string; cd?: number | ""; bonoAtaque?: number | ""; costeCargas?: number | "" }[]>([]);

  // --- ESTADOS DE ARTESANÍA ---
  const [oArtesaniaTaller, setOArtesaniaTaller] = useState("");
  const [oArtesaniaComponentes, setOArtesaniaComponentes] = useState<string[]>([]);
  const [oNuevoComponente, setONuevoComponente] = useState("");

  // --- ESTADOS DE VENENO ---
  const [oEsVeneno, setOEsVeneno] = useState(false);
  const [oTipoVeneno, setOTipoVeneno] = useState<"Contacto" | "Ingerido" | "Inhalado" | "Lesión">("Contacto");
  const [oCdSalvacionVeneno, setOCdSalvacionVeneno] = useState<number | "">("");
  const [oEfectoVeneno, setOEfectoVeneno] = useState("");

  // --- ESTADOS DE TIENDA Y EQUIPABILIDAD ---
  const [oEquipable, setOEquipable] = useState(false);

  // Tipo Principal de Objeto
  const [oTipoPrincipal, setOTipoPrincipal] = useState<"Arma" | "Armadura" | "Equipo de Aventuras">("Arma");

  // --- ESTADOS ESPECÍFICOS DE ARMA ---
  const [oSubcategoriaArma, setOSubcategoriaArma] = useState<"Sencilla" | "Marcial" | "De Fuego">("Sencilla");
  const [oTipoAtaque, setOTipoAtaque] = useState<"Cuerpo a Cuerpo" | "A Distancia">("Cuerpo a Cuerpo");
  const [oDadoDano, setODadoDano] = useState("1d6");
  const [oTipoDano, setOTipoDano] = useState("Fuerza");
  const [oPropiedadesArma, setOPropiedadesArma] = useState<string[]>([]);
  const [oMaestria, setOMaestria] = useState("Ninguna");
  const [oAlcanceNormal, setOAlcanceNormal] = useState<number | "">("");
  const [oAlcanceLargo, setOAlcanceLargo] = useState<number | "">("");
  const [oDanoVersatil, setODanoVersatil] = useState("");
  const [oMunicionRequerida, setOMunicionRequerida] = useState(false);

  // --- ESTADOS ESPECÍFICOS DE ARMADURA ---
  const [oSubcategoriaArmadura, setOSubcategoriaArmadura] = useState<"Ligera" | "Mediana" | "Pesada" | "Escudo">("Ligera");
  const [oCaBase, setOCaBase] = useState<number>(10);
  const [oRequisitoFuerza, setORequisitoFuerza] = useState<number | "">("");
  const [oDesventajaSigilo, setODesventajaSigilo] = useState(false);
  const [oBonoDestreza, setOBonoDestreza] = useState<TipoBonoDestreza>("Completo");
  const [oTiempoEquipar, setOTiempoEquipar] = useState<string | number>("");

  // --- ESTADOS ESPECÍFICOS DE EQUIPO DE AVENTURAS ---
  const [oSubcategoriaEquipo, setOSubcategoriaEquipo] = useState<SubcategoriaEquipo>("Maravilloso");
  const [oCantidad, setOCantidad] = useState<number | "">("");

  // --- ESTADOS DEL EDITOR DE EFECTOS PASIVOS LOCAL ---
  const [oNuevoBonoCategoria, setONuevoBonoCategoria] = useState("CA");
  const [oNuevoBonoBono, setONuevoBonoBono] = useState("CA");
  const [oNuevoBonoValor, setONuevoBonoValor] = useState<string | number>("");
  const [oNuevoBonoDesc, setONuevoBonoDesc] = useState("");

  // --- ESTADOS DEL EDITOR DE HECHIZOS VINCULADOS LOCAL ---
  const [oNuevoHechizoNombre, setONuevoHechizoNombre] = useState("");
  const [oNuevoHechizoCd, setONuevoHechizoCd] = useState<number | "">("");
  const [oNuevoHechizoBonoAtaque, setONuevoHechizoBonoAtaque] = useState<number | "">("");
  const [oNuevoHechizoCosteCargas, setONuevoHechizoCosteCargas] = useState<number | "">("");

  // Manejar el cambio reactivo de rareza
  const alCambiarRareza = useCallback((rareza: Rareza) => {
    setORareza(rareza);
    if (rareza !== "Común") {
      setOEsMagico(true);
    }
  }, []);

  // Manejar cambio reactivo de subcategoría de armadura para sugerir Destreza
  const alCambiarSubcategoriaArmadura = useCallback((sub: "Ligera" | "Mediana" | "Pesada" | "Escudo") => {
    setOSubcategoriaArmadura(sub);
    if (sub === "Ligera") setOBonoDestreza("Completo");
    else if (sub === "Mediana") setOBonoDestreza("Máximo 2");
    else if (sub === "Pesada") setOBonoDestreza("Sin Bono");
  }, []);

  const limpiarFormulario = useCallback(() => {
    setONombre("");
    setORareza("Común");
    setOPropiedades("");
    setODescripcion("");
    setOPesoLb(0);
    setOValorPO(0);
    setOCostoCantidad(0);
    setOCostoUnidad("PO");
    setOEsMagico(false);
    setOEfectosPasivos([]);

    // Reset nuevos campos comunes
    setOSintonizacionRequerida(false);
    setOCargas("");
    setOCondicionSintonizacion("");
    setOFormulaRecarga("");
    setOEstaMaldito(false);
    setOEsConsciente(false);
    setOModificadorAtaqueDano("");
    setOHechizosVinculados([]);

    // Reset artesania
    setOArtesaniaTaller("");
    setOArtesaniaComponentes([]);
    setONuevoComponente("");

    setOTipoPrincipal("Arma");

    setOSubcategoriaArma("Sencilla");
    setOTipoAtaque("Cuerpo a Cuerpo");
    setODadoDano("1d6");
    setOTipoDano("Fuerza");
    setOPropiedadesArma([]);
    setOMaestria("Ninguna");
    setOAlcanceNormal("");
    setOAlcanceLargo("");
    setODanoVersatil("");
    setOMunicionRequerida(false);

    setOSubcategoriaArmadura("Ligera");
    setOCaBase(10);
    setORequisitoFuerza("");
    setODesventajaSigilo(false);
    setOBonoDestreza("Completo");
    setOTiempoEquipar("");

    setOSubcategoriaEquipo("Maravilloso");
    setOCantidad("");

    setOEsVeneno(false);
    setOTipoVeneno("Contacto");
    setOCdSalvacionVeneno("");
    setOEfectoVeneno("");
    setOEquipable(false);

    setONuevoBonoCategoria("CA");
    setONuevoBonoBono("CA");
    setONuevoBonoValor("");
    setONuevoBonoDesc("");

    setONuevoHechizoNombre("");
    setONuevoHechizoCd("");
    setONuevoHechizoBonoAtaque("");
    setONuevoHechizoCosteCargas("");
  }, []);

  const cargarObjeto = useCallback((o: ObjetoHomebrew) => {
    setONombre(o.nombre);
    setORareza(o.rareza);
    setOPropiedades(Array.isArray(o.propiedades) ? o.propiedades.join(", ") : (o.propiedades || ""));
    setODescripcion(o.descripcion);
    setOPesoLb(o.pesoLb || 0);
    setOValorPO(o.valorPO || 0);
    
    if (o.costoOriginal) {
      setOCostoCantidad(o.costoOriginal.cantidad);
      setOCostoUnidad(o.costoOriginal.unidad);
    } else {
      setOCostoCantidad(o.valorPO || 0);
      setOCostoUnidad("PO");
    }

    setOEsMagico(o.esMagico);
    
    // Carga de efectosPasivos con fallback a bonosMagicos
    if (o.efectosPasivos) {
      setOEfectosPasivos(o.efectosPasivos);
    } else if ((o as any).bonosMagicos) {
      const legacyBonos = (o as any).bonosMagicos as { categoria: string; bono: string; valor: number }[];
      setOEfectosPasivos(legacyBonos.map(b => ({
        tipo: b.categoria,
        bono: b.bono,
        valor: b.valor
      })));
    } else {
      setOEfectosPasivos([]);
    }

    // Carga de nuevos campos comunes (mágicos y narrativos)
    setOSintonizacionRequerida(o.sintonizacionRequerida || false);
    setOCargas(o.cargas !== undefined ? o.cargas : "");
    setOCondicionSintonizacion(o.condicionSintonizacion || "");
    setOFormulaRecarga(o.formulaRecarga || "");
    setOEstaMaldito(o.estaMaldito || false);
    setOEsConsciente(o.esConsciente || false);
    setOModificadorAtaqueDano(o.modificadorAtaqueDano !== undefined ? o.modificadorAtaqueDano : "");
    
    setOHechizosVinculados(o.hechizosVinculados ? o.hechizosVinculados.map(h => ({
      nombre: h.nombre,
      cd: h.cd !== undefined ? h.cd : "",
      bonoAtaque: h.bonoAtaque !== undefined ? h.bonoAtaque : "",
      costeCargas: h.costeCargas !== undefined ? h.costeCargas : ""
    })) : []);

    // Carga de artesanía
    if (o.artesania) {
      setOArtesaniaTaller(o.artesania.tallerRequerido || "");
      setOArtesaniaComponentes(o.artesania.componentes || []);
    } else {
      setOArtesaniaTaller("");
      setOArtesaniaComponentes([]);
    }

    setOTipoPrincipal(o.tipoPrincipal);

    setOEsVeneno(o.esVeneno || false);
    setOTipoVeneno(o.tipoVeneno || "Contacto");
    setOCdSalvacionVeneno(o.cdSalvacionVeneno !== undefined ? o.cdSalvacionVeneno : "");
    setOEfectoVeneno(o.efectoVeneno || "");
    setOEquipable(o.equipable || false);

    if (o.tipoPrincipal === "Arma") {
      const arma = o as Arma;
      setOSubcategoriaArma(arma.subcategoria || "Sencilla");
      setOTipoAtaque(arma.tipoAtaque || "Cuerpo a Cuerpo");
      setODadoDano(arma.dadoDano || "1d6");
      setOTipoDano(arma.tipoDano || "Fuerza");
      setOPropiedadesArma(arma.propiedades || []);
      setOMaestria(arma.maestria || "Ninguna");
      setOAlcanceNormal(arma.alcanceNormal !== undefined ? arma.alcanceNormal : "");
      setOAlcanceLargo(arma.alcanceLargo !== undefined ? arma.alcanceLargo : "");
      setODanoVersatil(arma.danoVersatil || "");
      setOMunicionRequerida(arma.municionRequerida || false);
      setOEquipable(true);
    } else if (o.tipoPrincipal === "Armadura") {
      const armadura = o as Armadura;
      setOSubcategoriaArmadura(armadura.subcategoria || "Ligera");
      setOCaBase(armadura.caBase || 10);
      setORequisitoFuerza(armadura.requisitoFuerza !== undefined ? armadura.requisitoFuerza : "");
      setODesventajaSigilo(armadura.desventajaSigilo || false);
      setOBonoDestreza(armadura.bonoDestreza || "Completo");
      setOTiempoEquipar(armadura.tiempoEquipar !== undefined ? armadura.tiempoEquipar : "");
      setOEquipable(true);
    } else if (o.tipoPrincipal === "Equipo de Aventuras") {
      const equipo = o as EquipoAventuras;
      setOSubcategoriaEquipo(equipo.subcategoria || "Maravilloso");
      setOCantidad(equipo.cantidad !== undefined ? equipo.cantidad : "");
    }
  }, []);

  const agregarEfectoPasivo = useCallback(() => {
    if (!oNuevoBonoBono.trim() && !oNuevoBonoDesc.trim()) return;
    setOEfectosPasivos((prev) => [
      ...prev,
      {
        tipo: oNuevoBonoCategoria,
        bono: oNuevoBonoBono.trim(),
        valor: oNuevoBonoValor !== "" ? (isNaN(Number(oNuevoBonoValor)) ? String(oNuevoBonoValor) : Number(oNuevoBonoValor)) : undefined,
        descripcion: oNuevoBonoDesc.trim() || undefined
      }
    ]);
    setONuevoBonoValor("");
    setONuevoBonoDesc("");
  }, [oNuevoBonoBono, oNuevoBonoCategoria, oNuevoBonoValor, oNuevoBonoDesc]);

  const eliminarEfectoPasivoIdx = useCallback((idx: number) => {
    setOEfectosPasivos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const agregarHechizoVinculado = useCallback(() => {
    if (!oNuevoHechizoNombre.trim()) return;
    setOHechizosVinculados((prev) => [
      ...prev,
      {
        nombre: oNuevoHechizoNombre.trim(),
        cd: oNuevoHechizoCd !== "" ? Number(oNuevoHechizoCd) : undefined,
        bonoAtaque: oNuevoHechizoBonoAtaque !== "" ? Number(oNuevoHechizoBonoAtaque) : undefined,
        costeCargas: oNuevoHechizoCosteCargas !== "" ? Number(oNuevoHechizoCosteCargas) : undefined
      }
    ]);
    setONuevoHechizoNombre("");
    setONuevoHechizoCd("");
    setONuevoHechizoBonoAtaque("");
    setONuevoHechizoCosteCargas("");
  }, [oNuevoHechizoNombre, oNuevoHechizoCd, oNuevoHechizoBonoAtaque, oNuevoHechizoCosteCargas]);

  const eliminarHechizoVinculadoIdx = useCallback((idx: number) => {
    setOHechizosVinculados((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const agregarComponenteArtesania = useCallback(() => {
    if (!oNuevoComponente.trim()) return;
    setOArtesaniaComponentes((prev) => [...prev, oNuevoComponente.trim()]);
    setONuevoComponente("");
  }, [oNuevoComponente]);

  const eliminarComponenteArtesaniaIdx = useCallback((idx: number) => {
    setOArtesaniaComponentes((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const manejarGuardarObjeto = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!oNombre.trim()) {
      agregarNotificacion("El nombre del objeto es requerido", "advertencia");
      return;
    }

    // Autogenerar texto de propiedades para compatibilidad de render
    let propTxt = oPropiedades.trim();
    if (!propTxt) {
      const parts: string[] = [];
      parts.push(oTipoPrincipal);
      if (oTipoPrincipal === "Arma") {
        parts.push(oSubcategoriaArma);
        parts.push(oTipoAtaque);
        if (oDadoDano) parts.push(`${oDadoDano} ${oTipoDano}`);
        if (oAlcanceNormal) parts.push(`Alcance ${oAlcanceNormal}/${oAlcanceLargo || oAlcanceNormal}`);
      } else if (oTipoPrincipal === "Armadura") {
        parts.push(oSubcategoriaArmadura);
        parts.push(`CA ${oCaBase}`);
      } else if (oTipoPrincipal === "Equipo de Aventuras") {
        parts.push(oSubcategoriaEquipo);
      }
      propTxt = parts.join(", ");
    }

    // Calcular automáticamente el valor normalizado en PO
    let calculadoValorPO = Number(oCostoCantidad) || 0;
    if (oCostoUnidad === "PC") calculadoValorPO = calculadoValorPO / 100;
    else if (oCostoUnidad === "PP") calculadoValorPO = calculadoValorPO / 10;
    else if (oCostoUnidad === "PE") calculadoValorPO = calculadoValorPO / 2;
    else if (oCostoUnidad === "PPT") calculadoValorPO = calculadoValorPO * 10;

    let payload: Omit<ObjetoJuego, "id">;

    // Estructurar artesanía si tiene datos
    const artesaniaPayload = oArtesaniaTaller.trim() || oArtesaniaComponentes.length > 0 ? {
      tallerRequerido: oArtesaniaTaller.trim(),
      componentes: oArtesaniaComponentes
    } : undefined;

    // Estructurar hechizos vinculados
    const hechizosPayload = oHechizosVinculados.length > 0 ? oHechizosVinculados.map(h => ({
      nombre: h.nombre,
      cd: h.cd !== "" ? Number(h.cd) : undefined,
      bonoAtaque: h.bonoAtaque !== "" ? Number(h.bonoAtaque) : undefined,
      costeCargas: h.costeCargas !== "" ? Number(h.costeCargas) : undefined
    })) : undefined;

    const basePayload = {
      nombre: oNombre.trim(),
      rareza: oRareza,
      propiedades: propTxt,
      descripcion: oDescripcion.trim(),
      pesoLb: Number(oPesoLb) || 0,
      valorPO: calculadoValorPO,
      costoOriginal: {
        cantidad: Number(oCostoCantidad) || 0,
        unidad: oCostoUnidad
      },
      esMagico: oEsMagico,
      efectosPasivos: oEfectosPasivos.length > 0 ? oEfectosPasivos : undefined,
      equipable: oTipoPrincipal === "Arma" || oTipoPrincipal === "Armadura" ? true : oEquipable,
      
      // Nuevos campos mágicos/narrativos comunes
      sintonizacionRequerida: oSintonizacionRequerida,
      cargas: oCargas !== "" ? Number(oCargas) : undefined,
      condicionSintonizacion: oCondicionSintonizacion.trim() || undefined,
      formulaRecarga: oFormulaRecarga.trim() || undefined,
      estaMaldito: oEstaMaldito,
      esConsciente: oEsConsciente,
      modificadorAtaqueDano: oModificadorAtaqueDano !== "" ? Number(oModificadorAtaqueDano) : undefined,
      hechizosVinculados: hechizosPayload,
      artesania: artesaniaPayload
    };

    if (oTipoPrincipal === "Arma") {
      payload = {
        ...basePayload,
        tipoPrincipal: "Arma",
        subcategoria: oSubcategoriaArma,
        tipoAtaque: oTipoAtaque,
        dadoDano: oDadoDano.trim() || "1d4",
        tipoDano: oTipoDano,
        propiedades: oPropiedadesArma,
        maestria: oMaestria,
        alcanceNormal: oAlcanceNormal !== "" ? Number(oAlcanceNormal) : undefined,
        alcanceLargo: oAlcanceLargo !== "" ? Number(oAlcanceLargo) : undefined,
        danoVersatil: oDanoVersatil.trim() || undefined,
        municionRequerida: oMunicionRequerida
      } as Omit<Arma, "id">;
    } else if (oTipoPrincipal === "Armadura") {
      const tiempoVal = oTiempoEquipar !== "" ? (isNaN(Number(oTiempoEquipar)) ? String(oTiempoEquipar).trim() : Number(oTiempoEquipar)) : undefined;
      payload = {
        ...basePayload,
        tipoPrincipal: "Armadura",
        subcategoria: oSubcategoriaArmadura,
        caBase: Number(oCaBase) || 10,
        requisitoFuerza: oRequisitoFuerza !== "" ? Number(oRequisitoFuerza) : undefined,
        desventajaSigilo: oDesventajaSigilo,
        bonoDestreza: oBonoDestreza,
        tiempoEquipar: tiempoVal
      } as Omit<Armadura, "id">;
    } else {
      payload = {
        ...basePayload,
        tipoPrincipal: "Equipo de Aventuras",
        subcategoria: oSubcategoriaEquipo,
        cantidad: oCantidad !== "" ? Number(oCantidad) : undefined,
        ...(oSubcategoriaEquipo === "Consumible" && oEsVeneno ? {
          esVeneno: true,
          tipoVeneno: oTipoVeneno,
          cdSalvacionVeneno: oCdSalvacionVeneno !== "" ? Number(oCdSalvacionVeneno) : undefined,
          efectoVeneno: oEfectoVeneno.trim()
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
    oNombre, oRareza, oPropiedades, oDescripcion, oPesoLb, oValorPO, oEsMagico, oEfectosPasivos,
    oTipoPrincipal, oSubcategoriaArma, oTipoAtaque, oDadoDano, oTipoDano, oPropiedadesArma,
    oMaestria, oAlcanceNormal, oAlcanceLargo, oDanoVersatil, oMunicionRequerida, 
    oSubcategoriaArmadura, oCaBase, oRequisitoFuerza, oDesventajaSigilo, oBonoDestreza, oTiempoEquipar,
    oSubcategoriaEquipo, oCantidad, oSintonizacionRequerida, oCargas, oCondicionSintonizacion, 
    oFormulaRecarga, oEstaMaldito, oEsConsciente, oModificadorAtaqueDano, oHechizosVinculados,
    oArtesaniaTaller, oArtesaniaComponentes, idEnEdicion, agregarObjetoHomebrew, actualizarObjetoHomebrew, 
    agregarNotificacion, limpiarFormulario, alGuardarExitoso, oCostoCantidad, oCostoUnidad, oEsVeneno, 
    oTipoVeneno, oCdSalvacionVeneno, oEfectoVeneno, oEquipable
  ]);

  return {
    oNombre, setONombre,
    oRareza, alCambiarRareza,
    oPropiedades, setOPropiedades,
    oDescripcion, setODescripcion,
    oPesoLb, setOPesoLb,
    oValorPO, setOValorPO,
    oCostoCantidad, setOCostoCantidad,
    oCostoUnidad, setOCostoUnidad,
    oEsMagico, setOEsMagico,
    oEfectosPasivos, setOEfectosPasivos,
    oTipoPrincipal, setOTipoPrincipal,

    oSubcategoriaArma, setOSubcategoriaArma,
    oTipoAtaque, setOTipoAtaque,
    oDadoDano, setODadoDano,
    oTipoDano, setOTipoDano,
    oPropiedadesArma, setOPropiedadesArma,
    oMaestria, setOMaestria,
    oAlcanceNormal, setOAlcanceNormal,
    oAlcanceLargo, setOAlcanceLargo,
    oDanoVersatil, setODanoVersatil,
    oMunicionRequerida, setOMunicionRequerida,

    oSubcategoriaArmadura, alCambiarSubcategoriaArmadura,
    oCaBase, setOCaBase,
    oRequisitoFuerza, setORequisitoFuerza,
    oDesventajaSigilo, setODesventajaSigilo,
    oBonoDestreza, setOBonoDestreza,
    oTiempoEquipar, setOTiempoEquipar,

    oSubcategoriaEquipo, setOSubcategoriaEquipo,
    oCantidad, setOCantidad,
    oSintonizacionRequerida, setOSintonizacionRequerida,
    oCargas, setOCargas,

    oEsVeneno, setOEsVeneno,
    oTipoVeneno, setOTipoVeneno,
    oCdSalvacionVeneno, setOCdSalvacionVeneno,
    oEfectoVeneno, setOEfectoVeneno,
    oEquipable, setOEquipable,

    // Nuevos estados mágicos/narrativos y artesanía
    oCondicionSintonizacion, setOCondicionSintonizacion,
    oFormulaRecarga, setOFormulaRecarga,
    oEstaMaldito, setOEstaMaldito,
    oEsConsciente, setOEsConsciente,
    oModificadorAtaqueDano, setOModificadorAtaqueDano,
    oHechizosVinculados, setOHechizosVinculados,
    oArtesaniaTaller, setOArtesaniaTaller,
    oArtesaniaComponentes, setOArtesaniaComponentes,
    oNuevoComponente, setONuevoComponente,

    // Nuevos estados del editor de efectos/hechizos
    oNuevoBonoCategoria, setONuevoBonoCategoria,
    oNuevoBonoBono, setONuevoBonoBono,
    oNuevoBonoValor, setONuevoBonoValor,
    oNuevoBonoDesc, setONuevoBonoDesc,
    oNuevoHechizoNombre, setONuevoHechizoNombre,
    oNuevoHechizoCd, setONuevoHechizoCd,
    oNuevoHechizoBonoAtaque, setONuevoHechizoBonoAtaque,
    oNuevoHechizoCosteCargas, setONuevoHechizoCosteCargas,

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
