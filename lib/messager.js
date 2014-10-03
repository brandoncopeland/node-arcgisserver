// messager.js
// Write messages out to the console
// Usage...
//   messager.info('some stuff to write');

var _ = require('underscore');

var colors = require('colors/safe');
colors.setTheme({
  header: 'cyan',
  log: 'white',
  info: 'green',
  error: 'red'
});

var writeMessage = function () {
  var messages = _.toArray(arguments).slice(1);
  var format = arguments[0];
  var formattedMessages = _.map(messages, function (message) {
    return colors[format](message);
  });
  console.log.apply(null, formattedMessages);
};

module.exports = {
  header: _.bind(writeMessage, null, 'header'),
  log: _.bind(writeMessage, null, 'log'),
  info: _.bind(writeMessage, null, 'info'),
  error: _.bind(writeMessage, null, 'error')
};