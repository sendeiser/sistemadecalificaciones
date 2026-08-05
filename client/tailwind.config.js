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
                    primary: 'var(--tech-primary)',
                    secondary: 'var(--tech-secondary)',
                    surface: 'var(--tech-surface)',
                    cyan: 'var(--tech-cyan)',
                    accent: 'var(--tech-accent)',
                    success: 'var(--tech-success)',
                    danger: 'var(--tech-danger)',
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
