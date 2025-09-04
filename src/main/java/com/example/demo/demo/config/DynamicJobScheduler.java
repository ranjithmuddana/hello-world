package com.example.demo.demo.config;

import com.example.demo.demo.entity.JobConfiguration;
import com.example.demo.demo.repository.JobConfigurationRepository;
import com.example.demo.demo.service.DynamicJobService;

import lombok.extern.log4j.Log4j2;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Component responsible for dynamically scheduling jobs based on configurations stored in the database.
 * It implements {@link SchedulingConfigurer} to integrate with Spring's scheduling mechanism.
 */
@Component
@Log4j2
public class DynamicJobScheduler implements SchedulingConfigurer {

    private final JobConfigurationRepository jobConfigurationRepository;
    private ScheduledTaskRegistrar taskRegistrar;
    private final DynamicJobService dynamicJobService;

    /**
     * Constructs a new DynamicJobScheduler with the given dependencies.
     *
     * @param jobConfigurationRepository Repository for accessing job configurations.
     * @param dynamicJobService Service for executing dynamic jobs.
     */
    @Autowired
    public DynamicJobScheduler(JobConfigurationRepository jobConfigurationRepository,
                                DynamicJobService dynamicJobService) {
        this.jobConfigurationRepository = jobConfigurationRepository;
        this.dynamicJobService = dynamicJobService;
    }

    /**
     * Configures the scheduled tasks.
     * This method is called by Spring to set up the scheduler.
     *
     * @param taskRegistrar The registrar for scheduled tasks.
     */
    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        this.taskRegistrar = taskRegistrar;
        scheduleJobs();
    }

    /**
     * Schedules jobs based on configurations retrieved from the database.
     * Only jobs with status "QUEUED" and that are enabled with a valid input table name are considered.
     * Jobs with a cron expression are scheduled; otherwise, they are run immediately.
     */
    public void scheduleJobs() {
        List<JobConfiguration> jobConfigurations = jobConfigurationRepository.findAllByStatus("QUEUED");
        log.info("Found {} job configurations to schedule.", jobConfigurations.size());
        for (JobConfiguration jobConfiguration : jobConfigurations) {
            if (jobConfiguration.isEnabled() && jobConfiguration.getInputTableName() != null && !jobConfiguration.getInputTableName().isEmpty()) {
                Runnable task = () -> dynamicJobService.executeJob(jobConfiguration);
                if(jobConfiguration.getCronExpression() != null && !jobConfiguration.getCronExpression().isEmpty()) {
                    log.info("Scheduling job: {} with cron expression: {}", jobConfiguration.getJobName(), jobConfiguration.getCronExpression());
                    taskRegistrar.addTriggerTask(task, new CronTrigger(jobConfiguration.getCronExpression()));
                } else {
                    log.warn("Cron expression is missing for job: {}. Skipping scheduling.", jobConfiguration.getJobName());
                    task.run(); // Run immediately if no cron expression
                    jobConfiguration.setStatus("COMPLETED");
                    jobConfigurationRepository.save(jobConfiguration);
                }
            } else {
                log.warn("Job {} is not enabled or input table name is missing", jobConfiguration.getJobName());
            }
        }
    }

    /**
     * Triggers an immediate check and scheduling of jobs.
     * This method can be used to force a re-evaluation of job configurations and schedule new jobs.
     */
    public void triggerJobCheck() {
        scheduleJobs();
    }

}