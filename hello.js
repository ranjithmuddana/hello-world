val columnNames = Seq("v_A", "v_b", "v_A4", "v_B4") // Expand this list as needed
val caseStatements = columnNames.map(name => s"MAX(CASE WHEN Name = '$name' THEN Extracted_Data ELSE NULL END) AS $name").mkString(", ")

val finalQuery = s"""
WITH cleaned_data AS (
  SELECT ID, REMAINING_Data,
         split(regexp_replace(coalesce(SEGMENTS, ''), '[^0-9,]', ''), ',') AS segments_array
  FROM dataFile
),
exploded_data AS (
  SELECT ID, REMAINING_Data, CAST(segment AS INT) AS Segment
  FROM cleaned_data
  LATERAL VIEW explode(segments_array) AS segment
  WHERE segment != ''
),
matched_data AS (
  SELECT d.ID, l.Name,
         CASE
           WHEN l.Start IS NOT NULL AND l.Length IS NOT NULL THEN
             SUBSTRING(d.REMAINING_Data, l.Start + 1, l.Length)
           ELSE ''
         END AS Extracted_Data
  FROM exploded_data d
  LEFT JOIN layout l ON d.Segment = l.Segment
)
SELECT ID, $caseStatements
FROM matched_data
GROUP BY ID
"""

// Execute the finalQuery using Spark SQL
spark.sql(finalQuery)