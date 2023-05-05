import 'reflect-metadata';
import {KafkaService} from '../services';
import {container} from 'tsyringe';
import {filter, tap} from 'rxjs';
import {File} from '../models';
import {finalize} from 'rxjs/operators';

const kafka = container.resolve(KafkaService);
const topic = {
    pub: 'edrm-files-zip',
    sub: 'edrm-files'
}

const final = () => {
    console.info('stopping...');
    if (cons) {
        cons.disconnect()
            .then(() => console.debug(`kafka ${topic.sub} consumer disconnected`));
    }
    if (prod) {
        prod.disconnect()
            .then(() => console.debug(`kafka ${topic.pub} producer disconnected`));
    }
};

process.once('SIGTERM', final);
process.once('SIGINT', final);


const [cons, drink$] = kafka.drink$<File>(topic.sub, 'stanley-zip-router');
const zip$ = drink$.pipe(
        filter(file => /^application\/zip/.test(file.contentType) ),
        tap(file => console.info(`routing ${file.name}`) ),
        finalize(final)
);

// zip$.subscribe(file => console.log(file.path));
const prod = kafka.publish(topic.pub, zip$);

