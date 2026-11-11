/**
 * ReglasCombateHordas.tsx
 * -----------------------
 * Referencia táctica de reglas y tabla de Combate por Hordas (D&D 5.5e / DMG)
 * con simulador y calculadora interactiva para el Dungeon Master.
 */

import React, { useId, useMemo, useState } from "react";
import { Calculator, BookOpen, Shield } from "lucide-react";
import { calcularAtaqueHorda } from "@/servicios/combateHordas";
import estilos from "./ReglasCombateHordas.module.css";

interface FilaTablaHorda {
  min: number;
  max: number;
  etiquetaD20: string;
  criaturas: number | "Imposible";
  probabilidad: string;
}

const TABLA_HORDAS_DMG: readonly FilaTablaHorda[] = [
  { min: 1, max: 5, etiquetaD20: "1 – 5", criaturas: 1, probabilidad: "80% – 100%" },
  { min: 6, max: 12, etiquetaD20: "6 – 12", criaturas: 2, probabilidad: "45% – 75%" },
  { min: 13, max: 14, etiquetaD20: "13 – 14", criaturas: 3, probabilidad: "35% – 40%" },
  { min: 15, max: 16, etiquetaD20: "15 – 16", criaturas: 4, probabilidad: "25% – 30%" },
  { min: 17, max: 18, etiquetaD20: "17 – 18", criaturas: 5, probabilidad: "15% – 20%" },
  { min: 19, max: 19, etiquetaD20: "19", criaturas: 10, probabilidad: "10%" },
  { min: 20, max: 20, etiquetaD20: "20", criaturas: 20, probabilidad: "5%" },
  { min: 21, max: 999, etiquetaD20: "21+", criaturas: "Imposible", probabilidad: "0%" }
];

const MODOS_TIRADA = [
  { id: "desventaja", etiqueta: "Desv (-5)" },
  { id: "plano", etiqueta: "Normal" },
  { id: "ventaja", etiqueta: "Vent (+5)" }
] as const;

