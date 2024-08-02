CREATE OR REPLACE FUNCTION yaml_to_json(yaml_text TEXT)
RETURNS JSONB AS $$
DECLARE
    json_text TEXT;
BEGIN
    -- Replace YAML elements with JSON structure
    json_text := replace(yaml_text, ': ', '": "');
    json_text := replace(json_text, ', ', '", "');
    
    -- Handle object boundaries
    json_text := regexp_replace(json_text, '\{\s*(.*)\s*\}', '{"\1"}', 'g');
    
    -- Handle array boundaries
    json_text := regexp_replace(json_text, '-\s*', '{"');
    json_text := regexp_replace(json_text, '\s*:\s*', '": "');
    json_text := regexp_replace(json_text, '},\s*{', '},{"');
    json_text := replace(json_text, '}', '"}');
    
    -- Convert to JSONB
    RETURN jsonb(json_text);
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to convert YAML to JSON: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;