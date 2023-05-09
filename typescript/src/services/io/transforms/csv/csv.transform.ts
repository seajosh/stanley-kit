import {GridFsService} from '../../gridfs.service';
import {KafkaService} from '../../../kafka';
import {injectable} from 'tsyringe';
import {File, Payload, TopicGroup} from '../../../../models';
import {from, map, Observable, tap} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {parse} from 'csv';
import {Builder} from 'builder-pattern';
import path from 'path';
import {DefaultLogger} from '../../../logging';
import {Loggable} from '../../../loggable.abstract';


@injectable()
export class CsvTransform extends Loggable {
    constructor(protected _gridfs: GridFsService,
                protected _logger: DefaultLogger,
                protected _kafka: KafkaService) {
        super(_logger);
    }


    read$(topic: TopicGroup): Observable<readonly [File, any[]]> {
        const files$ = this._kafka
                           .drink$<File>(topic.sub,
                                         'stanley-csv-xform');

        return files$.pipe(
            tap(file =>
                this._log.info(`csv xform => ${file.name}`)
            ),
            mergeMap(file =>
                this._gridfs
                    .downloadStream$(file, 'UTF-8')
                    .pipe(
                        map(stream => [file, stream] as const)
                    )
            ),
            map( ([file, stream]) =>
                [file, stream.pipe(parse({}))] as const
            ),
            mergeMap( ([file, parser]) =>
                from(parser).pipe(
                    map( (record: any[]) => {
                        record.unshift(file.path);
                        return [file, record] as const;
                    })
                )
            )
        );
    }


    run(topic: TopicGroup) {
        const upsert$ =
                  this.read$(topic)
                      .pipe(
                          map(([file, record]) => {
                              const name = record[1] as string;
                              const recordFile = Builder<File>(file).name(`${file.name}/${name}`)
                                                                    .path(path.join(file.path, name))
                                                                    .origin(path.join(file.origin, name))
                                                                    .size(0)
                                                                    .encoding('UTF-8')
                                                                    .build();
                              return [recordFile, record] as const;
                          }),
                          map(([recordFile, record]) => {
                              // convert an array to an object
                              const obj = [...record.keys()].map(i =>
                                                                     [i.toString(), record[i]] as const
                                                            )
                                                            .reduce((target: any, [key, val]) => {
                                                                        target[key] = val;
                                                                        return target;
                                                                    },
                                                                    {});
                              return [recordFile, obj] as const;
                          }),
                          map(([recordFile, obj]) =>
                                  new Payload(recordFile, obj)
                          ),
                          tap(payload =>
                                  this._log.info(`saving ${payload.file.path}...`)
                          )
                      );

        this._gridfs.upsertPayload('payloads', upsert$);

    }
}
