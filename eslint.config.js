import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tailwindcss from "eslint-plugin-tailwindcss";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

const commonRules = {
  "prettier/prettier": [
    "error",
    {
      tabWidth: 2,
      useTabs: false,
      endOfLine: "lf",
    },
  ],
  "no-param-reassign": 0,
  "react/destructuring-assignment": "off",
  "react/require-default-props": "off",
  "react/jsx-props-no-spreading": "off",
  "react-hooks/exhaustive-deps": "off",
  "@next/next/no-img-element": "off",
  "import/prefer-default-export": "off",
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
  "no-unknown-property": "off",
  "no-console": "off",
  "no-unused-vars": "warn",
  "tailwindcss/no-custom-classname": "off",
  "tailwindcss/migration-from-tailwind-2": "off",
  "unused-imports/no-unused-imports": "off",
  "tailwindcss/enforces-negative-arbitrary-values": "off",
};

export default [
  {
    ignores: [
      "node_modules/**",
      "build/**",
      "dist/**",
      "coverage/**",
      ".yarn/**",
      ".out/**",
      ".turbo/**",
      ".temp/**",
      "public/**",
    ],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "unused-imports": unusedImports,
      tailwindcss: tailwindcss,
      "simple-import-sort": simpleImportSort,
      prettier: prettierPlugin,
      "@next/next": nextPlugin,
    },
    settings: {
      next: {
        rootDir: ["apps/*/", "packages/*/"],
      },
    },
    rules: commonRules,
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      "unused-imports": unusedImports,
      tailwindcss: tailwindcss,
      "simple-import-sort": simpleImportSort,
      prettier: prettierPlugin,
      "@next/next": nextPlugin,
    },
    settings: {
      next: {
        rootDir: ["apps/*/", "packages/*/"],
      },
    },
    rules: {
      ...commonRules,
      "@typescript-eslint/comma-dangle": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-throw-literal": "off",
    },
  },
];
