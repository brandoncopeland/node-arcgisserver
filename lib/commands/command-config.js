// command-config.js

var _ = require('underscore');

var program = require('commander');

var config = require('../config');

var consoleTheme = require('../consoletheme');

var writeConfigurations = function () {
  return config.getConfigurations()
  .then(function (configs) {
    if (!_.size(configs)) {
      console.log(consoleTheme.output('No user defined configurations'));
    }
    _.each(configs, function (config, key) {
      console.log(consoleTheme.subheader(key + ':') + consoleTheme.output(config));
    });
  });
};

var addConfig = function (key, val) {
  return config.saveConfiguration(key, val)
    .then(function () {
      console.log(consoleTheme.output('Added configuration %s:%s'), key, val);
      console.log(consoleTheme.separator('---'));
    });
};

var deleteConfig = function (key) {
  return config.deleteConfiguration(key)
    .then(function () {
      console.log(consoleTheme.output('Deleted configuration %s'), key);
      console.log(consoleTheme.separator('---'));
    });
};

var writeError = function (err) {
  console.log(consoleTheme.error(err));
};

var commandAction = function (key, val, cmd) {
  if (key && cmd.delete) {
    deleteConfig(key)
      .then(writeConfigurations)
      .catch(writeError);
  } else if (key && val) {
    addConfig(key, val)
      .then(writeConfigurations)
      .catch(writeError);
  } else {
    writeConfigurations()
      .catch(writeError);
  }
};

// $ags config - list configs
// $ags config key value - adds new key:value
// $ags config key -d - deletes key
program
  .command('config [key] [value]')
  .description('List, save, and delete user configured default command arguments')
  .option('-d, --delete', 'delete configuration by key')
  .action(commandAction);