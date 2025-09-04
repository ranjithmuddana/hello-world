package com.example.demo.demo.service;

import com.example.demo.demo.entity.JobConfiguration;
import lombok.extern.log4j.Log4j2;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Service responsible for executing dynamic jobs based on provided {@link JobConfiguration}.
 * It handles reading data from an input table, processing it, and writing results to a dynamically created output table.
 */
@Service
@Log4j2
public class DynamicJobService {

    private final JsonTransformerService jsonTransformerService;
    private final JdbcTemplate jdbcTemplate;
    private final RestClient restClient;
    private record Result(String request, String response, long timeTaken) {
    }

    /**
     * Constructs a new DynamicJobService with the given dependencies.
     *
     * @param jsonTransformerService Service for JSON transformations.
     * @param jdbcTemplate Spring's JDBC template for database interactions.
     * @param restClient Client for making REST calls.
     */
    public DynamicJobService(JsonTransformerService jsonTransformerService,
                               JdbcTemplate jdbcTemplate,
                               RestClient restClient) {
        this.jsonTransformerService = jsonTransformerService;
        this.jdbcTemplate = jdbcTemplate;
        this.restClient = restClient;
    }

    /**
     * Executes a job based on the provided job configuration.
     * This method reads data from the input table in pages, processes each record,
     * and writes the transformed results to a new dynamically created output table.
     *
     * @param jobConfiguration The configuration for the job to be executed.
     */
    public void executeJob(JobConfiguration jobConfiguration) {
        log.info("Running job: {} from input table: {}", jobConfiguration.getJobName(), jobConfiguration.getInputTableName());

        String timestamp = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        String outputTableName = jobConfiguration.getInputTableName() + "_batch_output_" + timestamp;

        // Create dynamic output table
        jdbcTemplate.execute("CREATE TABLE " + outputTableName + " (id BIGSERIAL PRIMARY KEY, request TEXT, response TEXT, time_taken BIGINT)");

        int pageSize = jobConfiguration.getPageSize();
        int pageNumber = 0;
        List<String> inputJsons;

        do {
            inputJsons = readPageFromInputTable(jobConfiguration.getInputTableName(), pageNumber, pageSize);

            if (!inputJsons.isEmpty()) {

                List<Result> transformedJsons = inputJsons.stream()
                        .map(inputJson -> {
                            long startTime = System.currentTimeMillis();
                            String response = restClient.processData(inputJson);
                            long timeTaken = System.currentTimeMillis() - startTime;
                            return new Result(inputJson, response, timeTaken);
                        })
                        .map(result -> {
                            String transformed = jsonTransformerService.transform(
                                    result.response(),
                                    jobConfiguration.getOutputTransformerSpec()
                            );
                            return new Result(result.request(), transformed, result.timeTaken());
                        })
                        .collect(Collectors.toList());

                CompletableFuture.runAsync(() -> batchInsert(outputTableName, transformedJsons));
            }

            pageNumber++;
        } while (inputJsons.size() == pageSize);


        log.info("Finished job: {}, output table: {}", jobConfiguration.getJobName(), outputTableName);
    }

    /**
     * Reads a page of JSON requests from the specified input table.
     *
     * @param tableName The name of the input table.
     * @param pageNumber The page number to read (0-indexed).
     * @param pageSize The number of records per page.
     * @return A list of JSON strings representing the requests in the specified page.
     */
    private List<String> readPageFromInputTable(String tableName, int pageNumber, int pageSize) {
        int offset = pageNumber * pageSize;
        String sql = "SELECT request FROM " + tableName + " ORDER BY id LIMIT ? OFFSET ?";
        return jdbcTemplate.queryForList(sql, String.class, pageSize, offset);
    }

    /**
     * Inserts a batch of processed results into the specified output table.
     *
     * @param tableName The name of the output table.
     * @param jsonData A list of {@link Result} objects containing the request, response, and time taken.
     */
    private void batchInsert(String tableName, List<Result> jsonData) {
        if (jsonData == null || jsonData.isEmpty()) {
            return;
        }
        String sql = "INSERT INTO " + tableName + " (request, response, time_taken) VALUES (?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, jsonData, jsonData.size(), // batch size
                (PreparedStatement ps, Result argument) -> {
                    ps.setString(1, argument.request());
                    ps.setString(2, argument.response());
                    ps.setLong(3, argument.timeTaken());
                });
    }
}