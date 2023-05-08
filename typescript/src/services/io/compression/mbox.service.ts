import {Observable} from 'rxjs';
import {injectable} from 'tsyringe';
import {Stream} from 'stream';
import {MboxStream} from 'node-mbox';




@injectable()
export class MboxService {

    read$(stream: Stream): Observable<readonly [string, number]> {
        return new Observable(sub$$ => {
            const mbox = MboxStream(stream, {});
            let index = 0;

            mbox.on('error', (err: any) => sub$$.error(err));
            mbox.on('finish', () => sub$$.complete());

            mbox.on('data', (buff: Buffer) =>
                sub$$.next([buff.toString(), ++index] as const)
            );
        });
    }
}
