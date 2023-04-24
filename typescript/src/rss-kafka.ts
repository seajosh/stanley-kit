import {RssEngine} from 'vcardz';
import {RxHR} from '@akanass/rx-http-request';
import {map} from 'rxjs/operators';

const fetch$ = RxHR.get('https://rss.nytimes.com/services/xml/rss/nyt/US.xml')
                   .pipe(
                       map((response: any) => response.body as string)
                   );

fetch$.subscribe((xml: any) => {
        console.log(xml);
    });




// const feed = new RssEngine("foo");
