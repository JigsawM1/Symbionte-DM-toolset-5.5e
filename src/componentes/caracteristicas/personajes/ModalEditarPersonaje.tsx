import React, { useState } from "react";
import type {
  PersonajeJugador,
  Caracteristica,
  Habilidad,
  GradoCompetencia
} from "@/tipos";
import {
  HABILIDADES_LISTA,
  CARACTERISTICAS_CLAVES,
  CLASES_DND,
  ALINEAMIENTOS_DND,
  obtenerDadoGolpePorClase,
  obtenerExperienciaMinimaPorNivel
} from "@/constantes";
import { SelectorDesplegable } from "@/componentes/comunes/SelectorDesplegable";
import { SelectorSugerencias } from "@/componentes/comunes/SelectorSugerencias";
import { ts } from "@/utiles/TaleSpireAdapter";
import { X, Save, Shield, User, Award, Eye, Link } from "lucide-react";
import estilos from "./HojaPersonaje.module.css";

interface ModalEditarPersonajeProps {
  personaje: PersonajeJugador;
  alGuardar: (cambios: Partial<PersonajeJugador>) => void;
  alCerrar: () => void;
}

type PestañaModal = "identidad" | "atributos" | "competencias" | "sentidos";

const OPCIONES_GRADO_HABILIDAD = [
  { valor: "ninguna", etiqueta: "Sin Bono (0x)" },
  { valor: "medio", etiqueta: "Medio Bono (0.5x PB)" },
  { valor: "competente", etiqueta: "Competente (1x PB)" },
  { valor: "pericia", etiqueta: "Pericia (2x PB)" }
];

