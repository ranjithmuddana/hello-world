SELECT 
  LPAD(CAST(ROW_NUMBER() OVER (ORDER BY RAND()) AS STRING), 11, '0') AS unique_seq_number
FROM your_table;