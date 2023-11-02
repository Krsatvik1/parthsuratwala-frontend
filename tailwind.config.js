/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/*.{html,ejs,js}","./views/**/*.{html,js,ejs}", "./views/**/**/*.{html,js,ejs}"],
  theme: {
    extend: {
      fontSize: {
        'clamp-xs' : "clamp(0.5rem, 9.4vw, 3.9rem)",
        'clamp-sm' : "clamp(2rem, 9.7vw, 5.9rem)",
        'clamp-md' : "clamp(4rem, 9vw, 5.9rem)",
        'clamp-lg' : "clamp(6rem, 9.5vw, 7.4rem)",
        'clamp-xl' : "clamp(7.5rem, 9.5vw, 8.9rem)",
        'clamp-2xl' : "clamp(9rem, 9.5vw, 100rem)",
        'clamp-b-xs' : "clamp(0.5rem, 8.7vw, 3.9rem)",
        'clamp-b-sm' : "clamp(2rem, 9.1vw, 5.9rem)",
        'clamp-b-md' : "clamp(2rem, 8.5vw, 5.9rem)",
        'clamp-b-lg' : "clamp(4rem, 8.8vw, 7.4rem)",
        'clamp-b-xl' : "clamp(5rem, 9vw, 8.9rem)",
        'clamp-b-2xl' : "clamp(6rem, 9.1vw, 100rem)",
      }
    },
    fontFamily: {
      sans: ["Archivo", "sans-serif"],
    },
  },
  plugins: [],
}

