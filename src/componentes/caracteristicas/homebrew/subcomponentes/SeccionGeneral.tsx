import { CampoNumerico } from "@/componentes/comunes/CampoNumerico";
import React from "react";
import { Shield, Heart } from "lucide-react";
import estilos from "../FormularioCriatura.module.css";
import { VelocidadEstructurada, SentidosEstructurados } from "@/tipos";
import { formatearVelocidad, formatearSentidos } from "@/almacen/sanitizacion";
import { Criatura_Tipos, TAMAÑOS_CRIATURA, ALINEAMIENTOS_DND } from "@/constantes/homebrewConstantes";
import { SelectorSugerencias, SelectorDesplegable } from "@/componentes/comunes";

interface SeccionGeneralProps {
  monstruoForm: {
    nombre: string;
    tipo: string;
    tamaño?: string;
    alineacion?: string;
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
    equipo?: string;
    tesoros?: string;
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
            placeholder="Ej. Siervo de Vampiro"
            className={estilos.inputForm}
            required
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Tipo de Criatura:</label>
          <SelectorDesplegable
            valor={monstruoForm.tipo}
            alCambiar={(val) => actualizarGeneral("tipo", val)}
            opciones={Criatura_Tipos}
            placeholder="Seleccionar tipo..."
          />
        </div>
      </div>

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Tamaño:</label>
          <SelectorSugerencias
            valor={monstruoForm.tamaño || ""}
            alCambiar={(val) => actualizarGeneral("tamaño", val)}
            opciones={TAMAÑOS_CRIATURA}
            placeholder="Ej. Mediano, Mediano o Pequeño"
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Alineamiento / Alineación:</label>
          <SelectorDesplegable
            valor={monstruoForm.alineacion || "-"}
            alCambiar={(val) => actualizarGeneral("alineacion", val)}
            opciones={ALINEAMIENTOS_DND.map((al) => ({
              valor: al,
              etiqueta: al === "-" ? "Sin alineamiento (-)" : al
            }))}
            placeholder="Seleccionar alineamiento..."
          />
        </div>
      </div>

      <div className={estilos.filaTripleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>
            <Shield size={12} /> CA:
          </label>
          <CampoNumerico
            value={monstruoForm.ca}
            alConfirmar={(valor) => actualizarGeneral("ca", valor)}
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
          <CampoNumerico
            value={monstruoForm.vidaMaxima}
            alConfirmar={(valor) => actualizarGeneral("vidaMaxima", valor)}
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
          <CampoNumerico
            value={monstruoForm.iniciativaBonificador || 0}
            alConfirmar={(valor) => actualizarGeneral("iniciativaBonificador", valor)}
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
          <CampoNumerico value={monstruoForm.desafio || ""}
            alConfirmar={(valor) => actualizarGeneral("desafio", ({ 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" } as Record<number, string>)[valor] ?? String(valor))}
            placeholder="Ej. 5 o 1/2"
            className={estilos.inputForm} min={0} tipo="decimal" alVaciar={() => actualizarGeneral("desafio", "")} />
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

      <div className={estilos.filaDobleForm}>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Equipo:</label>
          <input
            type="text"
            value={monstruoForm.equipo || ""}
            onChange={(e) => actualizarGeneral("equipo", e.target.value)}
            placeholder="Ej. Armadura de cuero, arco corto..."
            className={estilos.inputForm}
          />
        </div>
        <div className={estilos.campoForm}>
          <label className={estilos.labelForm}>Tesoros:</label>
          <input
            type="text"
            value={monstruoForm.tesoros || ""}
            onChange={(e) => actualizarGeneral("tesoros", e.target.value)}
            placeholder="Ej. Reliquias, armamento, personal..."
            className={estilos.inputForm}
          />
        </div>
      </div>
    </div>
  );
};
