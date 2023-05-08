import 'reflect-metadata';
import {container} from 'tsyringe';
import {TopicGroup} from '../models';
import {CsvRouter} from '../services/io/transforms/csv';


const topic = new TopicGroup('edrm-files-csv', 'edrm-files');
const router = container.resolve(CsvRouter);
router.run(topic);



