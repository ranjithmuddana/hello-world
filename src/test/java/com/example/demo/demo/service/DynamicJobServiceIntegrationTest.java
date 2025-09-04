package com.example.demo.demo.service;

import com.example.demo.demo.entity.JobConfiguration;
import com.example.demo.demo.repository.JobConfigurationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DynamicJobServiceTest{

    @InjectMocks
    private DynamicJobService dynamicJobService;

    @Mock
    private JobConfigurationRepository jobConfigurationRepository;

    // Autowire the mocks that are now provided by the TestConfig
    @Mock
    private JsonTransformerService jsonTransformerService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private RestClient restClient;

    @BeforeEach
    void setUp() {
//        jobConfigurationRepository.deleteAll();
//        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS test_input_table (id INT, request VARCHAR(255))");
//        jdbcTemplate.update("INSERT INTO test_input_table (id, request) VALUES (?, ?)", 1, "{\"id\":1, \"data\":\"value1\"}");
    }

    @Test
    void testExecuteJob_success() {
        // Given
        JobConfiguration jobConfiguration = new JobConfiguration();
        jobConfiguration.setJobName("testJob");
        jobConfiguration.setInputTableName("test_input_table");
        jobConfiguration.setPageSize(1);
        jobConfiguration.setOutputTransformerSpec("output_spec");

        // Mock JdbcTemplate behavior
        when(jdbcTemplate.queryForList(anyString(), eq(String.class), anyInt(), anyInt()))
                .thenReturn(List.of("{\"id\":1, \"data\":\"value1\"}")) // First page
                .thenReturn(Collections.emptyList()); // Second page, to stop the loop

        // Mock RestClient behavior
        when(restClient.processData(anyString()))
                .thenReturn("{\"processed\":\"data\"}");

        // Mock JsonTransformerService behavior
        when(jsonTransformerService.transform(anyString(), anyString()))
                .thenReturn("{\"transformed\":\"data\"}");

        // Mock batchUpdate to avoid NullPointerException if it's called
        doAnswer(invocation -> {
            // Simulate batch update success
            return null;
        }).when(jdbcTemplate).batchUpdate(anyString(), any(List.class), anyInt(), any());

        doNothing().when(jdbcTemplate).execute(anyString());


        // When
        dynamicJobService.executeJob(jobConfiguration);

        // Then
        // Verify that jdbcTemplate.execute was called to create the output table
        verify(jdbcTemplate, times(1)).execute(anyString());

        // Verify that readPageFromInputTable was called twice (once for data, once to check for more)
        verify(jdbcTemplate, times(2)).queryForList(anyString(), eq(String.class), anyInt(), anyInt());

        // Verify RestClient and JsonTransformerService interactions
        verify(restClient, times(1)).processData(anyString());
        verify(jsonTransformerService, times(1)).transform(anyString(), anyString());

        // Verify batchInsert was called (with a timeout for the async call)
        verify(jdbcTemplate, timeout(1000).times(1)).batchUpdate(anyString(), any(List.class), anyInt(), any());
    }
}
