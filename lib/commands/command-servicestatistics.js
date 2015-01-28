// command-servicestatistics.js
// Report cumulative statistics around services configured on the ArcGIS for Server site

var _ = require('underscore');

/* global -Promise */
var Promise = require('bluebird');

var program = require('commander');

var site = require('../ags/site');
var services = require('../ags/services');

var consoleTheme = require('../consoletheme');

var titleCase = require('titlecase');

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

// request folder list for host
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

// request service report for folder and return folder statistics from report
var getFolderServiceReport = function (host, token, folder) {
  return services.report({
    host: host,
    folder: folder,
    token: token
  }).then(function (folderReport) {
    var serviceCount = folderReport.reports.length;
    var typeCount = {}, statusCount = {}, publicCount = 0, cachedCount = 0, maxInstanceCount = 0, busyInstanceCount = 0, freeInstanceCount = 0;
    var publicPermission;

    _.each(folderReport.reports, function (service) {
      if (!typeCount[service.type]) {
        typeCount[service.type] = 0;
      }
      typeCount[service.type] += 1;
      if (!statusCount[service.status.realTimeState]) {
        statusCount[service.status.realTimeState] = 0;
      }
      statusCount[service.status.realTimeState] += 1;
      publicPermission = _.find(service.permissions, function (permission) {
        return permission.principal === 'esriEveryone' && permission.permission && permission.permission.isAllowed === true;
      });
      if (publicPermission) {
        publicCount += 1;
      }
      if (service.properties.isCached === 'true') {
        cachedCount += 1;
      }
      maxInstanceCount += service.instances.max;
      busyInstanceCount += service.instances.busy;
      freeInstanceCount += service.instances.free;
    });

    return {
      host: host,
      serviceCount: serviceCount,
      typeCount: typeCount,
      statusCount: statusCount,
      publicCount: publicCount,
      cachedCount: cachedCount,
      maxInstanceCount: maxInstanceCount,
      busyInstanceCount: busyInstanceCount,
      freeInstanceCount: freeInstanceCount
    };
  });
};

// get services report for all folders + root. returns promise for all async requests.
var getAllFolderReports = function (host, token, folders) {
  var folderRequests = _.map(_.union([''], folders), function (folder) { // union '' to include root folder
    return getFolderServiceReport(host, token, folder);
  });
  return Promise.all(folderRequests);
};

// reduce all service report statistics to single cumulative statistics
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
      serviceCount: runningReport.serviceCount + report.serviceCount,
      typeCount: typeCount,
      statusCount: statusCount,
      publicCount: runningReport.publicCount + report.publicCount,
      cachedCount: runningReport.cachedCount + report.cachedCount,
      maxInstanceCount: runningReport.maxInstanceCount + report.maxInstanceCount,
      busyInstanceCount: runningReport.busyInstanceCount + report.busyInstanceCount,
      freeInstanceCount: runningReport.freeInstanceCount + report.freeInstanceCount
    };
  }, { // default runningReport
    serviceCount: 0,
    typeCount: {},
    statusCount: {},
    publicCount: 0,
    cachedCount: 0,
    maxInstanceCount: 0,
    busyInstanceCount: 0,
    freeInstanceCount: 0
  });
  return _.extend(oneReport, {
    folderCount: individualReports.length - 1 // -1 to account for the root report
  });
};

// writes report to console
var writeReport = function (report) {
  console.log(consoleTheme.header(report.host));
  console.log(consoleTheme.separator('---'));
  console.log(consoleTheme.output('Folders: %d'), report.folderCount);
  console.log(consoleTheme.output('Services: %d'), report.serviceCount);
  console.log(consoleTheme.output('Public Services: %d'), report.publicCount);
  console.log(consoleTheme.output('Cached Map Services: %d'), report.cachedCount);
  console.log(consoleTheme.separator('---'));
  console.log(consoleTheme.subheader('Service Types'));
  _.each(report.typeCount, function (value, key) {
    console.log(consoleTheme.output('%s: %s'), key, value);
  });
  console.log(consoleTheme.separator('---'));
  console.log(consoleTheme.subheader('Statuses'));
  _.each(report.statusCount, function (value, key) {
    console.log(consoleTheme.output('%s: %s'), titleCase(key.toLowerCase()), value); // returned from server as all caps. make title.
  });
  console.log(consoleTheme.separator('---'));
  console.log(consoleTheme.subheader('Instances'));
  console.log(consoleTheme.output('Maximum Possible Instances: %d'), report.maxInstanceCount);
  console.log(consoleTheme.output('Current Instances Busy: %d'), report.busyInstanceCount);
  console.log(consoleTheme.output('Current Instances Free: %d'), report.freeInstanceCount);
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
      console.log(consoleTheme.error(response.error));
    });
};

program
  .command('servicestatistics')
  .description('Report statistics on services for an ArcGIS for Server site')
  .action(commandAction);