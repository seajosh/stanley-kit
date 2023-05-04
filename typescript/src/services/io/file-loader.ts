import {expand, filter, from, Observable, of, Subject, tap} from 'rxjs';
import * as fs from 'fs';
import {catchError, finalize, map, mergeMap, take} from 'rxjs/operators';
import path from 'path';
import {GridFsService} from './gridfs.service';


export class FileLoader {
    private _root = '';
    private _mask = '';

    constructor(path: string, mask = '') {
        this._root = path;
        this._mask = mask;
    }


    get files$(): Observable<string> {
        return this.traverse$
                   .pipe(
                       filter(([folder, entry]) => entry.isFile()),
                       map(([folder, entry]) => path.join(folder, entry.name))
                   );
    }

    x
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
        const handler = {
            next: (tuple: any) => {
                const [file, ext] = tuple;
                console.log(`upload complete: ${file}`);
            },
            error: (err: any) => {
                console.error(`!! ${err.message}`);
            },
            complete: () => {
                // console.log('handler complete');
            }
        };

        this.load$
            .pipe(
                map(file => [file, path.extname(file)] as const),
                tap(([file, ext]) => console.log(`found ${ext} file`))
            )
            .subscribe(handler);

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
