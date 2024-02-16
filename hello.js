import re

sql_query = """
SELECT column1, column2
FROM 
    schema1.table1
WHERE 
    condition;
"""

table_names = re.findall(r'(?i)FROM\s+([a-z_][a-z0-9_$]*)', sql_query, re.MULTILINE)
print(table_names)