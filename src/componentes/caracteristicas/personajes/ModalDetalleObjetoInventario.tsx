import React, { useState, useMemo } from "react";
import type {
  ObjetoInventario,
  Rareza,
  Arma,
  Armadura,
  ObjetoJuego,
  EfectoPasivo,
  HechizoVinculado,
  TipoContenedor
} from "@/tipos";
import {
  X,
  Swords,
  Shield,
  Package,
  Sparkles,
  Link2,
  Zap,
  Weight,
  Coins,
  Check,
  Save,
  BookOpen,
  Box,
  PackageOpen,
  Dices,
  FlaskConical,
  Hammer,
  Clock,
  Target,
  AlertTriangle
} from "lucide-react";
import { CONFIG_CONTENEDORES } from "@/servicios/calculadorInventario";
import {
  calcularAlmacenamientoMunicion,
  calcularContenidoContenedorMunicion,
  normalizarTexto
} from "@/servicios/gestorMunicion";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { lanzarDadosTaleSpire, sanitizarEtiqueta } from "@/utiles/lanzadorDados";
import estilos from "./ModalDetalleObjetoInventario.module.css";

/** Diccionario de descripciones oficiales de maestrías D&D 5.5e (2024) */
const DESCRIPCIONES_MAESTRIAS: Record<string, string> = {
  "cleave": "HENDER (Cleave): Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes realizar otro ataque contra una segunda criatura a 5 pies que esté a tu alcance.",
  "hender": "HENDER (Cleave): Si impactas a una criatura con un ataque cuerpo a cuerpo, puedes realizar otro ataque contra una segunda criatura a 5 pies que esté a tu alcance.",
  "graze": "ROZAR (Graze): Si fallas una tirada de ataque contra una criatura, aun así le infliges daño igual al modificador de la característica usada.",
  "rozar": "ROZAR (Graze): Si fallas una tirada de ataque contra una criatura, aun así le infliges daño igual al modificador de la característica usada.",
  "nick": "CORTE RÁPIDO (Nick): Puedes realizar el ataque adicional de la propiedad Ligera como parte de la misma Acción de Atacar, en lugar de consumir tu Acción Adicional.",
  "corte": "CORTE RÁPIDO (Nick): Puedes realizar el ataque adicional de la propiedad Ligera como parte de la misma Acción de Atacar, en lugar de consumir tu Acción Adicional.",
  "push": "EMPUJE (Push): Si impactas a una criatura, puedes empujarla hasta 10 pies en línea recta lejos de ti (si es de tamaño Grande o menor).",
  "empuje": "EMPUJE (Push): Si impactas a una criatura, puedes empujarla hasta 10 pies en línea recta lejos de ti (si es de tamaño Grande o menor).",
  "sap": "ZAPATAZO / ATURDIR (Sap): Si impactas a una criatura, esta tiene desventaja en su próxima tirada de ataque antes del inicio de tu próximo turno.",
  "aturdir": "ZAPATAZO / ATURDIR (Sap): Si impactas a una criatura, esta tiene desventaja en su próxima tirada de ataque antes del inicio de tu próximo turno.",
  "slow": "FRENAR (Slow): Si impactas a una criatura y le infliges daño, reduces su velocidad en 10 pies hasta el inicio de tu próximo turno.",
  "frenar": "FRENAR (Slow): Si impactas a una criatura y le infliges daño, reduces su velocidad en 10 pies hasta el inicio de tu próximo turno.",
  "topple": "DERRIBAR (Topple): Si impactas a una criatura, debe superar una salvación de Constitución o caer derribada (Tumbada).",
  "derribar": "DERRIBAR (Topple): Si impactas a una criatura, debe superar una salvación de Constitución o caer derribada (Tumbada).",
  "vex": "HOSTIGAR (Vex): Si impactas a una criatura y le infliges daño, ganas ventaja en tu próxima tirada de ataque contra ella antes del final de tu próximo turno.",
  "hostigar": "HOSTIGAR (Vex): Si impactas a una criatura y le infliges daño, ganas ventaja en tu próxima tirada de ataque contra ella antes del final de tu próximo turno."
};

