import 'reflect-metadata';
import {DemolitionService, FileLoader, GridFsService, KafkaService, ScratchService, ZipService} from '../services';
import {container} from 'tsyringe';
import {File, Formatters} from '../models';
import {finalize, map, mergeMap, take} from 'rxjs/operators';
import {of, tap} from 'rxjs';


const demo = container.resolve(DemolitionService);
const scratch = container.resolve(ScratchService);
const kafka = container.resolve(KafkaService);
const gridfs = container.resolve(GridFsService);
const zip = container.resolve(ZipService);
const compact = Formatters.compact;
const topic = {
    sub: 'edrm-files-zip'
}

const [cons, zip$] = kafka.drink$<File>(topic.sub, 'stanley-zip-xform');

demo.register(() =>
                  cons.disconnect()
                      .then(() => console.debug(`kafka ${topic.sub} consumer disconnected`) )
);
demo.register(() =>
                  gridfs.disconnect$
                        .subscribe(() => console.debug(`gridfs disconnected`))
);


zip$.pipe(
        take(1),
        tap(file =>
            console.info(`zip xform => ${file.name} (${compact.format(file.size)})`)
        ),
        mergeMap(file =>
            gridfs.downloadFile$(file, scratch.create(file))
        ),
        tap(download => {
            console.log(`downloaded ${download.name} (${compact.format(download.size)}) @ ${download.origin}`)
        }),
        mergeMap(download =>
            zip.unzip$(download)
        ),
        mergeMap(([entry, balloon]) =>
            of(balloon).pipe(
                    FileLoader.detectEncoding(),
                    map(_balloon => [entry, _balloon] as const)
            )
        ),
        finalize(() => demo.destroy())
    )
    .subscribe(([entry, balloon]) => {
        // console.log(`extracted ${file.path}`);
        console.log(balloon);
    })
