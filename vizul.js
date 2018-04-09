//Get a commander instance
var program = require('commander');

//Get an instance of winston
global.winston = require('winston');

const version = '0.0.1';

global._root = __dirname;

//Set the version
program
  .version(version)
  .option('-v, --verbose', 'Verbose logging');

//Start command
program
  .command('start')
  .option('-p, --port <port>', 'Set the port for the http server')
  .action(function(cmd) {
  //Load the logger
  if (program.verbose) {
    global.winston.level = 'debug';
    global.winston.debug('Using verbose logging');
  } else global.winston.level = 'info';
  
  winston.info('Booting up server...');
  //Boot up the server!
  require('./server/index.js')();
});


//Parse input
program.parse(process.argv);