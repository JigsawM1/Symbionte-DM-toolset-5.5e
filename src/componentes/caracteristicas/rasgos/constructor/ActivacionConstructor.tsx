import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { Zap } from "lucide-react";
import estilos from "../ConstructorRasgoDote.module.css";
import type { BorradorRasgo } from "@/servicios/rasgos/borradorRasgo";
import type { ActualizarBorradorRasgo, usarConstructorRasgo } from "./usarConstructorRasgo";
interface Props {
    borrador: Pick<BorradorRasgo, 
      | "esActivable"
      | "autoDesactivar"
      | "ligadoA"
      | "condicionAlActivar"
      | "duracionEfectoAlActivar"
      | "tieneRestauracion"
      | "idRasgoRestaurar"
      | "tipoCantidadRestaurar"
      | "cantidadRestaurarFija">;
    actualizarBorrador: ActualizarBorradorRasgo;
    opcionesRasgosPadre: ReturnType<typeof usarConstructorRasgo>["opcionesRasgosPadre"];
}
export function ActivacionConstructor({ borrador, actualizarBorrador, opcionesRasgosPadre }: Props) {
    const {
      esActivable,
      autoDesactivar,
      ligadoA,
      condicionAlActivar,
      duracionEfectoAlActivar,
      tieneRestauracion,
      idRasgoRestaurar,
      tipoCantidadRestaurar,
      cantidadRestaurarFija
    } = borrador;
    return (<div className={estilos.seccionCard}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.tituloSeccion}>
            <Zap size={14} color="#38bdf8"/>
            <span>2. Conmutador Táctico, Dependencias y TaleSpire</span>
          </div>
          <p className={estilos.descripcionSeccion}>Configura si este rasgo se enciende/apaga e interactúa con la barra táctica</p>
        </div>

        <div className={estilos.filaToggle}>
          <div className={estilos.infoToggle}>
            <span className={estilos.labelToggle}>¿Es un rasgo activable con interruptor (ON / OFF)?</span>
            <span className={estilos.pistaToggle}>
              Permite encenderlo o apagarlo en combate con un clic (nace desactivado por defecto).
            </span>
          </div>
          <label className={estilos.interruptor}>
            <input
              type="checkbox"
              checked={esActivable}
              onChange={(e) => actualizarBorrador("esActivable", e.target.checked)}
            />
            <span className={estilos.deslizador}/>
          </label>
        </div>

        {esActivable && (<div className={`${estilos.gridDosColumnas} ${estilos.margenTop4}`}>
            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Rasgo Padre Requerido (ligadoA)</span>
              </label>
              <SelectorDesplegable
                valor={ligadoA}
                opciones={opcionesRasgosPadre}
                alCambiar={(val) => actualizarBorrador("ligadoA", val)}
                placeholder="-- Ninguno (Totalmente Independiente) --"
                tamano="normal"
              />
              <p className={estilos.pistaCampo}>
                Si defines un padre (ej. Furia), este rasgo estará bloqueado hasta que el padre se active, y si el padre se apaga, se apagará automáticamente en cascada.
              </p>
            </div>

            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Condición Táctica en TaleSpire</span>
              </label>
              <input
                type="text"
                className={estilos.inputControl}
                placeholder="ej. Furia (Rage), Bendición, Concentración..."
                value={condicionAlActivar}
                onChange={(e) => actualizarBorrador("condicionAlActivar", e.target.value)}
              />
              <p className={estilos.pistaCampo}>
                Al encender el rasgo, se añadirá esta condición a la barra táctica. Al quitar la condición en TaleSpire, el rasgo se apagará automáticamente.
              </p>
            </div>

            <div className={estilos.campoGrupo}>
              <label className={estilos.labelCampo}>
                <span>Duración del Efecto / Condición (Asaltos)</span>
              </label>
              <input
                type="number"
                min={1}
                className={estilos.inputControl}
                placeholder="ej. 10 (1 min), 100 (10 min)..."
                value={duracionEfectoAlActivar ?? ""}
                onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                actualizarBorrador("duracionEfectoAlActivar", !isNaN(val) && val > 0 ? val : undefined);
            }}
              />
              <p className={estilos.pistaCampo}>
                Duración en asaltos para el combate y TaleSpire (opcional, ej. 100 asaltos para 10 minutos).
              </p>
            </div>

            <div className={`${estilos.filaToggle} ${estilos.filaToggleSpanCompleto}`}>
              <div className={estilos.infoToggle}>
                <span className={estilos.labelToggle}>¿Auto-desactivar inmediatamente tras su uso?</span>
                <span className={estilos.pistaToggle}>
                  Ideal para habilidades instantáneas o de un solo golpe que restablecen recursos (ej. Furia persistente).
                </span>
              </div>
              <label className={estilos.interruptor}>
                <input
                  type="checkbox"
                  checked={autoDesactivar}
                  onChange={(e) => actualizarBorrador("autoDesactivar", e.target.checked)}
                />
                <span className={estilos.deslizador}/>
              </label>
            </div>

            <div className={`${estilos.filaToggle} ${estilos.filaToggleSpanCompleto}`}>
              <div className={estilos.infoToggle}>
                <span className={estilos.labelToggle}>¿Restaurar usos de otro rasgo al activarse?</span>
                <span className={estilos.pistaToggle}>
                  Permite recargar usos de otro recurso al encender este rasgo (ej. Furia Persistente restaura Furia).
                </span>
              </div>
              <label className={estilos.interruptor}>
                <input
                  type="checkbox"
                  checked={tieneRestauracion}
                  onChange={(e) => actualizarBorrador("tieneRestauracion", e.target.checked)}
                />
                <span className={estilos.deslizador}/>
              </label>
            </div>

            {tieneRestauracion && (<div className={`${estilos.gridDosColumnas} ${estilos.gridDosColumnasSpanCompleto}`}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Rasgo Objetivo a Recargar</span>
                  </label>
                  <input
                    type="text"
                    className={estilos.inputControl}
                    placeholder="ej. furia, inspiracion bardica, o ID del rasgo"
                    value={idRasgoRestaurar}
                    onChange={(e) => actualizarBorrador("idRasgoRestaurar", e.target.value)}
                  />
                </div>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.labelCampo}>
                    <span>Cantidad a Restaurar</span>
                  </label>
                  <div className={estilos.filaCamposCompacta}>
                    <SelectorDesplegable<"maximo" | "fijo">
                      valor={tipoCantidadRestaurar}
                      opciones={[
                    { valor: "maximo", etiqueta: "Todos (Máximo)" },
                    { valor: "fijo", etiqueta: "Cantidad Fija" }
                ]}
                      alCambiar={(val) => actualizarBorrador("tipoCantidadRestaurar", val)}
                    />
                    {tipoCantidadRestaurar === "fijo" && (<input
                      type="number"
                      min={1}
                      className={`${estilos.inputControl} ${estilos.inputNumeroAncho80}`}
                      value={cantidadRestaurarFija}
                      onChange={(e) => actualizarBorrador("cantidadRestaurarFija", Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />)}
                  </div>
                </div>
              </div>)}
          </div>)}
      </div>);
}
