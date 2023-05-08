import {GridFsService} from '../../gridfs.service';
import {KafkaService} from '../../../kafka';
import {injectable} from 'tsyringe';
import {File, TopicGroup} from '../../../../models';
import {from, map, Observable, tap} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {parse} from 'csv';


@injectable()
export class CsvTransform {
    constructor(protected _gridfs: GridFsService,
                protected _kafka: KafkaService) {
    }


    read$(topic: TopicGroup): Observable<readonly [File, any[]]> {
        const files$ = this._kafka
                           .drink$<File>(topic.sub,
                                         'stanley-csv-xform');

        return files$.pipe(
            tap(file =>
                console.info(`csv xform => ${file.name}`)
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
        this.read$(topic)
            .subscribe( ([file, record]) => {
                console.info(record);
            });
    }
}
