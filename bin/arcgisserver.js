#! /usr/bin/env node

var packageJson = require('../package.json');

var program = require('commander');

program
  .version(packageJson.version)
  .option('-h, --host <host>', 'Host name for the ArcGIS for Server site (ex. mysite:6080).')
  .option('-u, --username <username>', 'User name for an administrative account on the ArcGIS for Server site.')
  .option('-p, --password <password>', 'Credentials for the `username` account.');

require('../lib/commands/command-test');
require('../lib/commands/command-servicecount');

program.parse(process.argv);