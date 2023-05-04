import {GridFSBucket, GridFSBucketWriteStream, MongoClient, ServerApiVersion} from 'mongodb';
import {from, mergeMap, Observable, of, switchMap} from 'rxjs';
import {catchError, finalize, map} from 'rxjs/operators';
import * as fs from 'fs';
import {File} from '../../models/edrm/file.model';
import {Builder} from 'builder-pattern';
import path from 'path';

export class GridFsService {
    private _client =
        new MongoClient('mongodb://admin:password@localhost:37017',
                        {
                            serverSelectionTimeoutMS: 1000,
                            serverApi: {
                                version: ServerApiVersion.v1,
                                strict: true,
                                deprecationErrors: true,
                            }
                        });


    get connect$(): Observable<MongoClient|undefined> {
        return from(this._client.connect()).pipe(
            catchError(err => {
                console.error(`!! ${err}`);
                return of(undefined);
            }));
    }

    get disconnect$(): Observable<void> {
        return from(this._client.close());
    }

    uploadFile$(filePath: string, mask = ''): Observable<File> {
        const gridFsPath = mask ? filePath.replace(mask, '$/')
                                : filePath;

        return new Observable<File>(sub$ => {
            this.connect$
                .subscribe(client => {
                    if (!client) {
                        sub$.error('invalid MongoDB client');
                        return;
                    }
                    const bucket = new GridFSBucket(client.db('edrm'));
                    const file = fs.createReadStream(filePath);
                    file.on('error', err => {
                        sub$.error(err);
                    });

                    const gridfs = file.pipe(bucket.openUploadStream(gridFsPath,
                                                                     {
                                                                         chunkSizeBytes: 1 << 20,
                                                                     }));
                    gridfs.on('error', err => {
                        sub$.error(err);
                    });
                    gridfs.on('finish', () => {
                        const file = Builder<File>().name(path.basename(gridfs.filename))
                                                    .origin(filePath)
                                                    .path(gridfs.filename)
                                                    .size(gridfs.length)
                                                    .build();

                        sub$.next(file);
                        sub$.complete();
                    });
                });
        });

    }

    // downloadFile$(file: string) {
    //     return this.connect$
    //                .pipe(
    //                    map(client => {
    //                        return new GridFSBucket(client.db('edrm'));
    //                    }),
    //                    map(bucket => {
    //                        return bucket.openDownloadStreamByName(file);
    //                    }),
    //                );
    // }

}
