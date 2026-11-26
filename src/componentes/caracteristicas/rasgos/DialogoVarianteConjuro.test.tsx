import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DialogoVariante } from "./DialogoVarianteConjuro";
import { confirmarOpcionDialogo } from "./elegirVarianteConjuro";

describe("DialogoVarianteConjuro — recordar elección", () => {
  it("renderiza la casilla de recordar y el aviso solo cuando se proporciona recordar", () => {
    const sinRecordar = renderToStaticMarkup(
      <DialogoVariante
        nombre="Ataque temerario"
        etiqueta="Antes de tirar el ataque"
        descripcion="Elige si activar el rasgo."
        opciones={[{ id: "omitir", texto: "Atacar sin activar" }]}
        resolver={vi.fn()}
      />
    );
    expect(sinRecordar).not.toContain("Recordar mi elección para este rasgo");

    const conRecordar = renderToStaticMarkup(
      <DialogoVariante
        nombre="Ataque temerario"
        etiqueta="Antes de tirar el ataque"
        descripcion="Elige si activar el rasgo."
        opciones={[{ id: "omitir", texto: "Atacar sin activar" }]}
        recordar={{
          permitido: () => true,
          alRecordar: vi.fn(),
          aviso: "Solo se recordará omitir."
        }}
        resolver={vi.fn()}
      />
    );
    expect(conRecordar).toContain("Recordar mi elección para este rasgo");
    expect(conRecordar).toContain("Solo se recordará omitir.");
  });

  it("llama a alRecordar solo cuando está marcado y permitido(id) es verdadero", () => {
    const alRecordar = vi.fn();
    const resolver = vi.fn();
    const recordar = {
      permitido: (id: string) => id === "omitir",
      alRecordar
    };

    confirmarOpcionDialogo("omitir", false, recordar, resolver);
    expect(alRecordar).not.toHaveBeenCalled();
    expect(resolver).toHaveBeenLastCalledWith("omitir");

    confirmarOpcionDialogo("activar", true, recordar, resolver);
    expect(alRecordar).not.toHaveBeenCalled();
    expect(resolver).toHaveBeenLastCalledWith("activar");

    confirmarOpcionDialogo("omitir", true, recordar, resolver);
    expect(alRecordar).toHaveBeenCalledTimes(1);
    expect(alRecordar).toHaveBeenCalledWith("omitir");
    expect(resolver).toHaveBeenLastCalledWith("omitir");
  });
});
