/*
 * This file was generated by the Gradle 'init' task.
 */

plugins {
    id("io.idahodata.java-library-conventions")
    id("io.idahodata.stanley-conventions")
    id("org.springframework.boot") version "3.0.6"
    id("io.spring.dependency-management") version "1.1.0"
}

//configurations {
//    compileOnly {
//        extendsFrom(configurations.annotationProcessor.get())
//    }
//}

//extra["vSpringCloud"] = "2022.0.2"
//extra["vCloudStream"] = "4.0.2"
//extra["vSpringKafka"] = "3.0.6"
//extra["vLombok"] = "1.18.26"
//
//dependencies {
//    api(project(":schemas"))
//
//    implementation("org.springframework.cloud:spring-cloud-stream:${property("vCloudStream")}")
//    implementation("org.springframework.cloud:spring-cloud-stream-binder-kafka:${property("vCloudStream")}")
//    implementation("org.springframework.kafka:spring-kafka:${property("vSpringKafka")}")
//
//    compileOnly("org.projectlombok:lombok:${property("vLombok")}")
//    annotationProcessor("org.projectlombok:lombok:${property("vLombok")}")
//
//    testImplementation("org.springframework.boot:spring-boot-starter-test")
//}

//dependencyManagement {
//    imports {
//        mavenBom("org.springframework.cloud:spring-cloud-dependencies:${property("vSpringCloud")}")
//    }
//}
