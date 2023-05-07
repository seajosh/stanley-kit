import {DemolitionService} from '../../../process';
import {GridFsService} from '../../gridfs.service';
import {KafkaService} from '../../../kafka';
import {File, TopicGroup} from '../../../../models';
import {bindCallback, from, map, Observable, of, tap} from 'rxjs';
import {catchError, mergeMap, skip, take} from 'rxjs/operators';
import {ScratchService} from '../../scratch.service';
import {convertToHtml} from 'mammoth';
import {injectable} from 'tsyringe';
import WordExtractor from 'word-extractor';

@injectable()
export class DocxTransform {
    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _kafka: KafkaService,
                protected _scratch: ScratchService) {
    }


    read$(topic: TopicGroup): Observable<readonly [File, string|undefined]> {
        const files$ = this._kafka.drink$<File>(topic.sub,
                                                'stanley-docx-xform');

        const convertDoc$ = (file: File) => {
            const extractor = new WordExtractor();
            return from(extractor.extract(file.origin))
                .pipe(
                    catchError(err => {
                        console.error(`!!! ${file.origin} => ${err}`);
                        return of(undefined);
                    }),
                    map(doc => doc?.getBody() ),
                    map(text =>
                            [file, text] as const
                    )
                );
        };

        const convertDocx$ = (file: File) => {
            return from(convertToHtml({path: file.origin}))
                .pipe(
                    map(({value}) =>
                            [file, value as string|undefined] as const
                    )
                )
        };

        return files$.pipe(
            tap(file =>
                console.info(`docx xform => ${file.name}`)
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
            tap(([download, data]) =>
                console.log(data ?? 'undefined')
            )
        );
    }

    run(topic: TopicGroup) {
        this.read$(topic).subscribe();
    }


}
