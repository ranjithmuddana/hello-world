from collections import defaultdict

# Input data
data = [
    (1, "abc"),
    (2, "abd"),
    (1, "xyz"),
    (1, "dfg"),
    (2, "cfd"),
]

# Dictionary to store the result
result = defaultdict(list)

# Track the last segment seen
current_segment = None
group_index = defaultdict(int)

# Process the data
for segment, field in data:
    if segment != current_segment:  # Start a new group if the segment changes
        current_segment = segment
        group_index[segment] += 1
    key = f"{segment}_{group_index[segment] - 1}"
    result[key].append(field)

# Convert to a regular dictionary
final_result = dict(result)
print(final_result)