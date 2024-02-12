( function () {
    const winston = require('winston');

    const {createLogger, format, transports} = require('winston');
    const {combine, timestamp, label, printf} = format;
    require('winston-daily-rotate-file');
    const directory = './logs',
        pattern = 'YYYY-MM-DD';

    const myFormat = printf(({level, message, timestamp}) => {
        return `${timestamp} : ${message} : ${level}`;
    });

    const logger = winston.createLogger({
        level: 'info',
        //format: winston.format.json(),
        format: combine(
            timestamp(),
            myFormat
        ),
        defaultMeta: {service: 'user-service'},
        transports: [
            //
            // - Write to all logs with level `info` and below to `combined.log`
            // - Write all logs error (and below) to `error.log`.
            //
            new winston.transports.DailyRotateFile({
                dirname: directory,
                filename: 'all-%DATE%.log',
                datePattern: pattern,
                zippedArchive: false,
                maxSize: '20m',
                maxFiles: '14d'

            })
            ,
            new winston.transports.DailyRotateFile({
                dirname: directory,
                filename: 'err-%DATE%.log',
                level: 'error',
                datePattern: pattern,
                zippedArchive: false,
                maxSize: '20m',
                maxFiles: '14d'

            })
        ]
    });

    const fmt = (msg, id) => {
        let str = id.padEnd(20,' ');
        return str.substr(0,20) + ':' + msg;
    };


    logger.transports[0].on('rotate', function (oldFilename, newFilename) {
        logger.error('rotating file: ', oldFilename)
    });
    /**
     logger.transports[1].on('rotate', function (oldFilename, newFilename) {
    logger.info('rotating file: ', oldFilename)
});
     **/
    const custom = (logger) => {
        return {
            info: function (msg, id) {
                logger.info(fmt(msg, id))
            },
            error: function (msg, id) {
                logger.error(fmt(msg, id))
            },
        }
    }
    module.exports.logger = custom(logger);

})();


