import com.fasterxml.jackson.databind.ObjectMapper;
import org.json.JSONObject;
import org.json.XML;

import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        try {
            // Create sample data
            Customers customers = new Customers();
            customers.setName("John Doe");
            List<Address> addressList = new ArrayList<>();
            addressList.add(new Address("123 Main St", "Springfield"));
            addressList.add(new Address("456 Elm St", "Shelbyville"));
            customers.setAddresses(addressList);

            // Step 1: Convert Customers object to JSON string
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonString = objectMapper.writeValueAsString(customers);
            System.out.println("JSON String:\n" + jsonString);

            // Step 2: Convert JSON string to JSONObject
            JSONObject jsonObject = new JSONObject(jsonString);

            // Step 3: Convert JSONObject to XML string
            String xmlString = XML.toString(jsonObject, "header");
            System.out.println("XML String:\n" + xmlString);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}