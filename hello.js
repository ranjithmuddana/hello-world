WITH raw_data AS (
    SELECT content
    FROM yaml_data
    WHERE id = 1
), extracted_items AS (
    SELECT
        regexp_matches(
            content,
            'items:\s*(-\s*\{[^}]+\}\s*)+',
            'g'
        ) AS items_block
    FROM raw_data
), items_list AS (
    SELECT
        regexp_split_to_table(
            regexp_replace(
                items_block[1],
                '-\s*\{([^}]+)\}',
                '\1',
                'g'
            ),
            '\n\s*-'
        ) AS item
    FROM extracted_items
), parsed_items AS (
    SELECT
        regexp_matches(
            item,
            'element1:\s*([^,]+),\s*element2:\s*([^}]+)',
            'g'
        ) AS elements
    FROM items_list
)
SELECT
    elements[1] AS element1,
    elements[2] AS element2
FROM parsed_items;