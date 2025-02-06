# Start from a minimal base image
FROM ubuntu:22.04

# Set environment variables
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

# Mount the local Java installation
VOLUME ["/usr/lib/jvm/java-17-openjdk-amd64"]

# Install required dependencies
RUN apt-get update && apt-get install -y \
    maven \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy the application source code
COPY . .

# Build the Spring Boot application
RUN mvn clean package -DskipTests

# Run the application (for JAR-based Spring Boot apps)
CMD ["java", "-jar", "target/myapp.jar"]