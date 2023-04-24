/*
 * This file was generated by the Gradle 'init' task.
 */

plugins {
    // Apply the java Plugin to add support for Java.
    java
}

java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
    // Use Maven Central for resolving dependencies.
    mavenCentral()
}

extra["vSpringBoot"] = "3.0.6"
extra["vSpringDependencyGradlePlugin"] = "1.1.0"

dependencies {
//    // Gradle plugins
//    implementation("org.springframework.boot:spring-boot-gradle-plugin:${property("vSpringBoot")}")
//    implementation("io.spring.dependency-management:io.spring.dependency-management.gradle.plugin:${"vSpringDepdencyGradlePlugin"}")

    constraints {
        // Define dependency versions as constraints
        implementation("org.apache.commons:commons-text:1.10.0")
    }

    // Use JUnit Jupiter for testing.
    testImplementation("org.junit.jupiter:junit-jupiter:5.9.1")
}

tasks.named<Test>("test") {
    // Use JUnit Platform for unit tests.
    useJUnitPlatform()
}
