import {injectable} from 'tsyringe';
import {RouterAbstract} from '../router.abstract';
import {DemolitionService} from '../../../process';
import {KafkaService} from '../../../kafka';
import {TopicGroup} from '../../../../models';
import {DefaultLogger} from '../../../logging';

@injectable()
export class ZipRouter extends RouterAbstract {
    constructor(protected _demo: DemolitionService,
                protected _logger: DefaultLogger,
                protected _kafka: KafkaService) {
        super(_demo, _logger, _kafka);
    }

    run(topic: TopicGroup) {
        super.execute('zip',
                      topic,
                      file => /^application\/zip/.test(file.contentType)
        );
    }
}
