import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node.js globals (Backend)
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        
        // Browser globals (Frontend - for public/app.js)
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        setTimeout: "readonly",
        confirm: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error"
    }
  }
];