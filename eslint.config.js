import js from "@eslint/js";
import globals from "globals";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";

export default [
  {
    ignores: [
      "dist",
      "node_modules",
      "eslint.config.js",
      "deploy_to_ts.js",
      "build_and_zip.js",
      "scripts/**"
    ],
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
        ...globals.browser,
        TS: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin,
    },
    rules: {
      // Reglas recomendadas de JavaScript estándar
      ...js.configs.recommended.rules,
      // Desactivar no-undef en TS (delegado a tsc y strict: true)
      "no-undef": "off",
      // Desactivar no-useless-assignment (permite inicializaciones defensivas estándar)
      "no-useless-assignment": "off",

      // Reglas recomendadas de TypeScript
      ...typescriptPlugin.configs.recommended.rules,

      // Reglas recomendadas de React
      ...reactPlugin.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "no-useless-escape": "off",

      // Reglas de diseño (DESIGN.md)
      "react/forbid-elements": [
        "error",
        {
          forbid: [
            {
              element: "select",
              message: "Prohibido el uso de <select> nativo según DESIGN.md. Usa <SelectorDesplegable /> o <SelectorSugerencias />."
            }
          ]
        }
      ],

      // Erradicación de estilos inline en favor de CSS Modules y utilidades
      "react/forbid-dom-props": [
        "error",
        {
          forbid: [
            {
              propName: "style",
              message: "Prohibido el uso de estilos inline (style={{...}}). Modulariza en CSS Modules (*.module.css) o clases utilitarias de src/estilos/utilidades.css."
            }
          ]
        }
      ],

      // Restricción de consola (permitido solo en logger y scripts CLI/test)
      "no-console": "error",

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

      // React refresh
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
  // React Hooks estrictos para componentes .tsx
  {
    files: ["**/*.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Excepciones de no-console para logger, CLI tools y tests
  {
    files: [
      "src/utiles/logger.ts",
      "src/editor_hechizos/**/*.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts"
    ],
    rules: {
      "no-console": "off",
    },
  },
  // Blindaje de arquitectura: no-restricted-imports para capas internas
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
  },
  // Blindaje de persistencia: prohibir localStorage fuera de la capa de persistencia y tests
  {
    files: [
      "src/componentes/**/*.ts",
      "src/componentes/**/*.tsx",
      "src/servicios/**/*.ts"
    ],
    ignores: [
      "src/componentes/comunes/LimiteError.tsx",
      "**/*.test.ts",
      "**/*.test.tsx"
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message: "Prohibido el uso directo de localStorage en componentes y servicios. Utiliza usarEstadoPersistido, TaleSpireAdapter o el almacén de configuración."
        }
      ]
    }
  },
  // Blindaje TaleSpire: prohibir window.TS fuera de TaleSpireAdapter
  {
    files: [
      "src/**/*.ts",
      "src/**/*.tsx"
    ],
    ignores: [
      "src/utiles/TaleSpireAdapter.ts",
      "src/tipos/talespire.d.ts",
      "**/*.test.ts",
      "**/*.test.tsx"
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='window'][property.name='TS']",
          message: "Aislamiento total de TaleSpire: Prohibido acceder a window.TS directamente. Utiliza la instancia importada 'ts' de '@/utiles/TaleSpireAdapter'."
        }
      ]
    }
  },
  // Regla anti-bifurcaciones por nombre o clase literal (rasgos y catálogo declarativo)
  {
    files: [
      "src/servicios/**/*.ts",
      "src/almacen/**/*.ts",
      "src/componentes/**/*.ts",
      "src/componentes/**/*.tsx",
      "src/hooks/**/*.ts"
    ],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "src/almacen/importadorJSON.ts",
      "src/servicios/compendioRasgos.ts",
      "src/componentes/caracteristicas/rasgos/utilidadesProgresionRasgos.ts"
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "BinaryExpression[operator=/^===?$/][left.property.name='nombre'][right.type='Literal']",
          message: "Prohibido bifurcar por nombre literal de rasgo (r.nombre === '...'). Toda la lógica mecánica debe resolverse con metadatos declarativos del catálogo."
        },
        {
          selector: "BinaryExpression[operator=/^===?$/][left.property.name='clase'][right.type='Literal']",
          message: "Prohibido bifurcar por nombre literal de clase (r.clase === '...'). Toda la lógica de clase debe resolverse con identificadores canónicos de '@/constantes'."
        },
        {
          selector: "CallExpression[callee.property.name='includes'][callee.object.property.name=/^(nombre|clase)$/][arguments.0.type='Literal']",
          message: "Prohibido bifurcar por nombre o clase mediante includes literal (r.nombre.includes('...')). Usa metadatos declarativos del catálogo o funciones canónicas de '@/constantes'."
        },
        {
          selector: "CallExpression[callee.property.name='includes'][callee.object.callee.property.name='toLowerCase'][callee.object.callee.object.property.name=/^(nombre|clase)$/][arguments.0.type='Literal']",
          message: "Prohibido bifurcar por nombre o clase con toLowerCase().includes('...'). Toda la lógica debe delegar en metadatos declarativos del catálogo."
        },
        {
          selector: "CallExpression[callee.property.name='includes'][callee.object.name=/^(clase|claseNorm)$/][arguments.0.type='Literal']",
          message: "Prohibido bifurcar variables de clase mediante includes literal (clase.includes('...')). Usa funciones canónicas como esClasePacto o esLanzadorSabiduria de '@/constantes'."
        }
      ]
    }
  }
];
