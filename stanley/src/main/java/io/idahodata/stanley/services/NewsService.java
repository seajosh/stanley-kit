package io.idahodata.stanley.services;

import io.idahodata.schemas.NewsItem;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.function.Consumer;


@Slf4j
@NoArgsConstructor
@Service
public class NewsService {
    private Sinks.Many<Message<NewsItem>> unicastProcessor = Sinks.many()
                                                                  .unicast()
                                                                  .onBackpressureBuffer();


    @Bean("news-consumer")
    public Consumer<Flux<Message<NewsItem>>> logNewsItems() {
        return flux -> {
            flux.subscribe(item -> log.info("news-consumer subscribed => {}", item));
        };
    }



}
