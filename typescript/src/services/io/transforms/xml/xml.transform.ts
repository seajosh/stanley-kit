import {File, Payload, TopicGroup} from '../../../../models';
import {KafkaService} from '../../../kafka';
import {DemolitionService} from '../../../process';
import {GridFsService} from '../../gridfs.service';
import {injectable} from 'tsyringe';
import {mergeMap} from 'rxjs/operators';
import {from, map, Observable, tap} from 'rxjs';
import {XMLParser} from 'fast-xml-parser';
import streamToString from 'stream-to-string';
import {Loggable} from '../../../loggable.abstract';
import {DefaultLogger} from '../../../logging';
import {StreamsService} from '../../compression/streams.service';
import {Builder} from 'builder-pattern';


@injectable()
export class XmlTransform extends Loggable {

    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _logger: DefaultLogger,
                protected _kafka: KafkaService,
                protected _streams: StreamsService) {
        super(_logger);
    }


    read$(topic: TopicGroup): Observable<readonly [File, any]> {
        const files$ = this._kafka.drink$<File>(topic.sub,
                                                'stanley-xml-xform');

        return files$.pipe(
            tap(file =>
                    this._log.info(`xml xform => ${file.name}`)
            ),
            mergeMap(file =>
                         this._gridfs
                             .downloadStream$(file, 'UTF-8')
                             .pipe(
                                 map(stream => [file, stream] as const)
                             )
            ),
            mergeMap(([file, stream]) =>
                this._streams.toString$(stream)
                             .pipe(
                                 map(xml => [file, xml] as const)
                             )
            ),
            map(([file, xml]) =>
                    [file, new XMLParser({}).parse(xml)] as const
            ),
        );

    }


    run(topic: TopicGroup) {
        const upsert$ =
                  this.read$(topic)
                      .pipe(
                          map(([file, xml]) => {
                              const clone = Builder<File>(file).size(xml.length)
                                                               .encoding('UTF-8')
                                                               .build();
                              return [clone, xml] as const;
                          }),
                          map(([clone, xml]) =>
                              new Payload(clone, xml)
                          )
                      );
        this._gridfs.upsertPayload('payloads', upsert$);

        // this.read$(topic)
        //     .subscribe( ([file, obj]) =>
        //         this._log.info(JSON.stringify(obj))
        //         // console.info(JSON.stringify(obj))
        //     )
    }

}
