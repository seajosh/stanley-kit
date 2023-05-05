import 'reflect-metadata';
import {GridFsService, KafkaService} from '../services';
import {container} from 'tsyringe';
import {File} from '../models';
import {catchError, finalize, map, mergeAll, mergeMap, skip, take, withLatestFrom} from 'rxjs/operators';
import {from, fromEvent, tap} from 'rxjs';
import unzip from 'unzip-stream';
import {Transform} from 'stream';

const kafka = container.resolve(KafkaService);
const gridfs = container.resolve(GridFsService);
const topic = {
    sub: 'edrm-files-zip'
}

const [cons, zip$] = kafka.drink$<File>(topic.sub, 'stanley-zip-xform');

const final = () => {
    console.info('stopping...');
    if (cons) {
        cons.disconnect()
            .then(() => console.debug(`kafka ${topic.sub} consumer disconnected`));
    }
    // if (prod) {
    //     prod.disconnect()
    //         .then(() => console.debug(`kafka ${topic.pub} producer disconnected`));
    // }
};

process.once('SIGTERM', final);
process.once('SIGINT', final);

zip$.pipe(
        take(1),
        tap(file =>
            console.info(`zip xform => ${file.name}`)
        ),
        mergeMap(file =>
            gridfs.downloadStream$(file)
                  .pipe(
                      map(stream => [stream, file] as const)
                  )
        ),
        mergeMap(([stream, file]) =>
                 fromEvent(stream.pipe(unzip.Parse()), 'entry')
                 // stream.pipe(unzip.Parse())
                  // .pipe(new Transform({
                  //                         objectMode: true,
                  //                         transform: (entry, err, cb) => {
                  //                             console.log(entry.path);
                  //                             entry.autodrain();
                  //                             cb();
                  //                         }
                  //                     }))
        ),

        finalize(final)
    )
    .subscribe(foo => {

    });
