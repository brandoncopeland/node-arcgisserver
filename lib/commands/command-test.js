// command-test.js

var messager = require('../messager');
var program = require('commander');

var commandAction = function (cmd) {
  messager.info('Command "' + cmd._name + '" executed');
  messager.log('Complete arguments:');
  messager.log(cmd);
};

program
  .command('test')
  .description('Command to test the usage of commander')
  .action(commandAction);