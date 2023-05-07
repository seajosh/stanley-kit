import 'reflect-metadata';
import {container} from 'tsyringe';
import {ZipTransform} from '../services';
import {TopicGroup} from '../models';


const topic = new TopicGroup('edrm-files', 'edrm-files-zip');
const transform = container.resolve(ZipTransform);
// zipArchive.run(topic);
// transform.decompress$(topic)
//           .subscribe(([file, entry]) =>
//                          console.log(file)
//           );

transform.run(topic)
