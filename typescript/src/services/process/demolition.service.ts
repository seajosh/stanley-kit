// type Demo = () => void;
import {singleton} from 'tsyringe';

@singleton()
export class DemolitionService {
    protected _registry: (() => void)[] = [];
    constructor() {
        process.once('SIGTERM', this.destroy.bind(this));
        process.once('SIGINT', this.destroy.bind(this));
    }

    register(demo: () => void) {
        this._registry.push(demo);
    }

    destroy() {
        console.info('destroying...');
        this._registry.forEach(demo => {
            demo();
        });
    }
}
