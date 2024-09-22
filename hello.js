import java.sql.*;
import java.net.http.*;
import java.net.URI;
import java.util.*;
import org.json.*;
import org.skyscreamer.jsonassert.JSONCompare;
import org.skyscreamer.jsonassert.JSONCompareResult;
import org.skyscreamer.jsonassert.JSONCompareMode;
import org.skyscreamer.jsonassert.comparator.CustomComparator;
import org.skyscreamer.jsonassert.comparator.JSONComparator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jayway.jsonpath.JsonPath;

public class ApiComparisonProgram {
    private static final Set<String> IGNORED_PATHS = new HashSet<>(Arrays.asList(
        "$.timestamp",
        "$.metadata.requestId"
        // Add more paths to ignore here
    ));

    private static final String DB_URL = "jdbc:postgresql://your_host:5432/your_database";
    private static final String DB_USER = "your_username";
    private static final String DB_PASSWORD = "your_password";

    public static void main(String[] args) throws Exception {
        createComparisonResultTable();

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id, request_data FROM requests")) {

            while (rs.next()) {
                long requestId = rs.getLong("id");
                String requestData = rs.getString("request_data");
                processRequest(requestId, requestData, "https://api.env1.com", "https://api.env2.com");
            }
        }
    }

    private static void createComparisonResultTable() throws SQLException {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             Statement stmt = conn.createStatement()) {
            String sql = "CREATE TABLE IF NOT EXISTS comparison_results (" +
                         "id SERIAL PRIMARY KEY, " +
                         "request_id BIGINT, " +
                         "comparison_result BOOLEAN, " +
                         "differences JSONB, " +
                         "comparison_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
            stmt.execute(sql);
        }
    }

    private static void processRequest(long requestId, String requestData, String env1BaseUrl, String env2BaseUrl) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        String env1Response = makeApiCall(client, env1BaseUrl, requestData);
        String env2Response = makeApiCall(client, env2BaseUrl, requestData);

        JSONComparator comparator = new CustomComparator(JSONCompareMode.LENIENT, 
            (o1, o2) -> shouldIgnore(o1, o2) ? true : null);

        JSONCompareResult result = JSONCompare.compareJSON(env1Response, env2Response, comparator);

        boolean passed = result.passed();
        String differences = passed ? null : createDifferencesJson(result);

        writeResultToDatabase(requestId, passed, differences);

        if (passed) {
            System.out.println("Everything is alright for request ID: " + requestId);
        } else {
            System.out.println("Differences found for request ID: " + requestId);
        }
    }

    private static boolean shouldIgnore(Object o1, Object o2) {
        if (o1 instanceof String && o2 instanceof String) {
            for (String path : IGNORED_PATHS) {
                try {
                    if (JsonPath.parse(o1).read(path) != null || JsonPath.parse(o2).read(path) != null) {
                        return true;
                    }
                } catch (Exception e) {
                    // Path doesn't exist in this object, continue to next path
                }
            }
        }
        return false;
    }

    private static String makeApiCall(HttpClient client, String baseUrl, String requestData) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/endpoint"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestData))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    private static String createDifferencesJson(JSONCompareResult result) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode rootNode = mapper.createObjectNode();

        for (String field : result.getFieldFailures()) {
            String[] parts = field.split(":");
            String fieldName = parts[0].trim();
            String expectedValue = parts[1].trim();
            String actualValue = parts[2].trim();

            ObjectNode fieldNode = mapper.createObjectNode();
            fieldNode.put("left", expectedValue);
            fieldNode.put("right", actualValue);

            rootNode.set(fieldName, fieldNode);
        }

        return mapper.writeValueAsString(rootNode);
    }

    private static void writeResultToDatabase(long requestId, boolean passed, String differences) throws SQLException {
        String sql = "INSERT INTO comparison_results (request_id, comparison_result, differences) VALUES (?, ?, ?::jsonb)";
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setLong(1, requestId);
            pstmt.setBoolean(2, passed);
            pstmt.setObject(3, differences, Types.OTHER);
            pstmt.executeUpdate();
        }
    }
}
