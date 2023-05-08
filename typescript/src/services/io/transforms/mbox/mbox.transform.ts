import {ScratchService} from '../../scratch.service';
import {KafkaService} from '../../../kafka';
import {GridFsService} from '../../gridfs.service';
import {DemolitionService} from '../../../process';
import {injectable} from 'tsyringe';
import {File, TopicGroup} from '../../../../models';
import {map, Observable, tap} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {MboxService} from '../../compression';
import {Readable} from 'stream';
import {Builder} from 'builder-pattern';
import path from 'path';
import * as console from 'console';

@injectable()
export class MboxTransform {
    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _kafka: KafkaService,
                protected _mbox: MboxService,
                protected _scratch: ScratchService) {
    }


    read$(topic: TopicGroup): Observable<readonly [File, string, number]> {
        const files$ = this._kafka.drink$<File>(topic.sub,
                                                'stanley-zip-xform');

        return files$.pipe(
            mergeMap(file =>
                         this._gridfs.downloadStream$(file, 'UTF-8')
                             .pipe(
                                 map(stream => [file, stream] as const)
                             )
            ),
            mergeMap(([file, stream]) =>
                         this._mbox.read$(stream)
                             .pipe(
                                 map(([email, index]) => [file, email, index] as const)
                             )
            ),

        );
    }


    run(topic: TopicGroup) {
        const upload$ = this.read$(topic)
                            .pipe(
                                mergeMap( ([file, email, index]) => {
                                              const name = `${index}.eml`;
                                              const upload = Builder<File>().name(name)
                                                                            .path(path.join(file.path, name))
                                                                            .origin(path.join(file.origin, name))
                                                                            .contentType('message/rfc822')
                                                                            .size(file.size)
                                                                            .encoding('UTF-8')
                                                                            .build();

                                              const reader = new Readable
                                              reader.push(email);
                                              reader.push(null);

                                              return this._gridfs.uploadStream$(upload, reader);
                                          },
                                          2
                                ),
                                tap(file =>
                                    console.info(`email ${file.path} uploaded`)
                                )
                            );

        this._kafka.publish(topic.pub, upload$);
    }
}
