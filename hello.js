from google.cloud import storage
import json

# GCS bucket and file names
bucket_name = "your-bucket-name"
source_file = "source.json"  # The first JSON file with multiple keys
target_file = "target.json"  # The second JSON file to be updated

# Initialize GCS client
client = storage.Client()

# Function to read a JSON file from GCS
def read_json_from_gcs(bucket_name, file_name):
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    content = blob.download_as_text()
    return json.loads(content)

# Function to write a JSON file to GCS
def write_json_to_gcs(bucket_name, file_name, data):
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    blob.upload_from_string(json.dumps(data, indent=4), content_type="application/json")

# Read source and target JSONs from GCS
source_data = read_json_from_gcs(bucket_name, source_file)
target_data = read_json_from_gcs(bucket_name, target_file)

# Add all keys from source.json to the "01" element of target.json
if "01" in target_data:
    target_data["01"].update(source_data)  # Add/merge all key-value pairs from source.json

# Write the updated JSON back to GCS
write_json_to_gcs(bucket_name, target_file, target_data)

print("Target JSON updated with all keys from source JSON.")