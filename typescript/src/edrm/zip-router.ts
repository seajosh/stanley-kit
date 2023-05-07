import 'reflect-metadata';
import {container} from 'tsyringe';
import {TopicGroup} from '../models';
import {ZipRouter} from '../services';


const router = container.resolve(ZipRouter);
router.run(new TopicGroup('edrm-files-zip', 'edrm-files'));
