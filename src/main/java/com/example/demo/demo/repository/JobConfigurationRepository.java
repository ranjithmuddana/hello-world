package com.example.demo.demo.repository;

import com.example.demo.demo.entity.JobConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository interface for managing {@link JobConfiguration} entities.
 * Extends {@link JpaRepository} to provide standard CRUD operations and custom query methods.
 */
public interface JobConfigurationRepository extends JpaRepository<JobConfiguration, Long> {
    /**
     * Finds all job configurations with the specified status.
     *
     * @param status The status to search for (e.g., "QUEUED", "COMPLETED").
     * @return A list of {@link JobConfiguration} entities matching the given status.
     */
    List<JobConfiguration> findAllByStatus(String status);
}
