WITH raw_data AS (
    SELECT content
    FROM yaml_data
    WHERE id = 1
), extracted_items AS (
    SELECT
        substring(
            content FROM 
            'items:\s*((?:\s*-\s*\S+\s*)+)'
        ) AS items_block
    FROM raw_data
), cleaned_items AS (
    SELECT
        regexp_split_to_table(
            regexp_replace(
                items_block,
                '\s*-\s*',
                '',
                'g'
            ),
            '\s+'
        ) AS item
    FROM extracted_items
)
SELECT item
FROM cleaned_items
WHERE item IS NOT NULL AND item <> '';