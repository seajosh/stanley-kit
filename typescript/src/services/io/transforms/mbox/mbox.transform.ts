import {KafkaService} from '../../../kafka';
import {GridFsService} from '../../gridfs.service';
import {DemolitionService} from '../../../process';
import {injectable} from 'tsyringe';
import {File, TopicGroup} from '../../../../models';
import {map, Observable, tap} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {MboxService} from '../../compression';
import {Builder} from 'builder-pattern';
import path from 'path';
import {StreamsService} from '../../compression/streams.service';
import {Loggable} from '../../../loggable.abstract';
import {DefaultLogger} from '../../../logging';


@injectable()
export class MboxTransform extends Loggable {
    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _logger: DefaultLogger,
                protected _kafka: KafkaService,
                protected _mbox: MboxService,
                protected _streams: StreamsService) {
        super(_logger);
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
                                              const upload = Builder<File>().name(`${file.name}/${name}`)
                                                                            .path(path.join(file.path, name))
                                                                            .origin(path.join(file.origin, name))
                                                                            .contentType('message/rfc822')
                                                                            .size(file.size)
                                                                            .encoding('UTF-8')
                                                                            .build();

                                              return this._gridfs.uploadStream$(upload,
                                                                                this._streams.fromString(email));
                                          },
                                          2
                                ),
                                tap(file =>
                                    this._log.info(`email ${file.path} uploaded`)
                                )
                            );

        this._kafka.publish(topic.pub, upload$);
    }
}
