module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}'
    ],
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#F2FBFE',
            100: '#E6F6FD',
            200: '#BFE9FA',
            300: '#99DCF7',
            400: '#4DC1F1',
            500: '#00A6EB',
            600: '#0085BC',
            700: '#00648D',
            800: '#00425E',
            900: '#00212F'
          }
        }
      }
    },
    plugins: []
  };