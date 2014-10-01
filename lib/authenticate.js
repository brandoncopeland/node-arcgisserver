// authenticate.js
// Usage...
//   var authenticate = require('authenticate');
//   var request = athenticate({
//     host: 'server:6080',
//     username: 'name',
//     password: 'password'
//   }).then(function (response) {
//     // Do some stuff on success
//     // response looks like { token: ..., expires: ... }
//   }).catch(function (err) {
//     // Do some stuff on error
//   });
// Returns `Bluebird` style promise. https://github.com/petkaantonov/bluebird

var request = require('request-promise');

var getToken = function (options) {
  options || (options = {});
  return request({
    uri : 'http://' + options.host + '/arcgis/admin/generateToken', // TODO. This should be https but not currently supported on our AGS
    method : 'POST',
    form: {
      f: 'json',
      username: options.username,
      password: options.password,
      referer: 'node-arcgisserver',
      expiration: 1
    }
  }).then(JSON.parse);
};

module.exports = getToken;