{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "java",
            "name": "Run Spring Boot WAR with Debug",
            "request": "launch",
            "console": "integratedTerminal",
            "program": "java",
            "args": [
                "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005",
                "-jar",
                "${workspaceFolder}/path/to/your-application.war"
            ]
        }
    ]
}