import {KafkaService} from '../../../kafka';
import {GridFsService} from '../../gridfs.service';
import {DemolitionService} from '../../../process';
import {File, TopicGroup} from '../../../../models';
import {injectable} from 'tsyringe';
import {filter, from, map, share, tap} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {simpleParser} from 'mailparser';
import {Builder} from 'builder-pattern';
import path from 'path';
import {charset} from 'mime-types';
import {Readable} from 'stream';
import {ScratchService} from '../../scratch.service';


@injectable()
export class EmailTransform {
    constructor(protected _demo: DemolitionService,
                protected _gridfs: GridFsService,
                protected _kafka: KafkaService,
                protected _scratch: ScratchService) {
    }


    read$(topic: TopicGroup) {
        const emails$ = this._kafka.drink$<File>(topic.sub, 'stanley-email-xform');

        return emails$.pipe(
            tap(file =>
                console.info(`email ${file.name}`)
            ),
            mergeMap(file =>
                this._gridfs
                    .downloadStream$(file)
                    .pipe(
                        map(stream => [file, stream] as const)
                    )
            ),
            mergeMap( ([download, stream]) =>
                from(simpleParser(stream))
                    .pipe(
                        map(email => [download, email] as const)
                    )
            ),
        );
    }


    run(topic: TopicGroup, attachmentTopic: TopicGroup) {
        const shared$ = this.read$(topic)
                            .pipe(
                                share(),
                            );

        shared$.subscribe(([file, email]) =>
                              console.info(`${file.name} => ${email.subject}`)
        );

        const attachments$ =
                  shared$.pipe(
                             filter(([file, email]) =>
                                        email.attachments.length > 0
                             ),
                             mergeMap(([file, email]) =>
                                          from(email.attachments)
                                              .pipe(
                                                  map(att => [file, email, att] as const)
                                              )
                             ),
                             mergeMap(([file, email, attachment]) => {

                                 const name = attachment.filename || `${this._scratch.prefix()}-attachment`;
                                 const upload = Builder<File>().name(name)
                                                               .path(path.join(file.path, name))
                                                               .origin(path.join(file.origin, name))
                                                               .contentType(attachment.contentType)
                                                               .encoding(charset(attachment.contentType) || '')
                                                               .build();

                                 return this._gridfs
                                            .uploadStream$(upload, Readable.from(attachment.content));
                             }),
                         );

        this._kafka.publish(attachmentTopic.pub, attachments$);

    }
}
