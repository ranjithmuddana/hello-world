flowchart LR
    %% Define the titles on the left side
    titleA["**Title A**"]
    titleB["**Title B**"]
    titleC["**Title C**"]

    %% Define the subgraphs
    subgraph A[" "]
        direction TB
        A1[Item A1]
        A2[Item A2]
    end

    subgraph B[" "]
        direction TB
        B1[Item B1]
        B2[Item B2]
    end

    subgraph C[" "]
        direction TB
        C1[Item C1]
        C2[Item C2]
    end

    %% Linking titles to subgraphs
    titleA --> A
    titleB --> B
    titleC --> C

    %% Linking the items between subgraphs
    A1 --> B1
    B1 --> C1
    A2 --> B2
    B2 --> C2