import {filter, from, Observable, Subject, tap} from 'rxjs';
import * as fs from 'fs';
import {map, mergeMap} from 'rxjs/operators';
import path from 'path';


export class FileLoader {
    private _root = '';
    private _nodes$ = new Subject<string>();

    constructor(path: string) {
        this._root = path;
    }


    get files$(): Observable<string> {
        return this.traverse$()
                   .pipe(
                       filter(([folder, entry]) => entry.isFile()),
                       map(([folder, entry]) => path.join(folder, entry.name))
                   );
    }

    get stats$(): Observable<readonly [string, fs.Stats]> {
        return this.traverse$()
                   .pipe(
                       map(([folder, entry]) =>
                           [path.join(folder, entry.name), entry] as const
                       ),
                       mergeMap(([file, entry]) =>
                           this.fileStats$(file)
                               .pipe(
                                   map(stat => [file, stat] as const)
                               )
                       )
                   );
    }


    list() {
        this._nodes$.next(this._root);
    }

    stats() {
        this._nodes$.next(this._root);
    }


    protected traverse$(): Observable<readonly [string, fs.Dirent]> {
        return this._nodes$.pipe(
            mergeMap(this.openDir$),
            mergeMap(dir =>
                         from(dir).pipe(
                             map(entry => [dir.path, entry] as const)
                         )
            ),
            tap(([folder, entry]) => {
                if (entry.isDirectory()) {
                    this._nodes$.next(path.join(folder, entry.name));
                }
            })
        );
    }


    protected openDir$(path: string): Observable<fs.Dir> {
        return new Observable((sub$ => {
            fs.opendir(path,
                       (err, dir) => {
                           if (err) {
                               return sub$.error(err);
                           }
                           sub$.next(dir);
                           sub$.complete();
                       });
        }));
    }


    protected fileStats$(path: string): Observable<fs.Stats> {
        return new Observable((sub$ => {
            fs.stat(path,
                    (err, stats) => {
                        if (err) {
                            return sub$.error(err);
                        }
                        sub$.next(stats);
                        sub$.complete();
                    });
        }));
    }
}
