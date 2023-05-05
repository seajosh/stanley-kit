import {GridFSBucket, GridFSBucketReadStream, GridFSBucketWriteStream, MongoClient, ServerApiVersion} from 'mongodb';
import {from, iif, mergeMap, Observable, of, retry, switchMap, tap} from 'rxjs';
import {catchError, finalize, map} from 'rxjs/operators';
import * as fs from 'fs';
import {File} from '../../models/edrm/file.model';
import {Builder} from 'builder-pattern';
import path from 'path';
import ReadWriteStream = NodeJS.ReadWriteStream;
import iconv from 'iconv-lite';
// const {decodeStream, encodeStream} = iconv;

export class GridFsService {
    private _client =
        new MongoClient('mongodb://admin:password@localhost:37017',
                        {
                            appName: 'GridFs node service',
                            serverSelectionTimeoutMS: 1000,
                            serverApi: {
                                version: ServerApiVersion.v1,
                                strict: true,
                                deprecationErrors: true,
                            },
                            maxPoolSize: 10
                        });


    get connect$(): Observable<MongoClient|undefined> {
        return from(this._client.connect())
                .pipe(
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

    downloadStream$(file: File, encoding = ''): Observable<GridFSBucketReadStream|ReadWriteStream> {
        const stream$ = this.connect$
                            .pipe(
                                    map(client => {
                                        const bucket = new GridFSBucket(client!.db('edrm'));
                                        return bucket.openDownloadStreamByName(file.path);
                                    })
                            );

        const fixed$ = stream$.pipe(
                map(stream =>
                            stream.pipe(iconv.decodeStream(file.encoding))
                                  .pipe(iconv.encodeStream(encoding))
                )
        );

        const convert =
                      !!encoding &&
                      !!file.encoding &&
                      encoding.toUpperCase() !== file.encoding.toUpperCase();

        return convert ? fixed$ : stream$;
    }

}
