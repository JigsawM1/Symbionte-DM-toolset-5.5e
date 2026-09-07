import { useState, useMemo } from "react";
import type {
  ObjetoInventario,
  Rareza,
  Arma,
  Armadura,
  ObjetoJuego
} from "@/tipos";
import estilos from "../ModalDetalleObjetoInventario.module.css";

export const CLASES_RAREZA: Record<Rareza, string> = {
  "Común": estilos.rarezaComun,
  "Poco Común": estilos.rarezaPocoComun,
  "Raro": estilos.rarezaRaro,
  "Muy Raro": estilos.rarezaMuyRaro,
  "Legendario": estilos.rarezaLegendario,
  "Artefacto": estilos.rarezaArtefacto
};

export interface OpcionEspecializacionContenedor {
  id: string;
  nombre: string;
  idObjeto: string;
  etiqueta: string;
  descripcion: string;
}

export const OPCIONES_ESPECIALIZACION_BOLSAS: OpcionEspecializacionContenedor[] = [
  {
    id: "pouch",
    nombre: "Bolsita",
    idObjeto: "pouch",
    etiqueta: "Bolsita Genérica (Multiuso)",
    descripcion: "Contenedor estándar multiuso (hasta 20 balas o 50 agujas)."
  },
  {
    id: "bullet-pouch",
    nombre: "Bolsa de Balas",
    idObjeto: "bullet-pouch",
    etiqueta: "Bolsa de Balas (Honda)",
    descripcion: "Especializada exclusivamente para transportar hasta 20 Balas de Honda."
  },
  {
    id: "needle-case",
    nombre: "Estuche de Agujas",
    idObjeto: "needle-case",
    etiqueta: "Estuche de Agujas (Cerbatana)",
    descripcion: "Especializado exclusivamente para transportar hasta 50 Agujas de Cerbatana."
  },
  {
    id: "cartridge-pouch",
    nombre: "Cartuchera",
    idObjeto: "cartridge-pouch",
    etiqueta: "Cartuchera (Arma de Fuego)",
    descripcion: "Especializada exclusivamente para transportar hasta 20 Balas de Arma de Fuego / Cargas."
  }
];

interface PropiedadesHookDetalleObjeto {
  objeto: ObjetoInventario;
  baseDatosObjetos?: ObjetoJuego[];
  totalSintonizados: number;
  alActualizarNotas?: (notas: string) => void;
}

export const usarDetalleObjetoInventario = ({
  objeto,
  baseDatosObjetos,
  totalSintonizados,
  alActualizarNotas
}: PropiedadesHookDetalleObjeto) => {
  const [notasTemp, setNotasTemp] = useState(objeto.notas || "");
  const [notasGuardadas, setNotasGuardadas] = useState(false);

  // Buscar objeto del compendio para obtener datos enriquecidos
  const objetoBase = useMemo<ObjetoJuego | null>(() => {
    if (!baseDatosObjetos) return null;
    const normalizar = (s: string) => s.toLowerCase().trim();
    return (
      baseDatosObjetos.find(
        (o) => o.id === objeto.idObjeto || normalizar(o.nombre) === normalizar(objeto.nombre)
      ) || null
    );
  }, [baseDatosObjetos, objeto.idObjeto, objeto.nombre]);

  const pesoUnitario = Number(objeto.pesoLb) || Number(objetoBase?.pesoLb) || 0;
  const pesoTotal = Math.round(pesoUnitario * (Number(objeto.cantidad) || 1) * 100) / 100;
  const valorPO = Number(objetoBase?.valorPO) || 0;
  const rareza = (objeto.rareza as Rareza) || (objetoBase?.rareza as Rareza) || "Común";
  const rarezaClass = CLASES_RAREZA[rareza] || estilos.rarezaComun;
  const subcategoria = objetoBase?.subcategoria;

  const puedeSintonizar = objeto.sintonizado || totalSintonizados < 3;

  const esArma = objeto.tipoPrincipal === "Arma" || objetoBase?.tipoPrincipal === "Arma";
  const esArmadura = objeto.tipoPrincipal === "Armadura" || objetoBase?.tipoPrincipal === "Armadura";
  const armaObj = esArma && objetoBase?.tipoPrincipal === "Arma" ? (objetoBase as Arma) : null;
  const armaduraObj = esArmadura && objetoBase?.tipoPrincipal === "Armadura" ? (objetoBase as Armadura) : null;
  const descripcion = objetoBase?.descripcion || objeto.notas || "";

  const manejarGuardarNotas = () => {
    if (alActualizarNotas) {
      alActualizarNotas(notasTemp);
      setNotasGuardadas(true);
      setTimeout(() => setNotasGuardadas(false), 2000);
    }
  };

  return {
    objetoBase,
    pesoUnitario,
    pesoTotal,
    valorPO,
    rareza,
    rarezaClass,
    subcategoria,
    puedeSintonizar,
    esArma,
    esArmadura,
    armaObj,
    armaduraObj,
    descripcion,
    notasTemp,
    setNotasTemp,
    notasGuardadas,
    manejarGuardarNotas
  };
};
