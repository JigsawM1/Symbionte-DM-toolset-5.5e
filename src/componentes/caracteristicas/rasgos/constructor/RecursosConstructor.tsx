import type { RecuperacionRasgo } from "@/tipos";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { Dice5, AlertTriangle } from "lucide-react";
import estilos from "../ConstructorRasgoDote.module.css";
import { OPCIONES_RECUPERACION, OPCIONES_FORMULA_ESCALADO } from "./constantesConstructor";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ActualizarBorradorRasgo, usarConstructorRasgo } from "./usarConstructorRasgo";
interface Props {
    borrador: Pick<BorradorRasgo, 
      | "ligadoA"
      | "tieneUsosLimitados"
      | "gastarDePadre"
      | "heredarDadosPadre"
      | "usosMaximos"
      | "usosRestantes"
      | "recuperacion"
      | "formulaDados"
      | "formulaEscalado"
      | "conjurosOtorgadosTexto">;
    actualizarBorrador: ActualizarBorradorRasgo;
    errores: Record<string, string>;
    opcionesRasgosPadre: ReturnType<typeof usarConstructorRasgo>["opcionesRasgosPadre"];
}
export function RecursosConstructor({ borrador, actualizarBorrador, opcionesRasgosPadre, errores }: Props) {
    const {
      ligadoA,
      tieneUsosLimitados,
      gastarDePadre,
      heredarDadosPadre,
      usosMaximos,
      usosRestantes,
      recuperacion,
      formulaDados,
      formulaEscalado,
      conjurosOtorgadosTexto
    } = borrador;
    return (<div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <Dice5 size={14} color="#38bdf8"/>
            <span>3. Usos, Cargas y Fórmulas de Dados</span>
          </div>
          <p className={estilos.descripcionSeccion}>Gestiona recursos limitados y tiradas directas a la bandeja 3D</p>
        </div>

        <div className={estilos.filaToggle}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>¿Tiene usos limitados o cargas?</span>
            <span className={estilos.pistaToggle}>Habilita el contador de usos consumibles con recarga</span>
          </div>
          <label className={estilos.interruptor}>
            <input
              type="checkbox"
              checked={tieneUsosLimitados}
              onChange={(e) => actualizarBorrador("tieneUsosLimitados", e.target.checked)}
            />
            <span className={estilos.deslizador}/>
          </label>
        </div>

        {tieneUsosLimitados && (<>
            <div className={estilos.gridTresColumnas}>
              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Usos Máximos</span>
                </label>
                <input
                  type="number"
                  min={1}
                  className={estilos.inputControl}
                  value={Number.isNaN(usosMaximos) ? "" : usosMaximos}
                  aria-label="Usos Máximos"
                  aria-invalid={Boolean(errores.usosMaximos)}
                  aria-describedby={errores.usosMaximos ? "error-rasgo-usosMaximos" : undefined}
                  onChange={(e) => {
                const val = e.target.valueAsNumber;
                actualizarBorrador("usosMaximos", val);
                if (usosRestantes > val)
                    actualizarBorrador("usosRestantes", val);
            }}
                />
              </div>

              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Usos Restantes Actuales</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={usosMaximos}
                  className={estilos.inputControl}
                  value={Number.isNaN(usosRestantes) ? "" : usosRestantes}
                  aria-label="Usos Restantes Actuales"
                  aria-invalid={Boolean(errores.usosRestantes)}
                  aria-describedby={errores.usosRestantes ? "error-rasgo-usosRestantes" : undefined}
                  onChange={(e) => actualizarBorrador("usosRestantes", e.target.valueAsNumber)}
                />
              </div>

              <div className={estilos.campoGrupo}>
                <label className={estilos.labelCampo}>
                  <span>Tipo de Recuperación</span>
                </label>
                <SelectorDesplegable<RecuperacionRasgo>
                  valor={recuperacion}
                  opciones={OPCIONES_RECUPERACION}
                  alCambiar={(val) => actualizarBorrador("recuperacion", val)}
                  tamano="normal"
                />
              </div>
            </div>

            <div className={`${estilos.campoGrupo} ${estilos.margenTop8}`}>
              <label className={estilos.labelCampo}>
                <span>Escalado Dinámico de Usos Máximos</span>
              </label>
              <SelectorDesplegable<string>
                valor={formulaEscalado}
                opciones={OPCIONES_FORMULA_ESCALADO}
                alCambiar={(val) => actualizarBorrador("formulaEscalado", val)}
                tamano="normal"
              />
              <p className={estilos.pistaCampo}>
                Permite que los usos escalen de forma automática con el Bonificador por Competencia (PB) o nivel del personaje.
              </p>
            </div>
          </>)}

        <div className={estilos.campoGrupo}>
          <label className={estilos.labelCampo}>
            <span>Fórmula de Dados Lanzable (TaleSpire)</span>
          </label>
          <input
            type="text"
            className={estilos.inputControl}
            placeholder="ej. 1d12, 1d6 + mitad_nivel, 2d6..."
            value={formulaDados}
            onChange={(e) => actualizarBorrador("formulaDados", e.target.value)}
          />
          <p className={estilos.pistaCampo}>
            Muestra un botón de dados en la tarjeta para lanzar esta tirada directamente a la bandeja 3D de TaleSpire.
          </p>
        </div>

        <div className={`${estilos.filaToggle} ${estilos.margenTop8}`}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>¿Gastar usos del rasgo padre?</span>
            <span className={estilos.pistaToggle}>
              Consume cargas del rasgo principal al que está vinculado (ej. Inspiración bárdica o Furia) sin requerir usos propios.
            </span>
          </div>
          <label className={estilos.interruptor}>
            <input
              type="checkbox"
              checked={gastarDePadre}
              onChange={(e) => actualizarBorrador("gastarDePadre", e.target.checked)}
            />
            <span className={estilos.deslizador}/>
          </label>
        </div>

        <div className={`${estilos.filaToggle} ${estilos.margenTop8}`}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>¿Heredar dados de escala del rasgo padre?</span>
            <span className={estilos.pistaToggle}>
              Hereda dinámicamente el dado del padre (ej. 1d6 - 1d12 de Inspiración bárdica) para tiradas 3D a TaleSpire.
            </span>
          </div>
          <label className={estilos.interruptor}>
            <input
              type="checkbox"
              checked={heredarDadosPadre}
              onChange={(e) => actualizarBorrador("heredarDadosPadre", e.target.checked)}
            />
            <span className={estilos.deslizador}/>
          </label>
        </div>

        {(gastarDePadre || heredarDadosPadre) && (<div className={`${estilos.campoGrupo} ${estilos.margenTop8}`}>
            <label className={estilos.labelCampo}>
              <span>Vincular al Rasgo Padre (ligadoA)</span>
            </label>
            <SelectorDesplegable
              valor={ligadoA}
              opciones={opcionesRasgosPadre}
              alCambiar={(val) => actualizarBorrador("ligadoA", val)}
              placeholder="-- Seleccionar Rasgo Padre --"
              tamano="normal"
            />
            {!ligadoA.trim() && (<p className={estilos.advertenciaPadreRequerido}>
                <AlertTriangle size={14}/>
                Se requiere seleccionar el rasgo padre para que los usos o dados se deleguen correctamente por metadatos declarativos.
              </p>)}
            <p className={estilos.pistaCampo}>
              Rasgo padre del que se descuentan los usos o se heredan los dados de escala.
            </p>
          </div>)}

        <div className={`${estilos.campoGrupo} ${estilos.margenTop8}`}>
          <label className={estilos.labelCampo}>
            <span>Conjuros Otorgados (Siempre preparados, separados por coma)</span>
          </label>
          <input
            type="text"
            className={estilos.inputControl}
            placeholder="ej. Palabra de poder: sanar, Palabra de poder: matar"
            value={conjurosOtorgadosTexto}
            onChange={(e) => actualizarBorrador("conjurosOtorgadosTexto", e.target.value)}
          />
          <p className={estilos.pistaCampo}>
            Los conjuros especificados aquí se prepararán automáticamente en el libro de conjuros del personaje.
          </p>
        </div>
      </div>);
}
