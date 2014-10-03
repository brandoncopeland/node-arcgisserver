// command-servicereport.js
// Report cumulative statistics around services configured on the ArcGIS for Server site

var _ = require('underscore');

/* global -Promise */
var Promise = require('bluebird');

var messager = require('../messager');
var program = require('commander');

var site = require('../ags/site');
var services = require('../ags/services');

// returns promise with /site/generateToken response
var getToken = function (host, username, password) {
  return site.generateToken({
    host: host,
    username: username,
    password: password
  });
};

// returns promise with /services response
var getRootDetails = function (host, token) {
  return services.services({
    host: host,
    token: token
  }).then(function (response) {
    return _.extend(response, {
      token: token // append token for continued use
    });
  });
};

// returns promise with /services/folder/report response
var getFolderDetails = function (host, folder, token) {
  return services.report({
    host: host,
    folder: folder,
    token: token
  });
};

var commandAction = function (cmd) { 
  getToken(cmd.parent.host, cmd.parent.username, cmd.parent.password)
    .then(function (getTokenResponse) {
      return getRootDetails(cmd.parent.host, getTokenResponse.token);
    })
    .then(function (rootDetailResponse) {
      var folderRequests, folderCount = rootDetailResponse.folders.length;
      var serviceCount = 0, typeCount = {}, statusCount = {}, cachedCount = 0, maxInstanceCount = 0, busyInstanceCount = 0, freeInstanceCount = 0;

      folderRequests = _.map(_.union([''], rootDetailResponse.folders), function (folder) {
        return getFolderDetails(cmd.parent.host, folder, rootDetailResponse.token).then(function (folderResponse) {
          serviceCount += folderResponse.reports.length;
          _.each(folderResponse.reports, function (service) {
            if (!typeCount[service.type]) {
              typeCount[service.type] = 0;
            }
            typeCount[service.type] += 1;
            if (!statusCount[service.status.realTimeState]) {
              statusCount[service.status.realTimeState] = 0;
            }
            statusCount[service.status.realTimeState] += 1;
            if (service.properties.isCached === 'true') {
              cachedCount += 1;
            }
            maxInstanceCount += service.instances.max;
            busyInstanceCount += service.instances.busy;
            freeInstanceCount += service.instances.free;
          });
        });
      });

      return Promise.all(folderRequests).then(function () {
        return {
          folderCount: folderCount,
          serviceCount: serviceCount,
          typeCount: typeCount,
          statusCount: statusCount,
          cachedCount: cachedCount,
          maxInstanceCount: maxInstanceCount,
          busyInstanceCount: busyInstanceCount,
          freeInstanceCount: freeInstanceCount
        };
      });
    })
    .then(function (report) {
      messager.header(cmd.parent.host);
      messager.info('Folders: ' + report.folderCount);
      messager.info('Services: ' + report.serviceCount);
      messager.info('Cached Map Services: ' + report.cachedCount);
      messager.log('Service Types');
      _.each(report.typeCount, function (value, key) {
        messager.info(key + ': ' + value);
      });
      messager.log('Statuses');
      _.each(report.statusCount, function (value, key) {
        messager.info(key + ': ' + value);
      });
      messager.log('Instances');
      messager.info('Maximum Total: ' + report.maxInstanceCount);
      messager.info('Current Busy: ' + report.busyInstanceCount);
      messager.info('Current Free: ' + report.freeInstanceCount);
    })
    .catch(function (response) {
      messager.error(response.error);
    });
};

program
  .command('servicereport')
  .description('Report statistics on services for an ArcGIS for Server site')
  .action(commandAction);