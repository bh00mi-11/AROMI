/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      },
      colors: {
        "primary-navy": "#0B3D5C",
        "gov-blue": "#1F5A8A",
        "saffron-accent": "#E67E22",
        "success-green": "#2E7D32",
        "warning-amber": "#FFC107",
        "danger-red": "#D32F2F",
        "bg-base": "#F5F7F8",
        "border-subtle": "#D9E1E5",
        "text-main": "#1F2933",
        // Semantic aliases
        primary: {
          DEFAULT: "#0B3D5C",
          light: "#EBF3F8",
          dark: "#07263A",
        },
        main: "#1F2933",
        "gov-navy": "#0B3D5C",
        "gov-slate": "#1F5A8A",
      },
    },
  },
  plugins: [],
}
