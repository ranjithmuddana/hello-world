import org.apache.spark.sql.functions.udf
import scala.xml.{Elem, XML}

// Function to convert XML element to a fixed format string
def xmlElementToFixed(element: scala.xml.Node): String = {
  val elementName = element.label
  val text = element.text.trim
  val attributes = element.attributes.asAttrMap.map { case (key, value) => s"$key=$value" }.mkString(", ")
  
  val children = element.child.filter(_.isInstanceOf[Elem]).map(xmlElementToFixed).mkString(" | ")
  
  s"Element: $elementName, Text: $text, Attributes: [$attributes], Children: [$children]"
}

// Define the UDF
val xmlToFixed = udf((xmlStr: String) => {
  try {
    val root = XML.loadString(xmlStr)
    xmlElementToFixed(root)
  } catch {
    case _: Exception => null
  }
})