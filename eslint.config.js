import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["dist", "node_modules", "eslint.config.js", "deploy_to_ts.js", "build_and_zip.js"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        TS: "readonly",
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        FileReader: "readonly",
        Record: "readonly",
        Omit: "readonly",
        Partial: "readonly",
        ReturnType: "readonly",
        Blob: "readonly",
        Promise: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin,
    },
    rules: {
      // Reglas recomendadas de TypeScript
      ...typescriptPlugin.configs.recommended.rules,
      // Desactivar React in JSX scope (React 17+)
      "react/react-in-jsx-scope": "off",
      // Forzar error ante explicit any
      "@typescript-eslint/no-explicit-any": "error",
      // Permitir variables/parámetros no usados con prefijo _
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Otras reglas
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
    settings: {
      react: {
        version: "18.2",
      },
    },
  },
  {
    files: [
      "src/servicios/**/*.ts",
      "src/almacen/**/*.ts",
      "src/tipos/**/*.ts",
      "src/constantes/**/*.ts",
      "src/utiles/**/*.ts"
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/componentes*", "@/componentes/**", "../*/componentes*", "../*/componentes/**"],
              message: "Violación de Arquitectura de Capas: Los servicios, almacén, tipos, constantes y utilidades no deben importar componentes ni estilos de la capa UI."
            }
          ]
        }
      ]
    }
  }
];
