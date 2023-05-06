import {DemolitionService} from '../../process';
import {FileLoader} from '../file-loader';
import {KafkaService} from '../../kafka';
import {GridFsService} from '../gridfs.service';
import {File, Formatters, TopicGroup} from '../../../models';
import {ScratchService} from '../scratch.service';
import {ZipService} from './zip.service';

import {injectable} from 'tsyringe';
import {distinct, finalize, map, mergeMap, Observable, of, tap} from 'rxjs';

import {ZipEntry} from 'node-stream-zip';


@injectable()
export class ZipArchiveService {
    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _kafka: KafkaService,
                protected _scratch: ScratchService,
                protected _zip: ZipService) {
        this._demo.register(() =>
                                this._gridfs.disconnect$.subscribe(() => console.info('gridfs disconnected'))
        );
    }

    decompress$(topic: TopicGroup): Observable<readonly [ZipEntry, File]> {
        const compact = Formatters.compact.format;
        const [cons, zip$] =
                  this._kafka.drink$<File>(topic.sub,
                                           'stanley-zip-xform');

        this._demo.register(() =>
                                cons.disconnect().then(() => `kafka ${topic.sub} topic disconnected`)
        )

        return zip$.pipe(
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
            mergeMap(([entry, balloon]) =>
                         of(balloon).pipe(
                             FileLoader.detectEncoding(),
                             map(_balloon => [entry, _balloon] as const)
                         )
            ),
            finalize(() => this._demo.destroy())
        )
    }


    run(topic: TopicGroup) {
        const prod =
                  this._kafka.publish(topic.pub,
                                      this.decompress$(topic)
                                          .pipe(
                                              map(([entry, file]) => file)
                                          ));

        this._demo.register(() =>
                                prod.disconnect().then(() => console.log(`kafka ${topic.pub} disconnected`))
        );
    }

}
