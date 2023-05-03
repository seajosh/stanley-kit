import {Item, ItemCategory} from 'vcardz/dist/models/rss';
import he from 'he';


export class NewsItem {
    title = '';
    description = '';
    pubDate = '';
    categories = [] as string[];
    link = '';

    static fromRss(item: Item): NewsItem {
        const news = new NewsItem();
        news.title = he.decode(item.title.trim());
        news.description = he.decode(item.description.trim());
        news.pubDate = item.pubDate.toISOString();

        news.categories = Array.isArray(item.category)
            ? item.category.map(cat => cat.category)
            : [(item.category as ItemCategory).category];
        news.link = item.link.href;
        return news;
    }

}
