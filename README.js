sequenceDiagram
    participant A as App 1
    participant B as GCS Bucket
    participant C as Pub/Sub Topic
    participant D as App 2
    participant E as Memory Cache

    A->>B: Persist File Cache
    A->>C: Send Pub/Sub Message (Synchronous)
    C->>D: Notify App 2
    D->>E: Check Memory Cache
    E-->>D: Cache Hit (Return Data)
    E--X D: Cache Miss
    D->>B: Fetch from GCS
    B-->>D: Return Data
    D->>E: Load Data into Memory Cache
    D-->>Caller: Return Data

    note over B: 30-Day Retention Policy