/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
    "./style/**/*.css",
  ],
  safelist: [
    'test-css-loading',
    'bg-red-500',
    'bg-blue-500',
    'text-white',
    'text-black',
    'p-4',
    'p-2',
    'rounded',
    'Button__root',
    'GLOBAL_CSS_TEST',
    // Add some common utilities that should always be available
    'flex',
    'items-center',
    'justify-center',
    'w-full',
    'h-full',
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
