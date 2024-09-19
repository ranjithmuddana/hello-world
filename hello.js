spring:
  r2dbc:
    url: r2dbc:pool:postgresql://localhost:5432/mydb
    username: myuser
    password: mypass
    pool:
      max-size: 20                          # Maximum number of connections in the pool
      initial-size: 10                       # Number of connections created at startup
      validation-query: SELECT 1             # Query to validate the connection
      max-idle-time: 30s                     # Max idle time before a connection is closed
      max-acquire-time: 5s                   # Maximum time to wait for acquiring a connection
      max-create-connection-time: 5s         # Time limit for creating a new connection
      acquire-retry: 3                       # Number of retries to acquire a connection
      connection-timeout: 10s                # Maximum wait time for a connection (new or existing)