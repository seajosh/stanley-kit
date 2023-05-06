import 'reflect-metadata';
import {container} from 'tsyringe';
import {XmlRouterService} from '../services';
import {TopicGroup} from '../models';

const router = container.resolve(XmlRouterService);
router.run(new TopicGroup('edrm-files-xml', 'edrm-files'));
