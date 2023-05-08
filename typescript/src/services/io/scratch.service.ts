import {File} from '../../models';
import {Builder} from 'builder-pattern';
import path from 'path';
import {injectable} from 'tsyringe';
import {range} from 'rxjs';

export class ScratchService {
    constructor(protected temp = '/tmp/stanley') {}

    prefix(): string {
        return [...Array(10).keys()]
                             .map(() => Math.floor(Math.random() * 10))
                             .join('');
    }

    create(file: File): File {
        const rando =
                      [...Array(10).keys()]
                              .map(() => Math.floor(Math.random() * 10))
                              .join('');

        const origin = path.join(this.temp, `${rando}-${file.name}`);

        return Builder<File>().name(file.name)
                              .path(file.path)
                              .origin(origin)
                              .build();
    }




}
