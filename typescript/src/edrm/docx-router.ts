import 'reflect-metadata';
import {container} from 'tsyringe';
import {TopicGroup} from '../models';
import {DocxRouter} from '../services';


const router = container.resolve(DocxRouter);
router.run(new TopicGroup('edrm-files-docx', 'edrm-files'));
