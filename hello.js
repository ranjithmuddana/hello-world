import org.apache.spark.sql.functions._
import org.apache.spark.sql.expressions.UserDefinedFunction

// Define the UDF
val diffUdf: UserDefinedFunction = udf { (str1: String, str2: String) =>
  if (str1 == null || str2 == null) {
    null
  } else {
    val maxLength = math.max(str1.length, str2.length)
    (0 until maxLength).map { i =>
      if (i < str1.length && i < str2.length && str1(i) == str2(i)) {
        str1(i)
      } else if (i < str1.length || i < str2.length) {
        '^'
      } else {
        ""
      }
    }.mkString
  }
}