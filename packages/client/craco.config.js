const { whenProd } = require('@craco/craco')
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin')

module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
  webpack: {
    plugins: [
      ...whenProd(
        () => [
          new CspHtmlWebpackPlugin(
            {
              'default-src': "'self'",
              'base-uri': "'self'",
              'object-src': "'none'",
              'script-src': ["'self'", 'blob:', 'cdnjs.cloudflare.com'],
              'style-src': ["'unsafe-inline'", "'self'"],
              'img-src': ["'self'", 'data:']
            },
            {
              nonceEnabled: {
                'script-src': false,
                'style-src': false,
              },
            },
          ),
        ],
        [],
      ),
    ],
  },
}
