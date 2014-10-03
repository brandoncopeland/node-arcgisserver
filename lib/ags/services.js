// services.js

var request = require('request-promise');

var agsresponse = require('./agsresponse');

var services = function (options) {
  options = options || {};
  return request({
    uri : 'http://' + options.host + '/arcgis/admin/services',
    method : 'GET',
    qs: {
      f: 'json',
      token: options.token,
      detail: false
    }
  }).then(JSON.parse).then(agsresponse.resolveResponseStatus);
};

var report = function (options) {
  options = options || {};
  var folderInsert = options.folder ? '/' + options.folder : '';
  return request({
    uri : 'http://' + options.host + '/arcgis/admin/services' + folderInsert + '/report',
    method : 'GET',
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