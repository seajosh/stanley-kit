import {File, TopicGroup} from '../../../../models';
import {KafkaService} from '../../../kafka';
import {DemolitionService} from '../../../process';
import {GridFsService} from '../../gridfs.service';
import {injectable} from 'tsyringe';
import {mergeMap, skip, take} from 'rxjs/operators';
import {finalize, from, map, Observable, tap} from 'rxjs';
import {XMLParser} from 'fast-xml-parser';
import streamToString from 'stream-to-string';
// const toString = import('stream-to-string');

@injectable()
export class XmlTransform {

    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _kafka: KafkaService) {
    }


    read$(topic: TopicGroup): Observable<readonly [File, any]> {
        const files$ = this._kafka.drink$<File>(topic.sub,
                                                'stanley-xml-xform');

        return files$.pipe(
            skip(2),
            take(1),
            tap(file =>
                    console.info(`xml xform => ${file.name}`)
            ),
            mergeMap(file =>
                         this._gridfs
                             .downloadStream$(file, 'UTF-8')
                             .pipe(
                                 map(stream => [file, stream] as const)
                             )
            ),
            mergeMap(([file, stream]) =>
                         from(streamToString(stream))
                             .pipe(
                                 map(xml => [file, xml as string] as const)
                             )
            ),
            map(([file, xml]) =>
                    [file, new XMLParser({

                                         }).parse(xml)] as const
            ),
        );

    }


    run(topic: TopicGroup) {
        this.read$(topic)
            .subscribe( ([file, obj]) =>
                console.info(JSON.stringify(obj))
            )
    }

}
