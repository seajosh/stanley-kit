import 'reflect-metadata';
import {GridFsService, KafkaService} from '../services';
import {container} from 'tsyringe';
import {File} from '../models';
import {catchError, finalize, map, mergeAll, mergeMap, skip, take, withLatestFrom} from 'rxjs/operators';
import {from, tap} from 'rxjs';
import {parse} from 'csv';
// import {decodeStream, encodeStream} from 'iconv-lite';



const kafka = container.resolve(KafkaService);
const gridfs = container.resolve(GridFsService);
const topic = {
    sub: 'edrm-files-csv'
}

const [cons, csv$] = kafka.drink$<File>(topic.sub, 'stanley-csv-xform');

const final = () => {
    cons.disconnect().then(() => console.debug(`kafka ${topic.sub} consumer disconnected`));
    gridfs.disconnect$.subscribe(() => console.debug('gridfs disconnected'));
};

process.once('SIGTERM', final);
process.once('SIGINT', final);

csv$.pipe(
        skip(1),
        take(1),
        tap(file =>
            console.info(`csv xform => ${file.name}`)
        ),
        mergeMap(file =>
            gridfs.downloadStream$(file, 'UTF-8')
                    .pipe(
                        map(stream => [stream, file] as const)
                    ),
            2
        ),
        map( ([stream, file]) =>
            [stream.pipe(parse({}) ), file] as const
        ),
        mergeMap(([parser, file]) =>
            from(parser)
                .pipe(
                    tap((rec: any[]) => rec.unshift(file.path))
                )
        ),
        catchError(err => {
            console.error(`!@!@: ${err}`);
            throw err;
        }),
        finalize(final)
    )
    .subscribe(record => {
        console.log(record);
    });
