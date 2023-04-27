import {RssKafka} from "./services";

const rssKafka = new RssKafka();
rssKafka.done$.subscribe(val => {
    if (val) {
        console.log('-- exiting');
        process.exit();
    }
})
rssKafka.run();
