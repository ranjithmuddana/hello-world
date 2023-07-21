import com.google.cloud.logging.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class GoogleCloudLoggingServiceTest {

    private static final String PROJECT_ID = "your-project-id";
    private GoogleCloudLoggingService loggingService;
    private Logging mockLogging;

    @BeforeEach
    public void setup() {
        // Create the mock object for Logging
        mockLogging = mock(Logging.class);

        // Create the GoogleCloudLoggingService instance
        loggingService = new GoogleCloudLoggingService(PROJECT_ID);
    }

    @Test
    public void testListLogEntries() {
        // Create a list of log entries to be returned by the mock Logging
        List<LogEntry> expectedLogEntries = Arrays.asList(
                LogEntry.newBuilder(StringPayload.of("Log entry 1")).build(),
                LogEntry.newBuilder(StringPayload.of("Log entry 2")).build()
        );

        // Simulate a successful response without any exceptions
        when(mockLogging.listLogEntries(any(), any()))
                .thenReturn(expectedLogEntries);

        // Replace "your-log-name" with the actual name of the log you want to read
        String logName = "projects/your-project-id/logs/your-log-name";

        // Define the filtering options if needed
        LogEntryListOption[] options = {
                LogEntryListOption.filter("severity=ERROR"), // Filter by severity if needed
                LogEntryListOption.option(LogEntryListOption.OptionType.DESCENDING) // Sort by descending order if needed
        };

        // Create the GoogleCloudLoggingService instance with the mock Logging
        loggingService = new GoogleCloudLoggingService(PROJECT_ID);
        // Set the mock Logging object in the GoogleCloudLoggingService instance
        ((GoogleCloudLoggingService) loggingService).setLoggingClient(mockLogging);

        // Call the method to read the log entries
        List<LogEntry> logEntries = loggingService.listLogEntries(logName, options);

        // Verify that the method was called once
        verify(mockLogging, times(1)).listLogEntries(eq(logName), eq(options));

        // Assert that the method returns the expected log entries
        assertEquals(expectedLogEntries, logEntries);
    }
}