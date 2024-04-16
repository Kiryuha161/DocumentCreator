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
    /* var responseErrorMessage = error.message;
    logger.error("Function Name: ".concat(functionName, " \n Message: ").concat(responseErrorMessage, " \n Stack: ").concat(error.stack)); */
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
    /* logger.info("Function Name: ".concat(functionName, " Message: ").concat(infoMessage)); */
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
    /* logger.warn("Function Name: ".concat(functionName, " Warning: ").concat(warnMessage)); */
    let logInfo = {
        timestamp: new Date(),
        functionName: functionName,
        level: 'warn',
        warning: warnMessage
    };
    logger.warn(JSON.stringify(logInfo));
};
module.exports.startLogger = function(startMessage, port) {
    var startInfo = {
        timestamp: new Date(),
        level: 'info',
        startMessage: startMessage, 
        port: port
    };

    logger.info(JSON.stringify(startInfo));
}
