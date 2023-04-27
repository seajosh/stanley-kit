import {RssEngine} from 'vcardz';
import {RxHR} from '@akanass/rx-http-request';
import {finalize, map, mergeMap, switchMap, toArray} from 'rxjs/operators';
import {forkJoin, from, of, Subject} from "rxjs";
import {Kafka, logLevel, Partitioners} from "kafkajs";
import {SchemaRegistry} from "@kafkajs/confluent-schema-registry";
import {NewsItem} from "../models";

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
        map(item => NewsItem.fromRss(item)),
        toArray()
    );

    private _kafka = new Kafka({
                                   brokers: ['localhost:29092'],
                                   logLevel: logLevel.NOTHING
                               });
    private _schemas = new SchemaRegistry({host: 'http://localhost:28081'});

    public done$ = new Subject<boolean>();

    run() {
        const producer = this._kafka.producer({
                                                  createPartitioner: Partitioners.DefaultPartitioner,
                                                  retry: {
                                                      retries: 1,
                                                      initialRetryTime: 100
                                                  }
                                              });
        const topic = 'news-stories';
        const topicSchema$ = this._schemas
                                 .getLatestSchemaId(`${topic}-value`)
                                 .catch(ex => console.warn(`! ${topic} value schema does not exist`));
        // this._schemas.getLatestSchemaId(`${topic}-value`),
        forkJoin([
                     this._rss$,
                     topicSchema$,
                     producer.connect()
                 ])
            .pipe(
                mergeMap(([items, schemaId]) =>
                             from([items[0]]).pipe(
                                 mergeMap(item =>
                                              (schemaId) ?
                                                  this._schemas.encode(schemaId, item) :
                                                  of(JSON.stringify(item))
                                 ),
                                 mergeMap(data =>
                                              producer.send({
                                                                topic: topic,
                                                                messages: [{value: data}]
                                                            })
                                 ),
                             )
                ),
                finalize(() => {
                    console.info('** disconnecting from Kafka');
                    producer.disconnect().then(() => this.done$.next(true));
                })
            )
            .subscribe({
                           // next: (resp) => console.info(`** ${resp}`),
                           error: (err) => console.error(`!! ${err}`)
                       });

    }
}


