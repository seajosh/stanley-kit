declare module 'node-mbox';
import {Transform} from 'stream';

/**
 * @class Class implements Transform stream. Transforming lines to messages as Buffers.
 *
 * @example fs.createReadStream(process.argv[2], {encoding: 'utf-8'}).pipe(split('\n'))
 * .pipe(new Mbox({encoding: "utf-8"})).on("data", function(data) {
 *   simpleParser(data, undefined, (err, parsed) => {
 *     if(err) {
 *       process.exit(-1);
 *     }
 *
 *     console.log("Attachment:> ", parsed.attachments);
 *   });
 * });
 */
export class Mbox extends Transform {
    /**
     *
     * @param {*} opts Options.
     * @param {Boolean} opts.includeMboxHeader Predicate if include header of Mbox entry i.e. 'From ... ...' or not.
     */
    constructor(opts: any);
    opts: any;
    firstLine: boolean;
    message: any[];
    messageCount: number;
    _transform(line: any, _: any, callback: any): void;
    _flush(cb: any): void;
}
/**
 * MboxStream simply pipes `split('\n')` with Mbox().
 *
 * @param {stream.Readable} readStream An instance of Readable stream.
 * @param {*} opts Params passed to Mbox.
 *
 * @returns {Mbox} An instance of Mbox stream.
 */
export function MboxStream(inputStream: any, opts: any): Mbox;
/**
 * @class
 *
 * MboxStreamConsumer is simple abstract class extending Writable.
 * You must implement consume method which consumes particural messages.
 *
 * @example fs.createReadStream().pipe(MboxStream()).pipe((new MboxStreamConsumer()).consume = function(message, encoding, cb){
 *    console.log(message);
 *    setImmediate(cb);
 *  }).on("finish", cb);
 */
export class MboxStreamConsumer {
    constructor(opts: any);
    /**
     *
     * @param {Buffer} message
     * @param {BufferEncoding} encoding
     * @param {callback} cb Async callback of form ([err]) => {}.
     */
    consume(message: Buffer, encoding: BufferEncoding, cb: callback): void;
    _write(message: any, encoding: any, cb: any): void;
}
