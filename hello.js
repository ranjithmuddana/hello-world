WITH raw_data AS (
    SELECT content
    FROM yaml_data
    WHERE id = 1
), extracted_items AS (
    SELECT
        regexp_split_to_table(
            regexp_replace(
                substring(content FROM 'items:(.*$)'),
                '\s*-\s*',
                '',
                'g'
            ),
            '\n\s*'
        ) AS item
    FROM raw_data
)
SELECT item
FROM extracted_items
WHERE item IS NOT NULL AND item <> '';