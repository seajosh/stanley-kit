import {Logger} from 'winston';
import {DefaultLogger} from './logging';


export abstract class Loggable {
    protected _log: Logger;

    constructor(protected _logger: DefaultLogger) {
        this._log = this._logger.log;
    }
}
