from google.cloud import storage
import json
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

def update_tracking_file(bucket_name, tracking_file, uploaded_file):
    """Check and update the tracking file in GCS with atomic operations."""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(tracking_file)

    # Read the existing tracking file and its metadata
    if blob.exists():
        tracking_data = json.loads(blob.download_as_string())
        generation = blob.generation  # Get the current generation/version
    else:
        tracking_data = {"job_id": tracking_file.split("/")[-1], "file1": None, "file2": None, "status": "waiting"}
        generation = None

    # Update the tracking file with the uploaded file
    if not tracking_data["file1"]:
        tracking_data["file1"] = uploaded_file
    elif not tracking_data["file2"]:
        tracking_data["file2"] = uploaded_file

    # Update the status to 'ready' if both files are now present
    if tracking_data["file1"] and tracking_data["file2"]:
        tracking_data["status"] = "ready"

    # Write back the updated tracking file to GCS
    if generation:
        # Attempt the upload with retries
        try_upload(blob, tracking_data, generation)
    else:
        blob.upload_from_string(json.dumps(tracking_data))

    return tracking_data

@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),  # Exponential backoff
    stop=stop_after_attempt(5),  # Stop after 5 attempts
    retry=retry_if_exception_type(storage.exceptions.PreconditionFailed)  # Retry on specific exception
)
def try_upload(blob, tracking_data, generation):
    """Attempt to upload the tracking data to GCS with generation match."""
    blob.upload_from_string(
        json.dumps(tracking_data),
        if_generation_match=generation
    )