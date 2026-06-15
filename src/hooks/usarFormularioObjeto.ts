import { useState, useCallback } from "react";
import { usarAlmacenDM, ObjetoHomebrew, ObjetoJuego, Rareza, TipoBonoDestreza, SubcategoriaEquipo, Arma, Armadura, EquipoAventuras } from "../almacen/usarAlmacenDM";

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
  const [oBonosMagicos, setOBonosMagicos] = useState<{ categoria: string; bono: string; valor: number }[]>([]);

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

  // --- ESTADOS ESPECÍFICOS DE ARMADURA ---
  const [oSubcategoriaArmadura, setOSubcategoriaArmadura] = useState<"Ligera" | "Mediana" | "Pesada" | "Escudo">("Ligera");
  const [oCaBase, setOCaBase] = useState<number>(10);
  const [oRequisitoFuerza, setORequisitoFuerza] = useState<number | "">("");
  const [oDesventajaSigilo, setODesventajaSigilo] = useState(false);
  const [oBonoDestreza, setOBonoDestreza] = useState<TipoBonoDestreza>("Completo");

  // --- ESTADOS ESPECÍFICOS DE EQUIPO DE AVENTURAS ---
  const [oSubcategoriaEquipo, setOSubcategoriaEquipo] = useState<SubcategoriaEquipo>("Maravilloso");
  const [oCantidad, setOCantidad] = useState<number | "">("");
  const [oSintonizacionRequerida, setOSintonizacionRequerida] = useState(false);
  const [oCargas, setOCargas] = useState<number | "">("");

  // --- ESTADOS DEL EDITOR DE BONOS DINÁMICOS LOCAL ---
  const [oNuevoBonoCategoria, setONuevoBonoCategoria] = useState("CA");
  const [oNuevoBonoBono, setONuevoBonoBono] = useState("CA");
  const [oNuevoBonoValor, setONuevoBonoValor] = useState(0);

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
    setOBonosMagicos([]);
    setOTipoPrincipal("Arma");

    setOSubcategoriaArma("Sencilla");
    setOTipoAtaque("Cuerpo a Cuerpo");
    setODadoDano("1d6");
    setOTipoDano("Fuerza");
    setOPropiedadesArma([]);
    setOMaestria("Ninguna");
    setOAlcanceNormal("");
    setOAlcanceLargo("");

    setOSubcategoriaArmadura("Ligera");
    setOCaBase(10);
    setORequisitoFuerza("");
    setODesventajaSigilo(false);
    setOBonoDestreza("Completo");

    setOSubcategoriaEquipo("Maravilloso");
    setOCantidad("");
    setOSintonizacionRequerida(false);
    setOCargas("");

    setOEsVeneno(false);
    setOTipoVeneno("Contacto");
    setOCdSalvacionVeneno("");
    setOEfectoVeneno("");
    setOEquipable(false);

    setONuevoBonoCategoria("CA");
    setONuevoBonoBono("CA");
    setONuevoBonoValor(0);
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
    setOBonosMagicos(o.bonosMagicos || []);
    setOTipoPrincipal(o.tipoPrincipal);

    setOEsVeneno(o.esVeneno || false);
    setOTipoVeneno(o.tipoVeneno || "Contacto");
    setOCdSalvacionVeneno(o.cdSalvacionVeneno !== undefined ? o.cdSalvacionVeneno : "");
    setOEfectoVeneno(o.efectoVeneno || "");
    setOEquipable(o.equipable || false);

    if (o.tipoPrincipal === "Arma") {
      setOSubcategoriaArma(o.subcategoria || "Sencilla");
      setOTipoAtaque(o.tipoAtaque || "Cuerpo a Cuerpo");
      setODadoDano(o.dadoDano || "1d6");
      setOTipoDano(o.tipoDano || "Fuerza");
      setOPropiedadesArma(o.propiedades || []);
      setOMaestria(o.maestria || "Ninguna");
      setOAlcanceNormal(o.alcanceNormal !== undefined ? o.alcanceNormal : "");
      setOAlcanceLargo(o.alcanceLargo !== undefined ? o.alcanceLargo : "");
      setOEquipable(true);
    } else if (o.tipoPrincipal === "Armadura") {
      setOSubcategoriaArmadura(o.subcategoria || "Ligera");
      setOCaBase(o.caBase || 10);
      setORequisitoFuerza(o.requisitoFuerza !== undefined ? o.requisitoFuerza : "");
      setODesventajaSigilo(o.desventajaSigilo || false);
      setOBonoDestreza(o.bonoDestreza || "Completo");
      setOEquipable(true);
    } else if (o.tipoPrincipal === "Equipo de Aventuras") {
      setOSubcategoriaEquipo(o.subcategoria || "Maravilloso");
      setOCantidad(o.cantidad !== undefined ? o.cantidad : "");
      setOSintonizacionRequerida(o.sintonizacionRequerida || false);
      setOCargas(o.cargas !== undefined ? o.cargas : "");
    }
  }, []);

  const agregarBonoMagico = useCallback(() => {
    if (!oNuevoBonoBono.trim()) return;
    setOBonosMagicos((prev) => [
      ...prev,
      {
        categoria: oNuevoBonoCategoria,
        bono: oNuevoBonoBono.trim(),
        valor: oNuevoBonoValor
      }
    ]);
    setONuevoBonoValor(0);
  }, [oNuevoBonoBono, oNuevoBonoCategoria, oNuevoBonoValor]);

  const eliminarBonoMagicoIdx = useCallback((idx: number) => {
    setOBonosMagicos((prev) => prev.filter((_, i) => i !== idx));
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
      bonosMagicos: oBonosMagicos,
      equipable: oTipoPrincipal === "Arma" || oTipoPrincipal === "Armadura" ? true : oEquipable
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
        alcanceLargo: oAlcanceLargo !== "" ? Number(oAlcanceLargo) : undefined
      } as Omit<Arma, "id">;
    } else if (oTipoPrincipal === "Armadura") {
      payload = {
        ...basePayload,
        tipoPrincipal: "Armadura",
        subcategoria: oSubcategoriaArmadura,
        caBase: Number(oCaBase) || 10,
        requisitoFuerza: oRequisitoFuerza !== "" ? Number(oRequisitoFuerza) : undefined,
        desventajaSigilo: oDesventajaSigilo,
        bonoDestreza: oBonoDestreza
      } as Omit<Armadura, "id">;
    } else {
      payload = {
        ...basePayload,
        tipoPrincipal: "Equipo de Aventuras",
        subcategoria: oSubcategoriaEquipo,
        cantidad: oCantidad !== "" ? Number(oCantidad) : undefined,
        sintonizacionRequerida: oSintonizacionRequerida,
        cargas: oCargas !== "" ? Number(oCargas) : undefined,
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
    oNombre, oRareza, oPropiedades, oDescripcion, oPesoLb, oValorPO, oEsMagico, oBonosMagicos,
    oTipoPrincipal, oSubcategoriaArma, oTipoAtaque, oDadoDano, oTipoDano, oPropiedadesArma,
    oMaestria, oAlcanceNormal, oAlcanceLargo, oSubcategoriaArmadura, oCaBase, oRequisitoFuerza,
    oDesventajaSigilo, oBonoDestreza, oSubcategoriaEquipo, oCantidad, oSintonizacionRequerida,
    oCargas, idEnEdicion, agregarObjetoHomebrew, actualizarObjetoHomebrew, agregarNotificacion,
    limpiarFormulario, alGuardarExitoso, oCostoCantidad, oCostoUnidad, oEsVeneno, oTipoVeneno,
    oCdSalvacionVeneno, oEfectoVeneno, oEquipable
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
    oBonosMagicos, setOBonosMagicos,
    oTipoPrincipal, setOTipoPrincipal,

    oSubcategoriaArma, setOSubcategoriaArma,
    oTipoAtaque, setOTipoAtaque,
    oDadoDano, setODadoDano,
    oTipoDano, setOTipoDano,
    oPropiedadesArma, setOPropiedadesArma,
    oMaestria, setOMaestria,
    oAlcanceNormal, setOAlcanceNormal,
    oAlcanceLargo, setOAlcanceLargo,

    oSubcategoriaArmadura, alCambiarSubcategoriaArmadura,
    oCaBase, setOCaBase,
    oRequisitoFuerza, setORequisitoFuerza,
    oDesventajaSigilo, setODesventajaSigilo,
    oBonoDestreza, setOBonoDestreza,

    oSubcategoriaEquipo, setOSubcategoriaEquipo,
    oCantidad, setOCantidad,
    oSintonizacionRequerida, setOSintonizacionRequerida,
    oCargas, setOCargas,

    oEsVeneno, setOEsVeneno,
    oTipoVeneno, setOTipoVeneno,
    oCdSalvacionVeneno, setOCdSalvacionVeneno,
    oEfectoVeneno, setOEfectoVeneno,
    oEquipable, setOEquipable,

    oNuevoBonoCategoria, setONuevoBonoCategoria,
    oNuevoBonoBono, setONuevoBonoBono,
    oNuevoBonoValor, setONuevoBonoValor,

    limpiarFormulario,
    cargarObjeto,
    agregarBonoMagico,
    eliminarBonoMagicoIdx,
    manejarGuardarObjeto
  };
}
