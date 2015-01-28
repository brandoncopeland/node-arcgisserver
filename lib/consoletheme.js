// consoletheme.js

var colors = require('colors/safe');
colors.setTheme({
  header: 'cyan',
  info: 'green',
  error: 'red'
});

module.exports = colors;