// command-servicereport.js
// Report cumulative statistics around services configured on the ArcGIS for Server site

var _ = require('underscore');

/* global -Promise */
var Promise = require('bluebird');

var colors = require('colors/safe');
colors.setTheme({
  header: 'cyan',
  info: 'green',
  error: 'red'
});

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
      var services = [], serviceCount = 0, typeCount = {}, statusCount = {}, cachedCount = 0, maxInstanceCount = 0, busyInstanceCount = 0, freeInstanceCount = 0;

      folderRequests = _.map(_.union([''], rootDetailResponse.folders), function (folder) {
        return getFolderDetails(cmd.parent.host, folder, rootDetailResponse.token).then(function (folderResponse) {
          serviceCount += folderResponse.reports.length;
          _.each(folderResponse.reports, function (service) {
            services.push({
              name: service.folderName.replace('/', '') + '/' + service.serviceName,
              description: service.description
            });
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
          services: services,
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
      console.log(colors.header(cmd.parent.host));
      console.log('---');
      console.log(colors.header('Statistics'));
      console.log(colors.info('Folders: %d'), report.folderCount);
      console.log(colors.info('Services: %d'), report.serviceCount);
      console.log(colors.info('Cached Map Services: %d'), report.cachedCount);
      console.log('Service Types');
      _.each(report.typeCount, function (value, key) {
        console.log(colors.info('%s: %s'), key, value);
      });
      console.log('Statuses');
      _.each(report.statusCount, function (value, key) {
        console.log(colors.info('%s: %s'), key, value);
      });
      console.log('Instances');
      console.log(colors.info('Maximum Total: %d'), report.maxInstanceCount);
      console.log(colors.info('Current Busy: %d'), report.busyInstanceCount);
      console.log(colors.info('Current Free: %d'), report.freeInstanceCount);
      console.log('---');
      console.log(colors.header('Service List'));
      _.each(_.sortBy(report.services, 'name'), function (service) {
        console.log(colors.info(service.name) + ' ' + service.description.replace(/\n/g, ''));
      });
    })
    .catch(function (response) {
      console.log(colors.error(response.error));
    });
};

program
  .command('servicereport')
  .description('Report statistics on services for an ArcGIS for Server site')
  .action(commandAction);