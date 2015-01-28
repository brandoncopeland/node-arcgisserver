// services.js

var request = require('request-promise');

var agsresponse = require('./agsresponse');

// admin/services
// http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Services_Root_Folder/02r3000001q6000000/
var services = function (options) {
  options = options || {};
  return request({
    uri: 'http://' + options.host + '/arcgis/admin/services',
    method: 'GET',
    qs: {
      f: 'json',
      token: options.token,
      detail: false
    }
  }).then(JSON.parse).then(agsresponse.resolveResponseStatus);
};

// admin/services/[<folder>]/report
// http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Service_Report/02r3000001qq000000/
var report = function (options) {
  options = options || {};
  var folderInsert = options.folder ? '/' + options.folder : '';
  return request({
    uri: 'http://' + options.host + '/arcgis/admin/services' + folderInsert + '/report',
    method: 'GET',
    qs: {
      f: 'json',
      token: options.token
    }
  }).then(JSON.parse).then(agsresponse.resolveResponseStatus);
};

module.exports = {
  services: services,
  report: report
};