import {filter, Observable, pipe, tap} from 'rxjs';
import * as fs from 'fs';
import {catchError, map, mergeMap} from 'rxjs/operators';
import path from 'path';
import {GridFsService} from './gridfs.service';
import {autoInjectable} from 'tsyringe';
import {KafkaService} from '../kafka';
import {File} from '../../models';
import {contentType} from 'mime-types';
import {detectFileSync} from 'chardet';
import {Builder} from 'builder-pattern';


@autoInjectable()
export class FileLoaderService {
    constructor(protected _root: string,
                protected _mask = '',
                protected _kafka?: KafkaService,
                protected _gridfs?: GridFsService) {
    }


    get files$(): Observable<File> {
        return this.traverse$
                   .pipe(
                       filter(([folder, entry]) =>
                                  entry.isFile()
                       ),
                       map(([folder, entry]) =>
                               path.join(folder, entry.name)
                       ),
                       map(item =>
                               Builder<File>().name(path.basename(item))
                                              .origin(item)
                                              .build()
                       )
                   );
    }


    get load$(): Observable<File> {
        return this.files$
                   .pipe(
                       map(file => {
                           file.path = this._mask ? file.origin.replace(this._mask, '$/')
                                                  : file.origin;
                           return file;
                       }),
                       mergeMap(file => this._gridfs!.uploadFile$(file),
                                2),
                       catchError(err => {
                           console.error(`!! ${err.message}`);
                           throw err;
                       })
                   );
    }

    public static detectEncoding() {
        return pipe(
                map((file: File) => {
                    file.contentType = contentType(file.name) || 'application/unknown';
                    return file;
                }),
                map(file => {
                    file.encoding = detectFileSync(file.origin, {sampleSize: 64}) || '';
                    return file;
                })
        );
    }


    public run() {
        const transform$ =
                      this.load$
                          .pipe(
                              tap(file =>
                                  console.log(`upload complete: ${file.path}`)
                              ),
                              FileLoaderService.detectEncoding(),
                          );

        this._kafka!
            .publish<File>('edrm-files', transform$);
    }


    protected get traverse$(): Observable<readonly [string, fs.Dirent]> {

        return new Observable<readonly [string, fs.Dirent]>(sub$ => {
            const queue = [this._root];
            while (queue.length > 0) {
                const folder = queue.shift()!;
                const children = fs.readdirSync(folder, {withFileTypes: true});
                // process directories
                children.filter(entry => entry.isDirectory())
                        .forEach(entry => queue.push(path.join(folder, entry.name)));

                // process files
                children.filter(entry => entry.isFile())
                        .forEach(entry => sub$.next([folder, entry] as const))
            }
            sub$.complete();
        });

    }

}
