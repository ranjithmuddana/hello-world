WITH raw_data AS (
    SELECT content
    FROM yaml_data
    WHERE id = 1
), extracted_items AS (
    SELECT
        substring(
            content FROM 
            'items:\s*((?:\s*-\s*\{[^}]+\}\s*)+)'
        ) AS items_block
    FROM raw_data
), cleaned_items AS (
    SELECT
        trim(both '{}' FROM unnest(regexp_split_to_array(
            regexp_replace(
                items_block,
                '\s*-\s*\{([^}]+)\}\s*',
                '\1',
                'g'
            ),
            '\},\s*\{'
        ))) AS item
    FROM extracted_items
), parsed_elements AS (
    SELECT
        trim(both ' ' FROM split_part(item, ',', 1)) AS element1,
        trim(both ' ' FROM split_part(item, ',', 2)) AS element2
    FROM cleaned_items
)
SELECT
    substring(element1 FROM 'element1:\s*(.*)') AS element1_value,
    substring(element2 FROM 'element2:\s*(.*)') AS element2_value
FROM parsed_elements;