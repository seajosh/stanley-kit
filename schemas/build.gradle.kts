plugins {
    id("io.idahodata.java-library-conventions")
    id("com.github.davidmc24.gradle.plugin.avro") version "1.7.0"
}

repositories {
    mavenCentral()
}
dependencies {
    implementation("org.apache.avro:avro:1.11.0")

}
