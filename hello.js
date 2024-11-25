import xlsxwriter

# Create a new Excel file and add a worksheet
workbook = xlsxwriter.Workbook('dummy_data.xlsx')
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

# Close the workbook
workbook.close()

print("Excel file 'dummy_data.xlsx' created successfully.")