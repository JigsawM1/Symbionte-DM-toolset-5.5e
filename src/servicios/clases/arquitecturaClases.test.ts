import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const archivos = ["catalogoClases", "dotesClase", "escaladosRasgos", "constructorRasgosClase", "buildClase"];

function dependencias(ruta: string): string[] {
  const contenido = readFileSync(ruta, "utf8");
  const ast = ts.createSourceFile(ruta, contenido, ts.ScriptTarget.Latest, true);
  return ast.statements.filter(ts.isImportDeclaration)
    .filter((declaracion) => !declaracion.importClause?.isTypeOnly)
    .map((declaracion) => (declaracion.moduleSpecifier as ts.StringLiteral).text);
}

describe("Dirección de dependencias en construcción de clases", () => {
  it("mantiene los módulos de dominio libres de UI, almacén y orquestación", () => {
    for (const nombre of archivos.filter((n) => n !== "buildClase")) {
      const imports = dependencias(resolve(process.cwd(), "src/servicios/clases", `${nombre}.ts`));
      expect(imports.some((ruta) => /componentes|almacen|compendioRasgos|gestorClases|buildClase/.test(ruta)), nombre).toBe(false);
    }
  });

  it("el compendio consume construcción directamente y no vuelve a la fachada del build", () => {
    const imports = dependencias(resolve(process.cwd(), "src/servicios/compendioRasgos.ts"));
    expect(imports).toContain("./clases/constructorRasgosClase");
    expect(imports.some((ruta) => /gestorClases|buildClase/.test(ruta))).toBe(false);
  });
});
