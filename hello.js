CREATE OR REPLACE FUNCTION yaml_to_json(yaml_text TEXT)
RETURNS JSONB AS $$
DECLARE
    json_text TEXT;
BEGIN
    -- Replace YAML syntax with JSON syntax
    json_text := replace(yaml_text, ': ', '": "');
    json_text := replace(json_text, ', ', '", "');
    
    -- Replace list items with proper JSON array syntax
    json_text := regexp_replace(json_text, '\s*-\s*{', '{"', 'g');
    json_text := replace(json_text, '}', '"}', 'g');
    json_text := replace(json_text, '\n', '",\n"', 'g');
    
    -- Replace item lists with proper JSON array syntax
    json_text := replace(json_text, '\nitems:', ',"items":[\n');
    json_text := replace(json_text, '\n', '},\n', 'g');
    json_text := replace(json_text, '}\n', '}', 'g');
    
    -- Handle edge cases where there are trailing commas or extra characters
    json_text := regexp_replace(json_text, ',\s*}', '}', 'g');
    
    -- Convert to JSONB
    RETURN jsonb(json_text);
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to convert YAML to JSON: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;