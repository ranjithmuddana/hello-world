from datetime import datetime

# Example dates
date1 = datetime(2025, 1, 13, 15, 0)  # Example: January 13, 2025, 3:00 PM
date2 = datetime(2025, 1, 14, 10, 0)  # Example: January 14, 2025, 10:00 AM

# Calculate the difference in hours
hours_difference = int((date2 - date1).total_seconds() / 3600)

print("Difference in hours:", hours_difference)