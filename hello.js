CREATE OR REPLACE FUNCTION yaml_to_json_items(yaml_text TEXT)
RETURNS JSONB AS $$
DECLARE
    items_block TEXT;
    json_text TEXT;
BEGIN
    -- Extract the block under 'items:' using regexp_match
    SELECT INTO items_block
        (regexp_match(yaml_text, 'items:\s*((?:\s*-\s*\{[^}]+\}\s*)+)', 'n'))[1];

    -- If no 'items:' block is found, return an empty JSON array
    IF items_block IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    -- Replace YAML list items with proper JSON format
    -- Handle object boundaries and key-value pairs
    json_text := regexp_replace(items_block, '-\s*\{', '{"', 'g');
    json_text := regexp_replace(json_text, ': ', '": "', 'g');
    json_text := regexp_replace(json_text, ', ', '", "', 'g');
    json_text := regexp_replace(json_text, '}', '"}', 'g');

    -- Ensure proper JSON array brackets
    json_text := '[' || replace(json_text, '}, {', '},\n{') || ']';

    -- Convert to JSONB
    RETURN jsonb(json_text);
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to convert YAML to JSON: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;