export const ReglasCombateHordas: React.FC = () => {
  const idBase = useId();
  const [caObjetivo, setCaObjetivo] = useState<number>(15);
  const [bonoAtaque, setBonoAtaque] = useState<number>(4);
  const [miembrosVivos, setMiembrosVivos] = useState<number>(8);
  const [ataquesPorMiembro, setAtaquesPorMiembro] = useState<number>(1);
  const [tipoTirada, setTipoTirada] = useState<"plano" | "ventaja" | "desventaja">("plano");
  const [formulaDano, setFormulaDano] = useState<string>("1d6+2");

  const resultado = useMemo(() => {
    return calcularAtaqueHorda({
      caObjetivo,
      bonificadorAtaque: bonoAtaque,
      miembrosVivos,
      ataquesPorMiembro,
      tipoTirada,
      formulaDano
    });
  }, [caObjetivo, bonoAtaque, miembrosVivos, ataquesPorMiembro, tipoTirada, formulaDano]);

  const filaResaltadaIndex = TABLA_HORDAS_DMG.findIndex(
    (fila) => resultado.d20Necesario >= fila.min && resultado.d20Necesario <= fila.max
  );

  return (
    <div className={estilos.contenedorHordas}>
      {/* Mini Calculadora / Simulador Interactivo */}
      <section className={estilos.panelCalculadora} aria-labelledby={`${idBase}-simulador`}>
        <div className={estilos.cabeceraCalculadora} id={`${idBase}-simulador`}>
          <span>
            <Calculator size={13} className={estilos.iconoCalculadora} aria-hidden="true" />
            Simulador Rápido de Impactos
          </span>
          <span className={estilos.contadorAtaquesTotales}>
            Ataques totales: {resultado.totalAtaques}
          </span>
        </div>

        <div className={estilos.gridControles}>
          <div className={estilos.campoControl}>
            <label className={estilos.etiquetaControl} htmlFor={`${idBase}-ca`}>CA Objetivo / CD</label>
            <input
              id={`${idBase}-ca`}
              type="number"
              min={1}
              max={35}
              className={estilos.inputControl}
              value={caObjetivo}
              onChange={(e) => setCaObjetivo(Number(e.target.value) || 0)}
            />
          </div>

          <div className={estilos.campoControl}>
            <label className={estilos.etiquetaControl} htmlFor={`${idBase}-bono`}>Bono Ataque / Salvación</label>
            <input
              id={`${idBase}-bono`}
              type="number"
              min={-5}
              max={20}
              className={estilos.inputControl}
              value={bonoAtaque}
              onChange={(e) => setBonoAtaque(Number(e.target.value) || 0)}
            />
          </div>

          <div className={estilos.campoControl}>
            <label className={estilos.etiquetaControl} htmlFor={`${idBase}-miembros`}>Miembros Atacando</label>
            <input
              id={`${idBase}-miembros`}
              type="number"
              min={1}
              max={100}
              className={estilos.inputControl}
              value={miembrosVivos}
              onChange={(e) => setMiembrosVivos(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className={estilos.campoControl}>
            <label className={estilos.etiquetaControl} htmlFor={`${idBase}-multi`}>Ataques por Miembro</label>
            <input
              id={`${idBase}-multi`}
              type="number"
              min={1}
              max={6}
              className={estilos.inputControl}
              value={ataquesPorMiembro}
              onChange={(e) => setAtaquesPorMiembro(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className={estilos.campoControl}>
            <label className={estilos.etiquetaControl}>Tirada</label>
            <div className={estilos.grupoBotonesTirada} role="group" aria-label="Modificador de tirada de horda">
              {MODOS_TIRADA.map(({ id, etiqueta }) => (
                <button
                  key={id}
                  type="button"
                  className={`${estilos.botonTirada} ${tipoTirada === id ? estilos.botonTiradaActivo : ""}`}
                  onClick={() => setTipoTirada(id)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className={estilos.campoControl}>
            <label className={estilos.etiquetaControl} htmlFor={`${idBase}-dano`}>Fórmula de Daño</label>
            <input
              id={`${idBase}-dano`}
              type="text"
              className={estilos.inputControl}
              value={formulaDano}
              onChange={(e) => setFormulaDano(e.target.value)}
              placeholder="1d6+2"
            />
          </div>
        </div>

        {/* Resumen de resultados */}
        <div className={estilos.resumenCalculo}>
          <div className={estilos.itemResumen}>
            <span className={estilos.itemResumenLabel}>d20 Requerido</span>
            <span className={estilos.itemResumenValor}>{resultado.d20Necesario}</span>
          </div>

          <div className={estilos.itemResumen}>
            <span className={estilos.itemResumenLabel}>Criaturas / Impacto</span>
            <span className={estilos.itemResumenValor}>
              {Number.isFinite(resultado.criaturasPorImpacto) ? resultado.criaturasPorImpacto : "—"}
            </span>
          </div>

          <div className={estilos.itemResumen}>
            <span className={estilos.itemResumenLabel}>Impactos Exitosos</span>
            <span className={`${estilos.itemResumenValor} ${estilos.itemResumenValorDestacado}`}>
              {resultado.impactosTotales}
            </span>
          </div>

          <div className={estilos.itemResumen}>
            <span className={estilos.itemResumenLabel}>Daño Total Estimado</span>
            <span className={estilos.itemResumenValor}>
              {resultado.impactosTotales > 0
                ? `${resultado.danoPromedioTotal} prom. (${resultado.formulaDanoEscalada})`
                : "0"}
            </span>
          </div>
        </div>
      </section>

      {/* Grid de Tabla Canónica y Reglas */}
      <div className={estilos.gridReglasYTabla}>
        {/* Tabla Oficial DMG */}
        <section className={estilos.tarjetaSeccion} aria-labelledby={`${idBase}-tabla`}>
          <div className={estilos.cabeceraTarjeta} id={`${idBase}-tabla`}>
            <Shield size={14} className={estilos.iconoTarjeta} aria-hidden="true" />
            Tabla Canónica de Hordas (DMG)
          </div>
          <table className={estilos.tablaHorda}>
            <thead>
              <tr>
                <th className={estilos.thHorda}>d20 Necesario</th>
                <th className={estilos.thHorda}>Criaturas / Éxito</th>
                <th className={estilos.thHorda}>Probabilidad</th>
              </tr>
            </thead>
            <tbody>
              {TABLA_HORDAS_DMG.map((fila, idx) => {
                const esActiva = idx === filaResaltadaIndex;
                return (
                  <tr key={fila.etiquetaD20} className={`${estilos.filaHorda} ${esActiva ? estilos.filaHordaResaltada : ""}`}>
                    <td>
                      <strong>{fila.etiquetaD20}</strong>
                    </td>
                    <td className={estilos.colNumero}>
                      {typeof fila.criaturas === "number" ? (
                        <span className={estilos.badgeExito}>{fila.criaturas} {fila.criaturas === 1 ? "criatura" : "criaturas"}</span>
                      ) : (
                        <span className={estilos.badgeImposible}>{fila.criaturas}</span>
                      )}
                    </td>
                    <td>{fila.probabilidad}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Resumen de Reglas Oficiales */}
        <section className={estilos.tarjetaSeccion} aria-labelledby={`${idBase}-reglas`}>
          <div className={estilos.cabeceraTarjeta} id={`${idBase}-reglas`}>
            <BookOpen size={14} className={estilos.iconoTarjeta} aria-hidden="true" />
            Directivas del Sistema 5.5e
          </div>

          <div className={estilos.bloqueRegla}>
            <span className={estilos.tituloBloqueRegla}>1. Cálculo de Impactos:</span>
            <span>Resta el bonificador de ataque de los atacantes a la CA del defensor para hallar el número necesario en el d20. Busca ese valor en la tabla para saber cuántos atacantes garantizan 1 impacto.</span>
          </div>

          <div className={estilos.bloqueRegla}>
            <span className={estilos.tituloBloqueRegla}>2. Ventaja y Desventaja:</span>
            <span>En lugar de tirar dos dados, la ventaja reduce en <strong>5</strong> el número requerido en el d20. La desventaja aumenta en <strong>5</strong> el número necesario.</span>
          </div>

          <div className={estilos.bloqueRegla}>
            <span className={estilos.tituloBloqueRegla}>3. Salvaciones en Área:</span>
            <span>Usa la misma tabla restando el bono de salvación a la CD del efecto (<code>CD - Bono</code>). Las criaturas necesarias por éxito determinan cuántos miembros superan la salvación (mitad de daño o 0 si tienen evasión); los demás reciben daño completo.</span>
          </div>

          <div className={estilos.bloqueRegla}>
            <span className={estilos.tituloBloqueRegla}>4. Modos de Puntos de Golpe:</span>
            <ul className={estilos.listaDetalles}>
              <li>
                <strong>Individual:</strong> Cada miembro tiene su propia barra. El daño se aplica a un miembro a la vez; el daño que supere su vida actual se pierde al morir.
              </li>
              <li>
                <strong>Cascada:</strong> El daño sobrante desborda automáticamente al siguiente miembro vivo de la horda.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};
