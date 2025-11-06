/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Garante que o Tailwind escaneie todos os seus arquivos de código
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Cores personalizadas usadas no App.jsx e Login.jsx
      colors: {
        'imobiliaria-primary': '#1e40af', // Azul principal
        'imobiliaria-secondary': '#3b82f6', // Azul secundário
      },
    },
  },
  plugins: [],
}
