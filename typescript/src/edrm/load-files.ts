import "reflect-metadata";
import {FileLoader} from '../services';

// console.warn(`safety lock!`);
// process.exit(0);

const loader =
              new FileLoader('/Users/joshw/dev/stanley-kit/data/EDRM Public Download',
                             '/Users/joshw/dev/stanley-kit/data/');

loader.run();

