import {RouterAbstract} from '../router.abstract';
import {DemolitionService} from '../../../process';
import {KafkaService} from '../../../kafka';
import {TopicGroup} from '../../../../models';
import {injectable} from 'tsyringe';
import {DefaultLogger} from '../../../logging';

@injectable()
export class MboxRouter extends RouterAbstract {

    constructor(protected _demo: DemolitionService,
                protected _logger: DefaultLogger,
                protected _kafka: KafkaService) {
        super(_demo, _logger, _kafka);
    }


    run(topic: TopicGroup) {
        super.execute('mbox',
                      topic,
                      file => /^application\/mbox/.test(file.contentType)
        )
    }
}
