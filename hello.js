val query = """
  SELECT
    COALESCE(t1.id, t2.id) AS id,
    t1.name AS name_df1,
    t2.name AS name_df2,
    CASE
      WHEN t1.name IS NOT NULL AND t2.name IS NULL THEN 'df1'
      WHEN t1.name IS NULL AND t2.name IS NOT NULL THEN 'df2'
      WHEN t1.name IS NOT NULL AND t1.name != t2.name THEN 'both'
      ELSE 'no_diff'
    END AS source
  FROM
    table1 t1
  FULL OUTER JOIN
    table2 t2
  ON
    t1.id = t2.id
  WHERE
    t1.name IS DISTINCT FROM t2.name
"""

val dfDiff = spark.sql(query)

dfDiff.show()