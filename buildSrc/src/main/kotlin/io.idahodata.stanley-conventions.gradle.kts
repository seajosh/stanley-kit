plugins {
    id("io.idahodata.java-common-conventions")
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    // Use Maven Central for resolving dependencies.
    mavenCentral()
    maven {
        url = uri("https://packages.confluent.io/maven")
    }
}

extra["vAvroSerializer"] = "7.3.3"
extra["vCloudStream"] = "4.0.2"
extra["vSpringCloud"] = "2022.0.2"
extra["vSpringBoot"] = "3.0.6"
extra["vSpringDependencyGradlePlugin"] = "1.1.0"
extra["vSpringKafka"] = "3.0.6"
extra["vLombok"] = "1.18.26"


dependencies {
    // schema module - geneated Java classes from Avro schema files
//    api(project(":schemas"))
    implementation(project(":schemas"))

    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter:${property("vSpringBoot")}")

    // Spring Cloud Stream and Kafka binder
    implementation("org.springframework.cloud:spring-cloud-stream:${property("vCloudStream")}")
    implementation("org.springframework.cloud:spring-cloud-stream-binder-kafka:${property("vCloudStream")}")

    // Spring Kafka
    implementation("org.springframework.kafka:spring-kafka:${property("vSpringKafka")}")

    // Confluent Avro serializer
    implementation("io.confluent:kafka-avro-serializer:${property("vAvroSerializer")}")

    // Lombok
    compileOnly("org.projectlombok:lombok:${property("vLombok")}")
    annotationProcessor("org.projectlombok:lombok:${property("vLombok")}")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

//dependencyManagement {
//    imports {
//        mavenBom("org.springframework.cloud:spring-cloud-dependencies:${property("vSpringCloud")}")
//    }
//}
