import {RouterAbstract} from '../router.abstract';
import {DemolitionService} from '../../../process';
import {KafkaService} from '../../../kafka';
import {TopicGroup} from '../../../../models';
import {injectable} from 'tsyringe';
import {DefaultLogger} from '../../../logging';

@injectable()
export class DocxRouter extends RouterAbstract {

    constructor(protected _demo: DemolitionService,
                protected _logger: DefaultLogger,
                protected _kafka: KafkaService) {
        super(_demo, _logger, _kafka);
    }


    run(topic: TopicGroup) {
        super.execute('docx',
                      topic,
                      file =>
                          /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/.test(file.contentType)
                          || /^application\/vnd.ms-word/.test(file.contentType)
                          || /^application\/msword/.test(file.contentType)
        )
    }
}
