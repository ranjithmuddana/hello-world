SELECT 
  LPAD('', 30, ' ') AS blank_col, -- Default to 30 blanks
  OVERLAY(
    OVERLAY(LPAD('', 30, ' ') PLACING SUBSTRING(name, 1, 10) FROM 1) -- Replace first 10 chars with 'name' substring
    PLACING SUBSTRING(ssn, 20, 11) FROM 20 -- Replace from 20 to 30 with 'ssn' substring
  ) AS result_col
FROM your_table;