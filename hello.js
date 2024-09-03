from google.cloud import storage

def move_gcs(source_uri, destination_uri):
    # Initialize the client
    client = storage.Client()

    # Parse the source and destination URIs
    source_bucket_name, source_path = source_uri.replace("gs://", "").split("/", 1)
    destination_bucket_name, destination_path = destination_uri.replace("gs://", "").split("/", 1)

    # Get the source bucket
    source_bucket = client.bucket(source_bucket_name)

    # Determine if the source is a single file or a folder
    blobs = list(source_bucket.list_blobs(prefix=source_path))

    if not blobs:
        print(f"No files found at {source_uri}")
        return

    # If the source is a single file, blobs will contain only one item with an exact name match
    if len(blobs) == 1 and blobs[0].name == source_path:
        # Single file move
        move_gcs_file(source_bucket, blobs[0], destination_bucket_name, destination_path)
    else:
        # Folder move (or multi-file move)
        for blob in blobs:
            # Construct the destination blob name by replacing the source prefix with the destination prefix
            relative_path = blob.name[len(source_path):]  # Get the relative path after the source prefix
            destination_blob_name = destination_path + relative_path

            move_gcs_file(source_bucket, blob, destination_bucket_name, destination_blob_name)

def move_gcs_file(source_bucket, source_blob, destination_bucket_name, destination_blob_name):
    # Get the destination bucket
    destination_bucket = source_bucket.client.bucket(destination_bucket_name)

    # Copy the blob to the new location
    destination_blob = destination_bucket.blob(destination_blob_name)
    source_bucket.copy_blob(source_blob, destination_bucket, destination_blob_name)

    # Delete the source blob
    source_blob.delete()

    print(f"Moved {source_blob.name} to {destination_blob_name}")

# Example usage for moving a file
source = "gs://source-bucket/folder/nested/test-r-001.avro"
destination = "gs://destination-bucket/folder/moved/test-r-001.avro"
move_gcs(source, destination)

# Example usage for moving a folder
source_folder = "gs://source-bucket/folder/nested/"
destination_folder = "gs://destination-bucket/folder/moved/"
move_gcs(source_folder, destination_folder)