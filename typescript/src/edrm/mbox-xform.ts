import 'reflect-metadata';
import {TopicGroup} from '../models';
import {container} from 'tsyringe';
import {MboxTransform} from '../services';

const topic = new TopicGroup('edrm-files', 'edrm-files-mbox');
const transform = container.resolve(MboxTransform)
transform.run(topic);
