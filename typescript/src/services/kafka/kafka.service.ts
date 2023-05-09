import {singleton} from 'tsyringe';
import {Consumer, EachMessagePayload, Kafka, LogEntry, logLevel, Partitioners, Producer} from 'kafkajs';
import {SchemaRegistry} from '@kafkajs/confluent-schema-registry';
import {forkJoin, from, Observable, of, Subject} from 'rxjs';
import {finalize, mergeMap} from 'rxjs/operators';
import {ConfigService} from '../config.service';
import {DemolitionService} from '../process';
import {DefaultLogger} from '../logging';
import {Loggable} from '../loggable.abstract';
import {format} from 'logform';
import {createLogger, transports} from 'winston';
import printf = format.printf;
import colorize = format.colorize;
import label = format.label;
import combine = format.combine;


@singleton()
export class KafkaService extends Loggable {

    protected _kafka: Kafka;
    protected _schemas: SchemaRegistry;

    constructor(protected _config: ConfigService,
                protected _demo: DemolitionService,
                protected _logger: DefaultLogger) {
        super(_logger);
        const brokers =
                  this._config
                      .prop('kafka-brokers')
                      .split(';');



        // const logCreator = (logLevel: logLevel) => {
        //     return (entry: LogEntry) => {
        //         const {message, ...extra} = entry.log;
        //         // const fixed = `${message} : groupId: ${extra['groupId']}`;
        //         this._log.log({
        //                           level: convertLevel(entry.level),
        //                           message,
        //                           extra
        //                       });
        //     };
        // };

        this._kafka = new Kafka({
                                    clientId: 'stanley-kafka-service',
                                    brokers: brokers,
                                    logLevel: logLevel.INFO,
                                    logCreator: this.createKafkaLogger
                                });

        this._schemas = new SchemaRegistry({
                                               host: this._config.prop('schema-host')
                                           });
    }


    private createKafkaLogger(loggerLevel: logLevel): (entry: LogEntry) => void {
        const consoleFormat = combine(
            label({
                      label: 'kafkajs',
                      message: false
                  }),
            colorize(),
            printf(info => {
                return `${info.extra.timestamp} [${info.label}] ${info.level}: ${info.message} | groupId: ${info.extra.groupId}`;
            })
        );

        const convertLevel = (level: logLevel) => {
            switch(level) {
                case logLevel.WARN:
                    return 'warn'
                case logLevel.INFO:
                    return 'info'
                case logLevel.DEBUG:
                    return 'debug'
                case logLevel.ERROR:
                case logLevel.NOTHING:
                    return 'error'
            }
        };

        const kafkaLogger =
                  createLogger({
                                   transports: [
                                       new transports.Console({
                                                                  format: consoleFormat
                                                              }),
                                   ]
                               });

        return (entry: LogEntry) => {
            const {message, ...extra} = entry.log;
            kafkaLogger.log({
                              level: convertLevel(entry.level),
                              message,
                              extra
                          });
        };

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
                          .catch(err => {
                              this._log.warn(`${topic}-value schema does not exist`);
                          });
        return from(promise);
    }


    publish<T>(topic: string, items$: Observable<T>) {
        const prod = this.producer();
        this._demo.register(() =>
            prod.disconnect().then(() => this._log.debug(`topic '${topic}' stopped publishing`))
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
                                     error: err => this._log.error(`kafka publish => ${err}`)
                                 });
            });

    }


    drink$<T>(topic: string, groupId: string): Subject<T> {
        const cons = this.consumer(groupId);
        this._demo.register(() =>
            cons.disconnect().then(() => this._log.debug(`topic '${topic}' unsubscribed`))
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
