package com.example.demo.demo.controller;

import com.example.demo.demo.BaseIntegrationTest;
import com.example.demo.demo.entity.JobConfiguration;
import com.example.demo.demo.repository.JobConfigurationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.test.web.reactive.server.WebTestClient;

@AutoConfigureWebTestClient
class JobSchedulerControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private JobConfigurationRepository jobConfigurationRepository;

    @BeforeEach
    void setUp() {
        jobConfigurationRepository.deleteAll();
    }

    @Test
    void testGetAllScheduledJobs() {
        JobConfiguration job1 = new JobConfiguration();
        job1.setJobName("job1");
        job1.setCronExpression("0 * * * * ?");
        jobConfigurationRepository.save(job1);

        JobConfiguration job2 = new JobConfiguration();
        job2.setJobName("job2");
        job2.setCronExpression("0 * * * * ?");
        jobConfigurationRepository.save(job2);

        webTestClient.post().uri("/api/jobs/trigger")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(void.class)
                .hasSize(0);
    }
}
