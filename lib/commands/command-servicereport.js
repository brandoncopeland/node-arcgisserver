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
  }).then(function (response) {
    return _.extend(response, {
      host: host
    });
  });
};

// returns promise with /services response
var getFolderList = function (host, token) {
  return services.services({
    host: host,
    token: token
  }).then(function (response) {
    return _.extend(response, {
      host: host,
      token: token
    });
  });
};

// returns promise with /services/folder/report response
var getFolderServiceReport = function (host, token, folder) {
  return services.report({
    host: host,
    folder: folder,
    token: token
  }).then(function (folderReport) {
    var services = [];
    var serviceCount = folderReport.reports.length;
    var typeCount = {}, statusCount = {}, cachedCount = 0, maxInstanceCount = 0, busyInstanceCount = 0, freeInstanceCount = 0;

    _.each(folderReport.reports, function (service) {
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

    return {
      host: host,
      services: services,
      serviceCount: serviceCount,
      typeCount: typeCount,
      statusCount: statusCount,
      cachedCount: cachedCount,
      maxInstanceCount: maxInstanceCount,
      busyInstanceCount: busyInstanceCount,
      freeInstanceCount: freeInstanceCount
    };
  });
};

// returns promise with compile service report
var getAllFolderReports = function (host, token, folders) {
  var folderRequests = _.map(_.union([''], folders), function (folder) { // union '' to include root folder
    return getFolderServiceReport(host, token, folder);
  });
  return Promise.all(folderRequests);
};

// returns promise with combined report by summarizing individual folder reports
var summarizeFolderReports = function (individualReports) {
  var oneReport = _.reduce(individualReports, function (runningReport, report) {
    // types - { MapServer: 12, GPServer: 3, ... }
    var typeCount = _.reduce(report.typeCount, function (runningTypeCount, count, key) {
      if (!runningTypeCount[key]) {
        runningTypeCount[key] = 0;
      }
      runningTypeCount[key] = runningTypeCount[key] + count;
      return runningTypeCount;
    }, runningReport.typeCount);
    // statuses - { STARTED: 4, STOPPED: 5, ... }
    var statusCount = _.reduce(report.statusCount, function (runningStatusCount, count, key) {
      if (!runningStatusCount[key]) {
        runningStatusCount[key] = 0;
      }
      runningStatusCount[key] = runningStatusCount[key] + count;
      return runningStatusCount;
    }, runningReport.statusCount);
    return {
      host: report.host,
      services: runningReport.services.concat(report.services),
      serviceCount: runningReport.serviceCount + report.serviceCount,
      typeCount: typeCount,
      statusCount: statusCount,
      cachedCount: runningReport.cachedCount + report.cachedCount,
      maxInstanceCount: runningReport.maxInstanceCount + report.maxInstanceCount,
      busyInstanceCount: runningReport.busyInstanceCount + report.busyInstanceCount,
      freeInstanceCount: runningReport.freeInstanceCount + report.freeInstanceCount
    };
  }, { // default runningReport
    services: [],
    serviceCount: 0,
    typeCount: {},
    statusCount: {},
    cachedCount: 0,
    maxInstanceCount: 0,
    busyInstanceCount: 0,
    freeInstanceCount: 0
  });
  return _.extend(oneReport, {
    folderCount: individualReports.length - 1, // -1 to account for the root report
  });
};

// writes report to console
var writeReport = function (report) {
  console.log(colors.header(report.host));
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
};

var commandAction = function (cmd) { 
  getToken(cmd.parent.host, cmd.parent.username, cmd.parent.password)
    .then(function (getTokenResponse) {
      return getFolderList(getTokenResponse.host, getTokenResponse.token);
    })
    .then(function (folderListResponse) {
      return getAllFolderReports(folderListResponse.host, folderListResponse.token, folderListResponse.folders);
    })
    .then(summarizeFolderReports)
    .then(writeReport)
    .catch(function (response) {
      console.log(colors.error(response.error));
    });
};

program
  .command('servicereport')
  .description('Report statistics on services for an ArcGIS for Server site')
  .action(commandAction);