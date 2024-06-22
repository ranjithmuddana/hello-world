#!/bin/bash

# Directories to skip (update with your specific directories)
declare -a directories_to_skip=(
    "directory1"
    "directory2"
    "directory3"
)

# Function to check if a directory should be skipped
should_skip_directory() {
    local dir="$1"
    for skip_dir in "${directories_to_skip[@]}"; do
        if [[ "$dir" == "$skip_dir" ]]; then
            return 0  # Skip directory
        fi
    done
    return 1  # Don't skip directory
}

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
    if should_skip_directory "$dir"; then
        echo "Skipping directory: $dir"
        continue
    fi

    build_project "$dir" &  # Run build_project function in background
    pids+=($!)  # Store the background process ID
done

# Wait for all background processes to complete
for pid in "${pids[@]}"; do
    wait "$pid"
done