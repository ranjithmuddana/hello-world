import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.functions._

val spark = SparkSession.builder.appName("CompareColumns").getOrCreate()
import spark.implicits._

// Example data
val data1 = Seq(
  (1, "abcd", "other1"),
  (2, "efgh", "other2"),
  (3, "ijkl", "other3")
).toDF("id", "col1", "col2")

val data2 = Seq(
  (1, "abxy", "other4"),
  (2, "efzz", "other5"),
  (3, "ijkl", "other6")
).toDF("id", "col1", "col2")

data1.show()
data2.show()

// UDF for character-wise comparison
val compareAndReplace = udf((str1: String, str2: String) => {
  val length = math.min(str1.length, str2.length)
  val result = str1.zip(str2).map { case (c1, c2) =>
    if (c1 == c2) ' ' else c1
  }.mkString
  if (str1.length > length) result + str1.substring(length)
  else result
})

// Join DataFrames on the 'id' column
val joinedDF = data1.as("df1").join(data2.as("df2"), $"df1.id" === $"df2.id")

// Apply the UDF to the 'col1' columns of both DataFrames
val resultDF = joinedDF.withColumn("compared_col1", compareAndReplace($"df1.col1", $"df2.col1"))

// Select the required columns to display
resultDF.select($"id", $"compared_col1").show()