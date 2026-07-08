/** @type {import('tailwindcss').Config} */
export default {
  // CONFIGURACIÓN CLAVE: Le dice a Tailwind que busque la clase para activar el modo oscuro
  darkMode: ['class', '.dark-mode'], 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}