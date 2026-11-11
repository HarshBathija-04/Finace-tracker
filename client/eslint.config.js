import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  reactHooks.configs["recommended-latest"],
  {
    files: ["**/*.{js,jsx}"],
    plugins: { "react-refresh": reactRefresh },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^[A-Z_]", ignoreRestSiblings: true }],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true, allowExportNames: ["buttonClass"] }],
    },
  },
];
