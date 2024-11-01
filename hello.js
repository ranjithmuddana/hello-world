-- Load the layout configuration
CREATE OR REPLACE TEMP VIEW layout AS
SELECT
    split(line, ',')[0] AS field_name,
    cast(split(line, ',')[1] AS INT) AS length
FROM
    (SELECT explode(split(file('layout.txt'), '\n')) AS line) AS tmp;

-- Load the first file into a DataFrame
CREATE OR REPLACE TEMP VIEW file1 AS
SELECT
    split(line, '\t')[0] AS id,
    split(line, '\t')[1] AS name,
    split(line, '\t')[2] AS age
FROM
    (SELECT explode(split(file('file1.txt'), '\n')) AS line) AS tmp;

-- Load the second file into a DataFrame
CREATE OR REPLACE TEMP VIEW file2 AS
SELECT
    split(line, '\t')[0] AS id,
    split(line, '\t')[1] AS age,
    split(line, '\t')[2] AS position,
    split(line, '\t')[3] AS hit_flag
FROM
    (SELECT explode(split(file('file2.txt'), '\n')) AS line) AS tmp;

-- Join file1 and file2 on ID
CREATE OR REPLACE TEMP VIEW joined_data AS
SELECT
    f1.id,
    f1.name,
    f1.age AS original_age,
    f2.age AS new_age,
    f2.position,
    f2.hit_flag
FROM
    file1 f1
JOIN
    file2 f2 ON f1.id = f2.id;

-- Process the joined data based on hit_flag and age conditions
CREATE OR REPLACE TEMP VIEW processed_data AS
SELECT
    id,
    name,
    CASE
        WHEN hit_flag <> '1' THEN ''  -- Blank if hit_flag is not '1'
        ELSE CASE WHEN f1.age = f2.age THEN f1.age ELSE '' END  -- Check age match
    END AS age,
    CASE
        WHEN hit_flag <> '1' THEN ''  -- Blank position if hit_flag is not '1'
        ELSE position
    END AS position,
    hit_flag
FROM
    joined_data;

-- Create the output based on layout
CREATE OR REPLACE TEMP VIEW output AS
SELECT
    id,
    name,
    age,
    position
FROM
    processed_data;

-- Final output with formatting based on the layout
SELECT
    l.field_name,
    CASE
        WHEN l.field_name = 'ID' THEN LPAD(id, l.length)
        WHEN l.field_name = 'Name' THEN LPAD(name, l.length)
        WHEN l.field_name = 'Age' THEN LPAD(age, l.length)
        WHEN l.field_name = 'Position' THEN LPAD(position, l.length)
        ELSE ''
    END AS value
FROM
    output o
CROSS JOIN layout l;

-- Counting records
SELECT
    COUNT(*) AS total_records,
    SUM(CASE WHEN hit_flag = '1' THEN 1 ELSE 0 END) AS total_hits,
    SUM(CASE WHEN hit_flag <> '1' THEN 1 ELSE 0 END) AS total_no_hits
FROM
    processed_data;