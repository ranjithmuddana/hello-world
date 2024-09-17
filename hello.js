ConnectionFactory connectionFactory = ConnectionFactories.get(
    ConnectionFactoryOptions.builder()
        .option(ConnectionFactoryOptions.DRIVER, "pool")
        .option(ConnectionFactoryOptions.PROTOCOL, "postgresql")  // Change based on your DB
        .option(ConnectionFactoryOptions.HOST, "your-db-host")
        .option(ConnectionFactoryOptions.USER, "your-username")
        .option(ConnectionFactoryOptions.PASSWORD, "your-password")
        .option(ConnectionFactoryOptions.DATABASE, "your-database")
        // Pool settings
        .option(ConnectionFactoryOptions.POOL_INITIAL_SIZE, 10)
        .option(ConnectionFactoryOptions.POOL_MAX_SIZE, 50)
        .option(ConnectionFactoryOptions.POOL_MAX_IDLE_TIME, Duration.ofMinutes(1))
        .option(ConnectionFactoryOptions.POOL_MAX_LIFE_TIME, Duration.ofMinutes(30))
        .option(ConnectionFactoryOptions.POOL_VALIDATION_QUERY, "SELECT 1")
        .build()
);