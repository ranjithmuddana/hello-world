import org.apache.spark.sql.{SparkSession, Row}
import org.apache.spark.sql.types.{StringType, StructField, StructType}

// Initialize Spark Session
val spark = SparkSession.builder
  .appName("ParseTextFile")
  .master("local[*]")
  .getOrCreate()

// Define schema for the DataFrame
val schema = StructType(Array(
  StructField("FIELD", StringType, nullable = true),
  StructField("FORMAT", StringType, nullable = true),
  StructField("LENGTH", StringType, nullable = true),
  StructField("START", StringType, nullable = true),
  StructField("END", StringType, nullable = true),
  StructField("SEGMENT", StringType, nullable = true),
  StructField("ERROR", StringType, nullable = true)
))

// Load the file as RDD
val lines = spark.sparkContext.textFile("path/to/your/file.txt")

// Define the set of known properties to identify fields
val propertyKeys = Set("FORMAT", "LENGTH", "START", "END", "SEGMENT", "ERROR")

// Aggregate to process each line and group fields together
val fieldsRdd = lines
  .filter(_.nonEmpty) // Remove empty lines
  .map(_.trim)        // Trim spaces
  .aggregate((List.empty[Row], Map.empty[String, String]))(
    // Sequential operation (process each line within a partition)
    (acc, line) => {
      val (rows, currentField) = acc
      val parts = line.split(":", 2).map(_.trim)

      if (parts.length == 2 && propertyKeys.contains(parts(0))) {
        // Line is a property, add to current field map
        (rows, currentField + (parts(0) -> parts(1)))
      } else {
        // Line is a new field name, finalize the current field if it exists
        val updatedRows = if (currentField.nonEmpty) rows :+ Row(
          currentField.getOrElse("FIELD", ""),
          currentField.getOrElse("FORMAT", ""),
          currentField.getOrElse("LENGTH", ""),
          currentField.getOrElse("START", ""),
          currentField.getOrElse("END", ""),
          currentField.getOrElse("SEGMENT", ""),
          currentField.getOrElse("ERROR", "")
        ) else rows
        // Start new field with current line as the field name
        (updatedRows, Map("FIELD" -> line))
      }
    },
    // Combine operation (merge results across partitions)
    (acc1, acc2) => {
      val (rows1, field1) = acc1
      val (rows2, field2) = acc2

      // Combine rows and keep any last uncompleted field
      val combinedRows = rows1 ++ rows2
      val combinedField = if (field1.isEmpty) field2 else field1
      (combinedRows, combinedField)
    }
  )._1

// Convert to DataFrame
val df = spark.createDataFrame(spark.sparkContext.parallelize(fieldsRdd), schema)

// Show the resulting DataFrame
df.show(truncate = false)