#!/bin/bash

# Specify the source file and destination directory
source_file="gs://your-bucket/path/to/part-r-00003.dat"
destination_directory="gs://your-bucket/path/to/destination/"

# Specify the number of copies you want
num_copies=10

# Loop to create and copy files with incremented numbers
for ((i=1; i<=$num_copies; i++)); do
  incremented_number=$(printf "%05d" $i)
  destination_file="${destination_directory}part-r-${incremented_number}.dat"
  gsutil cp "$source_file" "$destination_file"
done