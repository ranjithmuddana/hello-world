SELECT 
    ASSERT_TRUE(
        COUNT(*) = 0,
        'There are rows that do not have exactly 3 pipes'
    )
FROM 
    your_table
WHERE 
    LENGTH(col) - LENGTH(REPLACE(col, '|', '')) != 3;