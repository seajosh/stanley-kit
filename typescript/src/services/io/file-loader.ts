import {filter, Observable, tap} from 'rxjs';
import * as fs from 'fs';
import {catchError, finalize, map, mergeMap, take} from 'rxjs/operators';
import path from 'path';
import {GridFsService} from './gridfs.service';
import {autoInjectable} from 'tsyringe';
import {KafkaService} from '../kafka';
import {EdrmFile} from '../../models';
import {Builder} from 'builder-pattern';
import {contentType} from 'mime-types';

@autoInjectable()
export class FileLoader {
    constructor(protected _root: string,
                protected _mask = '',
                protected _kafka?: KafkaService) {}


    get files$(): Observable<string> {
        return this.traverse$
                   .pipe(
                       filter(([folder, entry]) => entry.isFile()),
                       map(([folder, entry]) => path.join(folder, entry.name))
                   );
    }


    get load$(): Observable<string> {
        const gridFs = new GridFsService();

        return this.files$
                   .pipe(
                       take(2),
                       mergeMap(file => gridFs.uploadFile$(file, this._mask),
                                2),
                       catchError(err => {
                           console.error(`!! ${err.message}`);
                           throw err;
                       }),
                       finalize(() => {
                           console.debug('load$ finalize');
                           gridFs.disconnect$.subscribe();
                       })
                   );
    }


    public run() {

        // const handler = {
        //     next: (tuple: any) => {
        //         const [file, ext] = tuple;
        //         console.log(`upload complete: ${file}`);
        //     },
        //     error: (err: any) => {
        //         console.error(`!! ${err.message}`);
        //     },
        //     complete: () => {
        //         // console.log('handler complete');
        //     }
        // };

        const transform$ =
                      this.load$
                          .pipe(
                              tap(filePath =>
                                      console.log(`upload complete: ${filePath}`)
                              ),
                              map(filePath => {
                                  const mimeType = contentType(filePath) || 'application/unknown';
                                  return Builder<EdrmFile>().path(filePath)
                                                            .name(path.basename(filePath))
                                                            .build();
                              })
                          );

        this._kafka!
            .publish<EdrmFile>('edrm-files', transform$);
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
