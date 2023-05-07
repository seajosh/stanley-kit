import {singleton} from 'tsyringe';
import {Consumer, EachMessageHandler, EachMessagePayload, Kafka, logLevel, Partitioners, Producer} from 'kafkajs';
import {SchemaRegistry} from '@kafkajs/confluent-schema-registry';
import {firstValueFrom, forkJoin, from, Observable, of, Subject, Subscription, tap} from 'rxjs';
import {finalize, mergeMap} from 'rxjs/operators';
import {ConfigService} from '../config.service';
import {DemolitionService} from '../process';

@singleton()
export class KafkaService {

    protected _kafka: Kafka;
    protected _schemas: SchemaRegistry;

    constructor(protected _config: ConfigService,
                protected _demo: DemolitionService) {
        const brokers =
                  this._config
                      .prop('kafka-brokers')
                      .split(';');

        this._kafka = new Kafka({
                                    brokers: brokers,
                                    logLevel: logLevel.INFO
                                });

        this._schemas = new SchemaRegistry({
                                               host: this._config.prop('schema-host')
                                           });
    }


    producer(): Producer {
        return this._kafka
                   .producer({
                       createPartitioner: Partitioners.DefaultPartitioner,
                       retry: {
                           retries: 1,
                           initialRetryTime: 100
                       }
                   });
    }

    consumer(groupId: string): Consumer {
        return this._kafka
                   .consumer({
                       groupId: groupId
                   });
    }


    topicSchema$(topic: string): Observable<number|void> {
        const promise =
                      this._schemas
                          .getLatestSchemaId(`${topic}-value`)
                          .catch(err => console.warn(`! ${topic}-value schema does not exist`));
        return from(promise);
    }


    publish<T>(topic: string, items$: Observable<T>) {
        const prod = this.producer();
        this._demo.register(() =>
            prod.disconnect().then(() => console.debug(`topic '${topic}' stopped publishing`))
        );

        forkJoin([
                     this.topicSchema$(topic),
                     prod.connect()
                 ])
            .subscribe(([schemaId]) => {
                items$.pipe(
                          mergeMap(item =>
                                       schemaId ? this._schemas.encode(schemaId, item)
                                                :of(JSON.stringify(item))
                          ),
                          mergeMap(datum =>
                                       prod.send({
                                                     topic: topic,
                                                     messages: [{value: datum}]
                                                 })
                          ),
                          finalize(() => {
                              prod.disconnect().then();
                          })
                      )
                      .subscribe({
                                     error: err => console.error(`kafka publish => ${err}`)
                                 });
            });

    }


    drink$<T>(topic: string, groupId: string): Subject<T> {
        const cons = this.consumer(groupId);
        this._demo.register(() =>
            cons.disconnect().then(() => console.debug(`topic '${topic}' unsubscribed`))
        );

        const sub$$ = new Subject<T>();

        const handler = async (payload: EachMessagePayload) => {
            of(payload)
                .pipe(
                    mergeMap(data => this._schemas.decode(data.message.value!),
                             2
                    )
                )
                .subscribe(data => {
                    sub$$.next(data as T);
                });
        };

        from(cons.connect())
            .pipe(
                mergeMap(() =>
                    cons.subscribe({
                                       topics: [topic],
                                       fromBeginning: true
                                   })
                ),
                mergeMap(() =>
                     cons.run({
                                  autoCommit: false,
                                  eachMessage: handler
                              })
                ),
            )
            .subscribe(() => {
                cons.seek({
                              topic: topic,
                              partition: 0,
                              offset: '0'
                          });
            });

        return sub$$;
    }

}
