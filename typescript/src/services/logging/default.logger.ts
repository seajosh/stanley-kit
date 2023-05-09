import {injectable, singleton} from 'tsyringe';
import {createLogger, format, Logger, transports} from 'winston';
import colorize = format.colorize;
import combine = format.combine;
import timestamp = format.timestamp;
import printf = format.printf;
import label = format.label;


@singleton()
export class DefaultLogger {
    protected _log: Logger;

    constructor() {
        const consoleFormat = combine(
            label({
                      label: 'stanley',
                      message: false
                  }),
            colorize(),
            timestamp(),
            printf(info => {
                return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
            })
        );


        this._log = createLogger({
                                     level: 'debug',
                                     transports: [
                                         new transports.Console({
                                                                    format: consoleFormat
                                                                }),
                                         new transports.File({ filename: 'stanley.log' })
                                     ]
                                 });
    }

    get log() {
        return this._log;
    }

}
