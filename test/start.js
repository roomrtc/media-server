var path = require('path');
// var mediaServer = require('../server');

// expose signaling server for test
// module.exports = mediaServer;

/**
 * Import specs
 */
var dir = '../test/spec/';
[
  'adapterTest',
  'endTest'
].forEach((script) => {
  require(path.join(dir, script));
});