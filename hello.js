flowchart TB
    %% Define the main container (e.g., VPC or Project)
    subgraph MAIN["GCP Project"]
        
        %% Define a sub-container for a region (e.g., us-central1)
        subgraph REGION1["us-central1"]
            direction TB
            
            %% Define a sub-container for a VPC
            subgraph VPC1["VPC Network"]
                direction TB
                
                %% Define resources within the VPC
                VM1[Compute Engine VM 1]
                VM2[Compute Engine VM 2]
                LB[Load Balancer]
                
            end
        end

        %% Define another region or container
        subgraph REGION2["europe-west1"]
            direction TB
            
            %% Define another VPC or resources
            subgraph VPC2["VPC Network"]
                direction TB
                
                GKE[Google Kubernetes Engine]
                SQL[Cloud SQL]
                
            end
        end
    end

    %% Define connections between resources
    VM1 --> LB
    VM2 --> LB
    LB --> GKE
    GKE --> SQL