import org.apache.spark.sql.functions._
import org.apache.spark.sql.expressions.UserDefinedFunction

// Define the enhanced UDF
val csvDiffUdf: UserDefinedFunction = udf { (str1: String, str2: String) =>
  if (str1 == null || str2 == null) {
    null
  } else {
    val list1 = str1.split(",").map(_.trim)
    val list2 = str2.split(",").map(_.trim)
    val maxLength = math.max(list1.length, list2.length)

    val diffs = (0 until maxLength).flatMap { i =>
      if (i < list1.length && i < list2.length) {
        if (list1(i) != list2(i)) {
          Some(s"${list1(i)}->${list2(i)}")
        } else {
          None
        }
      } else if (i < list1.length) {
        Some(s"${list1(i)}->null")
      } else {
        Some(s"null->${list2(i)}")
      }
    }

    if (diffs.isEmpty) "no_diff" else diffs.mkString(", ")
  }
}