from collections import defaultdict

# Input data
data = [
    (1, "abc"),
    (2, "abd"),
    (1, "xyz"),
    (1, "dfg"),
    (2, "cfd"),
]

# Dictionary to store grouped fields
result = defaultdict(list)

# Track the current group index for each segment
group_index = defaultdict(int)

# Process the data
for segment, field in data:
    key = f"{segment}_{group_index[segment]}"
    result[key].append(field)
    # Increment the group index when a new segment appears
    if len(result[key]) > 1:
        group_index[segment] += 1

# Convert defaultdict to a standard dictionary for the final output
final_result = dict(result)
print(final_result)