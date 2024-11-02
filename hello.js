WITH cleaned_data AS (
  SELECT ID, REMAINING_Data,
         -- Filter out null, empty, and non-numeric segments
         split(regexp_replace(coalesce(SEGMENTS, ''), '[^0-9,]', ''), ',') AS segments_array
  FROM dataFile
),
exploded_data AS (
  -- Explode the segments array to handle each segment separately
  SELECT ID, REMAINING_Data, CAST(segment AS INT) AS Segment
  FROM cleaned_data
  LATERAL VIEW explode(segments_array) AS segment
  WHERE segment != ''  -- Exclude any empty segments
),
matched_data AS (
  -- Join with layout data based on valid segments
  SELECT d.ID, l.Name,
         CASE
           WHEN l.Start IS NOT NULL AND l.Length IS NOT NULL THEN
             SUBSTRING(d.REMAINING_Data, l.Start + 1, l.Length)
           ELSE ''
         END AS Extracted_Data
  FROM exploded_data d
  LEFT JOIN layout l ON d.Segment = l.Segment
)
SELECT ID,
       MAX(CASE WHEN Name = 'v_A' THEN Extracted_Data ELSE '' END) AS v_A,
       MAX(CASE WHEN Name = 'v_b' THEN Extracted_Data ELSE '' END) AS v_b,
       MAX(CASE WHEN Name = 'v_A4' THEN Extracted_Data ELSE '' END) AS v_A4,
       MAX(CASE WHEN Name = 'v_B4' THEN Extracted_Data ELSE '' END) AS v_B4
FROM matched_data
GROUP BY ID