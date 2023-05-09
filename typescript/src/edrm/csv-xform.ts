import 'reflect-metadata';
import {CsvTransform} from '../services';
import {container} from 'tsyringe';
import {TopicGroup} from '../models';


const topic = new TopicGroup('', 'edrm-files-csv');
const transform = container.resolve(CsvTransform);
transform.run(topic);
