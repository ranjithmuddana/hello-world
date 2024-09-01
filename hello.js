import org.apache.spark.sql.{SaveMode, SparkSession}
import org.apache.spark.sql.functions._

// Initialize SparkSession
val spark = SparkSession.builder
  .appName("Spark SQL Example")
  .getOrCreate()

// Step 1: Load the raw data from the input file into a DataFrame and create a view
val inputFilePath = "path/to/input_file.txt" // Adjust the path to your input file
val df = spark.read
  .option("delimiter", "|")
  .option("header", "false")
  .csv(inputFilePath)
  .toDF("Key", "COL1", "COL2", "COL3")

df.createOrReplaceTempView("sample_data")

// Step 2: Create an intermediate DataFrame with formatting using SQL
spark.sql(
  """
    |CREATE OR REPLACE TEMP VIEW intermediate_data AS
    |SELECT
    |  Key,
    |  SUBSTR(TRIM(COL1), 1, 10) AS COL1,
    |  SUBSTR(TRIM(COL2), 1, 10) AS COL2,
    |  SUBSTR(TRIM(COL3), 1, 10) AS COL3
    |FROM sample_data
  """.stripMargin)

// Step 3: Split the DataFrame using SQL and create views
spark.sql(
  """
    |CREATE OR REPLACE TEMP VIEW filtered_data AS
    |SELECT * FROM intermediate_data
    |WHERE COL1 IS NOT NULL AND COL1 <> ''
  """.stripMargin)

spark.sql(
  """
    |CREATE OR REPLACE TEMP VIEW other_data AS
    |SELECT * FROM intermediate_data
    |WHERE COL1 IS NULL OR COL1 = ''
  """.stripMargin)

// Step 4: Find and filter duplicates using SQL
spark.sql(
  """
    |CREATE OR REPLACE TEMP VIEW filtered_duplicates AS
    |SELECT Key, COL1, COL2, COL3
    |FROM filtered_data
    |GROUP BY Key, COL1, COL2, COL3
    |HAVING COUNT(*) > 1
  """.stripMargin)

spark.sql(
  """
    |CREATE OR REPLACE TEMP VIEW other_duplicates AS
    |SELECT Key, COL1, COL2, COL3
    |FROM other_data
    |GROUP BY Key, COL1, COL2, COL3
    |HAVING COUNT(*) > 1
  """.stripMargin)

// Count records and duplicates
val filteredCount = spark.sql("SELECT COUNT(*) AS count FROM filtered_data").collect()(0)(0).asInstanceOf[Long]
val filteredDupCount = spark.sql("SELECT COUNT(*) AS count FROM filtered_duplicates").collect()(0)(0).asInstanceOf[Long]
val otherCount = spark.sql("SELECT COUNT(*) AS count FROM other_data").collect()(0)(0).asInstanceOf[Long]
val otherDupCount = spark.sql("SELECT COUNT(*) AS count FROM other_duplicates").collect()(0)(0).asInstanceOf[Long]

// Define output file paths
val filteredOutputPath = "path/to/filtered_duplicates_output.txt"
val otherOutputPath = "path/to/other_duplicates_output.txt"

// Function to write DataFrame to a file with header and trailer
def writeWithHeaderAndTrailer(viewName: String, outputPath: String, recordCount: Long, dupCount: Long): Unit = {
  val header = s"Header | Date: ${java.time.LocalDate.now} | Record Count: $recordCount"
  val trailer = s"Trailer | Record Count: $dupCount"

  // Create header DataFrame
  val headerDF = spark.createDataFrame(Seq((header, ""))).toDF("line", "empty")
  
  // Create trailer DataFrame
  val trailerDF = spark.createDataFrame(Seq(("", trailer))).toDF("empty", "line")

  // Create data DataFrame
  val dataDF = spark.sql(s"SELECT CONCAT_WS('|', COL1, COL2, COL3) AS line FROM $viewName")

  // Save header and data
  headerDF
    .union(dataDF)
    .union(trailerDF)
    .write
    .mode(SaveMode.Overwrite)
    .format("text")
    .save(outputPath)
}

// Write filtered duplicates to file
writeWithHeaderAndTrailer("filtered_duplicates", filteredOutputPath, filteredCount, filteredDupCount)

// Write other duplicates to file
writeWithHeaderAndTrailer("other_duplicates", otherOutputPath, otherCount, otherDupCount)

// Stop the SparkSession
spark.stop()