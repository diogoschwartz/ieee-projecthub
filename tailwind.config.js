/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['selector', '[data-mode="dark"]'],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2563eb', // blue-600
                secondary: '#4f46e5', // indigo-600
                paper: '#f9f7f1', // Cor de papel de jornal
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                newspaper: ['"Playfair Display"', 'serif'],
            },
        },
    },
    plugins: [],
}
