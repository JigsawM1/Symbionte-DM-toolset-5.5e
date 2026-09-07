import React, { useState, useEffect } from "react";
import { Coins, Weight, Link2, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import type { BolsaMonedas, TipoMonedaClave, ObjetoInventario } from "@/tipos";
import { evaluarOperacionMoneda } from "@/servicios/calculadorInventario";
import estilos from "@/componentes/caracteristicas/personajes/HojaPersonaje.module.css";

const MONEDAS_CONFIG: { clave: TipoMonedaClave; etiqueta: string; claseColor: string }[] = [
  { clave: "ppt", etiqueta: "PPT", claseColor: estilos.monedaPPT },
  { clave: "po",  etiqueta: "PO",  claseColor: estilos.monedaPO },
  { clave: "pe",  etiqueta: "PE",  claseColor: estilos.monedaPE },
  { clave: "pp",  etiqueta: "PP",  claseColor: estilos.monedaPP },
  { clave: "pc",  etiqueta: "PC",  claseColor: estilos.monedaPC }
];

interface CasillaMonedaProps {
  clave: TipoMonedaClave;
  etiqueta: string;
  claseColor: string;
  valorActual: number;
  alGuardar: (clave: TipoMonedaClave, nuevoValor: number) => void;
}

const CasillaMoneda: React.FC<CasillaMonedaProps> = ({
  clave,
  etiqueta,
  claseColor,
  valorActual,
  alGuardar
}) => {
  const [texto, setTexto] = useState(String(valorActual));

  useEffect(() => {
    setTexto(String(valorActual));
  }, [valorActual]);

  const aplicarOperacion = () => {
    const evaluado = evaluarOperacionMoneda(valorActual, texto);
    setTexto(String(evaluado));
    if (evaluado !== valorActual) {
      alGuardar(clave, evaluado);
    }
  };

  const manejarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={estilos.tarjetaMoneda}>
      <span className={`${estilos.etiquetaMoneda} ${claseColor}`}>
        {etiqueta}
      </span>
      <input
        type="text"
        inputMode="numeric"
        className={estilos.inputMoneda}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={aplicarOperacion}
        onKeyDown={manejarKeyDown}
        placeholder="0"
        title="Ingresa un número directo o una operación (+10, -5, 50+20)"
      />
    </div>
  );
};

interface BarraMetricasInventarioProps {
  estaAbierta: boolean;
  alAlternar: () => void;
  totalPOEquivalente: number;
  sobrecargado: boolean;
  pesoTotal: number;
  capacidadCarga: number;
  totalSintonizados: number;
  bolsaMonedas: BolsaMonedas;
  alEstablecerMonedas: (monedas: Partial<BolsaMonedas>) => void;
  fuerzaEfectiva: number;
  multiplicadorTexto: string;
  pesoContenedoresSinCarga: number;
  porcentajeCarga: number;
  objetosSintonizados: ObjetoInventario[];
}

