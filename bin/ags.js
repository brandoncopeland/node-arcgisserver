#! /usr/bin/env node

var packageJson = require('../package.json');

var program = require('commander');

program
  .version(packageJson.version)
  .option('-h, --host <host>', 'host name for the ArcGIS for Server site (ex. mysite:6080)')
  .option('-u, --username <username>', 'user name for an administrative account on the ArcGIS for Server site')
  .option('-p, --password <password>', 'credentials for the `username` administrative account');

require('../lib/commands/command-config');
require('../lib/commands/command-servicestatistics');
require('../lib/commands/command-servicelist');

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}