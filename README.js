import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import java.util.stream.Collectors;

public class JsonBenchmark {
    private final JdbcTemplate jdbcTemplate;

    public JsonBenchmark(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void runBenchmark() throws Exception {
        long fetchStart = System.currentTimeMillis();
        
        // Step 1: Fetch raw data (Simple query)
        List<Map<String, Object>> dataList = jdbcTemplate.queryForList("SELECT * FROM my_table ORDER BY item_type");
        
        long fetchEnd = System.currentTimeMillis();
        
        long processStart = System.currentTimeMillis();
        
        // Step 2: Group Data
        Map<String, List<Map<String, Object>>> groupedData = dataList.stream()
            .collect(Collectors.groupingBy(row -> (String) row.get("item_type")));

        Map<String, Object> jsonResult = new HashMap<>();
        
        for (Map.Entry<String, List<Map<String, Object>>> entry : groupedData.entrySet()) {
            String type = entry.getKey();
            List<Map<String, Object>> items = entry.getValue();

            if ("typeA".equals(type)) {
                Map<String, Object> level2 = new HashMap<>();
                level2.put("category", items.get(0).get("category")); // Assuming same category for typeA
                level2.put("items", items);

                jsonResult.put(type, Map.of("level1", Map.of("level2", level2)));
            } else {
                jsonResult.put(type, items);
            }
        }

        // Step 3: Convert to JSON
        ObjectMapper mapper = new ObjectMapper();
        String jsonString = mapper.writeValueAsString(jsonResult);
        
        long processEnd = System.currentTimeMillis();

        System.out.println("Raw Fetch Time: " + (fetchEnd - fetchStart) + " ms");
        System.out.println("JSON Processing Time: " + (processEnd - processStart) + " ms");
        System.out.println("Total Java Execution Time: " + (processEnd - fetchStart) + " ms");
    }
}