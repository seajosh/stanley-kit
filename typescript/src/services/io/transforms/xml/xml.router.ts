import {RouterAbstract} from '../router.abstract';
import {TopicGroup} from '../../../../models';
import {injectable} from 'tsyringe';
import {DemolitionService} from '../../../process';
import {KafkaService} from '../../../kafka';

@injectable()
export class XmlRouter extends RouterAbstract {

    constructor(protected _demo: DemolitionService,
                protected _kafka: KafkaService) {
        super(_demo, _kafka);
    }

    run(topic: TopicGroup) {
        super.execute('xml',
                      new TopicGroup('edrm-files-xml', 'edrm-files'),
                      file => /^(?:application|text)\/xml/.test(file.contentType)
        )
    }
}
