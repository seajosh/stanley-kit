import 'reflect-metadata';
import {container} from 'tsyringe';
import {KafkaInitService} from '../services';

const kafkaInit = container.resolve(KafkaInitService);
await kafkaInit.init();
