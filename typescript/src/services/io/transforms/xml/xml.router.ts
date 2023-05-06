import {RouterAbstract} from '../router.abstract';
import {TopicGroup} from '../../../../models';

export class XmlRouterService extends RouterAbstract {

    run(topic: TopicGroup) {
        super.execute('xml',
                      new TopicGroup('edrm-files-xml', 'edrm-files'),
                      file => /^(?:application|text)\/xml/.test(file.contentType)
        )
    }
}
