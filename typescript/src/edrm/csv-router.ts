import 'reflect-metadata';
import {KafkaService} from '../services';
import {container} from 'tsyringe';
import {filter, tap} from 'rxjs';
import {File} from '../models';

const kafka = container.resolve(KafkaService);
const topic = {
    pub: 'edrm-files-csv',
    sub: 'edrm-files'
}

const [cons, drink$] = kafka.drink$<File>(topic.sub, 'stanley-csv');
const csv$ = drink$.pipe(
        filter(file => /^text\/csv/.test(file.contentType) ),
        tap(file => console.log(file) )
);

kafka.publish(topic.pub, csv$);

