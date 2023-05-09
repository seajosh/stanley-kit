import {DemolitionService} from '../../../process';
import {GridFsService} from '../../gridfs.service';
import {KafkaService} from '../../../kafka';
import {File, Payload, TopicGroup} from '../../../../models';
import {bindCallback, from, map, Observable, of, tap} from 'rxjs';
import {catchError, mergeMap, skip, take} from 'rxjs/operators';
import {ScratchService} from '../../scratch.service';
import {convertToHtml} from 'mammoth';
import {injectable} from 'tsyringe';
import WordExtractor from 'word-extractor';
import {DefaultLogger} from '../../../logging';
import {Loggable} from '../../../loggable.abstract';
import {Builder} from 'builder-pattern';

@injectable()
export class DocxTransform extends Loggable {
    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _logger: DefaultLogger,
                protected _kafka: KafkaService,
                protected _scratch: ScratchService) {
        super(_logger);
    }


    read$(topic: TopicGroup): Observable<readonly [File, string]> {
        const files$ = this._kafka.drink$<File>(topic.sub,
                                                'stanley-docx-xform');

        const convertDoc$ = (file: File) => {
            const extractor = new WordExtractor();
            return from(extractor.extract(file.origin))
                .pipe(
                    catchError(err => {
                        this._log.error(`!!! ${file.origin} => ${err}`);
                        return of(undefined);
                    }),
                    map(doc => doc?.getBody() ),
                    map(text =>
                            [file, text || ''] as const
                    )
                );
        };

        const convertDocx$ = (file: File) => {
            return from(convertToHtml({path: file.origin}))
                .pipe(
                    map(({value}) =>
                            [file, value] as const
                    )
                )
        };

        return files$.pipe(
            tap(file =>
                this._log.info(`docx xform => ${file.name}`)
            ),
            mergeMap(file =>
                this._gridfs
                    .downloadFile$(file,
                                   this._scratch.create(file)),
                     2
            ),
            mergeMap( download =>
                          /application\/msword/.test(download.contentType) ? convertDoc$(download)
                                                                           : convertDocx$(download),
                      2
            ),
        );
    }

    run(topic: TopicGroup) {
        const upsert$ =
                  this.read$(topic)
                      .pipe(
                          map(([file, text]) => {
                              const dataFile = Builder<File>(file).size(text.length)
                                                                  .encoding('UTF-8')
                                                                  .build();
                              return [dataFile, text] as const;
                          }),
                          map(([dataFile, text]) =>
                              new Payload(dataFile, text)
                          )
                      );
        this._gridfs.upsertPayload('payloads', upsert$);

        // this.read$(topic).subscribe();
    }


}
