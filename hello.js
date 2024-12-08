import threading
import json
from google.cloud import storage
import pytest
from your_module import update_tracking_file

BUCKET_NAME = "test-tracking-bucket"  # Replace with your GCS test bucket
TRACKING_FILE = "tracking/test-job.json"

def simulate_file_upload(uploaded_file):
    """Simulates a single file upload."""
    update_tracking_file(BUCKET_NAME, TRACKING_FILE, uploaded_file)

@pytest.fixture(scope="function")
def setup_gcs():
    """Sets up a clean environment for the test."""
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(TRACKING_FILE)

    # Ensure the tracking file does not exist before the test
    if blob.exists():
        blob.delete()

    # Yield control to the test
    yield

    # Clean up after the test
    if blob.exists():
        blob.delete()

def test_concurrent_file_uploads(setup_gcs):
    """Test concurrent updates to the tracking file."""
    # Define the file uploads
    file1 = "gs://test-tracking-bucket/path/to/file1"
    file2 = "gs://test-tracking-bucket/path/to/file2"

    # Create threads to simulate concurrent updates
    thread1 = threading.Thread(target=simulate_file_upload, args=(file1,))
    thread2 = threading.Thread(target=simulate_file_upload, args=(file2,))

    # Start the threads
    thread1.start()
    thread2.start()

    # Wait for both threads to finish
    thread1.join()
    thread2.join()

    # Verify the result in the tracking file
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(TRACKING_FILE)

    assert blob.exists(), "Tracking file was not created."

    # Load the tracking file content
    tracking_data = json.loads(blob.download_as_string())
    assert tracking_data["file1"] == file1 or tracking_data["file1"] == file2
    assert tracking_data["file2"] == file1 or tracking_data["file2"] == file2
    assert tracking_data["file1"] != tracking_data["file2"]
    assert tracking_data["status"] == "ready"