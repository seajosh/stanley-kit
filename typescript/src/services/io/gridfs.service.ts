import {GridFSBucket, GridFSBucketReadStream, MongoClient, ServerApiVersion} from 'mongodb';
import {from, Observable, of} from 'rxjs';
import {catchError, map, mergeMap} from 'rxjs/operators';
import * as fs from 'fs';
import {File, Payload} from '../../models';
import {Builder} from 'builder-pattern';
import iconv from 'iconv-lite';
import {DemolitionService} from '../process';
import {ConfigService} from '../config.service';
import {singleton} from 'tsyringe';
import {Readable} from 'stream';
import ReadWriteStream = NodeJS.ReadWriteStream;
import {Loggable} from '../loggable.abstract';
import {DefaultLogger} from '../logging';

@singleton()
export class GridFsService extends Loggable {
    private _db = 'edrm';
    private _dataCollection = 'payloads';

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

    constructor(protected _config: ConfigService,
                protected _logger: DefaultLogger,
                protected _demo: DemolitionService) {
        super(_logger);
        this._demo
            .register(() =>
                this.disconnect$.subscribe(() => this._log.debug(`gridfs disconnected`))
            );
    }


    get connect$(): Observable<MongoClient | undefined> {
        return from(this._client.connect())
            .pipe(
                catchError(err => {
                    this._log.error(`error connecting to MongoDB GridFS: ${err.message}`);
                    return of(undefined);
                }));
    }


    get disconnect$(): Observable<void> {
        return from(this._client.close());
    }


    uploadStream$(file: File, reader: Readable): Observable<File> {
        return new Observable<File>(sub$$ => {
            this.connect$
                .subscribe(client => {
                    if (!client) {
                        sub$$.error('invalid MongoDB client');
                        return;
                    }
                    reader.on('error', err => sub$$.error(err) );

                    const bucket = new GridFSBucket(client.db(this._db));
                    const writer = reader.pipe(bucket.openUploadStream(file.path,
                                                                       {
                                                                           chunkSizeBytes: 1 << 20,
                                                                       }));
                    writer.on('error', err => sub$$.error(err));
                    writer.on('finish', () => {
                        file.size = writer.length;
                        sub$$.next(file);
                        sub$$.complete();
                    })
                });
        });
    }

    uploadFile$(file: File): Observable<File> {
        const reader = fs.createReadStream(file.origin);
        return this.uploadStream$(file, reader);
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


    downloadFile$(file: File, target: File, encoding = ''): Observable<File> {
        return new Observable<File>(sub$ => {
            this.downloadStream$(file, encoding)
                .subscribe(stream => {
                    const write = stream.pipe(fs.createWriteStream(target.origin));

                    write.on('error',
                             err => sub$.error(err)
                    );

                    write.on('finish',
                             () => {
                                 const download =
                                               Builder<File>(file).origin(target.origin)
                                                                  .size(write.bytesWritten)
                                                                  .build();
                                 sub$.next(download);
                                 sub$.complete();
                             });
                });
        });

    }


    upsertPayload(collection: string, payloads$: Observable<Payload>) {
        this.connect$
            .subscribe(client => {
                if (!client) {
                    throw 'invalid MongoDB client';
                }
                payloads$.pipe(
                             mergeMap(payload =>
                                          from(client.db(this._db)
                                                     .collection(this._dataCollection)
                                                     .updateOne({'file.path': payload.file.path},
                                                                {$set: payload},
                                                                {
                                                                    upsert: true
                                                                }
                                                     )
                                          ).pipe(
                                              map(result => [payload, result] as const)
                                          ),
                                      8
                             )
                         )
                         .subscribe( ([payload, result]) => {
                             const docPath = `${this._db}.${this._dataCollection}.${payload.file.path}`;
                             const stats =
                                       [`ack: ${result.acknowledged}`,
                                        `matched: ${result.matchedCount}`,
                                        `modified: ${result.modifiedCount}`,
                                        `upserted: ${result.upsertedCount}`,
                                        `id: ${result.upsertedId}`
                                       ].join(' ');

                             this._log.info(`mongodb upsert ${docPath} => ${stats}`);
                         });
            });
    }


}
