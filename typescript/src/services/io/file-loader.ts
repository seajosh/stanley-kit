import {filter, Observable, tap} from 'rxjs';
import * as fs from 'fs';
import {catchError, finalize, map, mergeMap, take} from 'rxjs/operators';
import path from 'path';
import {GridFsService} from './gridfs.service';
import {autoInjectable} from 'tsyringe';
import {KafkaService} from '../kafka';
import {File} from '../../models';
import {contentType} from 'mime-types';
import {detectFile, detectFileSync} from 'chardet';


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


    get load$(): Observable<File> {
        const gridFs = new GridFsService();

        return this.files$
                   .pipe(
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
        const transform$ =
                      this.load$
                          .pipe(
                              tap(file =>
                                  console.log(`upload complete: ${file.path}`)
                              ),
                              map(file => {
                                  file.contentType = contentType(file.name) || 'application/unknown';
                                  return file;
                              }),
                              map(file => {
                                  file.encoding = detectFileSync(file.origin) || '';
                                  return file;
                              })
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
