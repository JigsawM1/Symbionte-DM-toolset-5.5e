import React from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { ts } from "../utiles/TaleSpireAdapter";
import type { CriaturaSeleccionadaTS } from "../almacen/slices/sliceIniciativa";
import {
  Gamepad2,
  Dices,
  Shield,
  User,
  Users
} from "lucide-react";
import estilos from "./VistaJugadores.module.css";

export const VistaJugadores: React.FC = () => {
  const esGM = usarAlmacenDM((s) => s.esGM);
  const criaturasSeleccionadas = usarAlmacenDM((s) => s.criaturasSeleccionadas);
  const colaIniciativa = usarAlmacenDM((s) => s.colaIniciativa);
  const agregarNotificacion = usarAlmacenDM((s) => s.agregarNotificacion);

  // Función para realizar tiradas rápidas de dados para el jugador
  const realizarTirada = async (formula: string, nombreAccion: string) => {
    try {
      if (ts.estaDisponible) {
        const descriptores = await ts.dice.makeRollDescriptors(formula);
        descriptores[0].name = nombreAccion;
        await ts.dice.putDiceInTray(descriptores);
        agregarNotificacion(`Tirada de ${nombreAccion} (${formula}) enviada a TaleSpire`, "exito");
      } else {
        const res = Math.floor(Math.random() * 20) + 1;
        agregarNotificacion(`[Simulador] ${nombreAccion}: d20 = ${res}`, "info");
      }
    } catch (err) {
      console.error("[Vista Jugadores] Error en tirada de dados:", err);
      agregarNotificacion("Error al procesar tirada de dados", "error");
    }
  };

  return (
    <div className={estilos.contenedorGeneral}>
      {/* Tarjeta Banner de Estado del Modo Jugador */}
      <div className={estilos.tarjetaModoPrueba}>
        <div className={estilos.infoModo}>
          <div className={estilos.tituloModo}>
            <Gamepad2 size={18} />
            <span>Vista de Jugadores</span>
          </div>
          <div className={estilos.insigniaRol}>
            <User size={12} />
            <span>Rol Nativo Detectado: {esGM ? "Dungeon Master (GM)" : "Jugador"}</span>
          </div>
        </div>
      </div>

      {/* Cuadrícula de Contenido Rápido de Jugador */}
      <div className={estilos.cuadriculaPaneles}>
        {/* Panel 1: Miniatura / Criatura Seleccionada en TaleSpire */}
        <div className={estilos.panelSeccion}>
          <div className={estilos.cabeceraPanel}>
            <Shield size={16} />
            <span>Mi Personaje / Selección en Tablero</span>
          </div>

          <div className={estilos.listaCriaturas}>
            {criaturasSeleccionadas.length > 0 ? (
              criaturasSeleccionadas.map((c: CriaturaSeleccionadaTS) => (
                <div key={c.id} className={estilos.tarjetaCriatura}>
                  <span className={estilos.nombreCriatura}>{c.name}</span>
                  {c.hp !== undefined && (
                    <span className={estilos.vidaCriatura}>
                      HP: {c.hp} / {c.maxHp ?? "?"}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span className={estilos.textoVacio}>
                Selecciona tu miniatura en TaleSpire para ver sus datos.
              </span>
            )}
          </div>
        </div>

        {/* Panel 2: Lanzador Rápido de Dados */}
        <div className={estilos.panelSeccion}>
          <div className={estilos.cabeceraPanel}>
            <Dices size={16} />
            <span>Lanzador Rápido de Dados</span>
          </div>

          <div className={estilos.gridDados}>
            <button onClick={() => realizarTirada("1d20", "Prueba de Atributo")} className={estilos.botonDado} type="button">
              1d20
            </button>
            <button onClick={() => realizarTirada("1d20+5", "Ataque con Ventaja (+5)")} className={estilos.botonDado} type="button">
              1d20 + 5
            </button>
            <button onClick={() => realizarTirada("1d6", "Dado d6")} className={estilos.botonDado} type="button">
              1d6
            </button>
            <button onClick={() => realizarTirada("1d8", "Dado d8")} className={estilos.botonDado} type="button">
              1d8
            </button>
            <button onClick={() => realizarTirada("1d10", "Dado d10")} className={estilos.botonDado} type="button">
              1d10
            </button>
            <button onClick={() => realizarTirada("1d12", "Dado d12")} className={estilos.botonDado} type="button">
              1d12
            </button>
          </div>
        </div>

        {/* Panel 3: Iniciativa Pública */}
        <div className={estilos.panelSeccion}>
          <div className={estilos.cabeceraPanel}>
            <Users size={16} />
            <span>Orden de Iniciativa Pública</span>
          </div>

          <div className={estilos.listaCriaturas}>
            {colaIniciativa.length > 0 ? (
              colaIniciativa.map((item, index) => (
                <div key={item.id} className={estilos.tarjetaCriatura}>
                  <span className={estilos.nombreCriatura}>
                    #{index + 1} - {item.nombre}
                  </span>
                  <span className={estilos.vidaCriatura}>Init: {item.iniciativa}</span>
                </div>
              ))
            ) : (
              <span className={estilos.textoVacio}>No hay combate activo en la cola de iniciativa.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaJugadores;
