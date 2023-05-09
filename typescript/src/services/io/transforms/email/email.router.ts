import {RouterAbstract} from '../router.abstract';
import {TopicGroup} from '../../../../models';
import {injectable} from 'tsyringe';
import {DemolitionService} from '../../../process';
import {KafkaService} from '../../../kafka';
import {DefaultLogger} from '../../../logging';


@injectable()
export class EmailRouter extends RouterAbstract {

    constructor(protected _demo: DemolitionService,
                protected _logger: DefaultLogger,
                protected _kafka: KafkaService) {
        super(_demo, _logger, _kafka);
    }

    run(topic: TopicGroup) {
        super.execute('email',
                      topic,
                      file => /^message\/rfc822/.test(file.contentType)
        )
    }
}
