package io.idahodata.stanley.configuration;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@ComponentScan(basePackages = "io.idahodata.stanley.services")
@Configuration
@PropertySource(value = "classpath:stanley-application.yaml", factory = YamlPropertySourceFactory.class)
public class StanleyConfiguration {
}
