import io.r2dbc.spi.ConnectionFactoryOptions;
import io.r2dbc.spi.ConnectionFactory;
import io.r2dbc.pool.PoolingConnectionFactoryProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.r2dbc.connection.R2dbcTransactionManager;
import org.springframework.transaction.ReactiveTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import java.time.Duration;

@Configuration
@EnableTransactionManagement
public class CustomR2dbcConfig {

    private final CustomR2dbcProperties customR2dbcProperties;

    public CustomR2dbcConfig(CustomR2dbcProperties customR2dbcProperties) {
        this.customR2dbcProperties = customR2dbcProperties;
    }

    @Bean
    public ConnectionFactory customConnectionFactory() {
        return ConnectionFactories.get(
            ConnectionFactoryOptions.builder()
                .option(ConnectionFactoryOptions.DRIVER, customR2dbcProperties.getDriver())
                .option(ConnectionFactoryOptions.HOST, customR2dbcProperties.getUrl())
                .option(ConnectionFactoryOptions.USER, customR2dbcProperties.getUsername())
                .option(ConnectionFactoryOptions.PASSWORD, customR2dbcProperties.getPassword())
                .option(PoolingConnectionFactoryProvider.VALIDATION_QUERY, customR2dbcProperties.getValidationQuery())
                .option(PoolingConnectionFactoryProvider.CONNECT_TIMEOUT, customR2dbcProperties.getConnectTimeout())
                .option(PoolingConnectionFactoryProvider.MAX_LIFETIME, customR2dbcProperties.getMaxLifetime())
                .build()
        );
    }

    @Bean
    public ReactiveTransactionManager customTransactionManager(ConnectionFactory connectionFactory) {
        return new R2dbcTransactionManager(connectionFactory);
    }
}