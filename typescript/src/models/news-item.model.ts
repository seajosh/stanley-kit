import {Item, ItemCategory} from "vcardz/dist/models/rss";

export class NewsItem {
    title = '';
    description = '';
    pubDate = '';
    categories = [] as string[];
    link = '';

    static fromRss(item: Item): NewsItem {
        const news = new NewsItem();
        news.title = item.title;
        news.description = item.description;
        news.pubDate = item.pubDate.toISOString();
        news.categories = Array.isArray(item.category)
            ? item.category.map(cat => cat.category)
            : [(item.category as ItemCategory).category];
        // news.categories = [];
        news.link = item.link.href;

        return news;
    }

}
