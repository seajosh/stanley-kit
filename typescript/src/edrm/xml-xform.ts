import 'reflect-metadata';
import {container} from 'tsyringe';
import {XmlTransform} from '../services';
import {TopicGroup} from '../models';

const topic = new TopicGroup('', 'edrm-files-xml');
const xform = container.resolve(XmlTransform);
xform.run(topic);
