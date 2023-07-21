import com.google.api.gax.paging.Page;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.LogEntryListOption;
import com.google.cloud.logging.Logger;
import com.google.cloud.logging.Severity;
import com.google.cloud.logging.v2.LoggingClient;
import com.google.cloud.logging.v2.LoggingSettings;
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
        this.logging = LoggingOptions.newBuilder().setRetrySettings(LoggingSettings.defaultRetrySettings()).build().getService();
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