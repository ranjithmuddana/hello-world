flowchart TB
    %% Define the first swimlane
    subgraph LANE1["Title A"]
        direction LR
        A1[Item A1]
        A2[Item A2]
    end

    %% Define the second swimlane
    subgraph LANE2["Title B"]
        direction LR
        B1[Item B1]
        B2[Item B2]
    end

    %% Define the third swimlane
    subgraph LANE3["Title C"]
        direction LR
        C1[Item C1]
        C2[Item C2]
    end

    %% Linking the items across lanes
    A1 --> B1
    B1 --> C1
    A2 --> B2
    B2 --> C2