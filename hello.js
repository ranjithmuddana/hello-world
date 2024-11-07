import org.json.JSONArray;
import org.json.JSONObject;
import org.json.XML;

public class JsonToXmlConverter {

    public static String convertJsonToXml(String jsonString) {
        try {
            // Create JSONObject from the JSON string
            JSONObject jsonObject = new JSONObject(jsonString);
            
            // Recursively process the JSONObject and JSONArray to handle empty arrays and other structures
            processJson(jsonObject);
            
            // Convert the final JSON object to XML string
            return XML.toString(jsonObject, "root");  // "root" can be adjusted based on your needs
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // Recursively process the JSONObject to handle empty arrays and other structures
    private static void processJson(JSONObject jsonObject) {
        // Iterate over all keys in the JSONObject
        for (String key : jsonObject.keySet()) {
            Object value = jsonObject.get(key);

            if (value instanceof JSONObject) {
                // Recursively process nested JSONObjects
                processJson((JSONObject) value);
            } else if (value instanceof JSONArray) {
                // Handle JSONArray
                JSONArray jsonArray = (JSONArray) value;

                // If the array is empty, we can either remove it or keep it as is (based on your needs)
                if (jsonArray.isEmpty()) {
                    jsonObject.put(key, new JSONObject()); // or jsonObject.put(key, "");
                } else {
                    // If it's not empty, recursively process any nested JSONObjects within the array
                    for (int i = 0; i < jsonArray.length(); i++) {
                        Object element = jsonArray.get(i);
                        if (element instanceof JSONObject) {
                            processJson((JSONObject) element);
                        }
                    }
                }
            }
        }
    }

    public static void main(String[] args) {
        // Sample JSON string with an empty array and dynamic structure
        String jsonString = "{\"parent\":{\"child\":[], \"name\":\"John\"}}";

        // Convert JSON to XML
        String xmlString = convertJsonToXml(jsonString);

        // Print the result
        System.out.println("Converted XML:\n" + xmlString);
    }
}