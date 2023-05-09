import {File} from './file.model';


export class Payload {
    constructor(public file: File,
                public data: any) {
    }

}
