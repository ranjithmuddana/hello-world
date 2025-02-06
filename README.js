services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    user: root  # Run as root to match ownership
    container_name: spring_boot_app
    volumes:
      - /usr/share/maven:/usr/share/maven
    environment:
      JAVA_HOME: /usr/lib/jvm/java-17-openjdk-amd64
      SPRING_PROFILES_ACTIVE: dev
    network_mode: "host"