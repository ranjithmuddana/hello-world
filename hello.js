val joinedDF = df1.withColumn("source", lit("df1"))
  .union(df2.withColumn("source", lit("df2")))
  .groupBy(df1.columns.map(col): _*)
  .agg(collect_set("source").as("sources"))
  .filter(size(col("sources")) === 1)

joinedDF.show()