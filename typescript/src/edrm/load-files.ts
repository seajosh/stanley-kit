import "reflect-metadata";
import {FileLoader} from '../services';

// console.warn(`safety lock!`);
// process.exit(0);

const loader =
              new FileLoader('/Users/joshw/dev/stanley-kit/data/EDRM Public Download',
                             '/Users/joshw/dev/stanley-kit/data/');

loader.run();


// const downloadFile = '/Users/joshw/dev/stanley-kit/data/EDRM Public Download/Data from public websites/MinTemp_1970.zip';
//
// gridFs.downloadFile$(downloadFile)
//       .subscribe(stream => {
//           stream.pipe(unzip.Parse())
//                 .pipe(new Transform({
//                                         objectMode: true,
//                                         transform: (entry, err, cb) => {
//                                             console.log(entry.path);
//                                             entry.autodrain();
//                                             cb();
//                                         }
//                                     })
//                 );
//       });

