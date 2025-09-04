package com.example.demo.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Spring Boot application.
 * This class enables Spring Boot auto-configuration and component scanning.
 * It also enables Spring's scheduling capabilities via {@link EnableScheduling}.
 */
@SpringBootApplication
@EnableScheduling
public class DemoApplication {

	/**
	 * The main method that starts the Spring Boot application.
	 * @param args Command line arguments.
	 */
	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
