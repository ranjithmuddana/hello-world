package com.example.demo.demo.controller;

import com.example.demo.demo.config.DynamicJobScheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing job scheduling operations.
 * Provides endpoints to trigger job checks and other job-related functionalities.
 */
@RestController
@RequestMapping("/api/jobs")
public class JobSchedulerController {

    private final DynamicJobScheduler dynamicJobScheduler;

    /**
     * Constructs a new JobSchedulerController with the given {@link DynamicJobScheduler}.
     *
     * @param dynamicJobScheduler The scheduler responsible for dynamic job operations.
     */
    @Autowired
    public JobSchedulerController(DynamicJobScheduler dynamicJobScheduler) {
        this.dynamicJobScheduler = dynamicJobScheduler;
    }

    /**
     * Triggers an immediate check and scheduling of jobs.
     * This endpoint can be used to force the scheduler to re-evaluate job configurations
     * and schedule any new or updated jobs.
     */
    @PostMapping("/trigger")
    public void triggerJobCheck() {
        dynamicJobScheduler.triggerJobCheck();
    }
}
