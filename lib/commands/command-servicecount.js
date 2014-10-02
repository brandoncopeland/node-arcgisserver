// command-servicecount.js

var _ = require('underscore');

/* global -Promise */
var Promise = require('bluebird');

var messager = require('../messager');
var program = require('commander');

var site = require('../ags/site');
var services = require('../ags/services');

var getToken = function (host, username, password) {
  return site.generateToken({
    host: host,
    username: username,
    password: password
  }).then(function (getTokenResponse) {
    if (getTokenResponse.status !== 'error') {
      return getTokenResponse;
    } else {
      throw {
        error: getTokenResponse.messages[0]
      };
    }
  });
};

var getRootDetails = function (host, token) {
  return services.services({
    host: host,
    token: token
  });
};

var getFolderDetails = function (host, folder, token) {
  return services.report({
    host: host,
    folder: folder,
    token: token
  });
};

var commandAction = function (cmd) {
  var token, actionRequest = getToken(cmd.parent.host, cmd.parent.username, cmd.parent.password);
  
  actionRequest
    .then(function (getTokenResponse) {
      token = getTokenResponse.token;
      return getRootDetails(cmd.parent.host, token);
    })
    .then(function (servicesResponse) {
      var folderRequests, serviceCount = servicesResponse.services.length;
      folderRequests = _.map(servicesResponse.folders, function (folder) {
        return getFolderDetails(cmd.parent.host, folder, token).then(function (folderResponse) {
          serviceCount += folderResponse.reports.length;
        });
      });
      return Promise.all(folderRequests).then(function () {
        return serviceCount;
      });
    })
    .then(function (serviceCount) {
      messager.info(serviceCount);
    })
    .catch(function (response) {
      messager.error(response.error);
    });
};

program
  .command('servicecount')
  .description('Count the number of ArcGIS for Server services running on the host')
  .action(commandAction);