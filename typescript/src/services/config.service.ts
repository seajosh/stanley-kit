import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import {singleton} from 'tsyringe';

@singleton()
export class ConfigService {
    protected _map = new Map<string, string>();

    constructor() {
        dotenv.config();
        this._map.set('kafka-brokers', process.env.STANLEY_KAFKA_BROKERS || 'error');
        this._map.set('schema-host', process.env.STANLEY_SCHEMA_HOST || 'error');
        this._map.set('gridfs-connect', process.env.STANLEY_GRIDFS_CONNECT || 'error');
    }


    prop(key: string): string {
        return this._map.get(key) || '';
    }
}
