import {RssEngine} from 'vcardz';
import {RxHR} from '@akanass/rx-http-request';
import {concatMap, finalize, map, mergeMap, switchMap, tap, toArray} from 'rxjs/operators';
import {forkJoin, from} from "rxjs";
import {Kafka, Partitioners} from "kafkajs";
import {SchemaRegistry} from "@kafkajs/confluent-schema-registry";
import {NewsItem} from "../models";
import {subscribe} from "diagnostics_channel";

export class RssKafka {
    private _fetch$ =
        RxHR.get('https://rss.nytimes.com/services/xml/rss/nyt/US.xml')
            .pipe(
                map((response: any) => response.body as string)
            );

    private _rss$ = this._fetch$.pipe(
        switchMap(xml => {
            const engine = new RssEngine(xml);
            return from(engine.run());
        }),
        map(item => NewsItem.fromRss(item))
    );

    private _kafka = new Kafka({brokers: ['localhost:29092']});
    private _schemas = new SchemaRegistry({host: 'http://localhost:28081'});

    run() {
        const producer = this._kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
        console.log('starting up');

        forkJoin([this._schemas.getLatestSchemaId('news-stories-value'),
                 producer.connect()])
            .pipe(
                finalize(() => {
                    console.log('finalize called');
                    // producer.disconnect();
                })
            )
            .subscribe(response => {
                const [schemaId] = response;
                this._rss$
                    .pipe(
                        mergeMap(item => from(this._schemas.encode(schemaId, item)) ),
                        mergeMap(data => producer.send({
                                                           topic: 'news-stories',
                                                           messages: [{value: data}]
                                                       }) ),
                    )
                    .subscribe(records => console.log(records));
            });
    }
}

const rssKafka = new RssKafka();
rssKafka.run();







// console.log(schemaId);
//
// await producer.connect();
//
//
//
// process.once('SIGINT', producer.disconnect);

