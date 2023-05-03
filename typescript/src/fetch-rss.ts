import {RssKafka} from "./services";

const rssKafka = new RssKafka();
rssKafka.done$.subscribe(val => {
    if (val) {
        console.log('-- exiting');
        process.exit();
    }
})
rssKafka.run('https://rss.nytimes.com/services/xml/rss/nyt/US.xml', 'news-stories');
// rssKafka.run('https://www.cbssports.com/rss/headlines/', 'news-stories');
