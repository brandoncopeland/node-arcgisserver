#! /usr/bin/env node

var _ = require('underscore');
var colors = require('colors/safe');

var packageJson = require('./package.json');

var authenticate = require('./lib/authenticate');

var feature, features = {
  countServices: require('./lib/services-count')
};

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    host: 'h',
    username: 'u',
    password: 'p'
  }
});

colors.setTheme({
  info: 'green',
  error: 'red'
});

feature = features[argv._[0]]; // first arg without key, name of feature to execute
if (feature && _.isFunction(feature)) {
  console.log('Authenticating as "' + argv.username + '"');
  authenticate({
    host: argv.host,
    username: argv.username,
    password: argv.password
  }).then(function (response) {
    if (response.status !== 'error') {
      console.log(colors.info('Successfully authenticated'));
      console.log('Executing "' + argv._[0] + '"');
      feature(_.extend({}, argv, {
        token: response.token
      }));
    } else {
      // error returned from AGS `generateToken`
      console.log(colors.error('Failed to authenticate. ' + response.messages[0]));
    }
  }).catch(function (response) {
    // error with http post to AGS 'generateToken'
    console.log(colors.error('Failed to authenticate. ' + response.error));
  });
} else {
  if (argv._[0]) {
    // error. feature/command is included with params but is not known
    console.log(colors.error('\'' + argv._[0] + '\' is not a known arcgisserver command'));
  } else {
    // No parameter for command passed, just `arcgisserver`
    // TODO. maybe replace with some minimal help docs
    console.log(colors.info(packageJson.name + ' ' + packageJson.version + ' - ' + packageJson.description));
  }
}