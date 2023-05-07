import {ConfigService} from '../config.service';
import {ITopicConfig, Kafka, logLevel} from 'kafkajs';
import {readAVSCAsync, SchemaRegistry, SchemaType} from '@kafkajs/confluent-schema-registry';
import {injectable} from 'tsyringe';

@injectable()
export class KafkaInitService {
    protected _topics =
                  ['edrm-files',
                   'edrm-files-csv',
                   'edrm-files-xml',
                   'edrm-files-zip'
                  ];

    protected _fileSchema =  '../schemas/src/main/avro/edrm/file.avsc';

    constructor(protected _config: ConfigService) {
    }

    async init() {
        const brokers =
                  this._config
                      .prop('kafka-brokers')
                      .split(';');

        const kafka = new Kafka({
                                    brokers: brokers,
                                    logLevel: logLevel.INFO
                                });

        const registry = new SchemaRegistry({
                                               host: this._config.prop('schema-host')
                                           });

        const admin = kafka.admin();
        await admin.connect();

        const topics = await admin.listTopics();
        const createTopics =
                  this._topics
                      .filter(top => !topics.includes(top));

        this._topics
            .filter(top => !createTopics.includes(top))
            .forEach(top => console.info(`found topic '${top}' - skipping`));

        const topicConfigs =
                  createTopics.map(top => {
                      return {
                          topic: top,
                          numPartitions: 1,
                      } as ITopicConfig;
                  })
        await admin.createTopics({topics: topicConfigs});
        createTopics.forEach(top => console.info(`created topic ${top}`) );

        const fileAvro = await readAVSCAsync(this._fileSchema);
        for (const top of createTopics) {
            await registry.register(fileAvro, {subject: `${top}-value`});
        }
        createTopics.forEach(top => console.info(`created File schema ${top}-value`) );

        await admin.disconnect();
    }
}
