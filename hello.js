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
        # Use basename to get the directory name without trailing slash
        local base_dir=$(basename "$skip_dir")
        if [[ "$dir" == "$base_dir" ]]; then
            return 0  # Skip directory
        fi
    done
    return 1  # Don't skip directory
}

# Function to build Maven project in a directory
build_project() {
    local dir="$1"
    local log_file="$dir/build.log"
    
    (
        cd "$dir" || exit
        echo "Building project in directory: $dir"
        echo "Logs will be saved to: $log_file"
        
        # Run Maven command and capture stdout and stderr to log file
        mvn clean install > "$log_file" 2>&1
        
        echo "Build process for directory $dir completed."
    ) &
    
    # Store the background process ID
    local pid=$!
    echo "Started build process for directory: $dir (PID: $pid)"
    echo "$pid" >> .pids  # Store PID in a file for later cleanup if needed
}

# Array to store background process IDs
declare -a pids

# Cleanup function to wait for all background processes to complete
cleanup() {
    echo "Waiting for background processes to complete..."
    for pid in $(cat .pids); do
        wait "$pid"
    done
    rm .pids  # Clean up PID file
    echo "All background processes completed."
}

# Trap signals to ensure cleanup even on script termination
trap cleanup EXIT

# Iterate over direct subdirectories and build projects in parallel
for dir in */; do
    if should_skip_directory "$(basename "$dir")"; then
        echo "Skipping directory: $dir"
        continue
    fi

    build_project "$dir"  # Run build_project function
    pids+=($!)  # Store the background process ID
done

# Wait for all background processes to complete
wait

# Final cleanup handled by trap on EXIT