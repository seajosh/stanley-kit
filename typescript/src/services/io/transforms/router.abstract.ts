import {KafkaService} from '../../kafka';
import {DemolitionService} from '../../process';
import {File, TopicGroup} from '../../../models';
import {filter, finalize, tap} from 'rxjs';
import {DefaultLogger} from '../../logging';
import {Loggable} from '../../loggable.abstract';

export type RouterPredicate = (value: File, index: number) => boolean;

export abstract class RouterAbstract extends Loggable {
    protected constructor(protected _demo: DemolitionService,
                          protected _logger: DefaultLogger,
                          protected _kafka: KafkaService) {
        super(_logger);
    }


    route$(name: string, topic: TopicGroup, criteria: RouterPredicate) {
        const drink$ = this._kafka.drink$<File>(topic.sub,
                                                `stanley-${name}-router`);
        return drink$.pipe(
            filter(criteria),
            tap(file =>
                    this._log.info(`routing ${file.name}`)
            ),
            finalize(() => this._demo.destroy())
        );
    }


    execute(name: string, topic: TopicGroup, criteria: RouterPredicate) {
        this._kafka.publish(topic.pub,
                            this.route$(name, topic, criteria));
    }

}
