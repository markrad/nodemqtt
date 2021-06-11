'use strict';

const CATEGORY = 'Main';
const log4js = require('log4js');
log4js.getLogger().level = 'debug';
const logger = log4js.getLogger(CATEGORY);
const { Command } = require('commander');
const MqttServer = require('./mqttserver');

logger.level = 'info';
logger.info('nodeMQTT starting up')

try {
    const debugLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const defaultDebug = 3;
    const packageJSON = require('../package.json');
    const program = new Command();

    program.version(`Version = ${packageJSON.version}\nAuthor  = ${packageJSON.author}\nLicense = ${packageJSON.license}\nWebpage = ${packageJSON.repository.url}`)
        .name('nodeMQTT')
        .option('-c, --config <locaton>', 'name and location of config.json', './config.json')
        .option('-D --debug <type>', `logging level [${debugLevels.join(' | ')}]\n(default: if present the value from config.json debugLevel otherwise ${debugLevels[defaultDebug]})`)
        .parse(process.argv);

    let configFile = program.opts().config || './config.json';
    logger.info(`Using ${configFile}`);

    const config = { ...{ listen: '0.0.0.0', port: 1883, loglevel: 'info' }, ...(require(configFile)) };

    if (debugLevels.includes(config.loglevel)) {
        logger.level = config.loglevel;
    }
    else {
        throw new Error(`Specified logging level ${config.loglevel} is invalid`);
    }
    
    if (program.opts().debug) {
        if (!debugLevels.includes(program.opts().debug)) {
            throw new Error(`Invalid debugLevel value of ${program.opts().debug} passed`);
        }
        else {
            logger.level = program.opts().debug;
        }
    }

    let server = new MqttServer(config);

    process.stdin.resume();
    ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM'].forEach((eventType) => {
        process.on(eventType, async (signal) => {
            logger.fatal(`Clean up after event ${signal}`);
            await server.stop();
            process.exit(eventType == 'SIGTERM'? 0 : 4);
        });
    });

    process.on('uncaughtException', (err) => {
        logger.error(`Unhandled error: ${err.message}\n${err.stack}`);
    })

    server.run();
}
catch (err) {
    logger.fatal(err.message);
}
