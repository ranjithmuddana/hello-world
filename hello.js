#!/bin/bash

# Function to build Maven project in a directory
build_project() {
    local dir="$1"
    (
        cd "$dir" || exit
        echo "Building project in directory: $dir"
        mvn clean install
    )
}

# Array to store background process IDs
declare -a pids

# Iterate over direct subdirectories and build projects in parallel
for dir in */; do
    build_project "$dir" &  # Run build_project function in background
    pids+=($!)  # Store the background process ID
done

# Wait for all background processes to complete
for pid in "${pids[@]}"; do
    wait "$pid"
done