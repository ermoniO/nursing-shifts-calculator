# One container serves both the React app and the Spring Boot API.

# 1) Build the React app
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2) Build the Spring Boot jar, with the React build inside it as static files
FROM maven:3.9-eclipse-temurin-21 AS api
WORKDIR /api
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline || true
COPY backend/src ./src
COPY --from=web /web/dist ./src/main/resources/static
RUN mvn -B -q package -DskipTests

# 3) Run it
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=api /api/target/nursing-shifts-calculator.jar app.jar
# Lets Java use most of the small container's memory
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
