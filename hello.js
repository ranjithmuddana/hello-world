import csv
from jinja2 import Template

# Step 1: Load layout data from CSV file
layout = []
with open("layout.csv", mode="r") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        # Convert each field to the appropriate type (Segment, Length, and Start are integers)
        row['Segment'] = int(row['Segment'])
        row['Length'] = int(row['Length'])
        row['Start'] = int(row['Start'])
        layout.append(row)

# Step 2: Organize layout data by segments
segments = {}
for item in layout:
    segment = item["Segment"]
    if segment not in segments:
        segments[segment] = []
    segments[segment].append(item)

# Step 3: Use Jinja template for CTE generation and query building without `GROUP BY ID`
template = Template("""
{% for segment, fields in segments.items() %}
segment_{{ segment }} AS (
    SELECT ID,
           {% for field in fields %}
           MAX(CASE WHEN array_contains(split(SEGMENTS, ','), '{{ segment }}') THEN SUBSTRING(REMAINING_Data, {{ field['Start'] + 1 }}, {{ field['Length'] }}) ELSE '' END) AS {{ field['Name'] }}
           {% if not loop.last %}, {% endif %}
           {% endfor %}
    FROM dataFile
    WHERE array_contains(split(SEGMENTS, ','), '{{ segment }}')
){% if not loop.last %}, {% endif %}
{% endfor %}

SELECT COALESCE({{ segment_ids | join(', ') }}) AS ID,
       {% for field in all_fields %}
       COALESCE({{ field | join(', ') }}) AS {{ field }}
       {% if not loop.last %}, {% endif %}
       {% endfor %}
FROM {{ segment_ids | join(' FULL OUTER JOIN ') }}
ON {{ join_conditions | join(' = ') }}
""")

# Step 4: Define fields and join conditions for final select
all_fields = sorted(set(item["Name"] for item in layout))
segment_ids = [f"segment_{segment}.ID" for segment in segments]
field_joins = {field: [f"segment_{segment}.{field}" for segment in segments if any(f["Name"] == field for f in segments[segment])] for field in all_fields}

# Render the query using the Jinja template
query = template.render(
    segments=segments,
    segment_ids=segment_ids,
    all_fields=[field_joins[field] for field in all_fields]
)

# Save the generated query to a text file
with open("generated_query.sql", "w") as f:
    f.write(query)

print("Generated SQL Query:")
print(query)