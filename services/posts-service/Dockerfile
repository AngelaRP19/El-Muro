FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/posts-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8002
ENTRYPOINT ["java", "-jar", "app.jar"]
