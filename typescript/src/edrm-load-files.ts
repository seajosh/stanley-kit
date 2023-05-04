import {FileLoader} from './services/io';

const loader = new FileLoader('/Users/joshw/dev/stanley-kit/data/EDRM Public Download',
                              '/Users/joshw/dev/stanley-kit/data/');
loader.run();





// const compactFormatter = Intl.NumberFormat('en', {notation: 'compact'});

// const gridFs = new GridFsService();



// loader.files$
//       .pipe(
//           // take(62),
//           mergeMap(file => gridFs.uploadFile$(file), 2),
//           catchError(ex => {
//               console.error(`!! ${ex}`);
//               return of('');
//           }),
//           finalize(() => {
//               console.info('upload done');
//               gridFs.disconnect$.subscribe();
//           })
//       )
//       .subscribe(filePath => {
//           console.log(filePath);
//       });
//
// loader.list();


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


// loader.stats$
//       // .pipe(
//       //     take(10)
//       // )
//       .subscribe(([file, stat]) => {
//           console.log(`${file}: ${compactFormatter.format(stat.size)}`);
//       });
// loader.stats();
