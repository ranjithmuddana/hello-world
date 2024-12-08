import pytest
from unittest.mock import MagicMock, patch
from google.cloud import storage
from google.cloud.exceptions import PreconditionFailed
import json
from your_module import update_tracking_file, try_upload

@pytest.fixture
def mock_storage_client():
    """Mock the GCS Client."""
    with patch("your_module.storage.Client") as mock_client:
        yield mock_client

def test_update_tracking_file_new_file(mock_storage_client):
    """Test creating a new tracking file."""
    # Setup mock GCS behavior
    mock_blob = MagicMock()
    mock_bucket = MagicMock()
    mock_storage_client().bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False  # Simulate no existing file

    bucket_name = "test-bucket"
    tracking_file = "tracking/job-123.json"
    uploaded_file = "gs://test-bucket/path/to/file1"

    # Call the function
    result = update_tracking_file(bucket_name, tracking_file, uploaded_file)

    # Verify the file was created with expected content
    expected_content = {
        "job_id": "job-123",
        "file1": "gs://test-bucket/path/to/file1",
        "file2": None,
        "status": "waiting",
    }
    mock_blob.upload_from_string.assert_called_once_with(json.dumps(expected_content))
    assert result == expected_content

def test_update_tracking_file_existing_file(mock_storage_client):
    """Test updating an existing tracking file."""
    # Setup mock GCS behavior
    mock_blob = MagicMock()
    mock_bucket = MagicMock()
    mock_storage_client().bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True  # Simulate file exists

    # Simulate existing tracking file content
    existing_content = {
        "job_id": "job-123",
        "file1": "gs://test-bucket/path/to/file1",
        "file2": None,
        "status": "waiting",
    }
    mock_blob.download_as_string.return_value = json.dumps(existing_content)

    bucket_name = "test-bucket"
    tracking_file = "tracking/job-123.json"
    uploaded_file = "gs://test-bucket/path/to/file2"

    # Call the function
    result = update_tracking_file(bucket_name, tracking_file, uploaded_file)

    # Verify the file was updated with expected content
    expected_content = {
        "job_id": "job-123",
        "file1": "gs://test-bucket/path/to/file1",
        "file2": "gs://test-bucket/path/to/file2",
        "status": "ready",
    }
    mock_blob.upload_from_string.assert_called_once_with(json.dumps(expected_content))
    assert result == expected_content

def test_try_upload_with_precondition_failed():
    """Test try_upload retry logic when PreconditionFailed occurs."""
    # Setup mock blob
    mock_blob = MagicMock()

    # Simulate PreconditionFailed on first two attempts, then success
    mock_blob.upload_from_string.side_effect = [
        PreconditionFailed("Precondition failed"),
        PreconditionFailed("Precondition failed"),
        None,
    ]

    tracking_data = {"job_id": "job-123", "file1": "file1", "file2": "file2", "status": "ready"}
    generation = 12345

    # Call the retry logic
    try_upload(mock_blob, tracking_data, generation)

    # Verify upload was retried 3 times
    assert mock_blob.upload_from_string.call_count == 3
    mock_blob.upload_from_string.assert_called_with(
        json.dumps(tracking_data),
        if_generation_match=generation,
    )

def test_try_upload_exceeds_retries():
    """Test try_upload fails after exceeding retries."""
    # Setup mock blob
    mock_blob = MagicMock()

    # Simulate PreconditionFailed on all attempts
    mock_blob.upload_from_string.side_effect = PreconditionFailed("Precondition failed")

    tracking_data = {"job_id": "job-123", "file1": "file1", "file2": "file2", "status": "ready"}
    generation = 12345

    # Expect an exception after retries are exhausted
    with pytest.raises(PreconditionFailed):
        try_upload(mock_blob, tracking_data, generation)

    # Verify the upload was retried 5 times
    assert mock_blob.upload_from_string.call_count == 5