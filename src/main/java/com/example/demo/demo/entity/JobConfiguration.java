package com.example.demo.demo.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

/**
 * Represents the configuration for a batch job.
 * This entity is mapped to a database table and contains details about how a job should be scheduled and executed.
 */
@Entity
@Getter
@Setter
public class JobConfiguration {

    /**
     * Unique identifier for the job configuration.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The name of the job.
     */
    private String jobName;

    /**
     * The cron expression for scheduling the job.
     */
    private String cronExpression;

    /**
     * Indicates whether the job is enabled for scheduling.
     */
    private boolean isEnabled;

    /**
     * The Jolt specification for transforming the output of the job.
     */
    private String outputTransformerSpec;

    /**
     * The name of the input table for the job.
     */
    private String inputTableName;

    /**
     * The page size for processing data in the job.
     */
    private int pageSize;

    /**
     * The current status of the job (e.g., "QUEUED", "COMPLETED").
     */
    private String status;

}
