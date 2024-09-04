-- Check if all rows have exactly three pipes
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'Assertion Passed: All rows have exactly 3 pipes'
        ELSE CONCAT('Assertion Failed: There are ', COUNT(*), ' rows that do not have exactly 3 pipes')
    END AS assertion_result
FROM 
    your_table
WHERE 
    LENGTH(col) - LENGTH(REPLACE(col, '|', '')) != 3;