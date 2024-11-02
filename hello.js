import org.apache.spark.sql.{SparkSession, DataFrame}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._

val spark = SparkSession.builder().appName("File Join and Layout Processing").getOrCreate()
import spark.implicits._

// Define file paths
val file1Path = "file1.txt"
val file2Path = "file2.txt"
val layoutPath = "layout.txt"
val outputPath = "output.txt"

// Schema for layout configuration
val layoutSchema = StructType(List(
  StructField("segment", StringType, nullable = true),
  StructField("field_name", StringType, nullable = true),
  StructField("position", IntegerType, nullable = true),
  StructField("length", IntegerType, nullable = true)
))

// Read layout configuration
val layoutDF = spark.read
  .option("delimiter", ",")
  .schema(layoutSchema)
  .csv(layoutPath)

// Read file1 data (id, name, age)
val file1DF = spark.read
  .option("delimiter", "\t")
  .option("header", "false")
  .schema(StructType(Seq(
    StructField("ID", StringType, nullable = false),
    StructField("Name", StringType, nullable = true),
    StructField("Age", StringType, nullable = true)
  )))
  .csv(file1Path)

// Read file2 data (id, age, position, hit_flag, and segments as array)
val file2DF = spark.read
  .option("delimiter", "\t")
  .option("header", "false")
  .schema(StructType(Seq(
    StructField("ID", StringType, nullable = false),
    StructField("Age", StringType, nullable = true),
    StructField("Position", StringType, nullable = true),
    StructField("HitFlag", StringType, nullable = true),
    StructField("Segments", StringType, nullable = true)
  )))
  .csv(file2Path)
  .withColumn("Segments", split($"Segments", ","))

// Join file1 and file2 on ID
val joinedDF = file2DF.join(file1DF, Seq("ID"), "left")
  .withColumn("should_blank", $"HitFlag" =!= lit("1"))
  .withColumn("Age", when($"Age" =!= $"file2.Age", "").otherwise($"Age"))

// Process layout
val layoutWithValuesDF = layoutDF.crossJoin(joinedDF)
  .withColumn("Value", expr(
    """case 
         when field_name = 'ID' then ID
         when field_name = 'Name' then Name
         when field_name = 'Age' then Age
         when field_name = 'Position' then Position
       end"""
  ))
  .withColumn("Value", expr("substring(Value, 0, length)"))

// Create final output format and write to file
val finalOutput = layoutWithValuesDF
  .groupBy("ID")
  .agg(concat_ws("", collect_list("Value")) as "FormattedLine")

finalOutput.select("FormattedLine")
  .coalesce(1)
  .write
  .text(outputPath)

// Output counts
val totalRecords = joinedDF.count()
val totalHits = joinedDF.filter($"HitFlag" === "1").count()
val totalNoHits = totalRecords - totalHits

println(s"Data successfully joined and written to $outputPath based on layout, segments, and hit flag")
println(s"Total records output: $totalRecords")
println(s"Total hits: $totalHits")
println(s"Total no hits: $totalNoHits")

spark.stop()