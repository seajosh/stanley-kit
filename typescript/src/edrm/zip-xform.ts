import 'reflect-metadata';
import {
    DemolitionService, FileLoader, GridFsService, KafkaService, ScratchService, ZipArchiveService, ZipService
} from '../services';
import {container} from 'tsyringe';
import {File, Formatters, TopicGroup} from '../models';
import {finalize, map, mergeMap, skip, take} from 'rxjs/operators';
import {of, tap} from 'rxjs';

const topic = new TopicGroup('edrm-files', 'edrm-files-zip');
const zipArchive = container.resolve(ZipArchiveService);
// zipArchive.run(topic);
zipArchive.decompress$(topic)
          .subscribe(([entry, file]) =>
                         console.log(file)
          );
