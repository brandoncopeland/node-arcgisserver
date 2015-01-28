// consoletheme.js

var colors = require('colors/safe');
colors.setTheme({
  header: 'cyan',
  subheader: 'green',
  output: 'white',
  separator: 'gray',
  error: 'red'
});

module.exports = colors;