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
                    primary: '#0f172a',    // Deep Blue (Slate 900)
                    secondary: '#1e293b',  // Steel Gray (Slate 800)
                    surface: '#334155',    // Lighter Surface (Slate 700)
                    cyan: '#0ea5e9',       // Electric Blue (Sky 500)
                    accent: '#f59e0b',     // Industrial Orange (Amber 500)
                    success: '#10b981',    // Circuit Green (Emerald 500)
                    danger: '#ef4444',     // Alert Red (Red 500)
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Roboto Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
