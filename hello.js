WITH RECURSIVE traversal AS (
    -- Anchor member: start from each node
    SELECT
        process_id AS start_process,
        process_id AS current_process,
        CAST(process_id AS VARCHAR(MAX)) AS path,
        0 AS depth
    FROM process_relationship
    
    UNION ALL
    
    -- Recursive member: follow the edges
    SELECT
        t.start_process,
        pr.input_process_id,
        t.path || '->' || pr.input_process_id,
        t.depth + 1
    FROM traversal t
    JOIN process_relationship pr ON t.current_process = pr.process_id
    WHERE t.path NOT LIKE '%' || CAST(pr.input_process_id AS VARCHAR(MAX)) || '%'
)
-- Select paths where a cycle is detected
SELECT start_process, current_process, path
FROM traversal
WHERE current_process IN (SELECT process_id FROM process_relationship)
  AND current_process = start_process
  AND depth > 0;