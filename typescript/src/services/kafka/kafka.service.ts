import {singleton} from 'tsyringe';
import {Consumer, EachMessageHandler, EachMessagePayload, Kafka, logLevel, Partitioners, Producer} from 'kafkajs';
import {SchemaRegistry} from '@kafkajs/confluent-schema-registry';
import {firstValueFrom, forkJoin, from, Observable, of, Subject, tap} from 'rxjs';
import {finalize, mergeMap} from 'rxjs/operators';

@singleton()
export class KafkaService {
    protected _kafka = new Kafka({
                                     brokers: ['localhost:29092'],
                                     logLevel: logLevel.INFO
                                 });

    protected _schemas = new SchemaRegistry({
                                                host: 'http://localhost:28081'
                                            });

    public constructor() {
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

        return forkJoin([
                     this.topicSchema$(topic),
                     prod.connect()
                ])
                .subscribe( ([schemaId]) => {
                    items$.pipe(
                              mergeMap(item =>
                                      schemaId ? this._schemas.encode(schemaId, item)
                                               : of(JSON.stringify(item))
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
        const subj$ = new Subject<T>();

        const handler = async (payload: EachMessagePayload) => {
            of(payload)
                .pipe(
                    mergeMap(data => this._schemas.decode(data.message.value!),
                             2
                    )
                )
                .subscribe(data => {
                    subj$.next(data as T);
                });
        };

        forkJoin([
                     cons.connect()
                 ])
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
                )
            )
            .subscribe(() => {
                cons.seek({
                              topic: topic,
                              partition: 0,
                              offset: '0'
                          });
            });

        return subj$;
    }

}
