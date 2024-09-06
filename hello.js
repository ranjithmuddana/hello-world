import org.apache.spark.sql.functions.udf
import scala.xml.{Elem, XML}

// Function to extract all text content from XML elements and children
def extractTextFromXml(element: scala.xml.Node): String = {
  // Collect text from the current element and its children
  val textContent = element.text.trim
  val childTexts = element.child.filter(_.isInstanceOf[Elem]).map(extractTextFromXml).mkString(" ")

  // Concatenate text from current element and its children
  val combinedText = if (textContent.nonEmpty) textContent else ""
  s"$combinedText $childTexts".trim
}

// Define the UDF
val xmlToTextUDF = udf((xmlStr: String) => {
  try {
    val root = XML.loadString(xmlStr)
    extractTextFromXml(root)
  } catch {
    case _: Exception => null
  }
})