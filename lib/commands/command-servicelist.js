// command-servicelist.js
// List services configured on an ArcGIS for Server site

var _ = require('underscore');

/* global -Promise */
var Promise = require('bluebird');

var program = require('commander');

var site = require('../ags/site');
var services = require('../ags/services');

var consoleTheme = require('../consoletheme');

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

// request service report for folder and return list of services from report
var getFolderServices = function (host, token, folder) {
  return services.report({
    host: host,
    folder: folder,
    token: token
  }).then(function (folderReport) {
    var services = _.reduce(folderReport.reports, function (runningList, service) {
      runningList.push({
        name: service.folderName.replace('/', '') + '/' + service.serviceName,
        summary: service.iteminfo.summary,
        description: service.description
      });
      return runningList;
    }, []);

    return {
      host: host,
      services: services
    };
  });
};

// get services report for all folders + root. returns promise for all async requests.
var getAllFolderReports = function (host, token, folders) {
  var folderRequests = _.map(_.union([''], folders), function (folder) { // union '' to include root folder
    return getFolderServices(host, token, folder);
  });
  return Promise.all(folderRequests);
};

// reduce all folder list reports to single array of services
var summarizeFolderReports = function (individualReports) {
  return _.reduce(individualReports, function (runningReport, report) {
    return {
      host: report.host,
      services: runningReport.services.concat(report.services)
    };
  }, {
    services: []
  });
};

// writes report to console
var writeReport = function (report) {
  console.log(consoleTheme.header(report.host));
  console.log('---');
  _.each(_.sortBy(report.services, 'name'), function (service) {
    console.log(consoleTheme.info(service.name) + ' ' + service.summary.replace(/\n/g, ''));
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
      console.log(consoleTheme.error(response.error));
    });
};

program
  .command('servicelist')
  .description('List services for an ArcGIS for Server site')
  .action(commandAction);