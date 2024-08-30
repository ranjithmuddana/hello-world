val query = """
  SELECT
    COALESCE(t1.id, t2.id) AS id,
    t1.name AS name_df1,
    t2.name AS name_df2
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