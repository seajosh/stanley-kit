import {singleton} from 'tsyringe';
import {Kafka, logLevel, Partitioners, Producer} from 'kafkajs';
import {SchemaRegistry} from '@kafkajs/confluent-schema-registry';
import {forkJoin, from, Observable, of, tap, zip} from 'rxjs';
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
        return this._kafka.producer({
                                 createPartitioner: Partitioners.DefaultPartitioner,
                                 retry: {
                                     retries: 1,
                                     initialRetryTime: 100
                                 }
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

}
