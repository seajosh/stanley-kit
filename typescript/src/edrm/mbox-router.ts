import 'reflect-metadata';
import {container} from 'tsyringe';
import {TopicGroup} from '../models';
import {DocxRouter, MboxRouter} from '../services';


const router = container.resolve(MboxRouter);
router.run(new TopicGroup('edrm-files-mbox', 'edrm-files'));
