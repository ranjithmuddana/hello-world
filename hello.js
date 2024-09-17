ConnectionFactory connectionFactory = ConnectionFactories.get(
    "r2dbc:pool:postgresql://username:password@host:5432/database" +
    "?maxSize=20" +
    "&initialSize=10" +
    "&validationQuery=SELECT 1" +
    "&maxIdleTime=30s" +
    "&maxLifeTime=30m"
);