import React from "react";
import { Shield, Heart } from "lucide-react";
import estilos from "../FormularioCriatura.module.css";
import { VelocidadEstructurada, SentidosEstructurados } from "../../../tipos";
import { formatearVelocidad, formatearSentidos } from "../../../almacen/sanitizacion";

interface SeccionGeneralProps {
  monstruoForm: {
    nombre: string;
    tipo: string;
    ca: number;
    caNotas?: string;
    vidaMaxima: number;
    vidaNotas?: string;
    iniciativaBonificador?: number;
    velocidad?: string | VelocidadEstructurada;
    desafio?: string;
    fuente?: string;
    sentidos?: string | SentidosEstructurados;
    idiomas?: string;
  };
  actualizarGeneral: (campo: string, valor: unknown) => void;
}

export const SeccionGeneral: React.FC<SeccionGeneralProps> = ({
  monstruoForm,
  actualizarGeneral
}) => {
  return (
    <div className={estilos.seccionContenido}>
      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Nombre del Monstruo:</label>
          <input
            type="text"
            value={monstruoForm.nombre}
            onChange={(e) => actualizarGeneral("nombre", e.target.value)}
            placeholder="Ej. Dragón de Hielo"
            className={estilos.inputForm}
            required
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Tipo de Criatura:</label>
          <select
            value={monstruoForm.tipo}
            onChange={(e) => actualizarGeneral("tipo", e.target.value)}
            className={estilos.selectForm}
          >
            <option value="Humanoide">Humanoide</option>
            <option value="Monstruosidad">Monstruosidad</option>
            <option value="No Muerto">No Muerto</option>
            <option value="Dragón">Dragón</option>
            <option value="Bestia">Bestia</option>
            <option value="Constructo">Constructo</option>
            <option value="Elemental">Elemental</option>
            <option value="Feérico">Feérico</option>
            <option value="Infernal">Infernal</option>
            <option value="Gigante">Gigante</option>
            <option value="Aberración">Aberración</option>
            <option value="Celestial">Celestial</option>
            <option value="Abominación">Abominación</option>
            <option value="Planta">Planta</option>
            <option value="Cieno">Cieno</option>
          </select>
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>
            <Shield size={12} /> CA:
          </label>
          <input
            type="number"
            value={monstruoForm.ca}
            onChange={(e) => actualizarGeneral("ca", parseInt(e.target.value, 10) || 10)}
            className={estilos.inputForm}
            min={1}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Notas CA:</label>
          <input
            type="text"
            value={monstruoForm.caNotas || ""}
            onChange={(e) => actualizarGeneral("caNotas", e.target.value)}
            placeholder="ej. natural"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>
            <Heart size={12} /> HP Máx:
          </label>
          <input
            type="number"
            value={monstruoForm.vidaMaxima}
            onChange={(e) => actualizarGeneral("vidaMaxima", parseInt(e.target.value, 10) || 10)}
            className={estilos.inputForm}
            min={1}
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Notas Vida:</label>
          <input
            type="text"
            value={monstruoForm.vidaNotas || ""}
            onChange={(e) => actualizarGeneral("vidaNotas", e.target.value)}
            placeholder="ej. 8d8+16"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Bonif. Inic:</label>
          <input
            type="number"
            value={monstruoForm.iniciativaBonificador || 0}
            onChange={(e) => actualizarGeneral("iniciativaBonificador", parseInt(e.target.value, 10) || 0)}
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Velocidad:</label>
          <input
            type="text"
            value={formatearVelocidad(monstruoForm.velocidad)}
            onChange={(e) => actualizarGeneral("velocidad", e.target.value)}
            placeholder="ej. 30 pies, volar 60"
            className={estilos.inputForm}
          />
        </div>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Desafío (CR):</label>
          <input
            type="text"
            value={monstruoForm.desafio || ""}
            onChange={(e) => actualizarGeneral("desafio", e.target.value)}
            placeholder="Ej. 5 o 1/2"
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Fuente:</label>
          <input
            type="text"
            value={monstruoForm.fuente || ""}
            onChange={(e) => actualizarGeneral("fuente", e.target.value)}
            placeholder="Ej. Manual de Monstruos"
            className={estilos.inputForm}
          />
        </div>
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Sentidos:</label>
        <input
          type="text"
          value={formatearSentidos(monstruoForm.sentidos)}
          onChange={(e) => actualizarGeneral("sentidos", e.target.value)}
          placeholder="Ej. visión en la oscuridad 60 pies, Percepción pasiva 12"
          className={estilos.inputForm}
        />
      </div>

      <div className={estilos.campoForm}>
        <label className={estilos.labelForm}>Idiomas:</label>
        <input
          type="text"
          value={monstruoForm.idiomas || ""}
          onChange={(e) => actualizarGeneral("idiomas", e.target.value)}
          placeholder="Ej. Común, Dracónico"
          className={estilos.inputForm}
        />
      </div>
    </div>
  );
};
