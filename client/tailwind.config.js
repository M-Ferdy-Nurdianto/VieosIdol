/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'vibrant-pink': '#FF69B4',
                'vibrant-blue': '#4169E1',
                'vibrant-yellow': '#FFD700',
                'vibrant-orange': '#FF8C00',
                'vibrant-green': '#32CD32',
                'soft-bg': '#FFF5F8',
                'gold': '#D4AF37',
            },
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
                heading: ['"Plus Jakarta Sans"', 'sans-serif'],
                brand: ['"Playfair Display"', 'serif'],
            },
            letterSpacing: {
                tighter: '-0.05em',
                tight: '-0.02em',
                widest: '0.2em',
            },
            boxShadow: {
                'bouncy': '0 20px 40px -10px rgba(255, 105, 180, 0.3)',
                'glass-bright': '0 8px 32px 0 rgba(255, 255, 255, 0.5)',
            }
        },
    },
    plugins: [],
}
