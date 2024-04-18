var _a = require('log4js'), getLogger = _a.getLogger, configure = _a.configure;

configure({
    appenders: {
        console: { type: "console" }
    },
    categories: {
        default: {
            appenders: ["console"],
            level: 'all'
        }
    }
});

var logger = getLogger();

module.exports.errorLogger = function (error, functionName) {
    let logInfo = {
        timestamp: new Date(),
        functionName: functionName,
        level: 'error',
        errorMessage: error.message,
        stackTrace: error.stack
    };
    logger.error(JSON.stringify(logInfo));
};
module.exports.infoLogger = function (infoMessage, functionName, userName) {
    let logInfo = {
        timestamp: new Date(),
        functionName: functionName,
        level: 'info',
        message: infoMessage,
        userName: userName
    };
    logger.info(JSON.stringify(logInfo));

};
module.exports.warnLogger = function (warnMessage, functionName) {
    let logInfo = {
        timestamp: new Date(),
        functionName: functionName,
        level: 'warn',
        warning: warnMessage
    };
    logger.warn(JSON.stringify(logInfo));
};
module.exports.startLogger = function(startMessage, port) {
    let startInfo = {
        timestamp: new Date(),
        level: 'info',
        message: startMessage, 
        port: port
    };

    logger.info(JSON.stringify(startInfo));
}
