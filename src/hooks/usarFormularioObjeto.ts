import { useState } from "react";
import { usarAlmacenDM, ObjetoHomebrew } from "../almacen/usarAlmacenDM";

export function usarFormularioObjeto(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const { agregarObjetoHomebrew, actualizarObjetoHomebrew, agregarNotificacion } = usarAlmacenDM();

  const [oNombre, setONombre] = useState("");
  const [oRareza, setORareza] = useState("Común");
  const [oPropiedades, setOPropiedades] = useState("");
  const [oDescripcion, setODescripcion] = useState("");
  const [oCategoria, setOCategoria] = useState("ARMA");
  const [oCostoValor, setOCostoValor] = useState<number>(0);
  const [oCostoUnidad, setOCostoUnidad] = useState("PO");
  const [oPeso, setOPeso] = useState("");
  const [oTipoArma, setOTipoArma] = useState("SIMPLE");
  const [oEstiloAtaque, setOEstiloAtaque] = useState("CUERPO A CUERPO");
  const [oAlcance, setOAlcance] = useState("");
  const [oPropiedadesArma, setOPropiedadesArma] = useState<string[]>([]);
  const [oDadosDaño, setODadosDaño] = useState("");
  const [oTipoDaño, setOTipoDaño] = useState("N/A");
  const [oBonoAtaque, setOBonoAtaque] = useState("");
  const [oBonoDaño, setOBonoDaño] = useState("");
  const [oBonosMagicos, setOBonosMagicos] = useState<{ categoria: string; bono: string; valor: number }[]>([]);

  // Estados del editor de bonos mágicos local
  const [oNuevoBonoCategoria, setONuevoBonoCategoria] = useState("CA");
  const [oNuevoBonoBono, setONuevoBonoBono] = useState("CA");
  const [oNuevoBonoValor, setONuevoBonoValor] = useState(0);

  const limpiarFormulario = () => {
    setONombre("");
    setORareza("Común");
    setOPropiedades("");
    setODescripcion("");
    setOCategoria("ARMA");
    setOCostoValor(0);
    setOCostoUnidad("PO");
    setOPeso("");
    setOTipoArma("SIMPLE");
    setOEstiloAtaque("CUERPO A CUERPO");
    setOAlcance("");
    setOPropiedadesArma([]);
    setODadosDaño("");
    setOTipoDaño("N/A");
    setOBonoAtaque("");
    setOBonoDaño("");
    setOBonosMagicos([]);
  };

  const cargarObjeto = (o: ObjetoHomebrew) => {
    setONombre(o.nombre);
    setORareza(o.rareza);
    setOPropiedades(o.propiedades);
    setODescripcion(o.descripcion);
    setOCategoria(o.categoria || "ARMA");
    setOCostoValor(o.costoValor || 0);
    setOCostoUnidad(o.costoUnidad || "PO");
    setOPeso(o.peso || "");
    setOTipoArma(o.tipoArma || "SIMPLE");
    setOEstiloAtaque(o.estiloAtaque || "CUERPO A CUERPO");
    setOAlcance(o.alcance || "");
    setOPropiedadesArma(o.propiedadesArma || []);
    setODadosDaño(o.dadosDaño || "");
    setOTipoDaño(o.tipoDaño || "N/A");
    setOBonoAtaque(o.bonoAtaque || "");
    setOBonoDaño(o.bonoDaño || "");
    setOBonosMagicos(o.bonosMagicos || []);
  };

  const agregarBonoMagico = () => {
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
  };

  const eliminarBonoMagicoIdx = (idx: number) => {
    setOBonosMagicos((prev) => prev.filter((_, i) => i !== idx));
  };

  const manejarGuardarObjeto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oNombre.trim()) {
      agregarNotificacion("El nombre del objeto es requerido", "advertencia");
      return;
    }

    let propTxt = oPropiedades.trim();
    if (!propTxt) {
      const parts: string[] = [];
      parts.push(oCategoria);
      if (oPeso) parts.push(`${oPeso} lb.`);
      if (oCostoValor > 0) parts.push(`${oCostoValor} ${oCostoUnidad}`);
      if (oCategoria === "ARMA") {
        if (oTipoArma) parts.push(oTipoArma);
        if (oEstiloAtaque) parts.push(oEstiloAtaque);
        if (oAlcance) parts.push(`Alcance ${oAlcance}`);
        if (oDadosDaño) parts.push(`${oDadosDaño} ${oTipoDaño}`);
      }
      propTxt = parts.join(", ");
    }

    const payload = {
      nombre: oNombre.trim(),
      rareza: oRareza,
      propiedades: propTxt,
      descripcion: oDescripcion.trim(),
      categoria: oCategoria,
      costoValor: oCostoValor,
      costoUnidad: oCostoUnidad,
      peso: oPeso.trim() || undefined,
      tipoArma: oCategoria === "ARMA" ? oTipoArma : undefined,
      estiloAtaque: oCategoria === "ARMA" ? oEstiloAtaque : undefined,
      alcance: oCategoria === "ARMA" ? oAlcance.trim() : undefined,
      propiedadesArma: oCategoria === "ARMA" ? oPropiedadesArma : undefined,
      dadosDaño: oCategoria === "ARMA" ? oDadosDaño.trim() : undefined,
      tipoDaño: oCategoria === "ARMA" ? oTipoDaño : undefined,
      bonoAtaque: oCategoria === "ARMA" ? oBonoAtaque.trim() : undefined,
      bonoDaño: oCategoria === "ARMA" ? oBonoDaño.trim() : undefined,
      bonosMagicos: oBonosMagicos
    };

    if (idEnEdicion) {
      actualizarObjetoHomebrew(idEnEdicion, payload);
      agregarNotificacion("¡Objeto Homebrew actualizado con éxito!", "exito");
    } else {
      agregarObjetoHomebrew(payload);
      agregarNotificacion("¡Objeto Homebrew guardado con éxito!", "exito");
    }

    limpiarFormulario();
    alGuardarExitoso();
  };

  return {
    oNombre, setONombre,
    oRareza, setORareza,
    oPropiedades, setOPropiedades,
    oDescripcion, setODescripcion,
    oCategoria, setOCategoria,
    oCostoValor, setOCostoValor,
    oCostoUnidad, setOCostoUnidad,
    oPeso, setOPeso,
    oTipoArma, setOTipoArma,
    oEstiloAtaque, setOEstiloAtaque,
    oAlcance, setOAlcance,
    oPropiedadesArma, setOPropiedadesArma,
    oDadosDaño, setODadosDaño,
    oTipoDaño, setOTipoDaño,
    oBonoAtaque, setOBonoAtaque,
    oBonoDaño, setOBonoDaño,
    oBonosMagicos, setOBonosMagicos,
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
