import "reflect-metadata";
import {FileLoaderService} from '../services';

// console.warn(`safety lock!`);
// process.exit(0);

const loader =
              new FileLoaderService('/Users/joshw/dev/stanley-kit/data/EDRM Public Download',
                                    '/Users/joshw/dev/stanley-kit/data/');

loader.run();

