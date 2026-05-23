/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                tech: {
                    primary: '#faf5f5',
                    secondary: '#ffffff',
                    surface: '#e5e0e0',
                    cyan: '#dc2626',       // Rojo Institucional
                    accent: '#4b5563',     // Gris Comercial
                    success: '#16a34a',    // Verde gestión
                    danger: '#b91c1c',     // Rojo Oscuro
                }
            },
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
