// consoletheme.js

var colors = require('colors/safe');
colors.setTheme({
  header: 'cyan',
  subheader: 'white',
  output: 'green',
  output2: 'gray',
  separator: 'gray',
  error: 'red'
});

module.exports = colors;