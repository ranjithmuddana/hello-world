CREATE OR REPLACE FUNCTION yaml_to_json(yaml_text TEXT)
RETURNS JSONB AS $$
DECLARE
    json_text TEXT;
BEGIN
    -- Replace YAML syntax with JSON syntax
    json_text := replace(yaml_text, '{', '{"');
    json_text := replace(json_text, '}', '"}');
    json_text := replace(json_text, ': ', '": "');
    json_text := replace(json_text, ', ', '", "');
    json_text := replace(json_text, '\n', ' ');

    -- Add proper JSON array brackets
    json_text := regexp_replace(json_text, '(\s*\[\s*)', '[', 'g');
    json_text := regexp_replace(json_text, '(\s*\]\s*)', ']', 'g');
    
    -- Convert to JSONB
    RETURN jsonb(json_text);
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to convert YAML to JSON: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;