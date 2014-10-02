// messager.js
// Write messages out to the console
// Usage...
//   messager.info('some stuff to write');

var _ = require('underscore');

var colors = require('colors/safe');
colors.setTheme({
  info: 'green',
  error: 'red'
});

var log = function () {
  console.log.apply(null, _.values(arguments));
};

var info = function () {
  var formattedMessages = _.map(arguments, function (arg) {
    return colors.info(arg);
  });
  console.log.apply(null, formattedMessages);
};

var error = function () {
  var formattedMessages = _.map(arguments, function (arg) {
    return colors.error(arg);
  });
  console.log.apply(null, formattedMessages);
};

module.exports = {
  log: log,
  info: info,
  error: error
};