import {KafkaService} from '../../kafka';
import {DemolitionService} from '../../process';
import {File, TopicGroup} from '../../../models';
import {filter, finalize, tap} from 'rxjs';

export type RouterPredicate = (value: File, index: number) => boolean;

export abstract class RouterAbstract {
    protected constructor(protected _demo: DemolitionService,
                          protected _kafka: KafkaService) {
    }


    route$(name: string, topic: TopicGroup, criteria: RouterPredicate) {
        const drink$ = this._kafka.drink$<File>(topic.sub,
                                                `stanley-${name}-router`);
        return drink$.pipe(
            filter(criteria),
            tap(file =>
                    console.info(`routing ${file.name}`)
            ),
            finalize(() => this._demo.destroy())
        );
    }


    execute(name: string, topic: TopicGroup, criteria: RouterPredicate) {
        this._kafka.publish(topic.pub,
                            this.route$(name, topic, criteria));
    }

}
