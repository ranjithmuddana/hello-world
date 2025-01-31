graph TD
    A[App 1] -->|Persist file cache| B[GCS Bucket]
    A -->|Send Pub/Sub Message| C[Pub/Sub Topic]
    C -->|Notify| D[App 2]
    D -->|Check Memory Cache| E{Memory Cache}
    E -- Hit --> F[Return Data]
    E -- Miss --> G[Fetch from GCS]
    G -->|Load into Memory Cache| E
    G --> F[Return Data]
    B -->|Retention Policy: 30 Days| X[Auto Delete Old Files]
    
    %% Styling for better visualization
    classDef app fill:#f9f,stroke:#333,stroke-width:2px;
    classDef storage fill:#9ff,stroke:#333,stroke-width:2px;
    classDef pubsub fill:#ff9,stroke:#333,stroke-width:2px;
    
    class A,D app;
    class B storage;
    class C pubsub;