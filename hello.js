import com.google.api.gax.core.RetrySettings;
import com.google.api.gax.paging.Page;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.LogEntryListOption;
import com.google.cloud.logging.Logger;
import com.google.cloud.logging.Severity;
import com.google.common.collect.Lists;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class GcpReadLogsService {
    private final Logging logging;
    private final String project;

    public GcpReadLogsService() throws IOException {
        this.project = "your-project-id"; // Replace with your GCP project ID
        this.logging = createLoggingClientWithRetrySettings();
    }

    private Logging createLoggingClientWithRetrySettings() {
        RetrySettings retrySettings = RetrySettings.newBuilder()
                .setInitialRetryDelayMillis(1000) // 1 second initial delay
                .setMaxRetryDelayMillis(30000)    // 30 seconds maximum delay
                .setTotalTimeoutMillis(600000)    // 10 minutes total timeout
                .setInitialRpcTimeoutMillis(5000) // 5 seconds initial RPC timeout
                .setMaxRpcTimeoutMillis(30000)    // 30 seconds maximum RPC timeout
                .setRetryDelayMultiplier(1.3)     // Exponential backoff multiplier
                .setRpcTimeoutMultiplier(1.5)     // RPC timeout multiplier
                .setMaxAttempts(5)                // Maximum number of retry attempts
                .build();

        LoggingOptions loggingOptions = LoggingOptions.newBuilder()
                .setRetrySettings(retrySettings)
                .build();

        return loggingOptions.getService();
    }

    public List<LogEntry> readLogs(String logResource, String filterStr, LoggingOptions options) {
        List<LogEntry> logs = Lists.newArrayList();
        Logger logger = logging.getLogger(logResource);

        try {
            Page<LogEntry> entries = logging.listLogEntries(
                    LogEntryListOption.filter(filterStr),
                    LogEntryListOption.resource(logger),
                    options
            );
            entries.iterateAll().forEach(logs::add);
        } catch (Exception e) {
            System.err.println("Error occurred: " + e.getMessage());
        }

        return logs;
    }

    // You can add additional methods here if needed.
}