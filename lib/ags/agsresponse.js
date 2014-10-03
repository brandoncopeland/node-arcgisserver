// agsresponse.js

// ArcGIS Server operations return http 200 when they fail.
// The response includes `status: 'error'` and a `messages` property describing why the operation failed.
// Our application manages these operations through promises.
// `resolveResponseStatus` checks the status of incoming responses and helps reject the promise if the status indicates a server error.
// Usage:
//   var agsresponse = require('./agsresponse');
//   var promise = someAGSRequest;
//   promise.then(agsresponse.resolveResponseStatus);
var resolveResponseStatus = function (response) {
  if (response.status === 'error') {
    throw {
      error: response.messages.join(' ')
    };
  }
  return response;
};

module.exports = {
  resolveResponseStatus: resolveResponseStatus
};