package io.idahodata.stanley.anotation;

import io.idahodata.stanley.configuration.StanleyConfiguration;
import org.springframework.context.annotation.Import;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Import(StanleyConfiguration.class)
public @interface EnableStanley {
}
