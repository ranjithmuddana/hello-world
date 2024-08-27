import re
from google.cloud import storage

def list_gcs_objects(bucket_name, nested_folder_prefix, include_pattern=None, exclude_pattern=None, list_type='both'):
    """
    List files or folders in a Google Cloud Storage bucket with include/exclude patterns.
    
    :param bucket_name: Name of the GCS bucket.
    :param nested_folder_prefix: Prefix of the folder to search within.
    :param include_pattern: Regex pattern to include specific files or folders.
    :param exclude_pattern: Regex pattern to exclude specific files or folders.
    :param list_type: 'files', 'folders', or 'both' to specify what to list.
    :return: List of matching files or folders.
    """
    # Initialize a client
    storage_client = storage.Client()

    # Ensure the prefix ends with a slash
    if not nested_folder_prefix.endswith('/'):
        nested_folder_prefix += '/'

    # List blobs with the given prefix
    blobs = storage_client.list_blobs(bucket_name, prefix=nested_folder_prefix)

    # Compile regex patterns
    include_regex = re.compile(include_pattern) if include_pattern else None
    exclude_regex = re.compile(exclude_pattern) if exclude_pattern else None

    matching_objects = []
    for blob in blobs:
        # Determine if the blob is a file or a folder
        is_folder = blob.name.endswith('/')

        # Apply the include/exclude logic
        if include_regex and not include_regex.search(blob.name):
            continue
        if exclude_regex and exclude_regex.search(blob.name):
            continue

        # Add based on list_type
        if list_type == 'files' and not is_folder:
            matching_objects.append(blob.name)
        elif list_type == 'folders' and is_folder:
            matching_objects.append(blob.name)
        elif list_type == 'both':
            matching_objects.append(blob.name)

    return matching_objects

# Example usage
bucket_name = 'your-bucket-name'
nested_folder_prefix = 'nested/folder/'  # Specify your nested folder here
include_pattern = r'.*\.csv$'  # Example: Include only CSV files
exclude_pattern = r'^nested/folder/exclude_this/'  # Example: Exclude a specific subdirectory
list_type = 'both'  # Options: 'files', 'folders', 'both'

matching_objects = list_gcs_objects(bucket_name, nested_folder_prefix, include_pattern, exclude_pattern, list_type)

print("Matching objects:")
for obj in matching_objects:
    print(obj)