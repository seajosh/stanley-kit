import {File} from '../../../models';
import {from, mergeMap, Observable, pipe} from 'rxjs';
import path from 'path';
import {mkdir} from 'fs/promises';
import {finalize, map} from 'rxjs/operators';
import streamZip, {ZipEntry} from 'node-stream-zip';
import {Builder} from 'builder-pattern';

export class ZipService {

    unzip$(file: File) {
        return new Observable<readonly [ZipEntry, File]>(sub$$ => {
            const archive =
                          path.basename(file.origin)
                              .replace('.zip', '');
            const dir =
                          path.join(path.dirname(file.origin), archive);

            const zip = new streamZip.async({file: file.origin});

            zip.on('extract',
                   (entry, dest) => {
                       const subpath = dest.split(archive)[1] || '$/?/';
                       const entryPath = path.join(file.path, subpath);

                       const temp =
                                     Builder<File>().name(path.basename(dest))
                                                    .origin(dest)
                                                    .path(entryPath)
                                                    .build();
                       sub$$.next([entry, temp] as const);
                   });

            from(mkdir(dir))
                .pipe(
                    mergeMap(() =>
                        zip.extract(null, dir)
                    ),
                    mergeMap(() =>
                        zip.close()
                    ),
                    finalize(() =>
                        sub$$.complete()
                    )
                )
                .subscribe();

        });
    }
}
