import com.github.tomakehurst.wiremock.WireMockServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WireMockConfig {

    @Value("${wiremock.enabled}")
    private boolean isWireMockEnabled;

    @Value("${wiremock.server.port}")
    private int wireMockPort;

    @Value("${wiremock.server.context-path}")
    private String wireMockContextPath;

    @Bean(initMethod = "start", destroyMethod = "stop")
    public WireMockServer wireMockServer() {
        if (isWireMockEnabled) {
            WireMockServer wireMockServer = new WireMockServer(wireMockPort);
            wireMockServer.addMockServiceRequestListener(/* ... */);
            wireMockServer.setGlobalFixedDelay(/* ... */);
            // Configure additional WireMock settings as needed
            return wireMockServer;
        } else {
            return null;
        }
    }
}