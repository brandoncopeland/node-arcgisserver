// config.js

// TODO. Use home (I think this is the best idea?), but permissions issue
// var packageJson = require('../package.json');
// var osenv = require('osenv');
// var configFile = osenv.home() + '/' + packageJson.name + '/userconfig.json';
var configFile = './userconfig.json';

/* global -Promise */
var Promise = require('bluebird');

var nconf = require('nconf');
nconf.save();
nconf.use('file', {
  file: configFile
});

var getConfigurations = function () {
  return new Promise(function (resolve, reject) {
    nconf.get(null, function (err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

var saveConfiguration = function (key, val) {
  return new Promise(function (resolve, reject) {
    nconf.set(key, val);
    nconf.save(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

var deleteConfiguration = function (key) {
  return new Promise(function (resolve, reject) {
    nconf.clear(key);
    console.log(nconf, key);
    nconf.save(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = {
  getConfigurations: getConfigurations,
  saveConfiguration: saveConfiguration,
  deleteConfiguration: deleteConfiguration
};