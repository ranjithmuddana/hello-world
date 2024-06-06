WITH RECURSIVE traversal AS (
    -- Anchor member: start from the specified process_id
    SELECT
        process_id AS start_process,
        process_id AS current_process,
        CAST(process_id AS TEXT) AS path,
        0 AS depth
    FROM process_relationship
    WHERE process_id = [SPECIFIC_PROCESS_ID]
    
    UNION ALL
    
    -- Recursive member: follow the edges
    SELECT
        t.start_process,
        pr.input_process_id,
        t.path || '->' || pr.input_process_id,
        t.depth + 1
    FROM traversal t
    JOIN process_relationship pr ON t.current_process = pr.process_id
    WHERE POSITION(pr.input_process_id::TEXT IN t.path) = 0
)
-- Select paths where a cycle is detected
SELECT start_process, current_process, path
FROM traversal
WHERE current_process = start_process
  AND depth > 0;