// command-servicelist.js
// List services configured on an ArcGIS for Server site

var _ = require('underscore');

/* global -Promise */
var Promise = require('bluebird');

var program = require('commander');

var config = require('../config');

var site = require('../ags/site');
var services = require('../ags/services');

var consoleTheme = require('../consoletheme');

var loadUserConfigs = function (programArgs) {
  return config.getConfigurations().then(function (configs) {
    return _.extend({}, configs, programArgs);
  });
};

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
var getFolderServices = function (host, token, folder, options) {
  var opts = options || {};
  return services.report({
    host: host,
    folder: folder,
    token: token
  }).then(function (folderReport) {
    var services = _.reduce(folderReport.reports, function (runningList, service) {
      var passesFilter = true;

      var publicPermission = _.find(service.permissions, function (permission) {
        return permission.principal === 'esriEveryone' && permission.permission && permission.permission.isAllowed === true;
      });

      if (opts.cached && service.properties.isCached !== 'true') {
        passesFilter = false;
      }
      if (opts.public && !publicPermission) {
        passesFilter = false;
      }
      if (opts.private && publicPermission) {
        passesFilter = false;
      }
      if (options.started && service.status.realTimeState !== 'STARTED') {
        passesFilter = false;
      }
      if (options.stopped && service.status.realTimeState !== 'STOPPED') {
        passesFilter = false;
      }
      if (opts.serviceType && service.type !== opts.serviceType) {
        passesFilter = false;
      }

      if (passesFilter) {
        runningList.push({
          name: service.folderName.replace('/', '') + '/' + service.serviceName,
          serviceType: service.type,
          summary: service.iteminfo.summary,
          description: service.description
        });
      }
      return runningList;
    }, []);

    return {
      host: host,
      services: services
    };
  });
};

// get services report for all folders + root. returns promise for all async requests.
var getAllFolderReports = function (host, token, folders, options) {
  var folderRequests = _.map(_.union([''], folders), function (folder) { // union '' to include root folder
    return getFolderServices(host, token, folder, options);
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
var writeReport = function (report, options) {
  var opts = options || {};
  console.log(consoleTheme.header(report.host));
  console.log(consoleTheme.separator('---'));
  _.each(_.sortBy(report.services, 'name'), function (service, index) {
    var num = index + 1;
    var output = consoleTheme.output(num + ' ' + service.name + ' (' + service.serviceType + ')');
    if (opts.verbose && service.summary) {
      output = output + consoleTheme.output2('\n' + service.summary.replace(/\n/g, ''));
    }
    console.log(output);
  });
};

var commandAction = function (cmd) {
  loadUserConfigs(_.pick(cmd.parent, 'host', 'username', 'password'))
  .then(function (args) {
    return getToken(args.host, args.username, args.password);
  })
  .then(function (getTokenResponse) {
    return getFolderList(getTokenResponse.host, getTokenResponse.token);
  })
  .then(function (folderListResponse) {
    var options = _.pick(cmd, 'cached', 'public', 'private', 'started', 'stopped', 'serviceType');
    return getAllFolderReports(folderListResponse.host, folderListResponse.token, folderListResponse.folders, options);
  })
  .then(summarizeFolderReports)
  .then(function (report) {
    writeReport(report, {
      verbose: cmd.verbose
    });
  })
  .catch(function (response) {
    console.log(consoleTheme.error(response.error));
  });
};

program
  .command('servicelist')
  .description('List services for an ArcGIS for Server site')
  .option('--cached', 'list only cached map services')
  .option('--public', 'list only public services')
  .option('--private', 'list only private services')
  .option('--started', 'list only started services')
  .option('--stopped', 'list only stopped services')
  .option('--service-type <type>', 'list only services matching the specified service type (GPServer, MapServer, GeocodeServer, SearchServer)')
  .option('--verbose', 'include service descriptions in addition to folder and service names')
  .action(commandAction);