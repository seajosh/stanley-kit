


import {injectable} from 'tsyringe';
import {distinct, finalize, map, mergeMap, Observable, of, tap} from 'rxjs';

import {ZipEntry} from 'node-stream-zip';
import {DemolitionService} from '../../../process';
import {GridFsService} from '../../gridfs.service';
import {KafkaService} from '../../../kafka';
import {ScratchService} from '../../scratch.service';
import {ZipService} from '../../compression';
import {File, Formatters, TopicGroup} from '../../../../models';
import {FileLoader} from '../../file-loader';


@injectable()
export class ZipTransform {
    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _kafka: KafkaService,
                protected _scratch: ScratchService,
                protected _zip: ZipService) {
    }

    decompress$(topic: TopicGroup): Observable<readonly [File, ZipEntry]> {
        const compact = Formatters.compact.format;

        const files$ = this._kafka.drink$<File>(topic.sub,
                                                'stanley-zip-xform');

        return files$.pipe(
            distinct(file => file.path),
            tap(file =>
                    console.info(`decompress$ => ${file.name} (${compact(file.size)})`)
            ),
            mergeMap(file =>
                         this._gridfs.downloadFile$(file,
                                                    this._scratch.create(file))
            ),
            tap(download =>
                    console.info(`decompress$ download => ${download.name} (${compact(download.size)}) @ ${download.origin}`)
            ),
            mergeMap(download =>
                         this._zip.unzip$(download)
            ),
            mergeMap(([entry, zipFile]) =>
                         of(zipFile).pipe(
                             FileLoader.detectEncoding(),
                             map(zipFile => [zipFile, entry] as const)
                         )
            ),
            finalize(() => this._demo.destroy())
        )
    }


    run(topic: TopicGroup) {
        const upload$ = this.decompress$(topic)
                            .pipe(
                                mergeMap(([file, entry]) =>
                                             this._gridfs.uploadFile$(file),
                                         2
                                ),
                                tap(upload =>
                                    console.info(`zip transform upload => ${upload.path} (${Formatters.compact.format(upload.size)})`)
                                )

                            );

        // upload$.subscribe();

        this._kafka.publish(topic.pub, upload$);
    }

}
