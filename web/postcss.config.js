const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    ...(process.env.HUGO_ENVIRONMENT === 'production'
      ? [tailwindcss, autoprefixer]
      : [tailwindcss, autoprefixer])
  ]
};
