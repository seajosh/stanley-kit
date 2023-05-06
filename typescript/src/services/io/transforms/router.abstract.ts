import {KafkaService} from '../../kafka';
import {DemolitionService} from '../../process';
import {File, TopicGroup} from '../../../models';
import {filter, finalize, tap} from 'rxjs';

export type RouterPredicate = (value: File, index: number) => boolean;

export abstract class RouterAbstract {
    constructor(protected _demo: DemolitionService,
                protected _kafka: KafkaService) {
    }


    route$(name: string, topic: TopicGroup, criteria: RouterPredicate) {
        const [cons, drink$] =
                  this._kafka.drink$<File>(topic.sub,
                                           `stanley-${name}-router`);

        this._demo.register(() =>
                                cons.disconnect().then(() => `kafka ${topic.sub} topic disconnected`)
        )

        return drink$.pipe(
            filter(criteria),
            tap(file =>
                    console.info(`routing ${file.name}`)
            ),
            finalize(() => this._demo.destroy())
        );
    }


    execute(name: string, topic: TopicGroup, criteria: RouterPredicate) {
        const prod =
                  this._kafka.publish(topic.pub,
                                      this.route$(name, topic, criteria));

        this._demo.register(() =>
                                prod.disconnect().then(() => console.log(`kafka ${topic.pub} disconnected`))
        );
    }

}
