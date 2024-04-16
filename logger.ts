const { getLogger, configure } = require('log4js');

configure(
    {
        appenders: {          
            console: { type: "console" }
        },
        categories: {
            default: {
                appenders: ["console"],
                level: 'all'

            }
        }
    }
);

const logger = getLogger();

module.exports.errorLogger = (error: Error, functionName:string)=>{

    let responseErrorMessage = error.message;
    logger.error(`Function Name: ${functionName} \n Message: ${responseErrorMessage} \n Stack: ${error.stack}`)

}

module.exports.infoLogger = (infoMessage: string, functionName:string)=>{

    logger.info(`Function Name: ${functionName} Message: ${infoMessage}`);

}

module.exports.warnLogger = (warnMessage: string, functionName:string)=>{

    logger.warn(`Function Name: ${functionName} Warning: ${warnMessage}`);    

}
