// ags-site.js

var request = require('request-promise');

var ip = require('ip');

var agsresponse = require('./agsresponse');

var generateToken = function (options) {
  options = options || {};
  return request({
    uri : 'http://' + options.host + '/arcgis/admin/generateToken',
    method : 'POST',
    form: {
      f: 'json',
      username: options.username,
      password: options.password,
      client: 'ip',
      ip: ip.address(),
      expiration: options.expiration || 10
    }
  }).then(JSON.parse).then(agsresponse.resolveResponseStatus);
};

module.exports = {
  generateToken: generateToken
};