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

// Process the RDD to extract fields and properties
val fieldsRdd = lines
  .filter(_.nonEmpty) // Remove empty lines
  .map(_.trim)        // Trim spaces
  .foldLeft((List.empty[Row], Map.empty[String, String])) { case ((rows, currentField), line) =>
    // Check if the line is a key-value property line
    val propertyKeys = Set("FORMAT", "LENGTH", "START", "END", "SEGMENT", "ERROR")
    val parts = line.split(":", 2).map(_.trim)

    if (parts.length == 2 && propertyKeys.contains(parts(0))) {
      // Line is a property, add to current field
      (rows, currentField + (parts(0) -> parts(1)))
    } else {
      // Line is a new field name
      // Add the completed current field to rows (if it's not empty)
      val updatedRows = if (currentField.nonEmpty) rows :+ Row(
        currentField("FIELD"),
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
  }._1

// Convert to DataFrame
val df = spark.createDataFrame(spark.sparkContext.parallelize(fieldsRdd), schema)

// Show the resulting DataFrame
df.show(truncate = false)