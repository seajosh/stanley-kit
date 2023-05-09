import 'reflect-metadata';
import {container} from 'tsyringe';
import {EmailRouter} from '../services';
import {TopicGroup} from '../models';


const router = container.resolve(EmailRouter);
router.run(new TopicGroup('edrm-files-email', 'edrm-files'));
