import {injectable} from 'tsyringe';
import {DemolitionService} from '../../process';
import {KafkaService} from '../../kafka';
import {File, TopicGroup} from '../../../models';
import {filter, finalize, tap} from 'rxjs';

@injectable()
export class ZipRouterService {
    constructor(protected _demo: DemolitionService,
                protected _kafka: KafkaService) {
    }

    route$(topic: TopicGroup) {
        const [cons, drink$] = this._kafka.drink$<File>(topic.sub, 'stanley-zip-router');
        this._demo.register(() =>
            cons.disconnect().then(() => `kafka ${topic.sub} topic disconnected`)
        )

        return drink$.pipe(
            filter(file =>
                       /^application\/zip/.test(file.contentType)
            ),
            tap(file =>
                    console.info(`routing ${file.name}`)
            ),
            finalize(() => this._demo.destroy())
        );
    }


    run(topic: TopicGroup) {
        const prod = this._kafka.publish(topic.pub, this.route$(topic));

        this._demo.register(() =>
            prod.disconnect().then(() => console.log(`kafka ${topic.pub} disconnected`))
        );
    }
}
