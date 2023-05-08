import 'reflect-metadata';
import {TopicGroup} from '../models';
import {container} from 'tsyringe';
import {EmailTransform} from '../services';

const topic = new TopicGroup('', 'edrm-files-email');
const attachmentTopic = new TopicGroup('edrm-files', '');
const transform = container.resolve(EmailTransform);
transform.run(topic, attachmentTopic);
