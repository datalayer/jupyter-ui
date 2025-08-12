/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'system': ['system-ui', '-apple-system', 'BlinkMacSystemFont', '.SFNSText-Regular', 'sans-serif'],
      },
      colors: {
        // Custom colors to match existing design
        'gray-light': '#eee',
        'gray-medium': '#ddd',
        'gray-dark': '#333',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
