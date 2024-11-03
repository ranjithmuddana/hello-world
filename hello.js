import org.apache.spark.sql.{SparkSession, Encoders}
import org.apache.spark.sql.types._
import org.apache.spark.sql.Row

object SerialNumberExample {
  def main(args: Array[String]): Unit = {
    // Initialize Spark session
    val spark = SparkSession.builder()
      .appName("Serial Number Example")
      .master("local[*]") // Use appropriate master for your cluster
      .getOrCreate()

    import spark.implicits._

    // Sample DataFrame
    val data = Seq(
      (1, "Alice"),
      (2, "Bob"),
      (3, "Charlie"),
      (4, "David"),
      (5, "Eve")
    )

    val df = spark.createDataFrame(data).toDF("id", "name")

    // Show original DataFrame
    println("Original DataFrame:")
    df.show()

    // Add a serial number using zipWithIndex
    val dfWithSerialNumber = df.rdd.zipWithIndex().map { case (row, index) =>
      Row.fromSeq(row.toSeq :+ (index + 1)) // Adding 1 to index to start from 1
    }

    // Define the schema for the new DataFrame
    val schema = StructType(df.schema.fields :+ StructField("serial_number", IntegerType))

    // Create a new DataFrame with the updated rows and schema
    val newDf = spark.createDataFrame(dfWithSerialNumber, schema)

    // Show the DataFrame with serial numbers
    println("DataFrame with Serial Number:")
    newDf.show()

    // Stop the Spark session
    spark.stop()
  }
}