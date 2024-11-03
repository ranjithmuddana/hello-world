SELECT 
    CASE 
        WHEN format = 'FR' THEN 
            CASE 
                WHEN field = RPAD('', LENGTH(field), '0') THEN 
                    RPAD('', LENGTH(field), ' ') -- This replicates " " x length
                ELSE 
                    CASE 
                        WHEN name IN ('A', 'B') THEN 
                            LPAD(CAST(field / 100 AS DECIMAL(10, 2)), length_value, '0') -- This replicates sprintf("%0${length_value}.2f", field/100)
                        ELSE 
                            field -- Keep the original field if conditions don't match
                    END
            END
        ELSE 
            field -- Keep the original field if format is not 'FR'
    END AS formatted_field
FROM your_table;