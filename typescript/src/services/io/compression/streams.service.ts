import {Observable} from 'rxjs';
import iconv from 'iconv-lite';
import {Readable} from 'stream';
import {injectable} from 'tsyringe';
import ReadWriteStream = NodeJS.ReadWriteStream;

@injectable()
export class StreamsService {

    constructor() {
    }

    toString$(reader: Readable|ReadWriteStream, fromEncoding = 'utf-8', toEncoding = 'utf-8'): Observable<string> {
        const chunks = [] as Buffer[];

        const convert = fromEncoding.toUpperCase() !== toEncoding.toUpperCase();
        const stream = convert ?
                       reader.pipe(iconv.decodeStream(fromEncoding))
                             .pipe(iconv.encodeStream(toEncoding)) :
                       reader;

        return new Observable<string>(sub$$ => {
            stream.on('data',
                      chunk => chunks.push(Buffer.from(chunk))
            );
            stream.on('error',
                      err => sub$$.error(err)
            );
            stream.on('end',
                      () => {
                          sub$$.next(Buffer.concat(chunks).toString());
                      })
        });
    }


    fromString(value: string): Readable {
        const reader = new Readable();
        reader.push(value);
        reader.push(null);
        return reader;
    }

}