export const BarraMetricasInventario: React.FC<BarraMetricasInventarioProps> = ({
  estaAbierta,
  alAlternar,
  totalPOEquivalente,
  sobrecargado,
  pesoTotal,
  capacidadCarga,
  totalSintonizados,
  bolsaMonedas,
  alEstablecerMonedas,
  fuerzaEfectiva,
  multiplicadorTexto,
  pesoContenedoresSinCarga,
  porcentajeCarga,
  objetosSintonizados
}) => {
  return (
    <div className={`${estilos.neoRaised} ${estilos.grupoListaInventario}`}>
      <div
        className={`${estilos.cabeceraGrupoInventario} ${estilos.cabeceraColapsableInventario}`}
        onClick={alAlternar}
        title="Haz clic para colapsar o expandir finanzas, carga y sintonización"
      >
        <div className={estilos.tituloGrupoInventario}>
          <span className={estilos.iconoChevronColapso}>
            {estaAbierta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <Coins size={14} color="#f59e0b" />
          <span>Recursos, Carga y Finanzas</span>
        </div>
        <div className={estilos.resumenCabeceraRecursos}>
          <span className={estilos.badgeResumenRecursoPO} title="Total en oro">
            <Coins size={10} color="#fbbf24" style={{ marginRight: 3, verticalAlign: "middle" }} />
            {totalPOEquivalente.toLocaleString("es-ES")} PO
          </span>
          <span
            className={`${estilos.badgeResumenRecursoCarga} ${sobrecargado ? estilos.badgeResumenCargaSobrecargado : ""}`}
            title="Peso total vs capacidad de carga"
          >
            <Weight size={10} color={sobrecargado ? "#ef4444" : "#10b981"} style={{ marginRight: 3, verticalAlign: "middle" }} />
            {pesoTotal} / {capacidadCarga} lb
          </span>
          <span className={estilos.badgeResumenRecursoSintonizacion} title="Ranuras sintonizadas ocupadas">
            <Link2 size={10} color="#c084fc" style={{ marginRight: 3, verticalAlign: "middle" }} />
            {totalSintonizados}/3
          </span>
        </div>
      </div>

      {estaAbierta && (
        <div className={estilos.cuerpoSeccionRecursos}>
          {/* SUB-BLOQUE 1: BOLSA DE MONEDAS */}
          <div className={estilos.contenedorMonedasInterior}>
            <div className={estilos.cabeceraMonedas}>
              <div className={estilos.tituloMonedas}>
                <Coins size={12} color="#f59e0b" />
                <span>Bolsa de Monedas</span>
              </div>
              <div className={estilos.resumenEquivalentePO}>
                Total: {totalPOEquivalente.toLocaleString("es-ES")} PO
              </div>
            </div>

            <div className={estilos.cuadriculaMonedas}>
              {MONEDAS_CONFIG.map(({ clave, etiqueta, claseColor }) => (
                <CasillaMoneda
                  key={clave}
                  clave={clave}
                  etiqueta={etiqueta}
                  claseColor={claseColor}
                  valorActual={bolsaMonedas[clave] || 0}
                  alGuardar={(c, val) => alEstablecerMonedas({ [c]: val })}
                />
              ))}
            </div>
          </div>

          {/* SUB-BLOQUE 2: CAPACIDAD DE CARGA */}
          <div className={estilos.contenedorCargaInterior}>
            <div className={estilos.cabeceraCarga}>
              <div className={estilos.tituloCarga}>
                <Weight size={12} color={sobrecargado ? "#ef4444" : "#10b981"} />
                <span>Capacidad de Carga</span>
              </div>
              <div className={estilos.detalleCalculoCarga}>
                FUE {fuerzaEfectiva} × 15 lb{multiplicadorTexto} = {capacidadCarga} lb
                {pesoContenedoresSinCarga > 0 && (
                  <span className={estilos.detalleCalculoCargaContenedores}>
                    (En Contenedores: {pesoContenedoresSinCarga} lb)
                  </span>
                )}
              </div>
            </div>

            <div className={estilos.barraCargaFondo}>
              <div
                className={`${estilos.barraCargaProgreso} ${
                  sobrecargado ? estilos.cargaSobrecargado : estilos.cargaNormal
                }`}
                style={{ width: `${porcentajeCarga}%` }}
              />
              <div className={estilos.barraCargaTexto}>
                <span>{pesoTotal}</span>
                <span className={estilos.barraCargaTextoTotal}>
                  / {capacidadCarga} lb
                </span>
              </div>
              <div
                className={`${estilos.badgeEstadoCarga} ${
                  sobrecargado ? estilos.badgeCargaSobrecargado : estilos.badgeCargaNormal
                }`}
              >
                {sobrecargado ? "Sobrecargado" : "Normal"}
              </div>
            </div>
          </div>

          {/* SUB-BLOQUE 3: SINTONIZACIÓN */}
          <div className={estilos.contenedorSintonizacionInterior}>
            <div className={estilos.cabeceraSintonizacion}>
              <div className={estilos.tituloSintonizacion}>
                <Link2 size={12} color="#c084fc" />
                <span>Sintonización Mágica</span>
              </div>
              <span className={estilos.sintonizacionRanurasTexto}>
                {totalSintonizados} / 3 Ranuras
              </span>
            </div>

            <div className={estilos.filaSlotsSintonizacion}>
              {[0, 1, 2].map((indice) => {
                const obj = objetosSintonizados[indice];
                if (obj) {
                  return (
                    <div
                      key={obj.idInstancia}
                      className={`${estilos.slotSintonizacion} ${estilos.slotSintonizacionActivo}`}
                      title={`${obj.nombre} (Sintonizado)`}
                    >
                      <Sparkles size={12} className={estilos.iconoSlotSintonizacion} />
                      <span className={estilos.textoSlotSintonizacion}>{obj.nombre}</span>
                    </div>
                  );
                }
                return (
                  <div
                    key={`vacio-${indice}`}
                    className={`${estilos.slotSintonizacion} ${estilos.slotSintonizacionVacio}`}
                  >
                    <span>Ranura {indice + 1} Libre</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
