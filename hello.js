import com.google.api.gax.retrying.RetrySettings;
import com.google.cloud.logging.LogEntry;
import com.google.cloud.logging.LogEntryListOption;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class GoogleCloudLoggingServiceTest {

    private static final String PROJECT_ID = "your-project-id";

    // The @InjectMocks annotation injects the GoogleCloudLoggingService into the class under test
    private GoogleCloudLoggingService loggingService;

    // The @Mock annotation creates a mock object for the Google Cloud Logging client library
    private Logging mockLogging;

    @BeforeEach
    public void setup() {
        // Create the mock object for Logging
        mockLogging = mock(Logging.class);

        // Create the GoogleCloudLoggingService instance with default retry settings
        loggingService = new GoogleCloudLoggingService(PROJECT_ID, mockLogging);
    }

    @Test
    public void testListLogEntries_DefaultRetrySettings() {
        // Create a list of log entries to be returned by the mock Logging
        List<LogEntry> expectedLogEntries = Arrays.asList(
                new LogEntry(),
                new LogEntry()
        );

        // Simulate a successful response without any exceptions
        when(mockLogging.listLogEntries(any(), any()))
                .thenReturn(expectedLogEntries);

        // Call the method to be tested
        List<LogEntry> logEntries = loggingService.listLogEntries("projects/your-project-id/logs/your-log-name",
                LogEntryListOption.filter("severity=ERROR"),
                LogEntryListOption.option(LogEntryListOption.OptionType.DESCENDING));

        // Assert that the method returns the expected log entries
        assertEquals(expectedLogEntries, logEntries);
    }

    @Test
    public void testListLogEntries_CustomRetrySettings() {
        // Create a list of log entries to be returned by the mock Logging
        List<LogEntry> expectedLogEntries = Arrays.asList(
                new LogEntry(),
                new LogEntry()
        );

        // Create custom retry settings
        RetrySettings retrySettings = RetrySettings.newBuilder()
                .setTotalTimeout(TimeUnit.SECONDS.toMillis(15))
                .setMaxRetryDelay(TimeUnit.SECONDS.toMillis(5))
                .setRetryableCodes(Arrays.asList(Code.UNAVAILABLE, Code.DEADLINE_EXCEEDED))
                .build();

        // Create a new GoogleCloudLoggingService instance with custom retry settings
        loggingService = new GoogleCloudLoggingService(PROJECT_ID, retrySettings, mockLogging);

        // Simulate an exception on the first invocation and a successful response on the second invocation
        when(mockLogging.listLogEntries(any(), any()))
                .thenThrow(new RuntimeException("Service unavailable"))
                .thenReturn(expectedLogEntries);

        // Call the method to be tested
        List<LogEntry> logEntries = loggingService.listLogEntries("projects/your-project-id/logs/your-log-name",
                LogEntryListOption.filter("severity=ERROR"),
                LogEntryListOption.option(LogEntryListOption.OptionType.DESCENDING));

        // Verify that the method retries two times (initial invocation + one retry)
        verify(mockLogging, times(2)).listLogEntries(any(), any());

        // Assert that the method returns the expected log entries after successful retry
        assertEquals(expectedLogEntries, logEntries);
    }

    @Test
    public void testListLogEntries_CustomRetrySettings_Failure() {
        // Create custom retry settings with shorter timeout
        RetrySettings retrySettings = RetrySettings.newBuilder()
                .setTotalTimeout(TimeUnit.SECONDS.toMillis(5))
                .setMaxRetryDelay(TimeUnit.SECONDS.toMillis(2))
                .setRetryableCodes(Arrays.asList(Code.UNAVAILABLE, Code.DEADLINE_EXCEEDED))
                .build();

        // Create a new GoogleCloudLoggingService instance with custom retry settings
        loggingService = new GoogleCloudLoggingService(PROJECT_ID, retrySettings, mockLogging);

        // Simulate an exception for all retry attempts
        when(mockLogging.listLogEntries(any(), any()))
                .thenThrow(new RuntimeException("Service unavailable"))
                .thenThrow(new RuntimeException("Service temporarily unavailable"))
                .thenThrow(new RuntimeException("Service still unavailable"));

        // Call the method to be tested
        List<LogEntry> logEntries = loggingService.listLogEntries("projects/your-project-id/logs/your-log-name",
                LogEntryListOption.filter("severity=ERROR"),
                LogEntryListOption.option(LogEntryListOption.OptionType.DESCENDING));

        // Verify that the method retries three times (initial invocation + two retries)
        verify(mockLogging, times(3)).listLogEntries(any(), any());

        // Assert that the method returns an empty list after exhausting all retries
        assertEquals(Collections.emptyList(), logEntries);
    }
}