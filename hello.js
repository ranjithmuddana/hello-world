import xlsxwriter
from google.cloud import storage

def create_excel_file(file_name):
    """Create an Excel file with dummy data."""
    workbook = xlsxwriter.Workbook(file_name)
    worksheet = workbook.add_worksheet('Sheet1')

    # Define some dummy data
    headers = ['ID', 'Name', 'Age', 'Country']
    data = [
        [1, 'Alice', 30, 'USA'],
        [2, 'Bob', 25, 'Canada'],
        [3, 'Charlie', 35, 'UK'],
        [4, 'Diana', 28, 'Australia'],
        [5, 'Eve', 22, 'Germany']
    ]

    # Write the headers
    for col, header in enumerate(headers):
        worksheet.write(0, col, header)

    # Write the data
    for row, record in enumerate(data, start=1):
        for col, value in enumerate(record):
            worksheet.write(row, col, value)

    workbook.close()
    print(f"Excel file '{file_name}' created successfully.")

def upload_to_gcs(bucket_name, source_file_name, destination_blob_name):
    """Upload a file to GCS."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_name)
    print(f"File '{source_file_name}' uploaded to 'gs://{bucket_name}/{destination_blob_name}'.")

if __name__ == "__main__":
    # File and GCS configuration
    local_file_name = "dummy_data.xlsx"
    bucket_name = "<YOUR_BUCKET_NAME>"  # Replace with your GCS bucket name
    destination_blob_name = "<YOUR_FILE_PATH>/dummy_data.xlsx"  # Replace with your desired file path in the bucket

    # Create the Excel file locally
    create_excel_file(local_file_name)

    # Upload the Excel file to GCS
    upload_to_gcs(bucket_name, local_file_name, destination_blob_name)