package com.example.demo.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * Configuration class for setting up the task scheduler.
 * This class defines a {@link TaskScheduler} bean that can be used for scheduling various tasks.
 */
@Configuration
public class SchedulerConfig {

    /**
     * Configures and provides a {@link ThreadPoolTaskScheduler} bean.
     * The scheduler is initialized with a pool size of 10 and a custom thread name prefix.
     *
     * @return A configured instance of {@link TaskScheduler}.
     */
    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("scheduled-task-");
        scheduler.initialize();
        return scheduler;
    }
}