interface ModalDetalleObjetoInventarioProps {
  objeto: ObjetoInventario;
  baseDatosObjetos?: ObjetoJuego[];
  inventarioCompleto?: ObjetoInventario[];
  totalSintonizados: number;
  alCerrar: () => void;
  alAlternarEquipado?: () => void;
  alAlternarSintonizado?: () => void;
  alActualizarNotas?: (notas: string) => void;
  alActualizarObjeto?: (cambios: Partial<ObjetoInventario>) => void;
  alCambiarContenedor?: (contenedor: TipoContenedor) => void;
  alDesempaquetar?: () => void;
  alModificarCargas?: (delta: number) => void;
  alLanzarHechizo?: (hechizo: HechizoVinculado, objetoNombre: string, coste: number) => Promise<boolean | void>;
  bloqueadoPorArmadura?: boolean;
  motivoBloqueoArmadura?: string;
}

const CLASES_RAREZA: Record<Rareza, string> = {
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

export const ModalDetalleObjetoInventario: React.FC<ModalDetalleObjetoInventarioProps> = ({
  objeto,
  baseDatosObjetos,
  inventarioCompleto,
  totalSintonizados,
  alCerrar,
  alAlternarEquipado,
  alAlternarSintonizado,
  alActualizarNotas,
  alActualizarObjeto,
  alCambiarContenedor,
  alDesempaquetar,
  alModificarCargas,
  alLanzarHechizo,
  bloqueadoPorArmadura = false,
  motivoBloqueoArmadura
}) => {
  const [notasTemp, setNotasTemp] = useState(objeto.notas || "");
  const [notasGuardadas, setNotasGuardadas] = useState(false);

  // Buscar objeto del compendio para obtener datos enriquecidos (descripción, valor, daño, propiedades)
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

  return (
    <div className={estilos.backdropModal} onClick={alCerrar}>
      <div
        className={estilos.ventanaModal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Visor */}
        <div className={estilos.cabeceraModal}>
          <div className={estilos.grupoTitulo}>
            <div className={estilos.iconoTipo}>
              {esArma && <Swords size={18} color="#f87171" />}
              {esArmadura && <Shield size={18} color="#60a5fa" />}
              {!esArma && !esArmadura && (
                objeto.esMagico || objetoBase?.esMagico ? (
                  <Sparkles size={18} color="#a855f7" />
                ) : (
                  <Package size={18} color="#34d399" />
                )
              )}
            </div>
            <div>
              <h3 className={estilos.tituloModal}>
                {objeto.nombre}
              </h3>
              <div className={estilos.filaSubtitulo}>
                <span className={`${estilos.badgeMeta} ${rarezaClass}`}>
                  {rareza}
                </span>
                <span className={estilos.textoSubtitulo}>
                  {objeto.tipoPrincipal} {subcategoria ? `• ${subcategoria}` : ""}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={estilos.botonCerrar}
            onClick={alCerrar}
            title="Cerrar visor"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo del Visor con scroll táctico */}
        {/* Cuerpo del Visor con scroll táctico */}
        <div className={estilos.cuerpoModal}>
          {/* Rejilla de Métricas Principales */}
          <div className={estilos.gridMetricas}>
            {/* Peso */}
            <div className={estilos.cajaMetrica}>
              <span className={estilos.etiquetaMetrica}>
                <Weight size={11} /> Peso
              </span>
              <strong className={estilos.valorMetrica}>
                {pesoTotal > 0 ? `${pesoTotal} lb` : "0 lb"}
                {objeto.cantidad > 1 && (
                  <span className={estilos.subtextoMetrica}>
                    ({pesoUnitario} c/u)
                  </span>
                )}
              </strong>
            </div>

            {/* Valor */}
            <div className={estilos.cajaMetrica}>
              <span className={estilos.etiquetaMetrica}>
                <Coins size={11} /> Valor
              </span>
              <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaOro}`}>
                {objetoBase?.costoOriginal && objetoBase.costoOriginal.cantidad > 0
                  ? `${objetoBase.costoOriginal.cantidad} ${objetoBase.costoOriginal.unidad}`
                  : valorPO > 0
                  ? `${valorPO} PO`
                  : "—"}
              </strong>
            </div>

            {/* Cantidad */}
            <div className={estilos.cajaMetrica}>
              <span className={estilos.etiquetaMetrica}>
                Cantidad
              </span>
              <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaAzul}`}>
                ×{objeto.cantidad}
              </strong>
            </div>

            {/* Daño si es Arma */}
            {esArma && armaObj && (
              <div className={estilos.cajaMetrica}>
                <span className={estilos.etiquetaMetrica}>
                  Daño Base
                </span>
                <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaRojo}`}>
                  {armaObj.dadoDano} {armaObj.tipoDano}
                </strong>
              </div>
            )}

            {/* CA si es Armadura */}
            {esArmadura && armaduraObj && (
              <div className={estilos.cajaMetrica}>
                <span className={estilos.etiquetaMetrica}>
                  Clase Armadura
                </span>
                <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaAzul}`}>
                  CA {armaduraObj.caBase}
                </strong>
              </div>
            )}

            {/* Cargas si aplica */}
            {objeto.cargasMaximas !== undefined && (
              <div className={estilos.cajaMetrica}>
                <span className={estilos.etiquetaMetrica}>
                  <Zap size={11} color="#fbbf24" /> Cargas
                </span>
                <strong className={`${estilos.valorMetrica} ${estilos.valorMetricaOro}`}>
                  {objeto.cargasActuales ?? objeto.cargasMaximas} / {objeto.cargasMaximas}
                </strong>
              </div>
            )}
          </div>

          {/* Estadísticas Detalladas de Arma */}
          {esArma && armaObj && (
            <div className={`${estilos.seccionDatosGenerales} ${estilos.seccionArma}`}>
              <div className={estilos.filaBadges}>
                {armaObj.tipoAtaque && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaAtaque}`}>
                    {armaObj.tipoAtaque}
                  </span>
                )}
                {armaObj.danoVersatil && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaVersatil}`}>
                    Versátil ({armaObj.danoVersatil})
                  </span>
                )}
                {armaObj.alcanceNormal && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaAlcance}`}>
                    Alcance {armaObj.alcanceNormal}/{armaObj.alcanceLargo || armaObj.alcanceNormal} pies
                  </span>
                )}
                {armaObj.maestria && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaMaestria}`}>
                    Maestría: {armaObj.maestria}
                  </span>
                )}
                {armaObj.ammunition && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeAmmunition}`}>
                    <Target size={10} /> Munición: {armaObj.ammunition.name}
                  </span>
                )}
                {objetoBase?.modificadorAtaqueDano && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeMagicoBono}`}>
                    <Sparkles size={10} /> Bono: +{objetoBase.modificadorAtaqueDano}
                  </span>
                )}
              </div>

              {armaObj.maestria && DESCRIPCIONES_MAESTRIAS[armaObj.maestria.toLowerCase()] && (
                <div className={estilos.explicacionMaestria}>
                  {DESCRIPCIONES_MAESTRIAS[armaObj.maestria.toLowerCase()]}
                </div>
              )}

              {armaObj.propiedades && armaObj.propiedades.length > 0 && (
                <div className={estilos.filaPropiedadesLista}>
                  {armaObj.propiedades.map((p) => (
                    <span key={p} className={estilos.badgePropiedad}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estadísticas Detalladas de Armadura */}
          {esArmadura && armaduraObj && (
            <div className={`${estilos.seccionDatosGenerales} ${estilos.seccionArmadura}`}>
              <div className={estilos.filaBadges}>
                <span className={`${estilos.badgeMeta} ${estilos.badgeArmaduraDes}`}>
                  Bono Destreza: {armaduraObj.bonoDestreza || "Completo"}
                </span>
                {armaduraObj.requisitoFuerza && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaduraFue}`}>
                    Fuerza Requerida: {armaduraObj.requisitoFuerza}
                  </span>
                )}
                {armaduraObj.desventajaSigilo && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeArmaduraSigilo}`}>
                    Desventaja en Sigilo
                  </span>
                )}
                {armaduraObj.tiempoEquipar && (
                  <span className={`${estilos.badgeMeta} ${estilos.badgeTiempoEquipar}`}>
                    <Clock size={10} /> Poner/Quitar: {armaduraObj.tiempoEquipar}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Selector de Especialización de Contenedor (Mutación táctica de Bolsita) */}
          {(() => {
            const nomNorm = normalizarTexto(objeto.nombre);
            const idNorm = normalizarTexto(objeto.idObjeto || "");
            const esContenedorBolsa =
              nomNorm.includes("bols") ||
              nomNorm.includes("pouch") ||
              nomNorm.includes("estuche de agujas") ||
              nomNorm.includes("needle case") ||
              nomNorm.includes("cartuchera") ||
              idNorm === "pouch" ||
              idNorm === "bullet-pouch" ||
              idNorm === "needle-case" ||
              idNorm === "cartridge-pouch";

            if (!esContenedorBolsa || !alActualizarObjeto) return null;

            let valorActual = "pouch";
            if (idNorm === "bullet-pouch" || nomNorm.includes("bolsa de balas")) valorActual = "bullet-pouch";
            else if (idNorm === "needle-case" || nomNorm.includes("estuche de agujas") || nomNorm.includes("needle case")) valorActual = "needle-case";
            else if (idNorm === "cartridge-pouch" || nomNorm.includes("cartuchera")) valorActual = "cartridge-pouch";

            const opcionActual = OPCIONES_ESPECIALIZACION_BOLSAS.find((o) => o.id === valorActual);

            return (
              <div className={estilos.seccionEspecializacionContenedor}>
                <div className={estilos.cabeceraEspecializacion}>
                  <span className={estilos.tituloEspecializacion}>
                    <Box size={13} /> Especialización del Contenedor
                  </span>
                  <SelectorDesplegable<string>
                    valor={valorActual}
                    alCambiar={(nuevaId) => {
                      const seleccionada = OPCIONES_ESPECIALIZACION_BOLSAS.find((o) => o.id === nuevaId);
                      if (seleccionada) {
                        alActualizarObjeto({
                          idObjeto: seleccionada.idObjeto,
                          nombre: seleccionada.nombre
                        });
                      }
                    }}
                    tamano="compacto"
                    opciones={OPCIONES_ESPECIALIZACION_BOLSAS.map((opc) => ({
                      valor: opc.id,
                      etiqueta: opc.etiqueta
                    }))}
                  />
                </div>
                {opcionActual && (
                  <span className={estilos.descripcionEspecializacion}>
                    {opcionActual.descripcion}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Regla de Almacenamiento / Capacidad de Munición o Contenedor Físico */}
          {(() => {
            const infoMunicion = inventarioCompleto
              ? calcularAlmacenamientoMunicion(objeto, inventarioCompleto, objetoBase || undefined)
              : null;
            const infoContenedor = inventarioCompleto
              ? calcularContenidoContenedorMunicion(objeto, inventarioCompleto)
              : null;

            if (infoMunicion) {
              return (
                <div className={estilos.filaBadges} style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  {infoMunicion.tieneContenedor ? (
                    <>
                      <span className={`${estilos.badgeMeta} ${estilos.badgeStorage}`} style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#7dd3fc", borderColor: "rgba(56, 189, 248, 0.35)" }}>
                        <Check size={10} /> Almacenamiento: {infoMunicion.almacenadasEnContenedor} de {infoMunicion.totalMunicion} en {infoMunicion.nombreContenedor} (Capacidad: {infoMunicion.capacidadTotal})
                      </span>
                      {infoMunicion.sueltasEnMochila > 0 && (
                        <span className={`${estilos.badgeMeta}`} style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fcd34d", borderColor: "rgba(245, 158, 11, 0.35)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={10} /> {infoMunicion.sueltasEnMochila} proyectiles exceden la capacidad de tu {infoMunicion.nombreContenedor} y van sueltos en la mochila
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={`${estilos.badgeMeta} ${estilos.badgeStorage}`} style={{ backgroundColor: "rgba(148, 163, 184, 0.1)", color: "#94a3b8", borderColor: "rgba(148, 163, 184, 0.2)" }}>
                      <Package size={10} /> Suelto en mochila. Requiere: {infoMunicion.nombreContenedor} (Capacidad: {infoMunicion.capacidadUnitaria} uds)
                    </span>
                  )}
                </div>
              );
            }

            if (infoContenedor) {
              return (
                <div className={estilos.filaBadges} style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <span className={`${estilos.badgeMeta}`} style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7", borderColor: "rgba(16, 185, 129, 0.35)" }}>
                    <Target size={10} /> Capacidad de Munición: {infoContenedor.totalAlmacenado} / {infoContenedor.capacidadTotal} {infoContenedor.tipoProyectil} ({infoContenedor.capacidadUnitaria} por unidad)
                    {infoContenedor.estaLleno && " • Completo"}
                  </span>
                </div>
              );
            }

            return null;
          })()}

          {/* Regla de Recarga de Cargas si existe */}
          {objetoBase?.formulaRecarga && (
            <div className={estilos.filaBadges}>
              <span className={estilos.badgeRecargaCargas}>
                <Sparkles size={10} /> Recarga: {objetoBase.formulaRecarga}
              </span>
            </div>
          )}

          {/* Sección de Venenos */}
          {(objetoBase?.esVeneno || objetoBase?.tipoVeneno || objetoBase?.efectoVeneno) && (
            <div className={estilos.seccionVeneno}>
              <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionVeneno}`}>
                <FlaskConical size={12} /> Propiedades del Veneno
              </span>
              {objetoBase.tipoVeneno && (
                <div className={estilos.filaBadges}>
                  <span className={`${estilos.badgeMeta} ${estilos.badgeVenenoTipo}`}>
                    Tipo: {objetoBase.tipoVeneno}
                  </span>
                </div>
              )}
              {objetoBase.efectoVeneno && (
                <div className={estilos.cajaTextoVeneno}>
                  {objetoBase.efectoVeneno}
                </div>
              )}
            </div>
          )}

          {/* Estado de Sintonización si aplica */}
          {(objeto.sintonizacionRequerida || objetoBase?.sintonizacionRequerida) && (
            <div
              className={`${estilos.filaInteractiva} ${
                objeto.sintonizado ? estilos.filaInteractivaSintonizado : ""
              }`}
            >
              <div className={estilos.bloqueInfoInteractiva}>
                <Link2 size={14} color={objeto.sintonizado ? "#c084fc" : "#94a3b8"} />
                <div>
                  <span className={objeto.sintonizado ? estilos.textoInteractivaActivo : estilos.textoInteractiva}>
                    {objeto.sintonizado ? "Sintonizado con este personaje" : "Requiere Sintonización (No sintonizado)"}
                  </span>
                  {objetoBase?.condicionSintonizacion && (
                    <div className={estilos.subtextoCondicionSintonizacion}>
                      Condición: {objetoBase.condicionSintonizacion}
                    </div>
                  )}
                </div>
              </div>

              {alAlternarSintonizado && (
                <button
                  type="button"
                  onClick={alAlternarSintonizado}
                  disabled={!puedeSintonizar}
                  className={`${estilos.botonAccionModal} ${
                    objeto.sintonizado ? estilos.botonDesintonizar : estilos.botonSintonizar
                  }`}
                >
                  {objeto.sintonizado ? "Desintonizar" : "Sintonizar"}
                </button>
              )}
            </div>
          )}

          {/* Ubicación y Contenedor Especial */}
          <div className={estilos.seccionContenedor}>
            <span className={estilos.tituloSeccion}>
              <Box size={12} /> Ubicación / Contenedor
            </span>
            <div className={estilos.gridContenedores}>
              {(["mochila", "bolsa_contencion", "montura", "almacen"] as TipoContenedor[]).map((contClave) => {
                const info = CONFIG_CONTENEDORES[contClave];
                const seleccionado = (objeto.contenedor || "mochila") === contClave;
                return (
                  <button
                    key={contClave}
                    type="button"
                    onClick={() => alCambiarContenedor && alCambiarContenedor(contClave)}
                    disabled={objeto.equipado && contClave !== "mochila"}
                    className={`${estilos.botonContenedor} ${
                      seleccionado ? estilos.botonContenedorActivo : ""
                    }`}
                    style={{
                      backgroundColor: seleccionado ? `${info.color}22` : undefined,
                      borderColor: seleccionado ? info.color : undefined
                    }}
                    title={info.descripcion}
                  >
                    <span
                      className={estilos.nombreContenedor}
                      style={{ color: seleccionado ? info.color : undefined }}
                    >
                      {info.nombreCorto}
                    </span>
                    <span className={info.sumaCargaPersonaje ? estilos.subtextoContenedor : `${estilos.subtextoContenedor} ${estilos.subtextoContenedorExento}`}>
                      {info.sumaCargaPersonaje ? "Suma carga" : "0 lb carga"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={estilos.explicacionContenedor}>
              {(objeto.contenedor || "mochila") === "mochila" ? (
                " Llevas este objeto encima. Su peso cuenta para tu capacidad de carga."
              ) : (objeto.contenedor === "bolsa_contencion") ? (
                " Guardado en la Bolsa de Contención (Bag of Holding). Su peso es 0 lb sobre tu personaje."
              ) : (objeto.contenedor === "montura") ? (
                " Transportado por tu montura, mula o carreta. No penaliza tu capacidad de carga."
              ) : (
                " Guardado en tu almacén, base o campamento. No penaliza tu capacidad de carga."
              )}
            </div>
          </div>

          {/* Descripción Completa */}
          <div className={estilos.seccionBloque}>
            <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionDescripcion}`}>
              <BookOpen size={12} /> Descripción y Reglas
            </span>
            <div className={estilos.cajaTextoDescripcion}>
              {descripcion ? descripcion : "Sin descripción adicional disponible."}
            </div>
          </div>

          {/* Receta de Artesanía y Crafteo si posee */}
          {((objetoBase?.artesania && (objetoBase.artesania.tallerRequerido || (objetoBase.artesania.componentes && objetoBase.artesania.componentes.length > 0))) || (objetoBase?.craft && objetoBase.craft.length > 0)) && (
            <div className={estilos.seccionArtesania}>
              <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionArtesania}`}>
                <Hammer size={12} /> Receta de Artesanía y Fabricación
              </span>
              <div className={estilos.filaArtesaniaMeta}>
                {objetoBase.artesania?.tallerRequerido && (
                  <div>
                    <span>Taller: </span>
                    <strong style={{ color: "#f8fafc" }}>{objetoBase.artesania.tallerRequerido}</strong>
                  </div>
                )}
              </div>

              {objetoBase.craft && objetoBase.craft.length > 0 && (
                <div>
                  <span style={{ fontSize: "10.5px", color: "#94a3b8", display: "block", marginBottom: 3 }}>
                    Herramientas Requeridas:
                  </span>
                  <div className={estilos.listaComponentesChips}>
                    {objetoBase.craft.map((c: { name: string; index: string }, idx: number) => (
                      <span key={idx} className={estilos.chipHerramientaCraft}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {objetoBase.artesania?.componentes && objetoBase.artesania.componentes.length > 0 && (
                <div>
                  <span style={{ fontSize: "10.5px", color: "#94a3b8", display: "block", marginBottom: 3 }}>
                    Componentes:
                  </span>
                  <div className={estilos.listaComponentesChips}>
                    {objetoBase.artesania.componentes.map((comp: string, idx: number) => (
                      <span key={idx} className={estilos.chipComponente}>
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido del Paquete si posee contents */}
          {objetoBase?.contents && objetoBase.contents.length > 0 && (
            <div className={estilos.seccionBloque}>
              <div className={estilos.cabeceraContents}>
                <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionContents}`}>
                  <Package size={12} /> Contenido del Paquete ({objetoBase.contents.length} objetos)
                </span>
                {alDesempaquetar && (
                  <button
                    type="button"
                    onClick={() => {
                      alDesempaquetar();
                      alCerrar();
                    }}
                    className={estilos.botonDesempaquetarModal}
                    title="Desempaquetar todos los ítems a tu mochila"
                  >
                    <PackageOpen size={12} />
                    <span>Desempaquetar</span>
                  </button>
                )}
              </div>
              <div className={estilos.listaItemsVertical}>
                {objetoBase.contents.map((itemContenido: { item: { name: string; index: string }; quantity: number }, idx: number) => (
                  <div key={idx} className={estilos.filaItemContenido}>
                    <span>{itemContenido.item.name}</span>
                    <strong className={estilos.cantidadItemContenido}>×{itemContenido.quantity}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Efectos Pasivos si posee */}
          {objetoBase?.efectosPasivos && objetoBase.efectosPasivos.length > 0 && (
            <div className={estilos.seccionBloque}>
              <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionPasivos}`}>
                Efectos Pasivos y Bonos
              </span>
              <div className={estilos.listaItemsVertical}>
                {objetoBase.efectosPasivos.map((efecto: EfectoPasivo, idx: number) => (
                  <div key={idx} className={estilos.filaEfectoPasivo}>
                    <strong>[{efecto.tipo}] {efecto.bono}</strong>: {efecto.descripcion || efecto.valor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hechizos Vinculados si posee */}
          {objetoBase?.hechizosVinculados && objetoBase.hechizosVinculados.length > 0 && (
            <div className={estilos.seccionBloque}>
              <span className={`${estilos.tituloSeccion} ${estilos.tituloSeccionHechizos}`}>
                Hechizos Vinculados
              </span>
              <div className={estilos.listaItemsVertical}>
                {objetoBase.hechizosVinculados.map((hechizo: HechizoVinculado, idx: number) => {
                  const coste = Number(hechizo.costeCargas) || 0;
                  const cargasDisponibles = objeto.cargasActuales ?? (objeto.cargasMaximas || 0);
                  const tieneCargasSuficientes = coste === 0 || cargasDisponibles >= coste;

                  const lanzarHechizoVinculado = async () => {
                    if (bloqueadoPorArmadura) {
                      return;
                    }

                    if (alLanzarHechizo) {
                      await alLanzarHechizo(hechizo, objeto.nombre, coste);
                      return;
                    }

                    if (coste > 0 && alModificarCargas) {
                      alModificarCargas(-coste);
                    }
                    const etiqueta = sanitizarEtiqueta(`Hechizo ${hechizo.nombre} (${objeto.nombre})`);
                    if (hechizo.bonoAtaque !== undefined && !isNaN(Number(hechizo.bonoAtaque))) {
                      const formula = `1d20+${hechizo.bonoAtaque}`;
                      await lanzarDadosTaleSpire(formula, `Ataque Mágico: ${etiqueta}`);
                    } else if (hechizo.cd !== undefined && !isNaN(Number(hechizo.cd))) {
                      await lanzarDadosTaleSpire("1d20", `Salvación vs CD ${hechizo.cd} (${etiqueta})`);
                    } else {
                      await lanzarDadosTaleSpire("1d20", etiqueta);
                    }
                  };

                  return (
                    <div key={idx} className={estilos.tarjetaHechizoVinculado}>
                      <div>
                        <strong className={estilos.nombreHechizoVinculado}>{hechizo.nombre}</strong>
                        <span className={estilos.metaHechizoVinculado}>
                          {hechizo.cd !== undefined ? `CD ${hechizo.cd}` : ""}
                          {hechizo.bonoAtaque !== undefined ? ` | Ataque +${hechizo.bonoAtaque}` : ""}
                          {coste > 0 ? ` (${coste} ${coste === 1 ? "carga" : "cargas"})` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={lanzarHechizoVinculado}
                        disabled={!tieneCargasSuficientes || bloqueadoPorArmadura}
                        className={estilos.botonLanzarHechizoModal}
                        title={
                          bloqueadoPorArmadura
                            ? (motivoBloqueoArmadura || "Bloqueado por armadura sin competencia (D&D 5.5e)")
                            : tieneCargasSuficientes
                            ? `Lanzar ${hechizo.nombre} en TaleSpire`
                            : "Cargas insuficientes"
                        }
                        style={bloqueadoPorArmadura ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                      >
                        <Dices size={11} />
                        <span>Lanzar {coste > 0 ? `(-${coste})` : ""}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas Personales del Jugador */}
          <div className={estilos.seccionBloque}>
            <div className={estilos.cabeceraNotas}>
              <span className={estilos.tituloSeccion}>
                Notas Personales
              </span>
              {notasGuardadas && (
                <span className={estilos.textoGuardado}>
                  <Check size={12} /> Guardado
                </span>
              )}
            </div>

            <textarea
              className={estilos.textareaNotasModal}
              value={notasTemp}
              onChange={(e) => setNotasTemp(e.target.value)}
              placeholder="Añade notas sobre el origen, marcas, runas o uso de este objeto..."
              rows={2}
            />

            {alActualizarNotas && (
              <button
                type="button"
                className={estilos.botonGuardarNotas}
                onClick={manejarGuardarNotas}
              >
                <Save size={12} />
                <span>Guardar Notas</span>
              </button>
            )}
          </div>
        </div>

        {/* Pie del Modal con Acciones Rápidas */}
        <div className={estilos.pieModal}>
          <div>
            {(esArma || esArmadura) && alAlternarEquipado && (
              <button
                type="button"
                onClick={alAlternarEquipado}
                className={objeto.equipado ? estilos.botonDesequiparModal : estilos.botonEquiparModal}
              >
                {objeto.equipado ? "Desequipar" : "Equipar"}
              </button>
            )}
          </div>

          <button
            type="button"
            className={estilos.botonCerrarVisor}
            onClick={alCerrar}
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
