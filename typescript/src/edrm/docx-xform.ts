import 'reflect-metadata';
import {container} from 'tsyringe';
import {TopicGroup} from '../models';
import {DocxTransform} from '../services';


const topic = new TopicGroup('', 'edrm-files-docx');
const transform = container.resolve(DocxTransform);
// zipArchive.run(topic);
// transform.decompress$(topic)
//           .subscribe(([file, entry]) =>
//                          console.log(file)
//           );

transform.run(topic)
