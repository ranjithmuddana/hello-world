import org.apache.spark.sql.SparkSession

val spark = SparkSession.builder.appName("CheckStringValueSQL").getOrCreate()

// SQL query with VALUES clause
val resultDf = spark.sql(
  """
  SELECT 
    CASE 
      WHEN CAST(TRIM(COALESCE(value, '')) AS INT) > 999 THEN '999'
      ELSE TRIM(COALESCE(value, ''))
    END AS value
  FROM (
    VALUES 
      ('500'),
      (' 1000 '),
      ('1500'),
      ('999'),
      ('200'),
      (NULL),
      ('')
  ) AS values_table(value)
  """
)

// Show the result
resultDf.show(false)