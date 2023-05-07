import {RouterAbstract} from '../router.abstract';
import {DemolitionService} from '../../../process';
import {KafkaService} from '../../../kafka';
import {TopicGroup} from '../../../../models';
import {injectable} from 'tsyringe';

@injectable()
export class DocxRouter extends RouterAbstract {

    constructor(protected _demo: DemolitionService,
                protected _kafka: KafkaService) {
        super(_demo, _kafka);
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
