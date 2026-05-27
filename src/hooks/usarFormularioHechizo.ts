import { useState } from "react";
import { usarAlmacenDM } from "../almacen/usarAlmacenDM";
import { HechizoBase } from "../tipos";

export function usarFormularioHechizo(idEnEdicion: string | null, alGuardarExitoso: () => void) {
  const { agregarHechizoHomebrew, actualizarHechizoHomebrew, agregarNotificacion } = usarAlmacenDM();

  const [hNombre, setHNombre] = useState("");
  const [hNivel, setHNivel] = useState(1);
  const [hEscuela, setHEscuela] = useState("Evocación");
  const [hTiempo, setHTiempo] = useState("1 acción");
  const [hAlcance, setHAlcance] = useState("60 pies");
  const [hDescripcion, setHDescripcion] = useState("");
  const [hDescNivelSuperior, setHDescNivelSuperior] = useState("");
  const [hMateriales, setHMateriales] = useState("");
  const [hCompVerbal, setHCompVerbal] = useState(true);
  const [hCompSomatico, setHCompSomatico] = useState(true);
  const [hCompMaterial, setHCompMaterial] = useState(false);
  const [hRitual, setHRitual] = useState("No");
  const [hDuracion, setHDuracion] = useState("INSTANTÁNEO");
  const [hConcentracion, setHConcentracion] = useState("No");
  const [hClases, setHClases] = useState<string[]>([]);
  const [hAtaqueCd, setHAtaqueCd] = useState("N/A");
  const [hDadosDaño, setHDadosDaño] = useState("");
  const [hDadosDañoNivelSuperior, setHDadosDañoNivelSuperior] = useState("");
  const [hCdSalvacion, setHCdSalvacion] = useState("N/A");
  const [hAgregarModificador, setHAgregarModificador] = useState("No");
  const [hTipoDaño, setHTipoDaño] = useState("N/A");

  const limpiarFormulario = () => {
    setHNombre("");
    setHNivel(1);
    setHEscuela("Evocación");
    setHTiempo("1 acción");
    setHAlcance("60 pies");
    setHDescripcion("");
    setHDescNivelSuperior("");
    setHMateriales("");
    setHCompVerbal(true);
    setHCompSomatico(true);
    setHCompMaterial(false);
    setHRitual("No");
    setHDuracion("INSTANTÁNEO");
    setHConcentracion("No");
    setHClases([]);
    setHAtaqueCd("N/A");
    setHDadosDaño("");
    setHDadosDañoNivelSuperior("");
    setHCdSalvacion("N/A");
    setHAgregarModificador("No");
    setHTipoDaño("N/A");
  };

  const cargarHechizo = (h: HechizoBase) => {
    setHNombre(h.nombre);
    setHNivel(h.nivel);
    setHEscuela(h.escuela);
    setHTiempo(h.tiempoLanzamiento);
    setHAlcance(h.alcance);
    setHDescripcion(h.descripcion);
    setHDescNivelSuperior(h.descNivelSuperior || "");
    setHMateriales(h.materiales || "");
    setHCompVerbal(h.componentesSeleccionados?.verbal ?? true);
    setHCompSomatico(h.componentesSeleccionados?.somatico ?? true);
    setHCompMaterial(h.componentesSeleccionados?.material ?? false);
    setHRitual(h.ritual ? "Sí" : "No");
    setHDuracion(h.duracion || "INSTANTÁNEO");
    setHConcentracion(h.concentracion ? "Sí" : "No");
    setHClases(h.clases || []);
    setHAtaqueCd(h.ataqueCd || "N/A");
    setHDadosDaño(h.dadosDaño || "");
    setHDadosDañoNivelSuperior(h.dadosDañoNivelSuperior || "");
    setHCdSalvacion(h.cdSalvacion || "N/A");
    setHAgregarModificador(h.agregarModificadorHabilidad ? "Sí" : "No");
    setHTipoDaño(h.tipoDaño || "N/A");
  };

  const manejarGuardarHechizo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hNombre.trim()) {
      agregarNotificacion("El nombre del hechizo es requerido", "advertencia");
      return;
    }

    const componentesGenerados: string[] = [];
    if (hCompVerbal) componentesGenerados.push("V");
    if (hCompSomatico) componentesGenerados.push("S");
    if (hCompMaterial) {
      if (hMateriales.trim()) {
        componentesGenerados.push(`M (${hMateriales.trim()})`);
      } else {
        componentesGenerados.push("M");
      }
    }
    const componentesTxt = componentesGenerados.join(", ") || "Ninguno";

    const payload = {
      nombre: hNombre.trim(),
      nivel: hNivel,
      escuela: hEscuela.trim(),
      tiempoLanzamiento: hTiempo.trim(),
      alcance: hAlcance.trim(),
      componentes: componentesTxt,
      descripcion: hDescripcion.trim(),
      descNivelSuperior: hDescNivelSuperior.trim() || undefined,
      materiales: hMateriales.trim() || undefined,
      componentesSeleccionados: {
        verbal: hCompVerbal,
        somatico: hCompSomatico,
        material: hCompMaterial
      },
      ritual: hRitual === "Sí",
      duracion: hDuracion.trim(),
      concentracion: hConcentracion === "Sí",
      clases: hClases,
      ataqueCd: hAtaqueCd,
      dadosDaño: hDadosDaño.trim() || undefined,
      dadosDañoNivelSuperior: hDadosDañoNivelSuperior.trim() || undefined,
      cdSalvacion: hCdSalvacion,
      agregarModificadorHabilidad: hAgregarModificador === "Sí",
      tipoDaño: hTipoDaño
    };

    if (idEnEdicion) {
      actualizarHechizoHomebrew(idEnEdicion, payload);
      agregarNotificacion("¡Hechizo Homebrew actualizado con éxito!", "exito");
    } else {
      agregarHechizoHomebrew(payload);
      agregarNotificacion("¡Hechizo Homebrew guardado con éxito!", "exito");
    }

    limpiarFormulario();
    alGuardarExitoso();
  };

  return {
    hNombre, setHNombre,
    hNivel, setHNivel,
    hEscuela, setHEscuela,
    hTiempo, setHTiempo,
    hAlcance, setHAlcance,
    hDescripcion, setHDescripcion,
    hDescNivelSuperior, setHDescNivelSuperior,
    hMateriales, setHMateriales,
    hCompVerbal, setHCompVerbal,
    hCompSomatico, setHCompSomatico,
    hCompMaterial, setHCompMaterial,
    hRitual, setHRitual,
    hDuracion, setHDuracion,
    hConcentracion, setHConcentracion,
    hClases, setHClases,
    hAtaqueCd, setHAtaqueCd,
    hDadosDaño, setHDadosDaño,
    hDadosDañoNivelSuperior, setHDadosDañoNivelSuperior,
    hCdSalvacion, setHCdSalvacion,
    hAgregarModificador, setHAgregarModificador,
    hTipoDaño, setHTipoDaño,
    limpiarFormulario,
    cargarHechizo,
    manejarGuardarHechizo
  };
}
