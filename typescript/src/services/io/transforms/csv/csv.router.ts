import {injectable} from 'tsyringe';
import {RouterAbstract} from '../router.abstract';
import {DemolitionService} from '../../../process';
import {KafkaService} from '../../../kafka';
import {TopicGroup} from '../../../../models';


@injectable()
export class CsvRouter extends RouterAbstract {
    constructor(protected _demo: DemolitionService,
                protected _kafka: KafkaService) {
        super(_demo, _kafka)
    }

    run(topic: TopicGroup) {
        super.execute('csv',
                      topic,
                      file => /^text\/csv/.test(file.contentType)
        );
    }
}
