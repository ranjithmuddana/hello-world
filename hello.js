import io
import xlsxwriter
from google.cloud import storage

def create_excel_file_in_memory():
    """Create an Excel file in memory and return it as a BytesIO object."""
    output = io.BytesIO()  # In-memory bytes buffer
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
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
    output.seek(0)  # Reset buffer pointer to the beginning
    return output

def upload_to_gcs(bucket_name, destination_blob_name, data_buffer):
    """Upload a BytesIO buffer directly to GCS."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_file(data_buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    print(f"File uploaded to 'gs://{bucket_name}/{destination_blob_name}'.")

if __name__ == "__main__":
    # GCS configuration
    bucket_name = "<YOUR_BUCKET_NAME>"  # Replace with your GCS bucket name
    destination_blob_name = "<YOUR_FILE_PATH>/dummy_data.xlsx"  # Replace with your desired file path in the bucket

    # Create the Excel file in memory
    excel_buffer = create_excel_file_in_memory()

    # Upload the Excel file directly to GCS
    upload_to_gcs(bucket_name, destination_blob_name, excel_buffer)