flowchart TB
    subgraph A[ ]
        direction TB
        titleA1[**Title A1**]
        A1[Item A1]
        A2[Item A2]
    end

    subgraph B[ ]
        direction TB
        titleB1[**Title B1**]
        B1[Item B1]
        B2[Item B2]
    end

    subgraph C[ ]
        direction TB
        titleC1[**Title C1**]
        C1[Item C1]
        C2[Item C2]
    end

    %% Linking the items between subgraphs
    A1 --> B1
    B1 --> C1
    A2 --> B2
    B2 --> C2