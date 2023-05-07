import 'reflect-metadata';
import {container} from 'tsyringe';
import {XmlRouter} from '../services';
import {TopicGroup} from '../models';

const router = container.resolve(XmlRouter);
router.run(new TopicGroup('edrm-files-xml', 'edrm-files'));
