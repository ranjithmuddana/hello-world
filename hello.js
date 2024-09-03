from google.cloud import storage
import re

def move_gcs(source_uri, destination_uri):
    # Initialize the client
    client = storage.Client()

    # Parse the source and destination URIs
    source_bucket_name, source_path = source_uri.replace("gs://", "").split("/", 1)
    destination_bucket_name, destination_path = destination_uri.replace("gs://", "").split("/", 1)

    # Get the source and destination buckets
    source_bucket = client.bucket(source_bucket_name)
    destination_bucket = client.bucket(destination_bucket_name)

    # Check if source is a single file or a folder
    blobs = list(source_bucket.list_blobs(prefix=source_path))

    if not blobs:
        print(f"No files found at {source_uri}")
        return

    # Check if the source is a single file
    if len(blobs) == 1 and blobs[0].name == source_path:
        move_gcs_file(source_bucket, blobs[0], destination_bucket_name, destination_path)
    else:
        # Handle folder (multiple files) - Move each file
        for blob in blobs:
            # Construct the destination blob name by replacing the source prefix with the destination prefix
            relative_path = blob.name[len(source_path):]  # Get the relative path after the source prefix
            destination_blob_name = destination_path + relative_path

            move_gcs_file(source_bucket, blob, destination_bucket_name, destination_blob_name)

def move_gcs_file(source_bucket, source_blob, destination_bucket_name, destination_blob_name):
    # Get the destination bucket and blob
    destination_bucket = source_bucket.client.bucket(destination_bucket_name)
    destination_blob = destination_bucket.blob(destination_blob_name)

    # Copy the source blob to the destination
    source_bucket.copy_blob(source_blob, destination_bucket, destination_blob_name)

    # Delete the source blob
    source_blob.delete()

    print(f"Moved {source_blob.name} to {destination_blob_name}")

# Example usage
source_1 = "gs://folder/nestedfolder/header/test-r-155225.txt"
destination_1 = "gs://folder/nestedfolder/data/header.csv"
move_gcs(source_1, destination_1)

source_folder = "gs://folder/nestedfolder/"
destination_folder = "gs://folder/nestedfolder/data/"
move_gcs(source_folder, destination_folder)

source_2 = "gs://folder/nestedfolder2/header/test-r-125525.txt"
destination_2 = "gs://folder/nestedfolder2/data/header.csv"
move_gcs(source_2, destination_2)