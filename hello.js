#!/bin/bash

# File to store directories of failed builds
FAILED_BUILDS_FILE=".failed_builds"

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
        local status=$?

        if [[ $status -ne 0 ]]; then
            echo "Build failed for directory: $dir (see $log_file for details)"
            echo "$dir" >> "$FAILED_BUILDS_FILE"  # Record the failed build directory
        else
            echo "Build succeeded for directory: $dir"
        fi
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

# Determine whether to rebuild only failed projects
rebuild_failed=false
if [[ "$1" == "--retry-failed" ]]; then
    rebuild_failed=true
fi

# Iterate over direct subdirectories and build projects in parallel
if $rebuild_failed && [[ -f "$FAILED_BUILDS_FILE" ]]; then
    echo "Rebuilding only failed projects..."
    directories=$(cat "$FAILED_BUILDS_FILE")
else
    echo "Building all projects..."
    directories=$(ls -d */)
    # Clear the failed builds file at the beginning of a full build
    > "$FAILED_BUILDS_FILE"
fi

for dir in $directories; do
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