export const ModalEditarPersonaje: React.FC<ModalEditarPersonajeProps> = ({
  personaje,
  alGuardar,
  alCerrar
}) => {
  const [pestañaActiva, setPestañaActiva] = useState<PestañaModal>("identidad");

  // Estado local para edición segura
  const [form, setForm] = useState<PersonajeJugador>({
    ...personaje,
    hpMaximoBase: personaje.hpMaximoBase || personaje.hpMaximo || 10
  });

  const actualizarCampo = <K extends keyof PersonajeJugador>(campo: K, valor: PersonajeJugador[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const manejarCambioClase = (nuevaClase: string) => {
    // Asignar el dado de golpe sugerido según la clase elegida (manteniendo libre modificación)
    const dadoSugerido = obtenerDadoGolpePorClase(nuevaClase.trim());
    setForm((prev) => ({
      ...prev,
      clase: nuevaClase,
      tipoDadoGolpe: dadoSugerido
    }));
  };

  const manejarCambioNivel = (nuevoNivelStr: string) => {
    const niv = Math.max(1, Math.min(20, parseInt(nuevoNivelStr, 10) || 1));
    const xpMinima = obtenerExperienciaMinimaPorNivel(niv);

    setForm((prev) => ({
      ...prev,
      nivel: niv,
      dadosGolpeTotal: niv,
      dadosGolpeRestantes: Math.min(prev.dadosGolpeRestantes, niv),
      experiencia: Math.max(prev.experiencia, xpMinima)
    }));
  };

  const actualizarCaracteristicaBase = (carac: Caracteristica, valor: number) => {
    setForm((prev) => ({
      ...prev,
      caracteristicas: {
        ...prev.caracteristicas,
        [carac]: Math.max(1, Math.min(30, valor || 10))
      }
    }));
  };

  const actualizarOverrideFijo = (carac: Caracteristica, valor: number | null) => {
    setForm((prev) => ({
      ...prev,
      overridesFijos: {
        ...prev.overridesFijos,
        [carac]: valor
      }
    }));
  };

  const alternarCompetenciaSalvacion = (carac: Caracteristica) => {
    setForm((prev) => ({
      ...prev,
      competenciasSalvacion: {
        ...prev.competenciasSalvacion,
        [carac]: !prev.competenciasSalvacion?.[carac]
      }
    }));
  };

  const actualizarGradoHabilidad = (hab: Habilidad, grado: GradoCompetencia) => {
    setForm((prev) => ({
      ...prev,
      gradosHabilidades: {
        ...prev.gradosHabilidades,
        [hab]: grado
      }
    }));
  };

  const manejarGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    alGuardar(form);
    alCerrar();
  };

  return (
    <div className={estilos.overlayModal} onClick={alCerrar}>
      <div className={estilos.cuerpoModal} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className={estilos.cabeceraModal}>
          <span className={estilos.tituloModal}>Configuración de Ficha: {personaje.nombre}</span>
          <button
            type="button"
            className={estilos.botonConfigurarPj}
            onClick={alCerrar}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Sub-pestañas */}
        <div className={estilos.barraPestañasModal}>
          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestañaActiva === "identidad" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestañaActiva("identidad")}
          >
            <User size={14} style={{ marginRight: 4 }} />
            Identidad
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestañaActiva === "atributos" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestañaActiva("atributos")}
          >
            <Award size={14} style={{ marginRight: 4 }} />
            Atributos y Overrides
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestañaActiva === "competencias" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestañaActiva("competencias")}
          >
            <Shield size={14} style={{ marginRight: 4 }} />
            Competencias
          </button>

          <button
            type="button"
            className={`${estilos.botonPestañaModal} ${
              pestañaActiva === "sentidos" ? estilos.botonPestañaModalActiva : ""
            }`}
            onClick={() => setPestañaActiva("sentidos")}
          >
            <Eye size={14} style={{ marginRight: 4 }} />
            Sentidos y Salud Base
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <form onSubmit={manejarGuardar} className={estilos.contenidoPestañaModal}>
          {/* PESTAÑA 1: IDENTIDAD */}
          {pestañaActiva === "identidad" && (
            <>
              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Nombre del Personaje</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.nombre}
                    onChange={(e) => actualizarCampo("nombre", e.target.value)}
                    required
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Nombre del Jugador</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.jugador}
                    onChange={(e) => actualizarCampo("jugador", e.target.value)}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>

              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Clase (Sugerencia o Personalizada)</label>
                  <SelectorSugerencias
                    valor={form.clase}
                    alCambiar={manejarCambioClase}
                    opciones={CLASES_DND}
                    placeholder="Escribe o selecciona una clase..."
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Subclase</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.subclase}
                    onChange={(e) => actualizarCampo("subclase", e.target.value)}
                    placeholder="Ej. Campeón, Evocación..."
                  />
                </div>
              </div>

              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Nivel (1 - 20)</label>
                  <input
                    type="number"
                    className={estilos.inputFormulario}
                    value={form.nivel}
                    onChange={(e) => manejarCambioNivel(e.target.value)}
                    min="1"
                    max="20"
                    required
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Puntos de Experiencia (PX)</label>
                  <input
                    type="number"
                    className={estilos.inputFormulario}
                    value={form.experiencia}
                    onChange={(e) => actualizarCampo("experiencia", parseInt(e.target.value, 10) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Especie / Raza</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.especie}
                    onChange={(e) => actualizarCampo("especie", e.target.value)}
                    placeholder="Ej. Humano, Elfo, Enano..."
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Trasfondo</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.trasfondo}
                    onChange={(e) => actualizarCampo("trasfondo", e.target.value)}
                    placeholder="Ej. Soldado, Erudito..."
                  />
                </div>
              </div>

              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Alineamiento</label>
                  <SelectorDesplegable
                    valor={form.alineacion}
                    alCambiar={(val) => actualizarCampo("alineacion", val)}
                    opciones={ALINEAMIENTOS_DND}
                    tamano="normal"
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Miniatura 3D TaleSpire</label>
                  <button
                    type="button"
                    className={estilos.neoButton}
                    onClick={async () => {
                      if (!ts.estaDisponible) return;
                      const seleccionadas = await ts.creatures.getSelectedCreatures();
                      if (seleccionadas && seleccionadas.length > 0) {
                        actualizarCampo("idMiniaturaTS", seleccionadas[0].id);
                      } else {
                        actualizarCampo("idMiniaturaTS", null);
                      }
                    }}
                    title="Vincula con la miniatura actualmente seleccionada en el tablero de TaleSpire"
                    style={{ width: "100%", height: 38, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Link size={13} />
                    {form.idMiniaturaTS ? "✓ Miniatura 3D Vinculada" : "Vincular Seleccionada en TS"}
                  </button>
                </div>
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>URL de Imagen de Avatar (Opcional)</label>
                <input
                  type="url"
                  className={estilos.inputFormulario}
                  value={form.avatarUrl || ""}
                  onChange={(e) => actualizarCampo("avatarUrl", e.target.value)}
                  placeholder="https://ejemplo.com/retrato-mi-personaje.png"
                />
              </div>
            </>
          )}

          {/* PESTAÑA 2: ATRIBUTOS Y MODIFICADORES */}
          {pestañaActiva === "atributos" && (
            <>
              <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>
                Establece las puntuaciones base de tu personaje. Si posees un objeto mágico que fija una puntuación (ej. <em>Cinturón de Fuerza de Gigante</em>), ingrésalo en el campo <strong>Override Fijo</strong>.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => {
                  const carac = clave as Caracteristica;
                  const valorBase = form.caracteristicas?.[carac] || 10;
                  const override = form.overridesFijos?.[carac];

                  return (
                    <div key={carac} className={`${estilos.neoPressed}`} style={{ padding: 10, borderRadius: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc" }}>
                        {etiqueta}
                      </span>

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block" }}>Base</label>
                          <input
                            type="number"
                            className={estilos.inputFormulario}
                            value={valorBase}
                            onChange={(e) => actualizarCaracteristicaBase(carac, parseInt(e.target.value, 10))}
                            min="1"
                            max="30"
                            style={{ width: "100%", padding: "4px 8px" }}
                          />
                        </div>

                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block" }}>Override Fijo</label>
                          <input
                            type="number"
                            className={estilos.inputFormulario}
                            value={override !== null && override !== undefined ? override : ""}
                            onChange={(e) => {
                              const val = e.target.value.trim() === "" ? null : parseInt(e.target.value, 10);
                              actualizarOverrideFijo(carac, val);
                            }}
                            placeholder="Ninguno"
                            min="1"
                            max="30"
                            style={{ width: "100%", padding: "4px 8px" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* PESTAÑA 3: COMPETENCIAS */}
          {pestañaActiva === "competencias" && (
            <>
              {/* Salvaciones */}
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Competencias en Tiradas de Salvación</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 2 }}>
                  {CARACTERISTICAS_CLAVES.map(({ clave, etiqueta }) => {
                    const carac = clave as Caracteristica;
                    const checked = form.competenciasSalvacion?.[carac] || false;
                    return (
                      <label
                        key={carac}
                        className={`${estilos.neoPressed}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => alternarCompetenciaSalvacion(carac)}
                        />
                        <span>{etiqueta}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Habilidades */}
              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Grado de Competencia en Habilidades</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 2, maxHeight: 240, overflowY: "auto" }}>
                  {HABILIDADES_LISTA.map(({ clave, nombre }) => {
                    const hab = clave as Habilidad;
                    const grado = form.gradosHabilidades?.[hab] || "ninguna";

                    return (
                      <div key={hab} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>{nombre}</span>
                        <SelectorDesplegable
                          valor={grado}
                          alCambiar={(val) => actualizarGradoHabilidad(hab, val as GradoCompetencia)}
                          opciones={OPCIONES_GRADO_HABILIDAD}
                          tamano="compacto"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Textos de Armas, Armaduras, Idiomas, Herramientas */}
              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Competencias con Armas</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.competenciasArmas}
                    onChange={(e) => actualizarCampo("competenciasArmas", e.target.value)}
                    placeholder="Ej. Armas sencillas, espadas..."
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Competencias con Armaduras</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.competenciasArmaduras}
                    onChange={(e) => actualizarCampo("competenciasArmaduras", e.target.value)}
                    placeholder="Ej. Ligeras, medianas, escudos..."
                  />
                </div>
              </div>

              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Idiomas Conocidos</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.idiomas}
                    onChange={(e) => actualizarCampo("idiomas", e.target.value)}
                    placeholder="Ej. Común, Élfico..."
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Herramientas e Instrumentos</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.herramientas}
                    onChange={(e) => actualizarCampo("herramientas", e.target.value)}
                    placeholder="Ej. Herramientas de ladrón..."
                  />
                </div>
              </div>
            </>
          )}

          {/* PESTAÑA 4: SENTIDOS, COMBATE Y SALUD */}
          {pestañaActiva === "sentidos" && (
            <>
              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>HP Máximo Base (Verdadero)</label>
                  <input
                    type="number"
                    className={estilos.inputFormulario}
                    value={form.hpMaximoBase || 10}
                    onChange={(e) => {
                      const maxBaseVal = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setForm((prev) => ({
                        ...prev,
                        hpMaximoBase: maxBaseVal,
                        hpMaximo: maxBaseVal,
                        hpActual: Math.min(prev.hpActual, maxBaseVal)
                      }));
                    }}
                    min="1"
                    required
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Tipo de Dado de Golpe (Sugerencia)</label>
                  <SelectorSugerencias
                    valor={form.tipoDadoGolpe}
                    alCambiar={(val) => actualizarCampo("tipoDadoGolpe", val as "d6" | "d8" | "d10" | "d12")}
                    opciones={["d6", "d8", "d10", "d12", "d4", "d20"]}
                    placeholder="d6, d8, d10, d12..."
                  />
                </div>
              </div>

              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Clase de Armadura (CA Base)</label>
                  <input
                    type="number"
                    className={estilos.inputFormulario}
                    value={form.ca}
                    onChange={(e) => actualizarCampo("ca", parseInt(e.target.value, 10) || 10)}
                    min="1"
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Notas de CA</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={form.caNotas}
                    onChange={(e) => actualizarCampo("caNotas", e.target.value)}
                    placeholder="Ej. Cota de malla + Escudo"
                  />
                </div>
              </div>

              <div className={estilos.filaFormulario}>
                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Bonificador Extra de Iniciativa</label>
                  <input
                    type="number"
                    className={estilos.inputFormulario}
                    value={form.iniciativaBono}
                    onChange={(e) => actualizarCampo("iniciativaBono", parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className={estilos.campoFormulario}>
                  <label className={estilos.labelFormulario}>Velocidad Base</label>
                  <input
                    type="text"
                    className={estilos.inputFormulario}
                    value={typeof form.velocidad === "string" ? form.velocidad : `${form.velocidad.caminar} pies`}
                    onChange={(e) => actualizarCampo("velocidad", e.target.value)}
                    placeholder="Ej. 30 pies, volar 60 pies"
                  />
                </div>
              </div>

              <div className={estilos.campoFormulario}>
                <label className={estilos.labelFormulario}>Sentidos Especiales</label>
                <input
                  type="text"
                  className={estilos.inputFormulario}
                  value={typeof form.sentidos === "string" ? form.sentidos : ""}
                  onChange={(e) => actualizarCampo("sentidos", e.target.value)}
                  placeholder="Ej. Visión en la oscuridad 60 pies"
                />
              </div>
            </>
          )}

          {/* Pie del Modal con botones */}
          <div className={estilos.pieModal}>
            <button
              type="button"
              className={estilos.neoButton}
              onClick={alCerrar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${estilos.neoButton}`}
              style={{ backgroundColor: "#3730a3", color: "#fff", borderColor: "#818cf8" }}
            >
              <Save size={14} style={{ marginRight: 4 }} />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
